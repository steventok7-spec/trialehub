import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty toasts array', () => {
    expect(service.toasts()).toEqual([]);
  });

  describe('show', () => {
    it('should add a toast with default type and duration', () => {
      service.show('Test message');

      const toasts = service.toasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('Test message');
      expect(toasts[0].type).toBe('info');
      expect(toasts[0].duration).toBe(3000);
    });

    it('should add a toast with custom type and duration', () => {
      service.show('Custom message', 'success', 5000);

      const toasts = service.toasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('Custom message');
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].duration).toBe(5000);
    });

    it('should assign unique IDs to toasts', () => {
      service.show('First message');
      service.show('Second message');
      service.show('Third message');

      const toasts = service.toasts();
      expect(toasts).toHaveLength(3);
      expect(toasts[0].id).toBe(0);
      expect(toasts[1].id).toBe(1);
      expect(toasts[2].id).toBe(2);
    });

    it('should auto-remove toast after duration', () => {
      service.show('Test message', 'info', 3000);

      expect(service.toasts()).toHaveLength(1);

      jest.advanceTimersByTime(3000);

      expect(service.toasts()).toHaveLength(0);
    });

    it('should handle multiple toasts with different durations', () => {
      service.show('Short message', 'info', 1000);
      service.show('Long message', 'info', 5000);

      expect(service.toasts()).toHaveLength(2);

      jest.advanceTimersByTime(1000);
      expect(service.toasts()).toHaveLength(1);
      expect(service.toasts()[0].message).toBe('Long message');

      jest.advanceTimersByTime(4000);
      expect(service.toasts()).toHaveLength(0);
    });
  });

  describe('success', () => {
    it('should create a success toast with default duration', () => {
      service.success('Success message');

      const toasts = service.toasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('Success message');
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].duration).toBe(3000);
    });

    it('should create a success toast with custom duration', () => {
      service.success('Success message', { duration: 7000 });

      const toasts = service.toasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].duration).toBe(7000);
    });
  });

  describe('error', () => {
    it('should create an error toast with default duration', () => {
      service.error('Error message');

      const toasts = service.toasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('Error message');
      expect(toasts[0].type).toBe('error');
      expect(toasts[0].duration).toBe(3000);
    });

    it('should create an error toast with custom duration', () => {
      service.error('Error message', { duration: 10000 });

      const toasts = service.toasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].duration).toBe(10000);
    });
  });

  describe('info', () => {
    it('should create an info toast with default duration', () => {
      service.info('Info message');

      const toasts = service.toasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('Info message');
      expect(toasts[0].type).toBe('info');
      expect(toasts[0].duration).toBe(3000);
    });

    it('should create an info toast with custom duration', () => {
      service.info('Info message', { duration: 4000 });

      const toasts = service.toasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].duration).toBe(4000);
    });
  });

  describe('remove', () => {
    it('should remove a toast by ID', () => {
      service.show('First message');
      service.show('Second message');
      service.show('Third message');

      const toasts = service.toasts();
      const secondToastId = toasts[1].id;

      service.remove(secondToastId);

      const remainingToasts = service.toasts();
      expect(remainingToasts).toHaveLength(2);
      expect(remainingToasts[0].message).toBe('First message');
      expect(remainingToasts[1].message).toBe('Third message');
    });

    it('should do nothing when removing non-existent ID', () => {
      service.show('Test message');

      service.remove(999);

      expect(service.toasts()).toHaveLength(1);
    });

    it('should handle removing from empty toasts array', () => {
      expect(() => service.remove(0)).not.toThrow();
      expect(service.toasts()).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid successive toast creation', () => {
      for (let i = 0; i < 10; i++) {
        service.show(`Message ${i}`);
      }

      expect(service.toasts()).toHaveLength(10);
    });

    it('should handle empty message', () => {
      service.show('');

      const toasts = service.toasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('');
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000);
      service.show(longMessage);

      const toasts = service.toasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe(longMessage);
    });

    it('should handle zero duration', () => {
      service.show('Test', 'info', 0);

      expect(service.toasts()).toHaveLength(1);

      jest.advanceTimersByTime(0);

      expect(service.toasts()).toHaveLength(0);
    });
  });

  describe('toast queue management', () => {
    it('should maintain correct order when toasts expire', () => {
      service.show('First', 'info', 1000);
      service.show('Second', 'info', 3000);
      service.show('Third', 'info', 2000);

      expect(service.toasts().map(t => t.message)).toEqual(['First', 'Second', 'Third']);

      jest.advanceTimersByTime(1000);
      expect(service.toasts().map(t => t.message)).toEqual(['Second', 'Third']);

      jest.advanceTimersByTime(1000);
      expect(service.toasts().map(t => t.message)).toEqual(['Second']);

      jest.advanceTimersByTime(1000);
      expect(service.toasts()).toHaveLength(0);
    });

    it('should allow manual removal before auto-removal', () => {
      service.show('Test message', 'info', 5000);

      const toastId = service.toasts()[0].id;

      jest.advanceTimersByTime(2000);
      service.remove(toastId);

      expect(service.toasts()).toHaveLength(0);

      // Advance remaining time to ensure no errors occur
      jest.advanceTimersByTime(3000);
      expect(service.toasts()).toHaveLength(0);
    });
  });
});
