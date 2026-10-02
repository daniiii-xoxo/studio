import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in apps/web/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DeptAccountConfig {
  deptCode: string;
  deptName: string;
  majorMinistryId: string;
  head: {
    workerId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  worker: {
    workerId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

const DEPT_CONFIGS: DeptAccountConfig[] = [
  {
    deptCode: 'W',
    deptName: 'Worship',
    majorMinistryId: 'W-WHITELIGHT',
    head: {
      workerId: '10001',
      firstName: 'Worship',
      lastName: 'Head',
      email: 'head.worship@church.org',
      phone: '09170000001',
    },
    worker: {
      workerId: '10002',
      firstName: 'Worship',
      lastName: 'Worker',
      email: 'worker.worship@church.org',
      phone: '09170000002',
    },
  },
  {
    deptCode: 'O',
    deptName: 'Outreach',
    majorMinistryId: 'O-CLUSTER1',
    head: {
      workerId: '20001',
      firstName: 'Outreach',
      lastName: 'Head',
      email: 'head.outreach@church.org',
      phone: '09170000003',
    },
    worker: {
      workerId: '20002',
      firstName: 'Outreach',
      lastName: 'Worker',
      email: 'worker.outreach@church.org',
      phone: '09170000004',
    },
  },
  {
    deptCode: 'R',
    deptName: 'Relationship',
    majorMinistryId: 'R-SPORTS',
    head: {
      workerId: '30001',
      firstName: 'Relationship',
      lastName: 'Head',
      email: 'head.relationship@church.org',
      phone: '09170000005',
    },
    worker: {
      workerId: '30002',
      firstName: 'Relationship',
      lastName: 'Worker',
      email: 'worker.relationship@church.org',
      phone: '09170000006',
    },
  },
  {
    deptCode: 'D',
    deptName: 'Discipleship',
    majorMinistryId: 'D-CLDP',
    head: {
      workerId: '40001',
      firstName: 'Discipleship',
      lastName: 'Head',
      email: 'head.discipleship@church.org',
      phone: '09170000007',
    },
    worker: {
      workerId: '40002',
      firstName: 'Discipleship',
      lastName: 'Worker',
      email: 'worker.discipleship@church.org',
      phone: '09170000008',
    },
  },
  {
    deptCode: 'A',
    deptName: 'Administration',
    majorMinistryId: 'A-FINANCE',
    head: {
      workerId: '50001',
      firstName: 'Admin',
      lastName: 'Head',
      email: 'head.admin@church.org',
      phone: '09170000009',
    },
    worker: {
      workerId: '50002',
      firstName: 'Admin',
      lastName: 'Worker',
      email: 'worker.admin@church.org',
      phone: '09170000010',
    },
  },
];

const DEFAULT_PASSWORD = 'Password123!';

async function getOrCreateAuthUser(email: string, password: string): Promise<string> {
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    throw listError;
  }

  const existing = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    // Update password to ensure it matches
    await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    return existing.id;
  }

  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    throw createError;
  }

  return createData.user.id;
}

