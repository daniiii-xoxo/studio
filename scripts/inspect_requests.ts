import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

const prisma = new PrismaClient();

async function main() {
  const requests = await prisma.approvalRequest.findMany({
    orderBy: { date: 'desc' },
  });
  console.log(`Total approval requests: ${requests.length}`);
  for (const r of requests) {
    console.log(`ID: ${r.id.slice(-6)} | type: ${r.type} | status: ${r.status} | workerId: ${r.workerId} | requester: ${r.requester} | details: ${r.details}`);
  }
}

main().finally(() => prisma.$disconnect());
