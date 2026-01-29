

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SpinnerSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center" [class.gap-3]="showLabel">
      <div
        [class]="spinnerClass()"
        class="border-current border-t-transparent rounded-full animate-spin"
      ></div>
      @if (showLabel && label) {
        <span class="text-sm text-zinc-600">{{ label }}</span>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingSpinnerComponent {
  @Input() size: SpinnerSize = 'md';
  @Input() label: string | null = null;
  @Input() showLabel = false;

  spinnerClass(): string {
    const sizeMap = {
      sm: 'w-4 h-4 border-2',
      md: 'w-6 h-6 border-2',
      lg: 'w-8 h-8 border-3'
    };

    return sizeMap[this.size];
  }
}
