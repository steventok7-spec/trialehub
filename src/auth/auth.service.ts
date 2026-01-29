import { Injectable, signal, DestroyRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  AuthError
} from 'firebase/auth';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  collection,
  updateDoc
} from 'firebase/firestore';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { getAuthInstance, getFirestoreInstance } from '../core/firebase.config';
import { OWNER_EMAIL } from '../core/constants';

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
  role: 'owner' | 'employee';
  photoURL?: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = getAuthInstance();
  private firestore: Firestore = getFirestoreInstance();
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  currentUser = signal<AuthUser | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(this.firestore, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            this.currentUser.set({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: userData['name'] || '',
              role: userData['role'] || 'employee',
              photoURL: firebaseUser.photoURL || undefined,
              createdAt: userData['createdAt']?.toDate?.() || new Date()
            });
          }
        } catch (e) {
          console.error('Error fetching user data:', e);
          this.error.set('Failed to load user data');
        }
      } else {
        this.currentUser.set(null);
      }
      this.isLoading.set(false);
    });
  }

  async login(email: string, password: string): Promise<AuthUser> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      const userDoc = await getDoc(doc(this.firestore, 'users', result.user.uid));

      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data();
      const user: AuthUser = {
        uid: result.user.uid,
        email: result.user.email || '',
        name: userData['name'] || '',
        role: userData['role'] || 'employee',
        photoURL: result.user.photoURL || undefined,
        createdAt: userData['createdAt']?.toDate?.() || new Date()
      };

      this.currentUser.set(user);
      return user;
    } catch (e: any) {
      const errorMessage = this.parseAuthError(e);
      this.error.set(errorMessage);
      throw e;
    } finally {
      this.isLoading.set(false);
    }
  }

  async signup(email: string, password: string, name: string): Promise<AuthUser> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const isOwner = email.toLowerCase() === OWNER_EMAIL.toLowerCase();

      const result = await createUserWithEmailAndPassword(this.auth, email, password);

      const userRef = doc(this.firestore, 'users', result.user.uid);
      const userData: any = {
        email,
        name,
        role: isOwner ? 'owner' : 'employee',
        createdAt: new Date(),
        photoURL: null
      };

      await setDoc(userRef, userData);

      if (!isOwner) {
        const employeeQuery = query(
          collection(this.firestore, 'employees'),
          where('email', '==', email)
        );
        const employeeDocs = await getDocs(employeeQuery);

        if (!employeeDocs.empty) {
          const employeeDoc = employeeDocs.docs[0];
          await updateDoc(doc(this.firestore, 'employees', employeeDoc.id), {
            userId: result.user.uid,
            updatedAt: new Date()
          });
        }
      }

      const user: AuthUser = {
        uid: result.user.uid,
        email,
        name,
        role: isOwner ? 'owner' : 'employee',
        photoURL: null,
        createdAt: new Date()
      };

      this.currentUser.set(user);
      return user;
    } catch (e: any) {
      const errorMessage = this.parseAuthError(e);
      this.error.set(errorMessage);
      throw e;
    } finally {
      this.isLoading.set(false);
    }
  }

  async logout(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      await signOut(this.auth);
      this.currentUser.set(null);
      this.router.navigate(['/']);
    } catch (e: any) {
      const errorMessage = this.parseAuthError(e);
      this.error.set(errorMessage);
      throw e;
    } finally {
      this.isLoading.set(false);
    }
  }

  isOwner(): boolean {
    return this.currentUser()?.role === 'owner';
  }

  isEmployee(): boolean {
    return this.currentUser()?.role === 'employee';
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  private parseAuthError(error: AuthError): string {
    const errorMap: Record<string, string> = {
      'auth/invalid-email': 'Invalid email address',
      'auth/user-disabled': 'User account is disabled',
      'auth/user-not-found': 'User not found',
      'auth/wrong-password': 'Incorrect password',
      'auth/email-already-in-use': 'Email already in use',
      'auth/weak-password': 'Password is too weak',
      'auth/operation-not-allowed': 'Operation not allowed',
      'auth/too-many-requests': 'Too many login attempts, please try again later'
    };

    return errorMap[error.code] || error.message || 'Authentication failed';
  }
}
