"use server";

import crypto from "crypto";
import { prisma } from "@studio/database/prisma";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type LegacyLoginResult = {
  success: boolean;
  email?: string;
  passwordChangeRequired?: boolean;
  error?: string;
};

const LEGACY_LOGIN_WINDOW_MINUTES = 15;
const LEGACY_LOGIN_MAX_ATTEMPTS = 5;

function isWorkerIdLoginEnabled(): boolean {
  const raw =
    process.env.ENABLE_WORKER_ID_LOGIN ??
    process.env.NEXT_PUBLIC_ENABLE_WORKER_ID_LOGIN;
  if (raw == null) return true;
  return raw.toLowerCase() !== "false";
}

async function logLegacyAuthEvent(
  action: "legacy_login" | "legacy_login_failed",
  details: string,
  targetId?: string,
) {
  try {
    await prisma.transactionLog.create({
      data: {
        action,
        module: "auth",
        details,
        targetId,
      },
    });
  } catch {
    // Logging must never block auth flow.
  }
}

async function getRecentFailedAttempts(workerId: string): Promise<number> {
  const windowStart = new Date(
    Date.now() - LEGACY_LOGIN_WINDOW_MINUTES * 60 * 1000,
  );

  return prisma.transactionLog.count({
    where: {
      module: "auth",
      action: "legacy_login_failed",
      targetId: workerId,
      timestamp: { gte: windowStart },
    },
  });
}

/**
 * Dynamically determines the correct column name for the legacy password hash.
 * This handles issues where DB migrations might have used different casing or snake_case.
 */
async function getLegacyPasswordColumnName(): Promise<string | null> {
  try {
    const columns = await prisma.$queryRaw<any[]>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Worker' AND (column_name = 'legacyPasswordHash' OR column_name = 'legacy_password_hash' OR column_name = 'password')
    `;
    if (columns.length === 0) return null;
    
    // Prioritize legacyPasswordHash if both exist for some reason
    const match = columns.find(c => c.column_name === 'legacyPasswordHash') || columns[0];
    return match.column_name;
  } catch (e) {
    console.error("Failed to probe Worker columns:", e);
    return null;
  }
}

export async function legacyWorkerIdLogin(
  workerId: string,
  password: string,
): Promise<LegacyLoginResult> {
  return withRetry(async () => {
    const genericError = "Invalid Worker ID or password.";

    if (!isWorkerIdLoginEnabled()) {
      await logLegacyAuthEvent(
        "legacy_login_failed",
        "Worker ID login attempted while feature flag is disabled",
        workerId,
      );
      return {
        success: false,
        error: "Worker ID login is currently disabled.",
      };
    }

    if (!workerId || !password) {
      return { success: false, error: genericError };
    }

    const recentAttempts = await getRecentFailedAttempts(workerId);
    if (recentAttempts >= LEGACY_LOGIN_MAX_ATTEMPTS) {
      await logLegacyAuthEvent(
        "legacy_login_failed",
        `Rate limit hit for worker #${workerId}`,
        workerId,
      );
      return {
        success: false,
        error: "Too many failed attempts. Please try again later.",
      };
    }

    // 1. Fetch worker via type-safe client
    const worker = await (prisma.worker as any).findFirst({
      where: { workerId },
      select: {
        id: true,
        email: true,
        status: true,
        firstName: true,
        lastName: true,
        passwordChangeRequired: true,
        legacyPasswordHash: true,
      }
    });

    if (!worker || !worker.email) {
      await logLegacyAuthEvent(
        "legacy_login_failed",
        `Failed legacy login for workerId ${workerId}: worker not found`,
        workerId,
      );
      return { success: false, error: genericError };
    }

    if (worker.status !== "Active") {
      await logLegacyAuthEvent(
        "legacy_login_failed",
        `Failed legacy login for worker #${workerId}: inactive account`,
        workerId,
      );
      return {
        success: false,
        error: "Your account is inactive. Please contact your administrator.",
      };
    }

    // If password change is required, we don't necessarily need the old password 
    // if the user handles it via First Name verification (in migration flow).
    if (worker.passwordChangeRequired) {
      return { 
        success: true, 
        email: worker.email, 
        passwordChangeRequired: true 
      };
    }

    // If no legacy hash exists but passwordChangeRequired is false,
    // the user already completed migration — let Supabase handle it directly
    const storedHash = (worker.legacyPasswordHash || "").trim().toLowerCase();

    if (!storedHash) {
      // No legacy hash — user should sign in directly via Supabase
      // Try signing in directly; if it fails, return a helpful error
      return { success: false, error: "Please use Email Login — your account has already been migrated." };
    }

    const submittedHash = crypto
      .createHash("md5")
      .update(password)
      .digest("hex")
      .toLowerCase();

    if (submittedHash !== storedHash) {
      await logLegacyAuthEvent(
        "legacy_login_failed",
        `Failed legacy login for worker #${workerId}: hash mismatch`,
        workerId,
      );
      return { success: false, error: genericError };
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // Look up Supabase auth user by email to get the real UUID
    const { data: authList } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = authList?.users?.find(u => u.email === worker.email);

    if (!authUser) {
      // No Supabase auth user yet — create one
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: worker.email,
        password,
        email_confirm: true,
      });
      if (createError) {
        await logLegacyAuthEvent("legacy_login_failed", `Failed to create auth user for worker #${workerId}: ${createError.message}`, workerId);
        return { success: false, error: genericError };
      }
    } else {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        password,
        email_confirm: true,
      });
      if (error) {
        await logLegacyAuthEvent("legacy_login_failed", `Failed legacy login for worker #${workerId}: ${error.message}`, workerId);
        return { success: false, error: genericError };
      }
    }

    await logLegacyAuthEvent(
      "legacy_login",
      `Worker #${workerId} (${worker.firstName} ${worker.lastName}) logged in via Worker ID`,
      worker.id,
    );

    return { success: true, email: worker.email, passwordChangeRequired: false };
  });
}

