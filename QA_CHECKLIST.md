# SUKHA Employee Hub - QA Checklist & Bug Prevention

## QA Test Matrix

### 1. Authentication & Authorization

#### Owner (Admin) Flow
- [ ] Owner can login with email: steventok7@gmail.com
- [ ] Owner is redirected to `/admin/dashboard`
- [ ] Owner cannot access `/employee/*` routes
- [ ] Owner can create new employee records
- [ ] Owner can view all employees
- [ ] Owner can view all attendance records
- [ ] Owner can approve/reject requests
- [ ] Owner can generate payroll
- [ ] Owner can logout successfully
- [ ] After logout, redirected to login page
- [ ] Refresh page maintains auth state

#### Employee Flow
- [ ] Employee can register with valid email
- [ ] Employee can login after registration
- [ ] Employee is redirected to `/employee/dashboard`
- [ ] Employee cannot access `/admin/*` routes
- [ ] Employee can only view own attendance
- [ ] Employee can only submit own requests
- [ ] Employee cannot approve other's requests
- [ ] Employee cannot access payroll summary
- [ ] Employee can logout successfully

#### Auth Guard Tests
- [ ] Unauthenticated users redirected to login
- [ ] Wrong role redirected to appropriate dashboard
- [ ] Guard prevents direct URL access to protected routes
- [ ] Auth state persists after page refresh
- [ ] Session timeout after 8 hours (configured)

### 2. Attendance Module

#### Check-In Flow
- [ ] Employee sees check-in button on dashboard
- [ ] Clicking check-in requests geolocation permission
- [ ] Check-in succeeds within geofence (500m radius)
- [ ] Check-in fails outside geofence with error message
- [ ] Cannot check-in twice same day
- [ ] Check-in time stored in Firestore
- [ ] Coordinates stored with check-in
- [ ] Toast notification shows success

#### Check-Out Flow
- [ ] Check-out button appears after successful check-in
- [ ] Check-out fails if no active check-in
- [ ] Check-out calculates total minutes worked
- [ ] Check-out geolocation stored
- [ ] Toast notification shows success

#### Attendance History
- [ ] Employee can view attendance for last 30 days
- [ ] History shows check-in time, check-out time, total minutes
- [ ] Owner can view all employees' attendance
- [ ] Owner can filter attendance by employee
- [ ] Owner can export attendance report
- [ ] Attendance displayed in correct timezone

#### Edge Cases
- [ ] Cannot check-in with GPS disabled (handled gracefully)
- [ ] Network timeout on check-in shows error
- [ ] Duplicate check-in attempts prevented
- [ ] Missing check-out record handled

### 3. Requests (Leave/Sick/Permission)

#### Sick Leave
- [ ] Employee can submit sick leave
- [ ] Sick leave request auto-approved
- [ ] Max 3 days/month auto-approved (then requires owner approval)
- [ ] Fourth sick day in month shows "Pending" status
- [ ] Owner cannot override auto-approved sick leave
- [ ] Employee receives notification of approval
- [ ] Sick days deducted from available balance

#### Leave Request
- [ ] Employee can submit leave request
- [ ] Requires reason/justification
- [ ] Shows "Pending" status initially
- [ ] Owner receives notification of new request
- [ ] Owner can approve/reject leave
- [ ] Employee notified of approval/rejection
- [ ] Rejected request shows rejection reason
- [ ] Multiple requests allowed but sequential

#### Permission Request
- [ ] Similar flow to leave
- [ ] Can specify number of hours
- [ ] Can submit same day
- [ ] Tracked separately from leave balance

#### Request Validation
- [ ] Cannot submit past-dated request
- [ ] Cannot submit request starting after ending date
- [ ] Cannot overlap with existing approved request
- [ ] Reason field is required
- [ ] Date range validation works
- [ ] Empty form submission prevented

