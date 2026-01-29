export interface Attendance {
  id?: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkInTime?: Date;
  checkInLat?: number;
  checkInLng?: number;
  checkOutTime?: Date;
  checkOutLat?: number;
  checkOutLng?: number;
  totalMinutes: number;
  status: 'checked_in' | 'checked_out' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface GeolocationPoint {
  lat: number;
  lng: number;
}

export const GEOFENCE_RADIUS_METERS = 500; // 500m radius for workplace
export const GEOFENCE_WORKPLACE_LAT = -6.2297; // Replace with actual
export const GEOFENCE_WORKPLACE_LNG = 106.8112; // Replace with actual
