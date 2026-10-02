import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

const prisma = new PrismaClient();

async function main() {
  const ministries = await prisma.ministry.findMany({
    orderBy: [{ departmentCode: 'asc' }, { name: 'asc' }],
  });
  console.log('Total ministries:', ministries.length);
  for (const m of ministries) {
    console.log(`[${m.departmentCode}] id: ${m.id} | name: '${m.name}' | headId: ${m.headId}`);
  }
}

main().finally(() => prisma.$disconnect());
