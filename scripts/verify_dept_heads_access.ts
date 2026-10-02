import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

const prisma = new PrismaClient();

async function main() {
  const deptEmails = [
    { name: 'Relationship Head', email: 'head.relationship@church.org', expectedCount: 7 },
    { name: 'Worship Head', email: 'head.worship@church.org', expectedCount: 7 },
    { name: 'Outreach Head', email: 'head.outreach@church.org', expectedCount: 11 },
    { name: 'Discipleship Head', email: 'head.discipleship@church.org', expectedCount: 7 },
    { name: 'Admin Head', email: 'head.admin@church.org', expectedCount: 8 },
  ];

  console.log('=== Verifying Department Heads Access ===\n');

  for (const item of deptEmails) {
    const worker = await prisma.worker.findUnique({ where: { email: item.email } });
    if (!worker) {
      console.error(`❌ Worker not found for ${item.email}`);
      continue;
    }

    // 1. Ministries where headId/approverId/leaderId = worker.id
    const leadMinistries = await prisma.ministry.findMany({
      where: {
        OR: [
          { headId: worker.id },
          { approverId: worker.id },
          { leaderId: worker.id },
        ],
      },
    });

    const allowedIds = new Set<string>(leadMinistries.map(m => m.id));
    if (worker.majorMinistryId) allowedIds.add(worker.majorMinistryId);
    if (worker.minorMinistryId) allowedIds.add(worker.minorMinistryId);
    for (const mid of worker.assignedMinistryIds || []) {
      if (mid) allowedIds.add(mid);
    }

    const visibleMinistries = await prisma.ministry.findMany({
      where: { id: { in: Array.from(allowedIds) } },
      orderBy: { name: 'asc' },
    });

    console.log(`👤 ${item.name} (${item.email})`);
    console.log(`   allowedMinistryIds count: ${allowedIds.size}`);
    console.log(`   visibleMinistries count: ${visibleMinistries.length}`);
    console.log(`   Ministries: ${visibleMinistries.map((m: any) => m.name).join(', ')}`);

    if (visibleMinistries.length === item.expectedCount) {
      console.log(`   ✅ MATCHES EXPECTED COUNT (${item.expectedCount})\n`);
    } else {
      console.log(`   ❌ MISMATCH: expected ${item.expectedCount}, got ${visibleMinistries.length}\n`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
