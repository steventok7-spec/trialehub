

import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-6 md:bottom-8 right-6 z-[60] flex flex-col gap-3 max-w-[calc(100vw-3rem)]">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          role="alert"
          class="min-w-[280px] max-w-[400px] p-4 rounded-xl shadow-2xl text-sm font-semibold transition-all transform animate-slide-up backdrop-blur-md border-2"
          [class.bg-green-50]="toast.type === 'success'"
          [class.bg-red-50]="toast.type === 'error'"
          [class.bg-blue-50]="toast.type === 'info'"
          [class.bg-yellow-50]="toast.type === 'warning'"
          [class.text-green-700]="toast.type === 'success'"
          [class.text-red-700]="toast.type === 'error'"
          [class.text-blue-700]="toast.type === 'info'"
          [class.text-yellow-700]="toast.type === 'warning'"
          [class.border-green-200]="toast.type === 'success'"
          [class.border-red-200]="toast.type === 'error'"
          [class.border-blue-200]="toast.type === 'info'"
          [class.border-yellow-200]="toast.type === 'warning'"
        >
          {{ toast.message }}
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slide-up {
      from {
        transform: translateY(100%) scale(0.9);
        opacity: 0;
      }
      to {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
    }
    .animate-slide-up {
      animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastComponent {
  toastService = inject(ToastService);
}
