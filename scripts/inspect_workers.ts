import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

const prisma = new PrismaClient();

async function main() {
  const workers = await prisma.worker.findMany({
    select: {
      id: true,
      workerId: true,
      firstName: true,
      lastName: true,
      email: true,
      roleId: true,
      majorMinistryId: true,
      minorMinistryId: true,
      assignedMinistryIds: true,
      role: { select: { name: true } },
    },
  });
  console.log(JSON.stringify(workers, null, 2));
}

main().finally(() => prisma.$disconnect());
