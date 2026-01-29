

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
  deleteDoc,
  serverTimestamp,
  Query,
  QueryConstraint,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { Employee, EmployeeProfile, EmployeePrivateDetails, FullEmployeeDetails } from '../models';
import { ToastService } from './toast.service';
import { LoadingService } from './loading.service';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private firestore = inject(Firestore);
  private toastService = inject(ToastService);
  private loadingService = inject(LoadingService);

  employees = signal<Employee[]>([]);
  currentEmployee = signal<FullEmployeeDetails | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Get all employees (owner only)
  async getAllEmployees(): Promise<Employee[]> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const q = query(collection(this.firestore, 'employees'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Employee));

      this.employees.set(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch employees';
      this.error.set(message);
      this.toastService.error(message);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get single employee with both profile and private details
  async getEmployeeById(id: string): Promise<FullEmployeeDetails | null> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const profileDoc = await getDoc(doc(this.firestore, 'employees', id));

      if (!profileDoc.exists()) {
        throw new Error('Employee not found');
      }

      const profileData = profileDoc.data() as Partial<FullEmployeeDetails>;
      const fullEmployee: FullEmployeeDetails = {
        id: profileDoc.id,
        email: '',
        name: '',
        role: 'employee',
        ...profileData
      };

      this.currentEmployee.set(fullEmployee);
      return fullEmployee;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch employee';
      this.error.set(message);
      this.toastService.error(message);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Create employee
  async createEmployee(employee: Omit<EmployeeProfile, 'id'>): Promise<string | null> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const data = {
        ...employee,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: employee.status || 'active'
      };

      const docRef = await addDoc(collection(this.firestore, 'employees'), data);
      this.toastService.success('Employee created successfully');
      return docRef.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create employee';
      this.error.set(message);
      this.toastService.error(message);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Update employee
  async updateEmployee(id: string, updates: Partial<FullEmployeeDetails>): Promise<boolean> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const { id: _, ...cleanUpdates } = updates;
      await updateDoc(doc(this.firestore, 'employees', id), {
        ...cleanUpdates,
        updatedAt: serverTimestamp()
      });

      this.toastService.success('Employee updated successfully');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update employee';
      this.error.set(message);
      this.toastService.error(message);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Delete employee
  async deleteEmployee(id: string): Promise<boolean> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await deleteDoc(doc(this.firestore, 'employees', id));
      this.employees.update(emp => emp.filter(e => e.id !== id));
      this.toastService.success('Employee deleted successfully');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete employee';
      this.error.set(message);
      this.toastService.error(message);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Search employees by name or email
  async searchEmployees(searchTerm: string): Promise<Employee[]> {
    if (!searchTerm.trim()) {
      return this.employees();
    }

    this.isLoading.set(true);

    try {
      const lowerSearch = searchTerm.toLowerCase();
      const allEmployees = await this.getAllEmployees();
      return allEmployees.filter(emp =>
        emp.name?.toLowerCase().includes(lowerSearch) ||
        emp.email?.toLowerCase().includes(lowerSearch)
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  // Subscribe to real-time updates
  subscribeToEmployees(callback: (employees: Employee[]) => void): Unsubscribe {
    const q = query(collection(this.firestore, 'employees'));
    return onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Employee));
      this.employees.set(data);
      callback(data);
    }, error => {
      console.error('Error subscribing to employees:', error);
      this.toastService.error('Failed to sync employee data');
    });
  }
}
