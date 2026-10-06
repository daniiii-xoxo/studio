'use server';

import { prisma } from '@studio/database/prisma';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';
import { NotificationService } from '@/services/notification-service';
import { validateLoginIdentifier } from '@/actions/legacy-auth';

/**
 * Requests a password reset link and sends it directly via Church of God Gmail SMTP
 * (churchofgoddasmarinas@gmail.com) instead of Supabase Auth's default mailer.
 */
export async function requestPasswordReset(identifier: string, origin?: string) {
  try {
    const clean = (identifier || '').trim();
    if (!clean) {
      return { success: false, error: 'Please enter your email or Worker ID.' };
    }

    // 1. Resolve identifier and check active status
    const validation = await validateLoginIdentifier(clean, clean.includes('@') ? 'email' : 'worker');
    if (!validation.success) {
      return {
        success: false,
        isDeactivated: validation.isDeactivated,
        error: validation.error || 'Failed to verify account.',
      };
    }

    const email = (validation.email || clean).trim();

    // 2. Fetch worker display name
    const worker = await prisma.worker.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { firstName: true, lastName: true, status: true },
    });

    if (worker && worker.status !== 'Active') {
      return {
        success: false,
        isDeactivated: true,
        error: 'Your account is deactivated. Please contact your administrator.',
      };
    }

    const workerName = worker ? `${worker.firstName} ${worker.lastName}`.trim() : undefined;

    // 3. Generate secure recovery link using Supabase Admin
    const supabaseAdmin = getSupabaseAdminClient();
    const appUrl = origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const redirectTo = `${appUrl}/auth/update-password`;

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error('generateLink error:', linkError);
      return {
        success: false,
        error: linkError?.message || 'Could not generate password reset link. Please verify the email.',
      };
    }

    const resetLink = linkData.properties.action_link;

    // 4. Send via Church of God Gmail SMTP
    await NotificationService.sendPasswordResetEmail(email, resetLink, workerName);

    return { success: true, email };
  } catch (error: any) {
    console.error('requestPasswordReset error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to send password reset email. Please try again.',
    };
  }
}

export async function signOutUser() {
  return { success: true };
}
