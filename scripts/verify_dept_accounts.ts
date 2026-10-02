import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

const prisma = new PrismaClient();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const client = createClient(supabaseUrl, supabaseAnonKey);

const testAccounts = [
  { role: 'Head', dept: 'Worship', email: 'head.worship@church.org', workerId: '10001' },
  { role: 'Worker', dept: 'Worship', email: 'worker.worship@church.org', workerId: '10002' },
  { role: 'Head', dept: 'Outreach', email: 'head.outreach@church.org', workerId: '20001' },
  { role: 'Worker', dept: 'Outreach', email: 'worker.outreach@church.org', workerId: '20002' },
  { role: 'Head', dept: 'Relationship', email: 'head.relationship@church.org', workerId: '30001' },
  { role: 'Worker', dept: 'Relationship', email: 'worker.relationship@church.org', workerId: '30002' },
  { role: 'Head', dept: 'Discipleship', email: 'head.discipleship@church.org', workerId: '40001' },
  { role: 'Worker', dept: 'Discipleship', email: 'worker.discipleship@church.org', workerId: '40002' },
  { role: 'Head', dept: 'Administration', email: 'head.admin@church.org', workerId: '50001' },
  { role: 'Worker', dept: 'Administration', email: 'worker.admin@church.org', workerId: '50002' },
];

async function main() {
  console.log('Testing authentication for all 10 created accounts...');
  let successCount = 0;

  for (const acc of testAccounts) {
    // 1. Check worker record in prisma
    const worker = await prisma.worker.findUnique({
      where: { email: acc.email },
      include: {
        role: true,
        roles: {
          include: { role: true },
        },
      },
    });

    if (!worker) {
      console.error(`❌ Worker record missing for ${acc.email}`);
      continue;
    }

    // 2. Check Supabase auth signIn
    const { data, error } = await client.auth.signInWithPassword({
      email: acc.email,
      password: 'Password123!',
    });

    if (error || !data.user) {
      console.error(`❌ Auth login failed for ${acc.email}:`, error?.message);
      continue;
    }

    // Sign out to clean up session
    await client.auth.signOut();

    // 3. Check Ministry Head mapping
    const headedMinistries = await prisma.ministry.count({
      where: { headId: worker.id },
    });

    console.log(`✅ [${acc.dept}] ${acc.role}: ${acc.email} (Worker ID: ${acc.workerId}) -> Login OK! (Headed ministries: ${headedMinistries})`);
    successCount++;
  }

  console.log(`\nVerification Result: ${successCount} / ${testAccounts.length} passed.`);
}

main().finally(() => prisma.$disconnect());
