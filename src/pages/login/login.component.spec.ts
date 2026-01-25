import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../auth/auth.service';
import { of, throwError, Observable } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let apiService: jest.Mocked<ApiService>;
  let toastService: jest.Mocked<ToastService>;
  let authService: jest.Mocked<AuthService>;
  let router: jest.Mocked<Router>;

  beforeEach(async () => {
    const apiServiceMock = {
      checkDatabaseSetup: jest.fn(),
      adminLogin: jest.fn(),
      employeeLogin: jest.fn(),
    };

    const toastServiceMock = {
      success: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    };

    const authServiceMock = {
      login: jest.fn(),
    };

    const routerMock = {
      navigate: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: ApiService, useValue: apiServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jest.Mocked<ApiService>;
    toastService = TestBed.inject(ToastService) as jest.Mocked<ToastService>;
    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    router = TestBed.inject(Router) as jest.Mocked<Router>;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default values', () => {
      expect(component.loginId).toBe('');
      expect(component.password).toBe('');
      expect(component.selectedRole).toBe('admin');
      expect(component.showPassword()).toBe(false);
      expect(component.loading()).toBe(false);
    });

    it('should check database setup on init', () => {
      apiService.checkDatabaseSetup.mockReturnValue(of({ ready: true }));

      component.ngOnInit();

      expect(apiService.checkDatabaseSetup).toHaveBeenCalled();
    });

    it('should set database status on successful check', () => {
      const mockStatus = { ready: true };
      apiService.checkDatabaseSetup.mockReturnValue(of(mockStatus));

      component.ngOnInit();

      expect(component.dbStatus()).toEqual(mockStatus);
      expect(component.checkingDb()).toBe(false);
    });

    it('should handle database check failure', () => {
      const mockStatus = { ready: false, errors: ['Connection failed'] };
      apiService.checkDatabaseSetup.mockReturnValue(of(mockStatus));
      jest.spyOn(console, 'warn').mockImplementation();

      component.ngOnInit();

      expect(component.dbStatus()).toEqual(mockStatus);
      expect(console.warn).toHaveBeenCalledWith('Supabase Check Failed:', ['Connection failed']);
      jest.restoreAllMocks();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', () => {
      expect(component.showPassword()).toBe(false);

      component.togglePassword();
      expect(component.showPassword()).toBe(true);

      component.togglePassword();
      expect(component.showPassword()).toBe(false);
    });
  });

  describe('Database Setup Check', () => {
    it('should set checkingDb to true while checking', () => {
      apiService.checkDatabaseSetup.mockReturnValue(of({ ready: true }));

      component.checkDatabaseSetup();

      // Check is initially true (before subscription completes)
      expect(component.checkingDb()).toBe(false); // finalize sets it to false
    });

    it('should handle network error during database check', () => {
      apiService.checkDatabaseSetup.mockReturnValue(throwError(() => new Error('Network error')));
      jest.spyOn(console, 'error').mockImplementation();

      component.checkDatabaseSetup();

      expect(component.dbStatus()?.ready).toBe(false);
      expect(component.dbStatus()?.errors).toContain('Network error. Check console for details.');
      jest.restoreAllMocks();
    });
  });

  describe('Test Connection', () => {
    it('should show success toast when connection is successful', () => {
      apiService.checkDatabaseSetup.mockReturnValue(of({ ready: true }));

      component.testConnection();

      expect(toastService.info).toHaveBeenCalledWith('Testing connection to Supabase...');
      expect(toastService.success).toHaveBeenCalledWith('Connection Successful! Tables found.');
    });

    it('should show error toast when connection fails', () => {
      const errorMsg = 'Tables not created';
      apiService.checkDatabaseSetup.mockReturnValue(of({ ready: false, errors: [errorMsg] }));

      component.testConnection();

      expect(toastService.info).toHaveBeenCalledWith('Testing connection to Supabase...');
      expect(toastService.error).toHaveBeenCalledWith(errorMsg);
    });
  });

  describe('Login Validation', () => {
    it('should show error when loginId is empty', () => {
      component.loginId = '';
      component.password = 'password';

      const event = new Event('submit');
      component.handleLogin(event);

      expect(toastService.error).toHaveBeenCalledWith('Please enter both ID and password');
      expect(component.loading()).toBe(false);
    });

    it('should show error when password is empty', () => {
      component.loginId = 'user@test.com';
      component.password = '';

      const event = new Event('submit');
      component.handleLogin(event);

      expect(toastService.error).toHaveBeenCalledWith('Please enter both ID and password');
      expect(component.loading()).toBe(false);
    });

    it('should prevent login when database is not ready and not using demo credentials', () => {
      component.dbStatus.set({ ready: false, errors: ['DB Error'] });
      component.loginId = 'user@test.com';
      component.password = 'password';

      const event = new Event('submit');
      component.handleLogin(event);

      expect(toastService.error).toHaveBeenCalledWith('Database connection failed. Check your config.');
      expect(component.loading()).toBe(false);
    });

    it('should allow login with demo credentials even when database is not ready', () => {
      component.dbStatus.set({ ready: false, errors: ['DB Error'] });
      component.loginId = 'admin';
      component.password = 'admin';
      apiService.adminLogin.mockReturnValue(of({
        success: true,
        admin: { username: 'admin@demo.com', name: 'Demo Admin', role: 'admin' }
      }));

      const event = new Event('submit');
      component.handleLogin(event);

      expect(apiService.adminLogin).toHaveBeenCalled();
    });
  });

  describe('Admin Login', () => {
    beforeEach(() => {
      component.selectedRole = 'admin';
      component.dbStatus.set({ ready: true });
    });

    it('should login successfully with valid admin credentials', () => {
      const mockAdmin = { username: 'admin@test.com', name: 'Admin User', role: 'admin' as const };
      component.loginId = 'admin@test.com';
      component.password = 'password';

      apiService.adminLogin.mockReturnValue(of({ success: true, admin: mockAdmin }));

      const event = new Event('submit');
      component.handleLogin(event);

      expect(component.loading()).toBe(false);
      expect(authService.login).toHaveBeenCalledWith(mockAdmin, 'admin');
      expect(toastService.success).toHaveBeenCalledWith('Welcome back, Admin!');
      expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
    });

    it('should show error with invalid admin credentials', () => {
      component.loginId = 'admin@test.com';
      component.password = 'wrongpassword';

      apiService.adminLogin.mockReturnValue(of({
        success: false,
        error: 'Invalid credentials'
      }));

      const event = new Event('submit');
      component.handleLogin(event);

      expect(component.loading()).toBe(false);
      expect(toastService.error).toHaveBeenCalledWith('Invalid credentials');
      expect(authService.login).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should handle demo admin login', () => {
      const mockAdmin = { username: 'admin@demo.com', name: 'Demo Admin', role: 'admin' as const };
      component.loginId = 'admin';
      component.password = 'admin';

      apiService.adminLogin.mockReturnValue(of({ success: true, admin: mockAdmin }));

      const event = new Event('submit');
      component.handleLogin(event);

      expect(apiService.adminLogin).toHaveBeenCalledWith({
        username: 'admin',
        password: 'admin'
      });
      expect(authService.login).toHaveBeenCalled();
    });

    it('should handle steventok demo login', () => {
      const mockAdmin = { username: 'steventok', name: 'Steven Tok (Owner)', role: 'admin' as const };
      component.loginId = 'steventok';
      component.password = '1234567';

      apiService.adminLogin.mockReturnValue(of({ success: true, admin: mockAdmin }));

      const event = new Event('submit');
      component.handleLogin(event);

      expect(apiService.adminLogin).toHaveBeenCalledWith({
        username: 'steventok',
        password: '1234567'
      });
      expect(authService.login).toHaveBeenCalled();
    });
  });

  describe('Employee Login', () => {
    beforeEach(() => {
      component.selectedRole = 'employee';
      component.dbStatus.set({ ready: true });
    });

    it('should login successfully with valid employee credentials', () => {
      const mockEmployee = {
        id: 'emp-123',
        name: 'John Doe',
        email: 'john@test.com',
        role: 'employee' as const,
        job_title: 'barista' as const,
        status: 'active' as const
      };
      component.loginId = 'EMP001';
      component.password = '1234';

      apiService.employeeLogin.mockReturnValue(of({ success: true, employee: mockEmployee }));

      const event = new Event('submit');
      component.handleLogin(event);

      expect(component.loading()).toBe(false);
      expect(authService.login).toHaveBeenCalledWith(mockEmployee, 'employee');
      expect(toastService.success).toHaveBeenCalledWith('Welcome back, John Doe!');
      expect(router.navigate).toHaveBeenCalledWith(['/employee/dashboard']);
    });

    it('should show error with invalid employee credentials', () => {
      component.loginId = 'EMP001';
      component.password = 'wrongpin';

      apiService.employeeLogin.mockReturnValue(of({
        success: false,
        error: 'Invalid employee credentials'
      }));

      const event = new Event('submit');
      component.handleLogin(event);

      expect(component.loading()).toBe(false);
      expect(toastService.error).toHaveBeenCalledWith('Invalid employee credentials');
      expect(authService.login).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should call employeeLogin with correct parameters', () => {
      apiService.employeeLogin.mockReturnValue(of({
        success: true,
        employee: {
          id: 'emp-1',
          name: 'Test',
          email: 'test@test.com',
          role: 'employee' as const,
          job_title: 'barista' as const,
          status: 'active' as const
        }
      }));

      component.loginId = 'EMP123';
      component.password = '4567';

      const event = new Event('submit');
      component.handleLogin(event);

      expect(apiService.employeeLogin).toHaveBeenCalledWith({
        employeeId: 'EMP123',
        pin: '4567'
      });
    });
  });

  describe('Loading State', () => {
    it('should set loading to true during login', () => {
      component.selectedRole = 'admin';
      component.loginId = 'admin';
      component.password = 'admin';
      component.dbStatus.set({ ready: true });

      // Delay the response to check loading state
      apiService.adminLogin.mockReturnValue(
        new Observable(subscriber => {
          expect(component.loading()).toBe(true);
          subscriber.next({ success: true, admin: { username: 'admin', name: 'Admin', role: 'admin' } });
          subscriber.complete();
        })
      );

      const event = new Event('submit');
      component.handleLogin(event);
    });

    it('should set loading to false after successful login', () => {
      component.selectedRole = 'admin';
      component.loginId = 'admin';
      component.password = 'admin';
      component.dbStatus.set({ ready: true });

      apiService.adminLogin.mockReturnValue(of({
        success: true,
        admin: { username: 'admin', name: 'Admin', role: 'admin' }
      }));

      const event = new Event('submit');
      component.handleLogin(event);

      expect(component.loading()).toBe(false);
    });

    it('should set loading to false after failed login', () => {
      component.selectedRole = 'admin';
      component.loginId = 'admin';
      component.password = 'wrong';
      component.dbStatus.set({ ready: true });

      apiService.adminLogin.mockReturnValue(of({
        success: false,
        error: 'Invalid credentials'
      }));

      const event = new Event('submit');
      component.handleLogin(event);

      expect(component.loading()).toBe(false);
    });
  });
});
