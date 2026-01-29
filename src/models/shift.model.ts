export type ShiftType = 'morning' | 'afternoon' | 'full_day';

export interface Shift {
  id?: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  shiftType: ShiftType;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const SHIFT_TIMES: Record<ShiftType, { start: string; end: string }> = {
  morning: { start: '06:00', end: '14:00' },
  afternoon: { start: '14:00', end: '22:00' },
  full_day: { start: '06:00', end: '22:00' }
};
