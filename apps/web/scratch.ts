import { NotificationService } from './src/services/notification-service';

async function test() {
  try {
    const res = await NotificationService.notifyRoomReservationApproved(undefined, 'test-booking-id');
    console.log(res);
  } catch(e) {
    console.error(e);
  }
}
test();
