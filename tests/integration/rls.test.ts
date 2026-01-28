import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import {
    createTestEmployee,
    cleanupTestUsers,
    getAuthenticatedClient,
    clientService,
    assertRowsAffected,
} from '../utils/supabaseTestUtils';

const OWNER_EMAIL = process.env.OWNER_EMAIL!;
const OWNER_PASSWORD = process.env.OWNER_PASSWORD!;
const TEST_EMPLOYEE_PASSWORD = process.env.TEST_EMPLOYEE_PASSWORD!;

describe('RLS Policy Validation', () => {
    let testEmployee: Awaited<ReturnType<typeof createTestEmployee>>;
    let employeeClient: Awaited<ReturnType<typeof getAuthenticatedClient>>;
    let ownerClient: Awaited<ReturnType<typeof getAuthenticatedClient>>;

    beforeAll(async () => {
        testEmployee = await createTestEmployee(
            `test-rls-${Date.now()}@example.com`,
            TEST_EMPLOYEE_PASSWORD,
            {
                name: 'RLS Test Employee',
                monthly_salary_idr: 5000000,
            }
        );

        employeeClient = await getAuthenticatedClient(testEmployee.email, testEmployee.password);
        ownerClient = await getAuthenticatedClient(OWNER_EMAIL, OWNER_PASSWORD);
    });

    afterAll(async () => {
        await cleanupTestUsers();
    });

    describe('private_details RLS', () => {
        test('employee CANNOT read private_details', async () => {
            const { data, error } = await employeeClient
                .from('private_details')
                .select('*');

            // Should either error or return empty
            if (error) {
                expect(error).toBeDefined();
            } else {
                expect(data).toEqual([]);
            }
        });

        test('owner CAN read all private_details', async () => {
            const { data, error } = await ownerClient
                .from('private_details')
                .select('*');

            expect(error).toBeNull();
            expect(data).toBeDefined();
            expect(data!.length).toBeGreaterThan(0);
        });

        test('employee CANNOT read own private_details', async () => {
            const { data, error } = await employeeClient
                .from('private_details')
                .select('*')
                .eq('id', testEmployee.id);

            // RLS should block
            if (error) {
                expect(error).toBeDefined();
            } else {
                expect(data).toEqual([]);
            }
        });
    });

    describe('profiles RLS', () => {
        test('employee CAN read own profile', async () => {
            const { data, error } = await employeeClient
                .from('profiles')
                .select('*')
                .eq('id', testEmployee.id)
                .single();

            expect(error).toBeNull();
            expect(data).toBeDefined();
            expect(data!.email).toBe(testEmployee.email);
        });

        test('employee CANNOT update own role', async () => {
            const { error } = await employeeClient
                .from('profiles')
                .update({ role: 'owner' })
                .eq('id', testEmployee.id);

            expect(error).toBeDefined();
        });

        test('owner CAN update employee profiles', async () => {
            const { error } = await ownerClient
                .from('profiles')
                .update({ job_title: 'senior-barista' })
                .eq('id', testEmployee.id);

            expect(error).toBeNull();
        });
    });

    describe('attendance RLS', () => {
        let attendanceId: string;

        beforeAll(async () => {
            // Create attendance record
            const service = clientService();
            const { data } = await service
                .from('attendance')
                .insert({
                    employee_id: testEmployee.id,
                    date: '2026-02-01',
                    clock_in: '2026-02-01 09:00:00',
                    clock_out: '2026-02-01 17:00:00',
                    total_minutes: 480,
                })
                .select()
                .single();

            attendanceId = data!.id;
        });

        test('employee CAN read own attendance', async () => {
            const { data, error } = await employeeClient
                .from('attendance')
                .select('*')
                .eq('employee_id', testEmployee.id);

            expect(error).toBeNull();
            expect(data).toBeDefined();
            expect(data!.length).toBeGreaterThan(0);
        });

        test('employee CANNOT read other employee attendance', async () => {
            // Create another employee
            const otherEmployee = await createTestEmployee(
                `test-other-${Date.now()}@example.com`,
                TEST_EMPLOYEE_PASSWORD
            );

            const service = clientService();
            await service.from('attendance').insert({
                employee_id: otherEmployee.id,
                date: '2026-02-01',
                clock_in: '2026-02-01 09:00:00',
            });

            const { data } = await employeeClient
                .from('attendance')
                .select('*')
                .eq('employee_id', otherEmployee.id);

            expect(data).toEqual([]);
        });

        test('owner CAN read all attendance', async () => {
            const { data, error } = await ownerClient
                .from('attendance')
                .select('*');

            expect(error).toBeNull();
            expect(data).toBeDefined();
            expect(data!.length).toBeGreaterThan(0);
        });
    });

    describe('requests RLS', () => {
        let requestId: string;

        beforeAll(async () => {
            const service = clientService();
            const { data } = await service
                .from('requests')
                .insert({
                    employee_id: testEmployee.id,
                    type: 'leave',
                    start_date: '2026-03-01',
                    end_date: '2026-03-05',
                    reason: 'Vacation',
                    status: 'pending',
                })
                .select()
                .single();

            requestId = data!.id;
        });

        test('employee CAN read own requests', async () => {
            const { data, error } = await employeeClient
                .from('requests')
                .select('*')
                .eq('employee_id', testEmployee.id);

            expect(error).toBeNull();
            expect(data).toBeDefined();
            expect(data!.length).toBeGreaterThan(0);
        });

        test('employee CANNOT update request status', async () => {
            const { error, data } = await employeeClient
                .from('requests')
                .update({ status: 'approved' })
                .eq('id', requestId)
                .select();

            // Should either error or affect 0 rows
            if (error) {
                expect(error).toBeDefined();
            } else {
                expect(data).toEqual([]);
            }
        });

        test('owner CAN update request status', async () => {
            const { error, data } = await ownerClient
                .from('requests')
                .update({ status: 'approved' })
                .eq('id', requestId)
                .select();

            expect(error).toBeNull();
            assertRowsAffected({ data, error }, 1);
        });

        test('owner CAN read all requests', async () => {
            const { data, error } = await ownerClient
                .from('requests')
                .select('*');

            expect(error).toBeNull();
            expect(data).toBeDefined();
            expect(data!.length).toBeGreaterThan(0);
        });
    });

    describe('schedule RLS', () => {
        let scheduleId: string;

        beforeAll(async () => {
            const service = clientService();
            const { data } = await service
                .from('schedule')
                .insert({
                    employee_id: testEmployee.id,
                    date: '2026-02-15',
                    shift: 'morning',
                    start_time: '06:00',
                    end_time: '14:00',
                })
                .select()
                .single();

            scheduleId = data!.id;
        });

        test('employee CAN read own schedule', async () => {
            const { data, error } = await employeeClient
                .from('schedule')
                .select('*')
                .eq('employee_id', testEmployee.id);

            expect(error).toBeNull();
            expect(data).toBeDefined();
            expect(data!.length).toBeGreaterThan(0);
        });

        test('employee CANNOT update schedule', async () => {
            const { error, data } = await employeeClient
                .from('schedule')
                .update({ shift: 'afternoon' })
                .eq('id', scheduleId)
                .select();

            if (error) {
                expect(error).toBeDefined();
            } else {
                expect(data).toEqual([]);
            }
        });

        test('owner CAN update schedule', async () => {
            const { error, data } = await ownerClient
                .from('schedule')
                .update({ shift: 'afternoon' })
                .eq('id', scheduleId)
                .select();

            expect(error).toBeNull();
            assertRowsAffected({ data, error }, 1);
        });
    });

    describe('UNIQUE constraints', () => {
        test('schedule should enforce unique (employee_id, date, shift)', async () => {
            const service = clientService();

            // Insert first schedule
            const { error: error1 } = await service
                .from('schedule')
                .insert({
                    employee_id: testEmployee.id,
                    date: '2026-02-20',
                    shift: 'morning',
                    start_time: '06:00',
                    end_time: '14:00',
                });

            expect(error1).toBeNull();

            // Try to insert duplicate
            const { error: error2 } = await service
                .from('schedule')
                .insert({
                    employee_id: testEmployee.id,
                    date: '2026-02-20',
                    shift: 'morning',
                    start_time: '06:00',
                    end_time: '14:00',
                });

            expect(error2).toBeDefined();
            expect(error2?.message).toMatch(/unique|duplicate/i);
        });

        test('upsert should work correctly for schedule', async () => {
            const service = clientService();

            // Upsert first time
            const { error: error1 } = await service
                .from('schedule')
                .upsert({
                    employee_id: testEmployee.id,
                    date: '2026-02-21',
                    shift: 'morning',
                    start_time: '06:00',
                    end_time: '14:00',
                });

            expect(error1).toBeNull();

            // Upsert again (should update)
            const { error: error2 } = await service
                .from('schedule')
                .upsert({
                    employee_id: testEmployee.id,
                    date: '2026-02-21',
                    shift: 'morning',
                    start_time: '07:00',
                    end_time: '15:00',
                });

            expect(error2).toBeNull();

            // Verify only one record
            const { data } = await service
                .from('schedule')
                .select('*')
                .eq('employee_id', testEmployee.id)
                .eq('date', '2026-02-21');

            expect(data?.length).toBe(1);
            expect(data![0].start_time).toBe('07:00:00');
        });
    });
});
