

import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './button.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div
      class="fixed inset-0 bg-black/50 z-40 transition-opacity duration-200"
      [class.opacity-0]="!isOpen"
      [class.pointer-events-none]="!isOpen"
      (click)="onBackdropClick()"
    ></div>

    <div
      role="dialog"
      [attr.aria-modal]="true"
      [attr.aria-labelledby]="titleId"
      class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-stone-50 rounded-2xl shadow-2xl max-w-sm w-[90vw] max-h-[90vh] overflow-y-auto z-50 transition-all duration-200"
      [class.scale-100]="isOpen"
      [class.scale-95]="!isOpen"
      [class.opacity-100]="isOpen"
      [class.opacity-0]="!isOpen"
      [class.pointer-events-none]="!isOpen"
    >
      <div class="p-6 sm:p-8">
        @if (title) {
          <h2 [id]="titleId" class="text-2xl font-bold text-zinc-900 mb-4">{{ title }}</h2>
        }

        <ng-content></ng-content>

        @if (showActions) {
          <div class="flex gap-3 justify-end mt-6">
            @if (cancelLabel) {
              <app-button
                variant="secondary"
                (clicked)="onCancel()"
              >
                {{ cancelLabel }}
              </app-button>
            }
            @if (confirmLabel) {
              <app-button
                variant="primary"
                (clicked)="onConfirm()"
                [isLoading]="isLoading"
              >
                {{ confirmLabel }}
              </app-button>
            }
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title: string | null = null;
  @Input() confirmLabel: string | null = null;
  @Input() cancelLabel: string | null = null;
  @Input() showActions = true;
  @Input() isLoading = false;
  @Input() closeOnBackdropClick = true;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly titleId = 'modal-title';

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen && this.closeOnBackdropClick) {
      this.cancelled.emit();
    }
  }

  onBackdropClick(): void {
    if (this.closeOnBackdropClick) {
      this.cancelled.emit();
    }
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