async function main() {
  console.log('=== 1. Normalizing Ministry Head Role ===');
  let headRole = await prisma.role.findFirst({
    where: {
      OR: [
        { name: 'Ministry Head' },
        { name: 'Ministry  Head' },
      ],
    },
  });

  if (!headRole) {
    headRole = await prisma.role.create({
      data: {
        name: 'Ministry Head',
        isSuperAdmin: false,
        isSystemRole: false,
      },
    });
  } else if (headRole.name !== 'Ministry Head') {
    headRole = await prisma.role.update({
      where: { id: headRole.id },
      data: { name: 'Ministry Head' },
    });
  }

  let workerRole = await prisma.role.findFirst({
    where: {
      OR: [
        { id: 'viewer' },
        { name: 'Worker' },
      ],
    },
  });

  if (!workerRole) {
    workerRole = await prisma.role.create({
      data: {
        id: 'viewer',
        name: 'Worker',
        isSuperAdmin: false,
        isSystemRole: true,
      },
    });
  }

  console.log(`Roles identified:`);
  console.log(`- Ministry Head Role ID: ${headRole.id}`);
  console.log(`- Worker Role ID: ${workerRole.id}`);

  console.log('\n=== 2. Creating Accounts for each Department ===');

  const createdSummary: any[] = [];

  for (const config of DEPT_CONFIGS) {
    console.log(`\n--- Setting up Department: ${config.deptName} (${config.deptCode}) ---`);

    // 1. Create/Sync Ministry Head
    const headAuthId = await getOrCreateAuthUser(config.head.email, DEFAULT_PASSWORD);
    console.log(`Supabase Auth ID for ${config.head.email}: ${headAuthId}`);

    const headWorker = await prisma.worker.upsert({
      where: { email: config.head.email },
      update: {
        firstName: config.head.firstName,
        lastName: config.head.lastName,
        phone: config.head.phone,
        workerId: config.head.workerId,
        roleId: headRole.id,
        majorMinistryId: config.majorMinistryId,
        status: 'Active',
        passwordChangeRequired: false,
      },
      create: {
        id: headAuthId,
        email: config.head.email,
        firstName: config.head.firstName,
        lastName: config.head.lastName,
        phone: config.head.phone,
        workerId: config.head.workerId,
        roleId: headRole.id,
        majorMinistryId: config.majorMinistryId,
        minorMinistryId: '',
        status: 'Active',
        avatarUrl: '',
        passwordChangeRequired: false,
      },
    });

    // Link WorkerRole
    await prisma.workerRole.upsert({
      where: {
        workerId_roleId: {
          workerId: headWorker.id,
          roleId: headRole.id,
        },
      },
      update: {},
      create: {
        workerId: headWorker.id,
        roleId: headRole.id,
      },
    });

    // 2. Assign headWorker as headId for ALL ministries in this department
    const ministryUpdate = await prisma.ministry.updateMany({
      where: { departmentCode: config.deptCode },
      data: { headId: headWorker.id },
    });
    console.log(`Assigned ${config.head.firstName} ${config.head.lastName} as head of ${ministryUpdate.count} ministries in ${config.deptName}`);

    // Also update DepartmentSetting if exists/upsert
    await prisma.departmentSetting.upsert({
      where: { id: config.deptCode },
      update: { headId: headWorker.id },
      create: {
        id: config.deptCode,
        headId: headWorker.id,
        description: `${config.deptName} Department`,
      },
    });

    // 3. Create/Sync Worker
    const workerAuthId = await getOrCreateAuthUser(config.worker.email, DEFAULT_PASSWORD);
    console.log(`Supabase Auth ID for ${config.worker.email}: ${workerAuthId}`);

    const workerRecord = await prisma.worker.upsert({
      where: { email: config.worker.email },
      update: {
        firstName: config.worker.firstName,
        lastName: config.worker.lastName,
        phone: config.worker.phone,
        workerId: config.worker.workerId,
        roleId: workerRole.id,
        majorMinistryId: config.majorMinistryId,
        status: 'Active',
        passwordChangeRequired: false,
      },
      create: {
        id: workerAuthId,
        email: config.worker.email,
        firstName: config.worker.firstName,
        lastName: config.worker.lastName,
        phone: config.worker.phone,
        workerId: config.worker.workerId,
        roleId: workerRole.id,
        majorMinistryId: config.majorMinistryId,
        minorMinistryId: '',
        status: 'Active',
        avatarUrl: '',
        passwordChangeRequired: false,
      },
    });

    // Link WorkerRole
    await prisma.workerRole.upsert({
      where: {
        workerId_roleId: {
          workerId: workerRecord.id,
          roleId: workerRole.id,
        },
      },
      update: {},
      create: {
        workerId: workerRecord.id,
        roleId: workerRole.id,
      },
    });

    createdSummary.push({
      department: config.deptName,
      head: {
        name: `${config.head.firstName} ${config.head.lastName}`,
        email: config.head.email,
        workerId: config.head.workerId,
        password: DEFAULT_PASSWORD,
        ministriesAssigned: ministryUpdate.count,
      },
      worker: {
        name: `${config.worker.firstName} ${config.worker.lastName}`,
        email: config.worker.email,
        workerId: config.worker.workerId,
        password: DEFAULT_PASSWORD,
        majorMinistry: config.majorMinistryId,
      },
    });
  }

  console.log('\n================ ACCOUNT SETUP COMPLETE ================');
  console.dir(createdSummary, { depth: null });
}

main()
  .catch((e) => {
    console.error('Error during setup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