#### Request History
- [ ] Employee can view own requests
- [ ] Shows status (pending/approved/rejected)
- [ ] Owner can view all requests
- [ ] Owner can filter by employee
- [ ] Owner can filter by status
- [ ] Request timestamps shown

### 4. Shift Scheduling

#### Owner Scheduling
- [ ] Owner can create shift for employee
- [ ] Can select shift type: morning/afternoon/full_day
- [ ] Morning shift: 6:00-14:00
- [ ] Afternoon shift: 14:00-22:00
- [ ] Full day shift: 6:00-22:00
- [ ] Can assign shift to multiple employees
- [ ] Can publish/unpublish schedule
- [ ] Only published schedules visible to employees

#### Employee View
- [ ] Employee sees published shifts only
- [ ] Shows shift type and times
- [ ] Can view schedule calendar
- [ ] Cannot modify own shifts
- [ ] Cannot see unpublished shifts

#### Bulk Operations
- [ ] Owner can create shifts for multiple days
- [ ] Can duplicate schedule template
- [ ] Can bulk update shift assignments
- [ ] Can delete future unpublished shifts
- [ ] Cannot delete past shifts

### 5. Payroll Module

#### Payroll Calculation
- [ ] Full-time employees: base salary
- [ ] Part-time employees: hourly rate × hours worked
- [ ] Attendance hours correctly calculated
- [ ] Approved expense claims added
- [ ] Deductions calculated correctly
- [ ] Net pay = base + claims - deductions
- [ ] Overtime calculated if applicable
- [ ] Calculations rounded to 2 decimals

#### Payroll Generation
- [ ] Cloud Function runs on 1st of month
- [ ] Manual trigger works for owner
- [ ] Only active employees included
- [ ] Generates for previous month
- [ ] Status set to "draft" initially
- [ ] Can be finalized for payment
- [ ] Cannot re-generate same period twice

#### Payroll Access Control
- [ ] Owner can view all payroll
- [ ] Employee cannot view payroll
- [ ] Payroll data never exposed to employee
- [ ] No payroll endpoints accessible by employee
- [ ] Payroll documents properly secured

#### Payroll Export
- [ ] Owner can export payroll as CSV
- [ ] Export includes all fields
- [ ] Export filename includes month/year
- [ ] Can email payroll summary
- [ ] Audit trail logged

### 6. Employee Directory (Owner Only)

#### View Employees
- [ ] Owner can see list of all employees
- [ ] Shows: name, email, role, status, start date
- [ ] Can search by name or email
- [ ] Can filter by status (active/inactive)
- [ ] Can filter by employment type (full/part-time)
- [ ] Can sort by any column

#### Add Employee
- [ ] Form has validation
- [ ] Email must be unique
- [ ] Name required
- [ ] Job title dropdown populated
- [ ] Employment type required
- [ ] Start date validation
- [ ] Can add employee before they signup
- [ ] Employee receives invite email with signup link

#### Edit Employee
- [ ] Can update employee details
- [ ] Changes reflect immediately
- [ ] Cannot change employee ID
- [ ] Cannot change role after creation
- [ ] Audit log tracks changes

#### Delete Employee
- [ ] Can mark employee as inactive
- [ ] Cannot delete active employee with pending requests
- [ ] Deleted employees' data retained for audit
- [ ] Cannot re-activate deleted employee

### 7. Form Validation & UX

#### Form Input Validation
- [ ] Required fields highlighted
- [ ] Email format validated
- [ ] Password minimum 6 characters
- [ ] Date fields validate format
- [ ] Number fields only accept numbers
- [ ] Submit button disabled on invalid form
- [ ] Error messages clear and helpful
- [ ] Inline validation shows in real-time

#### Error Handling
- [ ] Network errors show friendly message
- [ ] Server errors don't crash app
- [ ] Retry option available for failed operations
- [ ] Toast notifications show all errors
- [ ] Error messages auto-dismiss after 4 seconds
- [ ] Multiple errors show sequentially

