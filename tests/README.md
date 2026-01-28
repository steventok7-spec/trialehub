# Automated Testing Suite

Complete automated test suite for the Angular 21 + Supabase application.

## Test Structure

```
tests/
├── e2e/                    # Playwright E2E tests
│   ├── auth.owner.spec.ts
│   ├── auth.employee.spec.ts
│   ├── employees.directory.spec.ts
│   ├── employees.add.spec.ts
│   ├── attendance.spec.ts
│   ├── requests.spec.ts
│   ├── schedule.spec.ts
│   └── payroll.spec.ts
├── integration/            # Node integration tests (RLS)
│   └── rls.test.ts
└── utils/
    └── supabaseTestUtils.ts
```

## Setup

### 1. Install Dependencies

```bash
npm install
npm run playwright:install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for test cleanup)
- `OWNER_EMAIL` - steventok@sukhapku.com
- `OWNER_PASSWORD` - Your owner password
- `TEST_EMPLOYEE_PASSWORD` - Password for test employees
- `BASE_URL` - http://localhost:4200

### 3. Run Database Migrations

Ensure all migrations are applied:
1. `MIGRATION_001_OWNER_ROLE.sql`
2. `MIGRATION_002_SCHEDULE_TABLE.sql`
3. `MIGRATION_003_SICK_AUTO_APPROVAL.sql`
4. `MIGRATION_004_ENHANCED_PROFILES.sql`

## Running Tests

### All Tests
```bash
npm run test:all
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests (RLS)
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### E2E with UI Mode
```bash
npm run test:e2e:ui
```

### E2E in Headed Mode (see browser)
```bash
npm run test:e2e:headed
```

## Test Coverage

### E2E Tests (Playwright)

**Authentication:**
- ✅ Owner login success → redirect to /admin/dashboard
- ✅ Invalid credentials show error
- ✅ Session persistence across refresh
- ✅ Logout clears Supabase + localStorage
- ✅ Cross-tab logout sync
- ✅ Employee login → /employee/dashboard
- ✅ Employee blocked from /admin/*
- ✅ Employee never sees salary

**Employee Directory:**
- ✅ Owner sees employee list
- ✅ Salary column visible for owner
- ✅ Owner NOT in employee list
- ✅ Only active employees shown

**Add Employee:**
- ✅ Full flow: auth user + profile + private_details
- ✅ Missing fields blocked
- ✅ Duplicate email rejected
- ✅ Row count validation

**Attendance:**
- ✅ Clock-in with valid GPS (mocked)
- ✅ Clock-in blocked outside geo-fence
- ✅ Duplicate clock-in blocked

**Requests:**
- ✅ Sick requests auto-approved
- ✅ Leave requests stay pending
- ✅ Owner can approve/reject
- ✅ Employee cannot approve own requests

**Schedule:**
- ✅ Owner assigns shifts
- ✅ Upsert prevents duplicates
- ✅ Employee sees own schedule

**Payroll:**
- ✅ Only active employees included
- ✅ Full-time uses monthly_salary_idr
- ✅ Part-time uses hourly_rate_idr × hours

### Integration Tests (Node + Jest)

**RLS Policies:**
- ✅ Employee CANNOT read private_details
- ✅ Owner CAN read all private_details
- ✅ Employee CAN read own profile
- ✅ Employee CANNOT update own role
- ✅ Employee CAN read own attendance
- ✅ Employee CANNOT read other's attendance
- ✅ Employee CANNOT update request status
- ✅ Owner CAN update request status
- ✅ Schedule UNIQUE constraint enforced
- ✅ Schedule upsert works correctly

### Unit Tests (Jest)

**AuthService:**
- ✅ initializeSession uses supabase.auth.getSession
- ✅ Logout clears Supabase session
- ✅ hasRole validates correctly

**AuthGuard:**
- ✅ Validates Supabase session
- ✅ Checks role from database
- ✅ Enforces owner email = steventok@sukhapku.com

**ApiService:**
- ✅ addEmployee validates rows affected
- ✅ updateRequestStatus fails if rows=0

## Test Data Cleanup

All tests automatically clean up after themselves:
- Test users (email starting with `test-`) are deleted
- Test data in tables is removed
- Uses Supabase Service Role key for cleanup

## Debugging Failed Tests

### E2E Tests
- Screenshots saved to `test-results/`
- Videos saved on failure
- Use `--headed` flag to watch tests run
- Use `--ui` flag for interactive debugging

### Integration Tests
- Check console output for Supabase errors
- Verify RLS policies in Supabase dashboard
- Check that migrations are applied

### Common Issues

**"Missing required environment variable"**
- Ensure `.env` file exists and has all required variables

**"Connection refused at localhost:4200"**
- Start dev server: `npm run dev`
- Wait for server to be ready before running E2E tests

**"Invalid credentials"**
- Verify OWNER_EMAIL and OWNER_PASSWORD in `.env`
- Ensure owner account exists in Supabase Auth

**"RLS policy violation"**
- Run all migrations in order
- Verify `is_owner()` function exists
- Check that owner email matches exactly

## CI/CD Integration

For GitHub Actions or similar:

```yaml
- name: Run tests
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
    OWNER_EMAIL: ${{ secrets.OWNER_EMAIL }}
    OWNER_PASSWORD: ${{ secrets.OWNER_PASSWORD }}
    TEST_EMPLOYEE_PASSWORD: ${{ secrets.TEST_EMPLOYEE_PASSWORD }}
  run: npm run test:all
```

## Best Practices

1. **Run tests sequentially** - E2E tests use `workers: 1` to avoid race conditions
2. **Clean up test data** - Always use test email prefix `test-`
3. **Mock GPS** - Use Playwright's `setGeolocation()` for attendance tests
4. **Verify RLS** - Integration tests validate database-level security
5. **Check diagnostics** - Failed tests output clear error messages

## Maintenance

### Adding New Tests

1. **E2E**: Create new `.spec.ts` in `tests/e2e/`
2. **Integration**: Add to `tests/integration/rls.test.ts`
3. **Unit**: Add to component/service `.spec.ts` files

### Updating Test Data

Modify `supabaseTestUtils.ts` to adjust:
- Default employee data
- Cleanup logic
- Helper functions

---

**Last Updated:** 2026-01-28
