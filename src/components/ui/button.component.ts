

import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || isLoading"
      [class]="computedClass()"
      (click)="onClick()"
      [attr.aria-label]="ariaLabel"
      [attr.data-testid]="testId"
    >
      <span *ngIf="isLoading" class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></span>
      <ng-content></ng-content>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;
  @Input() isLoading = false;
  @Input() fullWidth = false;
  @Input() ariaLabel: string | null = null;
  @Input() testId: string | null = null;
  @Output() clicked = new EventEmitter<void>();

  computedClass(): string {
    const baseClass = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const sizeClass = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    }[this.size];

    const variantClass = {
      primary: 'bg-zinc-900 text-white hover:bg-zinc-800 focus:ring-zinc-900',
      secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus:ring-zinc-900',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
      outline: 'border-2 border-zinc-900 text-zinc-900 hover:bg-zinc-50 focus:ring-zinc-900',
      ghost: 'text-zinc-900 hover:bg-zinc-100 focus:ring-zinc-900'
    }[this.variant];

    const widthClass = this.fullWidth ? 'w-full' : '';

    return `${baseClass} ${sizeClass} ${variantClass} ${widthClass}`;
  }

  onClick(): void {
    if (!this.disabled && !this.isLoading) {
      this.clicked.emit();
    }
  }
}
