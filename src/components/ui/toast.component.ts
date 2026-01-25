import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-24 md:bottom-4 right-4 z-[60] flex flex-col gap-3 max-w-[calc(100vw-2rem)]">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="min-w-[280px] max-w-[400px] p-4 rounded-xl shadow-2xl text-sm font-semibold transition-all transform animate-slide-up backdrop-blur-md border-2"
          [class.bg-white/95]="true"
          [class.text-red-600]="toast.type === 'error'"
          [class.text-green-600]="toast.type === 'success'"
          [class.text-stone-800]="toast.type === 'info'"
          [class.border-red-500]="toast.type === 'error'"
          [class.border-green-500]="toast.type === 'success'"
          [class.border-blue-500]="toast.type === 'info'"
          [class.shadow-red-200/50]="toast.type === 'error'"
          [class.shadow-green-200/50]="toast.type === 'success'"
          [class.shadow-blue-200/50]="toast.type === 'info'"
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
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
}