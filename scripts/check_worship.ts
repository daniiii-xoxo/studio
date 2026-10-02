import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

const prisma = new PrismaClient();

async function main() {
  const worshipHead = await prisma.worker.findUnique({
    where: { email: 'head.worship@church.org' },
  });
  console.log('Worship Head profile:', worshipHead);

  const worshipMinistries = await prisma.ministry.findMany({
    where: { departmentCode: 'W' },
  });
  console.log('Ministries under Worship (W) department:');
  console.log(worshipMinistries.map(m => ({ id: m.id, name: m.name, headId: m.headId })));

  const allMinistriesWhereHead = await prisma.ministry.findMany({
    where: { headId: worshipHead?.id },
  });
  console.log('Ministries where Worship Head is headId:');
  console.log(allMinistriesWhereHead.map(m => ({ id: m.id, name: m.name })));
}

main().finally(() => prisma.$disconnect());
