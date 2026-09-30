import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding VenueAssistanceSetting...');

  await prisma.venueAssistanceSetting.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      slaDays: 3,
    },
  });

  console.log('Seed complete: VenueAssistanceSetting { id: "global", slaDays: 3 }');

  console.log('Seeding Departments...');
  const departments = [
    { code: 'W', name: 'Worship', weight: 1 },
    { code: 'O', name: 'Outreach', weight: 2 },
    { code: 'R', name: 'Relationship', weight: 3 },
    { code: 'D', name: 'Discipleship', weight: 4 },
    { code: 'A', name: 'Administration', weight: 5 },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {
        name: dept.name,
        weight: dept.weight,
      },
      create: dept,
    });
  }
  console.log('Seed complete: Departments');

  console.log('Seeding Ministries...');
  const ministries = [
    // WORSHIP
    { id: 'W-WHITELIGHT', name: 'Whitelight', deptCode: 'W', weight: 1 },
    { id: 'W-DANCE', name: 'Dance', deptCode: 'W', weight: 2 },
    { id: 'W-PMT', name: 'PMT', deptCode: 'W', weight: 3 },
    { id: 'W-CRUSADE', name: 'Crusade', deptCode: 'W', weight: 4 },
    { id: 'W-SINGERS', name: 'Singers', deptCode: 'W', weight: 5 },
    { id: 'W-MUSICIANS', name: 'Musicians', deptCode: 'W', weight: 6 },
    { id: 'W-AUDIO', name: 'Audio', deptCode: 'W', weight: 7 },

    // OUTREACH
    { id: 'O-CLUSTER1', name: 'Cluster 1', deptCode: 'O', weight: 1 },
    { id: 'O-CLUSTER2', name: 'Cluster 2', deptCode: 'O', weight: 2 },
    { id: 'O-CLUSTER3', name: 'Cluster 3', deptCode: 'O', weight: 3 },
    { id: 'O-CLUSTER4', name: 'Cluster 4', deptCode: 'O', weight: 4 },
    { id: 'O-CLUSTER5', name: 'Cluster 5', deptCode: 'O', weight: 5 },
    { id: 'O-CLUSTER6', name: 'Cluster 6', deptCode: 'O', weight: 6 },
    { id: 'O-CLUSTER7', name: 'Cluster 7', deptCode: 'O', weight: 7 },
    { id: 'O-CLUSTER8', name: 'Cluster 8', deptCode: 'O', weight: 8 },
    { id: 'O-CLUSTER9', name: 'Cluster 9', deptCode: 'O', weight: 9 },
    { id: 'O-WEYJ', name: 'WEYJ', deptCode: 'O', weight: 10 },
    { id: 'O-TAPAT', name: 'TAPAT', deptCode: 'O', weight: 11 },

    // RELATIONSHIP
    { id: 'R-SPORTS', name: 'Sports', deptCode: 'R', weight: 1 },
    { id: 'R-GEM', name: 'GEM', deptCode: 'R', weight: 2 },
    { id: 'R-USHERING', name: 'Ushering', deptCode: 'R', weight: 3 },
    { id: 'R-MENS', name: 'Mens', deptCode: 'R', weight: 4 },
    { id: 'R-LADIES', name: 'Ladies', deptCode: 'R', weight: 5 },
    { id: 'R-YOUTHEMPOWERED', name: 'Youth Empowered', deptCode: 'R', weight: 6 },
    { id: 'R-YOUNGADULTS', name: 'Young Adults', deptCode: 'R', weight: 7 },

    // DISCIPLESHIP
    { id: 'D-J12', name: 'J12', deptCode: 'D', weight: 1 },
    { id: 'D-ONELINER', name: 'Oneliner', deptCode: 'D', weight: 2 },
    { id: 'D-CLDP', name: 'CLDP', deptCode: 'D', weight: 3 },
    { id: 'D-KID', name: 'KID', deptCode: 'D', weight: 4 },
    { id: 'D-CHILDRENSMINISTRY', name: "Children's Ministry", deptCode: 'D', weight: 5 },
    { id: 'D-LIFEINSTITUTE', name: 'Life Institute', deptCode: 'D', weight: 6 },
    { id: 'D-KCA', name: 'KCA', deptCode: 'D', weight: 7 },

    // ADMINISTRATION
    { id: 'A-FINANCE', name: 'Finance', deptCode: 'A', weight: 1 },
    { id: 'A-ENGINEERING', name: 'Engineering', deptCode: 'A', weight: 2 },
    { id: 'A-SECURITYANDSHUTTLE', name: 'Security and Shuttle', deptCode: 'A', weight: 3 },
    { id: 'A-TECHNOLOGY', name: 'Technology', deptCode: 'A', weight: 4 },
    { id: 'A-INHOUSE', name: 'In house', deptCode: 'A', weight: 5 },
    { id: 'A-VENTURES', name: 'Ventures', deptCode: 'A', weight: 6 },
    { id: 'A-ARTS', name: 'Arts', deptCode: 'A', weight: 7 },
    { id: 'A-LINKAGES', name: 'Linkages', deptCode: 'A', weight: 8 },
  ];

  for (const min of ministries) {
    await prisma.ministry.upsert({
      where: { id: min.id },
      update: {
        name: min.name,
        departmentCode: min.deptCode,
        weight: min.weight,
      },
      create: {
        id: min.id,
        name: min.name,
        description: `${min.name} Ministry`,
        departmentCode: min.deptCode,
        leaderId: '',
        weight: min.weight,
      },
    });
  }
  console.log('Seed complete: Ministries (40 ministries across 5 departments)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
