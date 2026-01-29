# SUKHA Employee Hub - Firebase Rebuild Deployment Guide

## Overview

This guide provides step-by-step instructions for setting up, testing, and deploying the rebuilt SUKHA Employee Hub application with Firebase/Firestore backend.

---

## Part 1: Environment Setup

### 1.1 Prerequisites

- Node.js 18+ and npm
- Firebase CLI (`npm install -g firebase-tools`)
- Angular CLI 21+ (`npm install -g @angular/cli@21`)
- Git

### 1.2 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project named `sukha-employee-hub`
3. Enable Google Analytics (optional)
4. Once created, navigate to Project Settings
5. Copy these credentials for `.env` file:
   - API Key
   - Project ID
   - Auth Domain
   - Storage Bucket
   - Messaging Sender ID
   - App ID

### 1.3 Configure Firebase Services

**Enable Authentication:**
- In Firebase Console, go to Authentication
- Enable Email/Password sign-in method
- Set up password requirements (minimum 6 characters)

**Create Firestore Database:**
- Go to Firestore Database
- Create in **production** mode
- Region: `asia-southeast2` (or closest to your location)
- Deploy security rules (see section below)

**Enable Cloud Functions (for payroll):**
- Go to Cloud Functions
- Ensure billing is enabled (Cloud Functions require it)

### 1.4 Configure Environment Files

**Create `.env` file:**

```env
# Firebase Web Configuration
FIREBASE_API_KEY=YOUR_API_KEY
FIREBASE_AUTH_DOMAIN=sukha-employee-hub.firebaseapp.com
FIREBASE_PROJECT_ID=sukha-employee-hub
FIREBASE_STORAGE_BUCKET=sukha-employee-hub.appspot.com
FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
FIREBASE_APP_ID=YOUR_APP_ID

# App Configuration
OWNER_EMAIL=steventok7@gmail.com
API_URL=http://localhost:5000
```

**Update `src/environments/environment.ts`:**

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: process.env['FIREBASE_API_KEY'],
    authDomain: process.env['FIREBASE_AUTH_DOMAIN'],
    projectId: process.env['FIREBASE_PROJECT_ID'],
    storageBucket: process.env['FIREBASE_STORAGE_BUCKET'],
    messagingSenderId: process.env['FIREBASE_MESSAGING_SENDER_ID'],
    appId: process.env['FIREBASE_APP_ID']
  },
  apiUrl: process.env['API_URL'] || 'http://localhost:5000',
  ownerEmail: 'steventok7@gmail.com'
};
```

### 1.5 Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install Cloud Functions dependencies
cd functions
npm install
cd ..
```

---

## Part 2: Local Development

### 2.1 Start Local Development Server

```bash
# Start Angular dev server
npm run dev

# App will be available at http://localhost:4200

# In another terminal, start Firebase Emulator (optional but recommended)
firebase emulators:start
```

### 2.2 Deploy Security Rules Locally

```bash
# Deploy security rules to your Firebase project
firebase deploy --only firestore:rules

# Deploy Cloud Functions
firebase deploy --only functions
```

### 2.3 Initialize Firestore Collections

Create initial data structure in Firestore:

**1. Create Owner User:**
```bash
# Use Firebase Auth to create owner user
# Email: steventok7@gmail.com
# Password: [set manually or use test password]
```

**2. Create `/users/{uid}` document:**
```json
{
  "email": "steventok7@gmail.com",
  "name": "Steven Tok",
  "role": "owner",
  "createdAt": "timestamp",
  "photoURL": null
}
```

**3. Create sample employee:**
```bash
# Use the "Add Employee" form in admin dashboard after login
```

### 2.4 Test Local Build

```bash
# Build for testing
npm run build

# Serve production build locally
npm run preview
```

---

## Part 3: Testing

### 3.1 Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### 3.2 Integration Tests

```bash
# Run integration tests against Firestore
npm run test:integration
```

### 3.3 End-to-End Tests

```bash
# Install Playwright browsers
npm run playwright:install

# Run e2e tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui
```

### 3.4 Manual Testing Checklist

See QA_CHECKLIST.md

---

## Part 4: Deployment

### 4.1 Deploy to Firebase Hosting

**Option A: Firebase CLI**

```bash
# Build the project
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy everything (rules, functions, hosting)
firebase deploy
```

**Option B: GitHub Actions (Recommended)**

1. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

