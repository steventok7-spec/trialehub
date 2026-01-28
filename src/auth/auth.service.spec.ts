import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let router: jest.Mocked<Router>;
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};

    global.Storage.prototype.getItem = jest.fn((key: string) => {
      return localStorageMock[key] || null;
    });

    global.Storage.prototype.setItem = jest.fn((key: string, value: string) => {
      localStorageMock[key] = value;
    });

    global.Storage.prototype.removeItem = jest.fn((key: string) => {
      delete localStorageMock[key];
    });

    global.Storage.prototype.clear = jest.fn(() => {
      localStorageMock = {};
    });

    // Mock Router
    const routerMock = {
      navigate: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Router, useValue: routerMock },
      ],
    });

    router = TestBed.inject(Router) as jest.Mocked<Router>;
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorageMock = {};
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have currentUser signal initialized to null when no stored user', () => {
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('loadUserFromStorage', () => {
    it('should load admin user from localStorage on initialization', () => {
      const adminUser = { id: 1, username: 'owner' };
      localStorageMock['owner'] = JSON.stringify(adminUser);

      // Recreate service to trigger loadUserFromStorage in constructor
      service = new AuthService(router);

      expect(service.currentUser()).toEqual({ ...adminUser, role: 'owner' });
    });

    it('should load employee user from localStorage on initialization', () => {
      const employeeUser = { id: 2, name: 'John Doe' };
      localStorageMock['employee'] = JSON.stringify(employeeUser);

      // Recreate service to trigger loadUserFromStorage
      service = new AuthService(router);

      expect(service.currentUser()).toEqual({ ...employeeUser, role: 'employee' });
    });

    it('should prioritize admin over employee when both exist in localStorage', () => {
      const adminUser = { id: 1, username: 'owner' };
      const employeeUser = { id: 2, name: 'John Doe' };
      localStorageMock['owner'] = JSON.stringify(adminUser);
      localStorageMock['employee'] = JSON.stringify(employeeUser);

      service = new AuthService(router);

      expect(service.currentUser()).toEqual({ ...adminUser, role: 'owner' });
    });

    it('should set currentUser to null when no user data in localStorage', () => {
      service = new AuthService(router);

      expect(service.currentUser()).toBeNull();
    });
  });

  describe('isLoggedIn', () => {
    it('should return false when no user is logged in', () => {
      expect(service.isLoggedIn()).toBe(false);
    });

    it('should return true when a user is logged in', () => {
      const user = { id: 1, username: 'testuser' };
      service.login(user, 'owner');

      expect(service.isLoggedIn()).toBe(true);
    });
  });

  describe('hasRole', () => {
    it('should return false when no user is logged in', () => {
      expect(service.hasRole('owner')).toBe(false);
      expect(service.hasRole('employee')).toBe(false);
    });

    it('should return true when user has the specified admin role', () => {
      const adminUser = { id: 1, username: 'owner' };
      service.login(adminUser, 'owner');

      expect(service.hasRole('owner')).toBe(true);
      expect(service.hasRole('employee')).toBe(false);
    });

    it('should return true when user has the specified employee role', () => {
      const employeeUser = { id: 2, name: 'John Doe' };
      service.login(employeeUser, 'employee');

      expect(service.hasRole('employee')).toBe(true);
      expect(service.hasRole('owner')).toBe(false);
    });
  });

  describe('login', () => {
    it('should login admin user and store in localStorage', () => {
      const adminUser = { id: 1, username: 'owner' };

      service.login(adminUser, 'owner');

      expect(localStorage.setItem).toHaveBeenCalledWith('owner', JSON.stringify(adminUser));
      expect(service.currentUser()).toEqual({ ...adminUser, role: 'owner' });
      expect(service.isLoggedIn()).toBe(true);
    });

    it('should login employee user and store in localStorage', () => {
      const employeeUser = { id: 2, name: 'John Doe', employeeId: 'EMP001' };

      service.login(employeeUser, 'employee');

      expect(localStorage.setItem).toHaveBeenCalledWith('employee', JSON.stringify(employeeUser));
      expect(service.currentUser()).toEqual({ ...employeeUser, role: 'employee' });
      expect(service.isLoggedIn()).toBe(true);
    });

    it('should update currentUser signal on login', () => {
      const user = { id: 1, username: 'testuser' };

      service.login(user, 'owner');

      expect(service.currentUser()).toEqual({ ...user, role: 'owner' });
    });

    it('should overwrite previous user when logging in as different user', () => {
      const firstUser = { id: 1, username: 'first' };
      const secondUser = { id: 2, username: 'second' };

      service.login(firstUser, 'owner');
      expect(service.currentUser()?.username).toBe('first');

      service.login(secondUser, 'owner');
      expect(service.currentUser()?.username).toBe('second');
    });
  });

  describe('logout', () => {
    it('should clear admin from localStorage', () => {
      const adminUser = { id: 1, username: 'owner' };
      service.login(adminUser, 'owner');

      service.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('owner');
    });

    it('should clear employee from localStorage', () => {
      const employeeUser = { id: 2, name: 'John Doe' };
      service.login(employeeUser, 'employee');

      service.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('employee');
    });

    it('should set currentUser to null', () => {
      const user = { id: 1, username: 'testuser' };
      service.login(user, 'owner');

      service.logout();

      expect(service.currentUser()).toBeNull();
    });

    it('should navigate to root path', () => {
      const user = { id: 1, username: 'testuser' };
      service.login(user, 'owner');

      service.logout();

      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should make isLoggedIn return false after logout', () => {
      const user = { id: 1, username: 'testuser' };
      service.login(user, 'owner');
      expect(service.isLoggedIn()).toBe(true);

      service.logout();

      expect(service.isLoggedIn()).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle malformed JSON in localStorage gracefully', () => {
      localStorageMock['owner'] = 'invalid-json';

      // This should throw when JSON.parse is called
      expect(() => {
        service = new AuthService(router);
      }).toThrow();
    });

    it('should handle null user object in login', () => {
      service.login({}, 'owner');

      expect(service.currentUser()).toEqual({ role: 'owner' });
    });

    it('should handle empty user object in login', () => {
      service.login({}, 'employee');

      expect(service.currentUser()).toEqual({ role: 'employee' });
    });
  });

  describe('session persistence', () => {
    it('should persist session across service instances', () => {
      const user = { id: 1, username: 'testuser' };
      service.login(user, 'owner');

      // Create new service instance (simulating page reload)
      const newService = new AuthService(router);

      expect(newService.currentUser()).toEqual({ ...user, role: 'owner' });
      expect(newService.isLoggedIn()).toBe(true);
    });
  });
});
