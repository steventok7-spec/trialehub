import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex flex-col items-center justify-center py-16 px-4 text-center"
      [class]="containerClass"
      role="status"
      [attr.aria-label]="ariaLabel || message"
    >
      @if (icon) {
        <div class="mb-4" [class]="iconContainerClass">
          <app-icon [name]="icon" [size]="iconSize" class="text-stone-200" />
        </div>
      }

      @if (title) {
        <h3 class="text-lg font-semibold text-stone-700 mb-2">{{ title }}</h3>
      }

      <p class="text-stone-400 text-sm max-w-xs">{{ message }}</p>

      @if (actionLabel) {
        <button
          type="button"
          (click)="onAction()"
          class="mt-4 px-4 py-2 bg-lime-500 text-white text-sm font-medium rounded-lg hover:bg-lime-600 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2"
          [attr.aria-label]="actionLabel"
        >
          {{ actionLabel }}
        </button>
      }
    </div>
  `
})
export class EmptyStateComponent {
  /** Icon name to display (from icon component) */
  @Input() icon: string = '';

  /** Icon size in pixels */
  @Input() iconSize: number = 48;

  /** Optional title above the message */
  @Input() title: string = '';

  /** Main message to display */
  @Input() message: string = 'No data available';

  /** Optional action button label */
  @Input() actionLabel: string = '';

  /** Optional action callback */
  @Input() action: (() => void) | null = null;

  /** Custom CSS classes for the container */
  @Input() containerClass: string = '';

  /** Custom CSS classes for the icon container */
  @Input() iconContainerClass: string = '';

  /** Accessibility label */
  @Input() ariaLabel: string = '';

  onAction(): void {
    if (this.action) {
      this.action();
    }
  }
}