/**
 * Utility to retry a database operation if it fails due to transient connection issues.
 * This is particularly useful for Supabase/Pgbouncer pooler resets.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 500): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorMessage = error?.message || "";
    // Detect common Supabase pooler/connection reset errors
    const isTransientError = 
      errorMessage.includes("Can't reach database") || 
      errorMessage.includes("connection was forcibly closed") ||
      errorMessage.includes("Remote host reset connection") ||
      error?.code === 'P1001' || // Can't reach database
      error?.code === 'P2024' || // Connection timed out
      error?.code === 'P1017';   // Server closed connection

    if (isTransientError && retries > 0) {
      console.log(`Database connection glitch. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Checks if a worker (identified by email or workerId) requires a password change.
 * Used for both Email and Worker ID login flows.
 */
export async function getWorkerAuthStatus(identifier: string) {
  return withRetry(async () => {
    try {
      const worker = await prisma.worker.findFirst({
        where: {
          OR: [
            { email: identifier },
            { workerId: identifier }
          ]
        },
        select: {
          id: true,
          email: true,
          passwordChangeRequired: true,
          firstName: true,
        }
      });

      return {
        exists: !!worker,
        passwordChangeRequired: worker?.passwordChangeRequired ?? false,
        email: worker?.email,
        firstName: worker?.firstName,
      };
    } catch (error) {
      console.error("Critical error in getWorkerAuthStatus:", error);
      throw error;
    }
  });
}

/**
 * Completes the first-time password change for a legacy worker.
 * For Worker ID login, we verify identity using 'firstName' instead of 'legacyPassword'.
 * We also allow confirming/updating the associated email.
 */
