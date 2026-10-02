import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

const prisma = new PrismaClient();

async function runTests() {
  console.log('================================================================');
  console.log('🧪 VERIFYING GLOBAL MINISTRY-BASED ACCESS CONTROL & FILTERING');
  console.log('================================================================\n');

  const { getActorMinistryAccess, getMinistries, getWorkers, getBookings, createBooking, updateBooking } = await import('../apps/web/src/actions/db');

  // 1. Fetch test actors
  const adminWorker = await prisma.worker.findUnique({ where: { email: 'admin@admin.com' } });
  const sportsWorker = await prisma.worker.findUnique({ where: { email: 'worker.relationship@church.org' } });
  
  // Create or retrieve a test multi-ministry user
  let multiWorker = await prisma.worker.findUnique({ where: { email: 'multi.ministry@test.org' } });
  if (!multiWorker) {
    multiWorker = await prisma.worker.create({
      data: {
        firstName: 'Multi',
        lastName: 'Worker',
        email: 'multi.ministry@test.org',
        phone: '1234567890',
        status: 'Active',
        avatarUrl: '',
        majorMinistryId: 'R-SPORTS',
        minorMinistryId: 'W-WHITELIGHT',
        employmentType: 'Full-Time',
        assignedMinistryIds: ['R-SPORTS', 'W-WHITELIGHT', 'D-CLDP', 'A-FINANCE'],
      },
    });
  } else {
    await prisma.$executeRawUnsafe(
      `UPDATE "Worker" SET "majorMinistryId" = 'R-SPORTS', "minorMinistryId" = 'W-WHITELIGHT', "assignedMinistryIds" = $1::text[] WHERE id = $2`,
      ['R-SPORTS', 'W-WHITELIGHT', 'D-CLDP', 'A-FINANCE'],
      multiWorker.id
    );
  }

  // Create or retrieve a test zero-ministry user
  let zeroWorker = await prisma.worker.findUnique({ where: { email: 'zero.ministry@test.org' } });
  if (!zeroWorker) {
    zeroWorker = await prisma.worker.create({
      data: {
        firstName: 'Zero',
        lastName: 'Worker',
        email: 'zero.ministry@test.org',
        phone: '0000000000',
        status: 'Active',
        avatarUrl: '',
        majorMinistryId: '',
        minorMinistryId: '',
        employmentType: 'Volunteer',
        assignedMinistryIds: [],
      },
    });
  } else {
    await prisma.$executeRawUnsafe(
      `UPDATE "Worker" SET "majorMinistryId" = '', "minorMinistryId" = '', "assignedMinistryIds" = '{}'::text[] WHERE id = $1`,
      zeroWorker.id
    );
  }

  // Find a valid room to use for booking tests
  const testRoom = await prisma.room.findFirst();
  if (!testRoom) throw new Error('No rooms in database to test bookings');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- TEST SUITE 1: Single Ministry Worker (Sports) ---');
  if (sportsWorker) {
    const access = await getActorMinistryAccess(sportsWorker.id);
    assert(!access.isSuperAdmin, 'Sports worker is not Super Admin');
    assert(access.allowedMinistryIds?.includes('R-SPORTS') === true, 'Allowed ministries include R-SPORTS');
    assert(!access.allowedMinistryIds?.includes('W-WHITELIGHT'), 'Allowed ministries DO NOT include Whitelight');

    const ministries = await getMinistries(sportsWorker.id);
    assert(ministries.length === 1 && ministries[0].id === 'R-SPORTS', `getMinistries returns exactly 1 ministry (got ${ministries.length})`);

    const workers = await getWorkers({ actorId: sportsWorker.id });
    const allBelong = workers.every((w: any) => 
      w.majorMinistryId === 'R-SPORTS' || 
      w.minorMinistryId === 'R-SPORTS' || 
      (Array.isArray(w.assignedMinistryIds) && w.assignedMinistryIds.includes('R-SPORTS'))
    );
    assert(workers.length > 0 && allBelong, `getWorkers only returns workers for R-SPORTS (got ${workers.length})`);

    // Unauthorized booking creation test
    let rejected = false;
    try {
      await createBooking({
        roomId: testRoom.id,
        workerProfileId: sportsWorker.id,
        title: 'Illegal Foreign Booking',
        ministryId: 'W-WHITELIGHT', // Foreign ministry
        start: new Date(Date.now() + 86400000),
        end: new Date(Date.now() + 90000000),
        status: 'Pending',
      });
    } catch (e: any) {
      rejected = e.message.includes('Unauthorized') || e.message.includes('another ministry');
    }
    assert(rejected, 'createBooking rejected when attempting to book for another ministry');
  } else {
    assert(false, 'sportsWorker found in database');
  }

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST SUITE 2: Multi-Ministry Worker (Sports + Whitelight + CLDP + Finance) ---');
  const multiAccess = await getActorMinistryAccess(multiWorker.id);
  assert(!multiAccess.isSuperAdmin, 'Multi-ministry worker is not Super Admin');
  const expectedMins = ['R-SPORTS', 'W-WHITELIGHT', 'D-CLDP', 'A-FINANCE'];
  const hasAll = expectedMins.every(id => multiAccess.allowedMinistryIds?.includes(id));
  assert(hasAll, `Allowed ministries pool all 4 assigned ministries: ${multiAccess.allowedMinistryIds?.join(', ')}`);

  const multiMinistries = await getMinistries(multiWorker.id);
  assert(multiMinistries.length === 4, `getMinistries returns exactly 4 assigned ministries (got ${multiMinistries.length})`);
  assert(multiMinistries.every((m: any) => expectedMins.includes(m.id)), 'Returned ministries match assigned multi-ministries');

  // Allowed booking creation test
  let allowedSuccess = false;
  let testBookingId = '';
  try {
    const b = await createBooking({
      roomId: testRoom.id,
      workerProfileId: multiWorker.id,
      title: 'Multi Worker Finance Booking',
      name: 'Multi Worker Finance Booking',
      email: multiWorker.email,
      ministryId: 'A-FINANCE',
      pax: 5,
      requestedElements: [],
      guidelinesAccepted: true,
      start: new Date(Date.now() + 86400000),
      end: new Date(Date.now() + 90000000),
      status: 'Pending',
    });
    allowedSuccess = !!b.id;
    testBookingId = b.id;
  } catch (e: any) {
    console.error('Multi booking failed:', e.message);
  }
  assert(allowedSuccess, 'createBooking succeeds for assigned ministry A-FINANCE');

  // Unauthorized modification by Sports worker on Finance booking
  if (testBookingId && sportsWorker) {
    let modRejected = false;
    try {
      await updateBooking(testBookingId, { title: 'Tampered' }, sportsWorker.id);
    } catch (e: any) {
      modRejected = e.message.includes('Unauthorized');
    }
    assert(modRejected, 'Sports worker cannot modify Finance booking created by another ministry');

    // Clean up test booking
    await prisma.booking.delete({ where: { id: testBookingId } });
  }

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST SUITE 3: Zero-Assignment User (assignedMinistries = []) ---');
  const zeroAccess = await getActorMinistryAccess(zeroWorker.id);
  assert(!zeroAccess.isSuperAdmin, 'Zero-assignment worker is not Super Admin');
  assert(Array.isArray(zeroAccess.allowedMinistryIds) && zeroAccess.allowedMinistryIds.length === 0, 'allowedMinistryIds is strictly empty array []');

  const zeroMinistries = await getMinistries(zeroWorker.id);
  assert(zeroMinistries.length === 0, `getMinistries returns empty array [] (got ${zeroMinistries.length})`);

  const zeroWorkers = await getWorkers({ actorId: zeroWorker.id });
  assert(zeroWorkers.length === 0, `getWorkers returns empty array [] (got ${zeroWorkers.length})`);

  const zeroBookings = await getBookings({ actorId: zeroWorker.id });
  assert(zeroBookings.length === 0, `getBookings returns empty array [] (got ${zeroBookings.length})`);

  let zeroCreateRejected = false;
  try {
    await createBooking({
      roomId: testRoom.id,
      workerProfileId: zeroWorker.id,
      title: 'Zero Booking',
      ministryId: 'R-SPORTS',
      start: new Date(Date.now() + 86400000),
      end: new Date(Date.now() + 90000000),
      status: 'Pending',
    });
  } catch (e: any) {
    zeroCreateRejected = e.message.includes('No ministry assignment');
  }
  assert(zeroCreateRejected, 'createBooking rejected with "No ministry assignment available" error');

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST SUITE 4: Super Admin (Global Access) ---');
  if (adminWorker) {
    const adminAccess = await getActorMinistryAccess(adminWorker.id);
    assert(adminAccess.isSuperAdmin === true, 'Admin is recognized as Super Admin');
    assert(adminAccess.allowedMinistryIds === null, 'allowedMinistryIds is null (unrestricted global access)');

    const allMinistries = await getMinistries(adminWorker.id);
    assert(allMinistries.length >= 30, `Admin gets all global ministries (got ${allMinistries.length})`);

    const adminWorkers = await getWorkers({ actorId: adminWorker.id });
    assert(adminWorkers.length > 5, `Admin gets all workers globally (got ${adminWorkers.length})`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('================================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
