

import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private counter = 0;

  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration = 3000): void {
    const id = this.counter++;
    const toast: Toast = { id, message, type, duration };
    this.toasts.update(t => [...t, toast]);

    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  success(message: string, options?: { duration?: number }): void {
    this.show(message, 'success', options?.duration ?? 3000);
  }

  error(message: string, options?: { duration?: number }): void {
    this.show(message, 'error', options?.duration ?? 4000);
  }

  info(message: string, options?: { duration?: number }): void {
    this.show(message, 'info', options?.duration ?? 3000);
  }

  warning(message: string, options?: { duration?: number }): void {
    this.show(message, 'warning', options?.duration ?? 3500);
  }

  remove(id: number): void {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
