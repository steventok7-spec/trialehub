

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
import { Request, RequestStatus, RequestType } from '../models';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class RequestsService {
  private firestore = inject(Firestore);
  private toastService = inject(ToastService);

  requests = signal<Request[]>([]);
  isLoading = signal(false);

  // Create request
  async createRequest(
    employeeId: string,
    type: RequestType,
    data: {
      start_date?: string;
      end_date?: string;
      reason?: string;
      amount?: number;
    }
  ): Promise<string | null> {
    this.isLoading.set(true);

    try {
      const docRef = await addDoc(collection(this.firestore, 'requests'), {
        employee_id: employeeId,
        type,
        status: 'pending',
        ...data,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      this.toastService.success('Request submitted successfully');
      return docRef.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create request';
      this.toastService.error(message);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get requests for employee
  async getEmployeeRequests(employeeId: string): Promise<Request[]> {
    this.isLoading.set(true);

    try {
      const q = query(
        collection(this.firestore, 'requests'),
        where('employee_id', '==', employeeId),
        orderBy('created_at', 'desc')
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Request));

      this.requests.set(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch requests';
      this.toastService.error(message);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get all pending requests (owner only)
  async getPendingRequests(): Promise<Request[]> {
    this.isLoading.set(true);

    try {
      const q = query(
        collection(this.firestore, 'requests'),
        where('status', '==', 'pending'),
        orderBy('created_at', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Request));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch requests';
      this.toastService.error(message);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  // Approve request
  async approveRequest(requestId: string): Promise<boolean> {
    this.isLoading.set(true);

    try {
      await updateDoc(doc(this.firestore, 'requests', requestId), {
        status: 'approved' as RequestStatus,
        updated_at: serverTimestamp()
      });

      this.toastService.success('Request approved');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve request';
      this.toastService.error(message);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Reject request
  async rejectRequest(requestId: string): Promise<boolean> {
    this.isLoading.set(true);

    try {
      await updateDoc(doc(this.firestore, 'requests', requestId), {
        status: 'rejected' as RequestStatus,
        updated_at: serverTimestamp()
      });

      this.toastService.success('Request rejected');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject request';
      this.toastService.error(message);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get request statistics
  async getRequestStats(employeeId: string): Promise<{
    totalRequests: number;
    approvedRequests: number;
    pendingRequests: number;
    rejectedRequests: number;
  }> {
    try {
      const requests = await this.getEmployeeRequests(employeeId);

      return {
        totalRequests: requests.length,
        approvedRequests: requests.filter(r => r.status === 'approved').length,
        pendingRequests: requests.filter(r => r.status === 'pending').length,
        rejectedRequests: requests.filter(r => r.status === 'rejected').length
      };
    } catch (err) {
      console.error('Error getting request stats:', err);
      return {
        totalRequests: 0,
        approvedRequests: 0,
        pendingRequests: 0,
        rejectedRequests: 0
      };
    }
  }
}
