import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

const prisma = new PrismaClient();

async function main() {
  console.log('--- Resetting Ministry Head assignments to specific assigned ministries ---');

  // 1. Reset all ministries headId to null
  await prisma.ministry.updateMany({
    data: { headId: null },
  });

  // 2. Fetch the 5 Ministry Heads
  const worshipHead = await prisma.worker.findUnique({ where: { email: 'head.worship@church.org' } });
  const outreachHead = await prisma.worker.findUnique({ where: { email: 'head.outreach@church.org' } });
  const relationshipHead = await prisma.worker.findUnique({ where: { email: 'head.relationship@church.org' } });
  const discipleshipHead = await prisma.worker.findUnique({ where: { email: 'head.discipleship@church.org' } });
  const adminHead = await prisma.worker.findUnique({ where: { email: 'head.admin@church.org' } });

  const worshipIds = ['W-WHITELIGHT', 'W-DANCE', 'W-PMT', 'W-CRUSADE', 'W-SINGERS', 'W-MUSICIANS', 'W-AUDIO'];
  const outreachIds = ['O-CLUSTER1', 'O-CLUSTER2', 'O-CLUSTER3', 'O-CLUSTER4', 'O-CLUSTER5', 'O-CLUSTER6', 'O-CLUSTER7', 'O-CLUSTER8', 'O-CLUSTER9', 'O-WEYJ', 'O-TAPAT'];
  const relationshipIds = ['R-SPORTS', 'R-GEM', 'R-USHERING', 'R-MENS', 'R-LADIES', 'R-YOUTHEMPOWERED', 'R-YOUNGADULTS'];
  const discipleshipIds = ['D-J12', 'D-ONELINER', 'D-CLDP', 'D-KID', 'D-CHILDRENSMINISTRY', 'D-LIFEINSTITUTE', 'D-KCA'];
  const adminIds = ['A-FINANCE', 'A-ENGINEERING', 'A-SECURITYANDSHUTTLE', 'A-TECHNOLOGY', 'A-INHOUSE', 'A-VENTURES', 'A-ARTS', 'A-LINKAGES'];

  if (worshipHead) {
    await prisma.ministry.updateMany({ where: { id: { in: worshipIds } }, data: { headId: worshipHead.id } });
    await prisma.$executeRaw`UPDATE "Worker" SET "assignedMinistryIds" = ${worshipIds} WHERE id = ${worshipHead.id}`;
    console.log(`Assigned Worship Head to all 7 Worship ministries`);
  }

  if (outreachHead) {
    await prisma.ministry.updateMany({ where: { id: { in: outreachIds } }, data: { headId: outreachHead.id } });
    await prisma.$executeRaw`UPDATE "Worker" SET "assignedMinistryIds" = ${outreachIds} WHERE id = ${outreachHead.id}`;
    console.log(`Assigned Outreach Head to all 11 Outreach ministries`);
  }

  if (relationshipHead) {
    await prisma.ministry.updateMany({ where: { id: { in: relationshipIds } }, data: { headId: relationshipHead.id } });
    await prisma.$executeRaw`UPDATE "Worker" SET "assignedMinistryIds" = ${relationshipIds} WHERE id = ${relationshipHead.id}`;
    console.log(`Assigned Relationship Head to all 7 Relationship ministries (including Youth Empowered, Sports, etc.)`);
  }

  if (discipleshipHead) {
    await prisma.ministry.updateMany({ where: { id: { in: discipleshipIds } }, data: { headId: discipleshipHead.id } });
    await prisma.$executeRaw`UPDATE "Worker" SET "assignedMinistryIds" = ${discipleshipIds} WHERE id = ${discipleshipHead.id}`;
    console.log(`Assigned Discipleship Head to all 7 Discipleship ministries`);
  }

  if (adminHead) {
    await prisma.ministry.updateMany({ where: { id: { in: adminIds } }, data: { headId: adminHead.id } });
    await prisma.$executeRaw`UPDATE "Worker" SET "assignedMinistryIds" = ${adminIds} WHERE id = ${adminHead.id}`;
    console.log(`Assigned Admin Head to all 8 Administration ministries`);
  }

  console.log('Ministry assignments successfully updated to Option A!');
}

main().finally(() => prisma.$disconnect());
