

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
  orderBy,
  getDocs as getDocsRaw
} from 'firebase/firestore';
import { Request, RequestStatus, RequestType } from '../models';
import { ToastService } from './toast.service';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class RequestsService {
  private firestore = inject(Firestore);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  requests = signal<Request[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Helper: Check if current user is owner
  private isOwner(): boolean {
    return this.authService.isOwner();
  }

  // Helper: Get current user's UID
  private getCurrentUserId(): string | null {
    return this.authService.currentUser()?.uid || null;
  }

  // Helper: Get employee ID for current user
  private async getEmployeeIdForUser(userId: string): Promise<string | null> {
    try {
      const q = query(
        collection(this.firestore, 'employees'),
        where('user_id', '==', userId)
      );
      const snapshot = await getDocsRaw(q);
      if (!snapshot.empty) {
        return snapshot.docs[0].id;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Create leave request
  async createLeaveRequest(
    employeeId: string,
    data: {
      type: 'annual' | 'sick' | 'personal' | 'other';
      startDate: string;
      endDate: string;
      reason: string;
    }
  ): Promise<string | null> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const docRef = await addDoc(collection(this.firestore, 'leave_requests'), {
        employeeId,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        status: 'pending',
        approvedBy: null,
        approvalDate: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      this.toastService.success('Leave request submitted successfully');
      return docRef.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit leave request';
      this.error.set(message);
      this.toastService.error(message);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Create permission request
  async createPermissionRequest(
    employeeId: string,
    data: {
      type: 'early-leave' | 'late-arrival' | 'half-day' | 'other';
      requestDate: string;
      reason: string;
    }
  ): Promise<string | null> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const docRef = await addDoc(collection(this.firestore, 'permission_requests'), {
        employeeId,
        type: data.type,
        requestDate: data.requestDate,
        reason: data.reason,
        status: 'pending',
        approvedBy: null,
        approvalDate: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      this.toastService.success('Permission request submitted successfully');
      return docRef.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit permission request';
      this.error.set(message);
      this.toastService.error(message);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Generic create request (legacy support)
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
    this.error.set(null);

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
      this.error.set(message);
      this.toastService.error(message);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get all leave requests (with access control)
  async getAllLeaveRequests(): Promise<any[]> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // If owner, get all leave requests
      if (this.isOwner()) {
        const q = query(
          collection(this.firestore, 'leave_requests'),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocsRaw(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      // If employee, get only their own leave requests
      const employeeId = await this.getEmployeeIdForUser(userId);
      if (!employeeId) {
        throw new Error('Employee record not found for this user');
      }

      return this.getEmployeeLeaveRequests(employeeId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch leave requests';
      this.error.set(message);
      this.toastService.error(message);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get all permission requests (with access control)
  async getAllPermissionRequests(): Promise<any[]> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // If owner, get all permission requests
      if (this.isOwner()) {
        const q = query(
          collection(this.firestore, 'permission_requests'),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocsRaw(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      // If employee, get only their own permission requests
      const employeeId = await this.getEmployeeIdForUser(userId);
      if (!employeeId) {
        throw new Error('Employee record not found for this user');
      }

      return this.getEmployeePermissionRequests(employeeId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch permission requests';
      this.error.set(message);
      this.toastService.error(message);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get leave requests for specific employee
  async getEmployeeLeaveRequests(employeeId: string): Promise<any[]> {
    this.isLoading.set(true);

    try {
      const q = query(
        collection(this.firestore, 'leave_requests'),
        where('employeeId', '==', employeeId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocsRaw(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch leave requests';
      this.toastService.error(message);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get permission requests for specific employee
  async getEmployeePermissionRequests(employeeId: string): Promise<any[]> {
    this.isLoading.set(true);

    try {
      const q = query(
        collection(this.firestore, 'permission_requests'),
        where('employeeId', '==', employeeId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocsRaw(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch permission requests';
      this.toastService.error(message);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get requests for employee (legacy)
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

  // Approve leave request (owner only)
  async approveLeaveRequest(requestId: string): Promise<boolean> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Owner-only check
      if (!this.isOwner()) {
        const message = 'Only owners can approve requests';
        this.error.set(message);
        this.toastService.error(message);
        return false;
      }

      const ownerId = this.getCurrentUserId();
      await updateDoc(doc(this.firestore, 'leave_requests', requestId), {
        status: 'approved',
        approvedBy: ownerId,
        approvalDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      this.toastService.success('Leave request approved');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve request';
      this.error.set(message);
      this.toastService.error(message);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Reject leave request (owner only)
  async rejectLeaveRequest(requestId: string): Promise<boolean> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Owner-only check
      if (!this.isOwner()) {
        const message = 'Only owners can reject requests';
        this.error.set(message);
        this.toastService.error(message);
        return false;
      }

      const ownerId = this.getCurrentUserId();
      await updateDoc(doc(this.firestore, 'leave_requests', requestId), {
        status: 'rejected',
        approvedBy: ownerId,
        approvalDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      this.toastService.success('Leave request rejected');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject request';
      this.error.set(message);
      this.toastService.error(message);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Approve permission request (owner only)
  async approvePermissionRequest(requestId: string): Promise<boolean> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Owner-only check
      if (!this.isOwner()) {
        const message = 'Only owners can approve requests';
        this.error.set(message);
        this.toastService.error(message);
        return false;
      }

      const ownerId = this.getCurrentUserId();
      await updateDoc(doc(this.firestore, 'permission_requests', requestId), {
        status: 'approved',
        approvedBy: ownerId,
        approvalDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      this.toastService.success('Permission request approved');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve request';
      this.error.set(message);
      this.toastService.error(message);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Reject permission request (owner only)
  async rejectPermissionRequest(requestId: string): Promise<boolean> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Owner-only check
      if (!this.isOwner()) {
        const message = 'Only owners can reject requests';
        this.error.set(message);
        this.toastService.error(message);
        return false;
      }

      const ownerId = this.getCurrentUserId();
      await updateDoc(doc(this.firestore, 'permission_requests', requestId), {
        status: 'rejected',
        approvedBy: ownerId,
        approvalDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      this.toastService.success('Permission request rejected');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject request';
      this.error.set(message);
      this.toastService.error(message);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Approve request (legacy)
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

  // Reject request (legacy)
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
