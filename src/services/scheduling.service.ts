

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
  orderBy
} from 'firebase/firestore';
import { ToastService } from './toast.service';

export interface Shift {
  id?: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'morning' | 'afternoon' | 'evening' | 'full';
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class SchedulingService {
  private firestore = inject(Firestore);
  private toastService = inject(ToastService);

  shifts = signal<Shift[]>([]);
  isLoading = signal(false);

  // Get employee's shifts for a date range
  async getEmployeeShifts(employeeId: string, startDate: string, endDate: string): Promise<Shift[]> {
    this.isLoading.set(true);

    try {
      const q = query(
        collection(this.firestore, 'shifts'),
        where('employeeId', '==', employeeId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc')
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Shift));

      this.shifts.set(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch shifts';
      this.toastService.error(message);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get today's shift
  async getTodayShift(employeeId: string): Promise<Shift | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const q = query(
        collection(this.firestore, 'shifts'),
        where('employeeId', '==', employeeId),
        where('date', '==', today)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Shift;
    } catch (err) {
      console.error('Error fetching today shift:', err);
      return null;
    }
  }

  // Create shift (owner only)
  async createShift(shift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    this.isLoading.set(true);

    try {
      const docRef = await addDoc(collection(this.firestore, 'shifts'), {
        ...shift,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      this.toastService.success('Shift created successfully');
      return docRef.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create shift';
      this.toastService.error(message);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Update shift (owner only)
  async updateShift(id: string, updates: Partial<Shift>): Promise<boolean> {
    this.isLoading.set(true);

    try {
      const { id: _, createdAt, ...cleanUpdates } = updates as any;
      await updateDoc(doc(this.firestore, 'shifts', id), {
        ...cleanUpdates,
        updatedAt: serverTimestamp()
      });

      this.toastService.success('Shift updated successfully');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update shift';
      this.toastService.error(message);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get all shifts for a date (owner only)
  async getShiftsByDate(date: string): Promise<Shift[]> {
    this.isLoading.set(true);

    try {
      const q = query(
        collection(this.firestore, 'shifts'),
        where('date', '==', date),
        orderBy('startTime', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Shift));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch shifts';
      this.toastService.error(message);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }
}