export async function completeFirstLoginPasswordChange(
  identifier: string,
  verificationValue: string, // Can be legacyPassword (email flow) or firstName (workerId flow)
  newPassword: string,
  mode: "email" | "worker" = "email",
  updatedEmail?: string // New: allow updating email during migration
) {
  return withRetry(async () => {
    // 1. Fetch worker record via type-safe client
    const workerRecord = await prisma.worker.findFirst({
      where: mode === "email" ? { email: identifier } : { workerId: identifier },
      select: {
        id: true,
        email: true,
        firstName: true,
        passwordChangeRequired: true
      }
    });

    if (!workerRecord) {
      return { success: false, error: "Worker not found." };
    }

    // 2. Verify identity
    if (mode === "worker") {
      // For worker logins, verificationValue is the First Name
      if (workerRecord.firstName.toLowerCase().trim() !== verificationValue.toLowerCase().trim()) {
        return { success: false, error: "Invalid identity confirmation (First Name mismatch)." };
      }
    } else {
      // For email logins, we still use the legacy password verify
      const loginResult = await legacyWorkerIdLogin(identifier, verificationValue);
      if (!loginResult.success) {
        return { success: false, error: "Invalid legacy password." };
      }
    }

    const finalEmail = updatedEmail || workerRecord.email;

    // 3. Update Supabase User (Email & Password)
    const supabaseAdmin = getSupabaseAdminClient();

    // Look up the Supabase auth user by email to get the real UUID
    const { data: authList } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = authList?.users?.find(u => u.email === workerRecord.email);

    if (authUser) {
      // Update existing Supabase auth user
      const { error } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        email: finalEmail,
        password: newPassword,
        email_confirm: true,
      });
      if (error) {
        return { success: false, error: `Failed to update account: ${error.message}` };
      }
    } else {
      // No Supabase auth user yet — create one using the worker's DB id as the UUID if valid, else generate
      const { error } = await supabaseAdmin.auth.admin.createUser({
        email: finalEmail,
        password: newPassword,
        email_confirm: true,
        user_metadata: { workerId: workerRecord.id },
      });
      if (error) {
        return { success: false, error: `Failed to create account: ${error.message}` };
      }
    }

    // 4. Update Worker Table
    const legacyColumn = await getLegacyPasswordColumnName();
    
    // Using raw update to avoid Prisma client casting issues for missing/renamed columns
    await prisma.$executeRawUnsafe(`
      UPDATE "Worker" 
      SET "passwordChangeRequired" = false,
          "email" = $1,
          "legacyMigratedAt" = NOW(),
          "legacyMigratedFrom" = $3
      ${legacyColumn ? `, "${legacyColumn}" = NULL` : ""}
      WHERE "id" = $2
    `, finalEmail, workerRecord.id, mode === 'worker' ? 'Worker ID Login' : 'Email Login');

    await logLegacyAuthEvent(
      "legacy_login",
      `Worker #${identifier} completed mandatory password change and confirmed email (${finalEmail})`,
      workerRecord.id
    );

    return { success: true, email: finalEmail };
  });
}

/**
 * Simple Worker ID → email lookup for the login page.
 * No legacy password logic — just resolves the email so Supabase can sign in.
 */
export async function getWorkerEmail(workerId: string): Promise<{ success: boolean; email?: string; error?: string; isDeactivated?: boolean }> {
  try {
    const cleanId = workerId.trim();
    const worker = await prisma.worker.findFirst({
      where: {
        OR: [
          { workerId: cleanId },
          { workerId: cleanId.replace(/^COG-/i, '') },
          { workerId: `COG-${cleanId}` },
        ]
      },
      select: { email: true, status: true },
    });

    if (!worker) {
      return { success: false, error: "Worker ID not found." };
    }

    if (worker.status !== "Active") {
      return { success: false, isDeactivated: true, error: "Your account is deactivated. Please contact your administrator." };
    }

    return { success: true, email: worker.email };
  } catch (error: any) {
    console.error("getWorkerEmail error:", error);
    return { success: false, error: "Could not look up Worker ID. Please try again." };
  }
}

/**
 * Validates identifier (email or worker ID) and checks account active status before login.
 */
export async function validateLoginIdentifier(
  identifier: string,
  mode: "email" | "worker" = "email"
): Promise<{ success: boolean; email?: string; error?: string; isDeactivated?: boolean }> {
  try {
    const clean = identifier.trim();
    if (!clean) {
      return { success: false, error: "Identifier cannot be empty." };
    }

    if (mode === "worker") {
      return await getWorkerEmail(clean);
    }

    // Email mode: check if worker exists and is active
    const worker = await prisma.worker.findFirst({
      where: { email: { equals: clean, mode: "insensitive" } },
      select: { email: true, status: true },
    });

    if (worker && worker.status !== "Active") {
      return {
        success: false,
        isDeactivated: true,
        error: "Your account is deactivated. Please contact your administrator.",
      };
    }

    return { success: true, email: worker?.email || clean };
  } catch (error: any) {
    console.error("validateLoginIdentifier error:", error);
    return { success: false, error: "Could not verify account status. Please try again." };
  }
}

