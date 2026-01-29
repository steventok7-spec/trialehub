import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { environment } from '../environments/environment';

let auth: Auth;
let firestore: Firestore;

export function initializeFirebase() {
  const app = initializeApp(environment.firebase);
  auth = getAuth(app);
  firestore = getFirestore(app);

  // Enable persistence for web
  if (typeof window !== 'undefined') {
    // Firestore persistence is automatic in web SDK
  }
}

export function getAuthInstance(): Auth {
  if (!auth) {
    initializeFirebase();
  }
  return auth;
}

export function getFirestoreInstance(): Firestore {
  if (!firestore) {
    initializeFirebase();
  }
  return firestore;
}
