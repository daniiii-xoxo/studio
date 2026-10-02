import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

const prisma = new PrismaClient();

interface DeptMapping {
  deptCode: string;
  deptName: string;
  headEmail: string;
  ministryIds: string[];
}

const DEPARTMENTS: DeptMapping[] = [
  {
    deptCode: 'W',
    deptName: 'Worship',
    headEmail: 'head.worship@church.org',
    ministryIds: [
      'W-WHITELIGHT',
      'W-DANCE',
      'W-PMT',
      'W-CRUSADE',
      'W-SINGERS',
      'W-MUSICIANS',
      'W-AUDIO',
    ],
  },
  {
    deptCode: 'O',
    deptName: 'Outreach',
    headEmail: 'head.outreach@church.org',
    ministryIds: [
      'O-CLUSTER1',
      'O-CLUSTER2',
      'O-CLUSTER3',
      'O-CLUSTER4',
      'O-CLUSTER5',
      'O-CLUSTER6',
      'O-CLUSTER7',
      'O-CLUSTER8',
      'O-CLUSTER9',
      'O-WEYJ',
      'O-TAPAT',
    ],
  },
  {
    deptCode: 'R',
    deptName: 'Relationship',
    headEmail: 'head.relationship@church.org',
    ministryIds: [
      'R-SPORTS',
      'R-GEM',
      'R-USHERING',
      'R-MENS',
      'R-LADIES',
      'R-YOUTHEMPOWERED',
      'R-YOUNGADULTS',
    ],
  },
  {
    deptCode: 'D',
    deptName: 'Discipleship',
    headEmail: 'head.discipleship@church.org',
    ministryIds: [
      'D-J12',
      'D-ONELINER',
      'D-CLDP',
      'D-KID',
      'D-CHILDRENSMINISTRY',
      'D-LIFEINSTITUTE',
      'D-KCA',
    ],
  },
  {
    deptCode: 'A',
    deptName: 'Administration',
    headEmail: 'head.admin@church.org',
    ministryIds: [
      'A-FINANCE',
      'A-ENGINEERING',
      'A-SECURITYANDSHUTTLE',
      'A-TECHNOLOGY',
      'A-INHOUSE',
      'A-VENTURES',
      'A-ARTS',
      'A-LINKAGES',
    ],
  },
];

async function main() {
  console.log('=== Applying Option A: Assigning ALL Department Ministries to Each Department Head ===\n');

  for (const dept of DEPARTMENTS) {
    console.log(`--- Processing Department: ${dept.deptName} (${dept.deptCode}) ---`);

    const headWorker = await prisma.worker.findUnique({
      where: { email: dept.headEmail },
    });

    if (!headWorker) {
      console.warn(`WARNING: Head worker with email ${dept.headEmail} not found!`);
      continue;
    }

    console.log(`Found head: ${headWorker.firstName} ${headWorker.lastName} (${headWorker.id})`);

    // 1. Assign headWorker as headId for ALL ministries in this department
    const updateResult = await prisma.ministry.updateMany({
      where: {
        id: { in: dept.ministryIds },
      },
      data: {
        headId: headWorker.id,
      },
    });

    console.log(`Updated headId for ${updateResult.count} ministries in ${dept.deptName}`);

    // 2. Update headWorker assignedMinistryIds in Worker table
    try {
      await prisma.$executeRaw`
        UPDATE "Worker"
        SET "assignedMinistryIds" = ${dept.ministryIds}
        WHERE id = ${headWorker.id}
      `;
      console.log(`Updated assignedMinistryIds via raw SQL for ${dept.headEmail} (${dept.ministryIds.length} ministries)`);
    } catch (e: any) {
      console.warn(`Raw SQL update failed, trying prisma.worker.update:`, e.message);
      await prisma.worker.update({
        where: { id: headWorker.id },
        data: {
          assignedMinistryIds: dept.ministryIds,
        },
      });
    }

    // 3. Update DepartmentSetting headId
    try {
      await prisma.departmentSetting.upsert({
        where: { id: dept.deptCode },
        update: { headId: headWorker.id },
        create: {
          id: dept.deptCode,
          headId: headWorker.id,
          description: `${dept.deptName} Department`,
        },
      });
      console.log(`Updated DepartmentSetting for ${dept.deptCode} with headId: ${headWorker.id}`);
    } catch (e: any) {
      console.warn(`DepartmentSetting upsert warning:`, e.message);
    }

    console.log(`Completed ${dept.deptName} setup.\n`);
  }

  console.log('=== All Department Ministries Successfully Assigned! ===');
}

main()
  .catch((e) => {
    console.error('Error applying Option A:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
