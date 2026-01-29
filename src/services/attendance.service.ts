

import { Injectable, signal, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  serverTimestamp,
  limit,
  orderBy,
  QueryConstraint,
  getDocs as getDocsRaw,
  Timestamp
} from 'firebase/firestore';
import { Attendance } from '../models';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private firestore = inject(Firestore);
  private toastService = inject(ToastService);

  attendance = signal<Attendance[]>([]);
  isLoading = signal(false);

  // Check in
  async checkIn(employeeId: string, latitude?: number, longitude?: number): Promise<boolean> {
    this.isLoading.set(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const checkInTime = new Date().toISOString();

      // Check if already checked in today
      const q = query(
        collection(this.firestore, 'attendance'),
        where('employee_id', '==', employeeId),
        where('date', '==', today)
      );

      const existing = await getDocsRaw(q);

      if (!existing.empty) {
        throw new Error('Already checked in today');
      }

      await addDoc(collection(this.firestore, 'attendance'), {
        employee_id: employeeId,
        date: today,
        check_in: checkInTime,
        check_out: null,
        total_minutes: 0,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        createdAt: serverTimestamp()
      });

      this.toastService.success('Checked in successfully');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Check-in failed';
      this.toastService.error(message);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Check out
  async checkOut(employeeId: string, latitude?: number, longitude?: number): Promise<boolean> {
    this.isLoading.set(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const checkOutTime = new Date().toISOString();

      const q = query(
        collection(this.firestore, 'attendance'),
        where('employee_id', '==', employeeId),
        where('date', '==', today)
      );

      const snapshot = await getDocsRaw(q);

      if (snapshot.empty) {
        throw new Error('No check-in record found for today');
      }

      const attendanceDoc = snapshot.docs[0];
      const checkInTime = attendanceDoc.data()['check_in'];

      // Calculate minutes worked
      const checkInDate = new Date(checkInTime);
      const checkOutDate = new Date(checkOutTime);
      const totalMinutes = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 60000);

      await updateDoc(doc(this.firestore, 'attendance', attendanceDoc.id), {
        check_out: checkOutTime,
        total_minutes: totalMinutes,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        updatedAt: serverTimestamp()
      });

      this.toastService.success('Checked out successfully');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Check-out failed';
      this.toastService.error(message);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get attendance records for employee
  async getEmployeeAttendance(employeeId: string, daysBack: number = 30): Promise<Attendance[]> {
    this.isLoading.set(true);

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      const startDateStr = startDate.toISOString().split('T')[0];

      const q = query(
        collection(this.firestore, 'attendance'),
        where('employee_id', '==', employeeId),
        where('date', '>=', startDateStr),
        orderBy('date', 'desc'),
        limit(daysBack)
      );

      const snapshot = await getDocsRaw(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Attendance));

      this.attendance.set(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch attendance';
      this.toastService.error(message);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get attendance for a specific date range
  async getAttendanceByDateRange(employeeId: string, startDate: string, endDate: string): Promise<Attendance[]> {
    this.isLoading.set(true);

    try {
      const q = query(
        collection(this.firestore, 'attendance'),
        where('employee_id', '==', employeeId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocsRaw(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Attendance));
    } catch (err) {
      console.error('Error fetching attendance by date range:', err);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get today's attendance for employee
  async getTodayAttendance(employeeId: string): Promise<Attendance | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const q = query(
        collection(this.firestore, 'attendance'),
        where('employee_id', '==', employeeId),
        where('date', '==', today)
      );

      const snapshot = await getDocsRaw(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Attendance;
    } catch (err) {
      console.error('Error fetching today attendance:', err);
      return null;
    }
  }

  // Calculate total hours for a month
  async getMonthlyHours(employeeId: string, month: number, year: number): Promise<number> {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const records = await this.getAttendanceByDateRange(employeeId, startDate, endDate);
      return records.reduce((total, record) => total + (record.total_minutes || 0), 0) / 60; // Convert to hours
    } catch (err) {
      console.error('Error calculating monthly hours:', err);
      return 0;
    }
  }
}
