export interface AttendanceShiftSettings {
    shiftStartTime: string; // e.g. "09:00" (HH:mm)
    gracePeriodMinutes: number; // e.g. 15
    shiftEndTime: string; // e.g. "17:00" (HH:mm)
    cooldownMinutes: number; // e.g. 5
}

export const DEFAULT_ATTENDANCE_SETTINGS: AttendanceShiftSettings = {
    shiftStartTime: "09:00",
    gracePeriodMinutes: 15,
    shiftEndTime: "17:00",
    cooldownMinutes: 5,
};