#### Loading States
- [ ] Loading spinner shows during async operations
- [ ] Submit buttons disabled during submission
- [ ] Form fields disabled during submission
- [ ] Navigation disabled during loading
- [ ] Smooth loading animations

#### Responsive Design
- [ ] Works on mobile (320px+)
- [ ] Works on tablet (768px+)
- [ ] Works on desktop (1024px+)
- [ ] Bottom nav on mobile
- [ ] Sidebar on desktop
- [ ] Touch-friendly buttons (min 44px)
- [ ] Text readable on all screen sizes
- [ ] No horizontal scroll

### 8. Performance & Security

#### Performance
- [ ] Page load < 3 seconds
- [ ] Check-in/out < 1 second
- [ ] Dashboard renders < 2 seconds
- [ ] Large lists paginated (50 items/page)
- [ ] Images optimized and lazy-loaded
- [ ] Bundle size < 500KB (gzipped)
- [ ] Database queries indexed
- [ ] Caching enabled for static assets

#### Security
- [ ] Passwords never logged
- [ ] Sensitive data not in localStorage beyond auth
- [ ] All API calls over HTTPS
- [ ] CORS properly configured
- [ ] Security headers set (CSP, X-Frame-Options, etc.)
- [ ] Input sanitized on forms
- [ ] XSS protection enabled
- [ ] CSRF tokens validated on forms

#### Data Privacy
- [ ] Employee data only accessible to owner + self
- [ ] Payroll never exposed to employees
- [ ] No sensitive data in error messages
- [ ] Audit logs created for all changes
- [ ] Data exported includes data deletion option

### 9. Browser Compatibility

- [ ] Chrome 90+
- [ ] Firefox 88+
- [ ] Safari 14+
- [ ] Edge 90+
- [ ] Mobile Safari (iOS 12+)
- [ ] Chrome Android

### 10. Database Integrity

#### Firestore Collections
- [ ] /users - exists and populated
- [ ] /employees - exists and populated
- [ ] /attendance - records storing correctly
- [ ] /requests - records storing correctly
- [ ] /shifts - records storing correctly
- [ ] /payroll - records storing correctly

#### Data Constraints
- [ ] Duplicate emails prevented
- [ ] Employee IDs unique
- [ ] Timestamps in server time
- [ ] No orphaned documents
- [ ] Foreign key relationships valid

#### Index Status
- [ ] Composite indexes created
- [ ] Index queries perform efficiently
- [ ] No N+1 query patterns

---

## Bug Prevention Measures

### 1. Type Safety (TypeScript)

✅ **Prevents:**
- Runtime undefined access errors
- Wrong data type operations
- Missing required properties
- Implicit any usage

**Implementation:**
- Strict mode enabled: `"strict": true`
- All functions have return types
- All parameters typed
- No `any` without explanation
- Interfaces for all data models

### 2. Authentication & Authorization

✅ **Prevents:**
- Unauthorized access to routes
- Direct Firestore access without auth
- Cross-user data access
- Privilege escalation

**Implementation:**
- Auth guards on all protected routes
- Role-based access control in guards
- Firestore security rules enforce owner/employee separation
- Owner email hardcoded (not user-configurable)
- Session validation on app init

### 3. Data Validation

✅ **Prevents:**
- Invalid data in database
- Malformed API responses
- SQL injection-like attacks
- XSS through data

**Implementation:**
- Reactive forms with built-in validators
- Server-side validation in Cloud Functions
- Firestore validation rules
- Input sanitization in components
- Email format validation
- Date range validation

### 4. Double-Check Prevention

✅ **Prevents:**
- Duplicate check-ins same day
- Duplicate request submissions
- Duplicate payroll generation

**Implementation:**
- Client-side query before submission
- Server-side uniqueness constraints
- Optimistic UI disabled during submission
- Button disabled during submission
- Toast confirmation prevents accidental re-submission

