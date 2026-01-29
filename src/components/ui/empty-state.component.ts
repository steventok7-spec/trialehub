

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from './icon.component';
import { ButtonComponent } from './button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, IconComponent, ButtonComponent],
  template: `
    <div
      class="flex flex-col items-center justify-center py-16 px-4 text-center"
      [class]="containerClass"
      role="status"
      [attr.aria-label]="ariaLabel || message"
    >
      @if (icon) {
        <div class="mb-4 p-4 bg-zinc-100 rounded-full">
          <app-icon [name]="icon" size="48" class="text-zinc-400" />
        </div>
      }

      @if (title) {
        <h3 class="text-lg font-bold text-zinc-900 mb-2">{{ title }}</h3>
      }

      <p class="text-zinc-500 text-sm max-w-xs mb-4">{{ message }}</p>

      @if (actionLabel) {
        <app-button
          variant="primary"
          (clicked)="onAction()"
          [attr.aria-label]="actionLabel"
        >
          {{ actionLabel }}
        </app-button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  @Input() icon: string = '';
  @Input() title: string = '';
  @Input() message: string = 'No data available';
  @Input() actionLabel: string = '';
  @Input() action: (() => void) | null = null;
  @Input() containerClass: string = '';
  @Input() ariaLabel: string = '';

  onAction(): void {
    this.action?.();
  }
}
