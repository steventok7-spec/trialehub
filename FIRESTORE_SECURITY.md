# Firestore Security Rules - SUKHA HRIS

## Overview

This document describes the Firestore Security Rules for the SUKHA HRIS application (Phase 1-5). The rules enforce role-based access control (RBAC) at the database level.

## Architecture

### Authentication
- All sensitive operations require Firebase Authentication (`request.auth != null`)
- User role is stored in `/users/{uid}` with field `role` ('owner' | 'employee')

### Authorization
- **Owner**: Full read/write access to all operational data
- **Employee**: Read/write access to own data only
- **Payroll**: Read-only for employees, write-only for owners

### Data Ownership
Employee data ownership is determined by the `user_id` field in the employee document:
```
/employees/{employeeId}.user_id == request.auth.uid
```

## Collection Rules

### Users (`/users/{userId}`)
- **Read**: User can read own profile; owner can read all
- **Create**: User can create own profile (signup)
- **Update**: User can update own profile
- **Delete**: Disabled

### Employees (`/employees/{employeeId}`)
- **Read**: Owner reads all; employee reads own only (if `user_id` matches)
- **Write**: Owner only
- **Delete**: Disabled (audit trail)

### Attendance (`/attendance/{attendanceId}`)
- **Read**: Owner reads all; employee reads own (field: `employee_id`)
- **Create**: Authenticated users (service verifies employee_id ownership)
- **Update**: Owner updates any; employee updates own
- **Delete**: Disabled

### Leave Requests (`/leave_requests/{leaveId}`)
- **Read**: Owner reads all; employee reads own (field: `employeeId`)
- **Create**: Authenticated users (service verifies employee_id ownership)
- **Update**: Owner only (approval workflow)
- **Delete**: Disabled

### Permission Requests (`/permission_requests/{permissionId}`)
- **Read**: Owner reads all; employee reads own (field: `employeeId`)
- **Create**: Authenticated users (service verifies employee_id ownership)
- **Update**: Owner only (approval workflow)
- **Delete**: Disabled

### Payroll (`/payroll/{payrollId}`)
- **Read**: Owner reads all; employee reads own (field: `employeeId`)
- **Write**: Owner only (payroll generation)
- **Delete**: Disabled

### Requests (Legacy) (`/requests/{requestId}`)
- **Read**: Owner reads all; employee reads own (field: `employee_id`)
- **Create**: Authenticated users (service verifies employee_id ownership)
- **Update**: Owner only
- **Delete**: Disabled

### Shifts (`/shifts/{shiftId}`)
- **Read**: Owner only
- **Write**: Owner only
- **Delete**: Disabled

## Security Model

### Defense in Depth
1. **Database Rules**: First layer - prevent unauthorized queries
2. **Service Layer**: Second layer - application validates business logic
3. **Firestore Indexes**: Enable efficient rule evaluation

### Important Notes

#### Employee Ownership Verification
For create operations, Firestore rules **cannot query** the employees collection to verify that an `employee_id` belongs to the current user. Therefore:

- **Read operations**: Rules verify ownership by querying the employee document
- **Create operations**: Rules trust the application layer to pass the correct `employee_id`
  - The service layer (PayrollService, AttendanceService, RequestsService) enforces this
  - Example: `AttendanceService.checkIn()` calls `getEmployeeIdForUser()` before writing

#### No Deletes
All operational collections block deletes to maintain audit trail. Only owners can create records.

#### Audit Trail
- `createdAt` and `updatedAt` timestamps maintained by application
- Records are immutable once finalized (handled by application logic)

## Deployment

1. Deploy rules via Firebase Console or CLI:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. Verify rules syntax:
   ```bash
   firebase emulators:start  # Local testing
   ```

3. Test with Firestore Rules Simulator before production deployment

## Testing Checklist

### Owner Access
- [ ] Can read all employees
- [ ] Can create/update employees
- [ ] Can read all attendance records
- [ ] Can read all leave/permission requests
- [ ] Can generate payroll
- [ ] Can approve/reject requests

### Employee Access
- [ ] Can read own employee profile
- [ ] Can create own attendance records
- [ ] Can create own leave/permission requests
- [ ] Can read own payroll (read-only)
- [ ] Cannot read other employees' data
- [ ] Cannot modify payroll

### Unauthenticated Access
- [ ] Cannot read any collection
- [ ] Cannot create any collection
- [ ] Cannot update any collection
- [ ] Cannot delete any collection

## Helper Functions

```
isSignedIn()                    // Check authentication
isOwner()                       // Check if user is owner
isEmployee()                    // Check if user is employee (not owner)
belongsToCurrentUser(id)        // Verify employee_id ownership
getCurrentUserId()              // Get auth.uid
```

## Migration Notes

- Previous rules (v0.1) used email-based identification
- Current rules use Firebase Auth UID with employee.user_id mapping
- All existing data compatible - no schema migration needed
- Service layer already enforces these patterns

## Future Enhancements

- [ ] Add Firestore audit logging
- [ ] Implement IP allowlisting for sensitive operations
- [ ] Add rate limiting for API calls
- [ ] Custom security policies per employee role (not just owner/employee)