2. Get Firebase Token:
```bash
firebase login:ci
# Copy token to GitHub Secrets as FIREBASE_TOKEN
```

### 4.2 Production Environment Setup

**Update `src/environments/environment.prod.ts`:**

```typescript
export const environment = {
  production: true,
  firebase: {
    apiKey: 'YOUR_PROD_API_KEY',
    authDomain: 'sukha-employee-hub.firebaseapp.com',
    projectId: 'sukha-employee-hub-prod',
    storageBucket: 'sukha-employee-hub-prod.appspot.com',
    messagingSenderId: 'YOUR_PROD_SENDER_ID',
    appId: 'YOUR_PROD_APP_ID'
  },
  apiUrl: 'https://api.sukha-employee-hub.com',
  ownerEmail: 'steventok7@gmail.com'
};
```

### 4.3 Deploy Cloud Functions

```bash
cd functions

# Deploy specific function
firebase deploy --only functions:generateMonthlyPayroll

# Deploy all functions
firebase deploy --only functions

cd ..
```

### 4.4 Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes (if created)
firebase deploy --only firestore:indexes
```

### 4.5 Monitor Deployment

```bash
# View Firebase hosting logs
firebase hosting:log

# View Cloud Functions logs
firebase functions:log

# View Firestore usage
firebase firestore:usage
```

---

## Part 5: Post-Deployment

### 5.1 Health Checks

- [ ] Navigate to deployed URL
- [ ] Test owner login (steventok7@gmail.com)
- [ ] Test employee login
- [ ] Verify attendance check-in/out works
- [ ] Test request submission (leave/sick)
- [ ] Verify payroll generation runs on schedule

### 5.2 Monitoring & Logging

**Enable Cloud Logging:**

```bash
# View all logs
firebase functions:log

# Stream real-time logs
firebase functions:log --follow
```

**Setup Alerts in Firebase Console:**
- Go to Cloud Functions
- Click on function
- Set up alert thresholds

### 5.3 Backup & Recovery

**Firestore Backup:**

```bash
# Export collection
gcloud firestore export gs://your-bucket/backups/$(date +%Y%m%d)

# Import collection
gcloud firestore import gs://your-bucket/backups/YYYY-MM-DD
```

---

## Part 6: Troubleshooting

### Common Issues

**Issue: "Firebase config not initialized"**
- Solution: Ensure `initializeFirebase()` is called in `main.ts` before bootstrap

**Issue: "Auth guard redirects to login infinitely"**
- Solution: Verify user doc exists in Firestore with correct role field

**Issue: "Attendance document not saving"**
- Solution: Check security rules allow employee to write attendance for their ID

**Issue: "Cloud Functions timeout"**
- Solution: Increase timeout in `firebase.json`:
```json
{
  "functions": {
    "timeout": 540
  }
}
```

**Issue: "Payroll generation not running**
- Solution: Check Cloud Scheduler is enabled and set to correct timezone

### Debug Mode

Enable debug logging:

```typescript
// In main.ts
import { enableDebugTracing } from '@angular/router';
enableDebugTracing();
```

---

## Part 7: Security Hardening

### 7.1 Security Rules Best Practices

✅ **Already Implemented:**
- Owner-only access to sensitive collections
- Employee can only access own data
- No direct root write access
- Request approval workflow enforced server-side
- Automatic sick leave approval with limits

### 7.2 Additional Security Steps

1. **Enable Security Auditing:**
   - Firebase Console → Security Rules → Audit Logs

2. **Setup VPC Service Controls:**
   - Restrict access to Firestore API

3. **Enable Encryption:**
   - Default: Application-layer encryption
   - Optional: Customer-managed keys in Cloud KMS

4. **Rate Limiting:**
   - Configure WAF rules on Firebase Hosting

### 7.3 GDPR Compliance

- User data deletion endpoint (Cloud Function)
- Data export endpoint (Cloud Function)
- Consent management UI

---

## Maintenance Schedule

| Task | Frequency | Owner |
|------|-----------|-------|
| Database backup | Daily | DevOps |
| Security rules review | Monthly | Tech Lead |
| Dependency updates | Weekly | Tech Lead |
| Performance optimization | Quarterly | Tech Lead |
| Disaster recovery drill | Quarterly | CTO |

---

## Support & Documentation

- **Firebase Docs**: https://firebase.google.com/docs
- **Angular 21 Docs**: https://angular.io/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Firestore Security**: https://firebase.google.com/docs/firestore/security
