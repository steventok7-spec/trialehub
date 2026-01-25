import { Component, input, output, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black/40 z-40" (click)="cancel.emit()"></div>
    <div 
      role="dialog" 
      aria-modal="true"
      [attr.aria-labelledby]="titleId"
      class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-[90vw] max-w-sm z-50 max-h-[90vh] overflow-y-auto animate-scale-in"
    >
      <h2 [id]="titleId" class="text-xl font-bold text-zinc-900 mb-2">{{ title() }}</h2>
      <p class="text-zinc-500 mb-6 leading-relaxed">{{ message() }}</p>
      <div class="flex justify-end gap-3">
        <button (click)="cancel.emit()" class="px-5 py-2.5 bg-zinc-100 text-zinc-700 rounded-xl font-bold hover:bg-zinc-200 transition-colors text-sm">
          Cancel
        </button>
        <button (click)="confirm.emit()" class="px-5 py-2.5 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors text-sm shadow-lg shadow-zinc-900/20">
          Confirm
        </button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes scale-in { from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
    .animate-scale-in { animation: scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmationModalComponent {
  title = input<string>('Are you sure?');
  message = input.required<string>();
  confirm = output<void>();
  cancel = output<void>();

  readonly titleId = 'confirmation-modal-title';

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    this.cancel.emit();
  }
}