
import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private counter = 0;

  show(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) {
    const id = this.counter++;
    const toast: Toast = { id, message, type, duration };
    this.toasts.update(t => [...t, toast]);

    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  success(message: string, options?: { duration: number }) {
    this.show(message, 'success', options?.duration);
  }

  error(message: string, options?: { duration: number }) {
    this.show(message, 'error', options?.duration);
  }

  info(message: string, options?: { duration: number }) {
    this.show(message, 'info', options?.duration);
  }

  remove(id: number) {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
