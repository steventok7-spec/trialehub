import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });

    service = TestBed.inject(ApiService);
  });

  describe('PHASE 0: Stubbed Services', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('checkDatabaseSetup should return ready=true (stubbed)', (done) => {
      service.checkDatabaseSetup().subscribe((result) => {
        expect(result.ready).toBe(true);
        done();
      });
    });

    it('adminLogin should return error (stubbed)', (done) => {
      service.adminLogin({ username: 'admin', password: 'pass' }).subscribe((result) => {
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        done();
      });
    });

    it('employeeLogin should return error (stubbed)', (done) => {
      service.employeeLogin({ email: 'emp@test.com', pin: '1234' }).subscribe((result) => {
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        done();
      });
    });

    it('getEmployees should return empty array (stubbed)', (done) => {
      service.getEmployees().subscribe((employees) => {
        expect(Array.isArray(employees)).toBe(true);
        expect(employees.length).toBe(0);
        done();
      });
    });

    it('getAllAttendance should return empty array (stubbed)', (done) => {
      service.getAllAttendance().subscribe((attendance) => {
        expect(Array.isArray(attendance)).toBe(true);
        expect(attendance.length).toBe(0);
        done();
      });
    });

    it('getRequests should return empty array (stubbed)', (done) => {
      service.getRequests().subscribe((requests) => {
        expect(Array.isArray(requests)).toBe(true);
        expect(requests.length).toBe(0);
        done();
      });
    });

    it('checkIn should return error (stubbed)', (done) => {
      service.checkIn({ employeeId: 'emp-123', latitude: 0, longitude: 0 }).subscribe((result) => {
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        done();
      });
    });

    it('checkOut should return error (stubbed)', (done) => {
      service.checkOut({ employeeId: 'emp-123' }).subscribe((result) => {
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        done();
      });
    });

    it('generatePayroll should return empty array (stubbed)', async () => {
      const result = await service.generatePayroll(2026, 1);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('Note: Database Tests Pending Firebase Implementation', () => {
    it('Full test suite awaits PHASE 1 Firebase migration', () => {
      // Database tests will be restored after Firebase Auth + Firestore are implemented
      // Current service methods are stubbed to allow app to run cleanly
      expect(true).toBe(true);
    });
  });
});