### 5. Error Handling

✅ **Prevents:**
- Silent failures
- Unhandled promise rejections
- Lost user input after error
- Confusing error messages

**Implementation:**
- Try-catch on all async operations
- Service-level error state with signal
- Component-level error display
- Specific error messages
- Retry mechanism for transient failures
- Error logging to console in dev mode

### 6. Async Operations

✅ **Prevents:**
- Memory leaks from subscriptions
- Race conditions
- Stale data
- Concurrent operation conflicts

**Implementation:**
- `takeUntilDestroyed` for subscriptions
- Explicit unsubscribe in ngOnDestroy
- Loading state prevents double-submission
- Async operations use `await` (not fire-and-forget)
- Signals for reactive state updates
- OnPush change detection prevents stale UI

### 7. Access Control

✅ **Prevents:**
- Cross-employee data access
- Employee modifying own salary
- Employee viewing payroll
- Non-owners accessing admin functions

**Implementation:**
- Firestore rules: read access gated by role
- Firestore rules: write access to own data only for employees
- Firestore rules: payroll only readable by owner
- Routes guarded by role
- Backend Cloud Functions verify auth

### 8. State Management

✅ **Prevents:**
- Inconsistent state
- Stale data after updates
- Lost updates from concurrent ops
- Incorrect UI based on old data

**Implementation:**
- Single source of truth (Firestore)
- Signals used for local state
- Real-time subscriptions for shared data
- Optimistic updates with rollback
- State refreshed after mutations

### 9. Geofencing

✅ **Prevents:**
- Remote check-in/out (attendance fraud)
- Checking in from wrong location
- Bypass via VPN

**Implementation:**
- 500m radius validation on backend
- Coordinates stored and audited
- Owner can view check-in locations
- Failed geofence check shows specific error
- GPS validation before submission

### 10. Database Schema

✅ **Prevents:**
- Missing required fields
- Type mismatches
- Inconsistent timestamps
- Circular references

**Implementation:**
- TypeScript interfaces mirror Firestore
- Server timestamp used (not client)
- Required fields enforced by rules
- No nested collections to prevent sync issues
- Flat document structure

---

## Common Bugs Avoided

| Bug | How It's Prevented | Status |
|-----|-------------------|--------|
| Unauthorized database access | Firestore rules + auth guard | ✅ |
| Employee sees all payroll | Payroll collection rules | ✅ |
| Double check-in same day | Client + server-side query | ✅ |
| Race condition in requests | Async/await + loading state | ✅ |
| Memory leak from subscriptions | takeUntilDestroyed operator | ✅ |
| Stale UI after update | OnPush + signals | ✅ |
| Undefined errors at runtime | Strict TypeScript | ✅ |
| XSS through user input | Angular sanitization | ✅ |
| CSRF attacks | Firestore token-based auth | ✅ |
| Lost data on error | Error handling + retry | ✅ |

---

## Testing Guidelines

### Unit Test Coverage

**Minimum target: 80%**

```bash
npm run test:coverage
```

### Integration Test Coverage

**Test Firestore interactions:**
- Auth flows
- Role-based access
- Database queries
- Security rules

### E2E Test Coverage

**Critical user flows:**
- Owner login → create employee → assign shift → generate payroll
- Employee register → check-in → submit leave → view history
- Owner approve leave → verify notification

### Load Testing

```bash
# Simulate 100 concurrent users
firebase emulators:start
# Then use k6 or Artillery to load test
```

---

## Deployment Checklist

- [ ] All tests passing
- [ ] Security rules deployed
- [ ] Cloud Functions deployed
- [ ] Firestore indexes created
- [ ] Environment variables set
- [ ] Domain configured
- [ ] SSL certificate valid
- [ ] Email service configured (for notifications)
- [ ] Monitoring/alerting enabled
- [ ] Backup strategy documented
- [ ] Disaster recovery plan tested
