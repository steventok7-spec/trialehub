

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardVariant = 'elevated' | 'outlined' | 'flat';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cardClass()" [attr.data-testid]="testId">
      @if (title) {
        <div class="p-4 sm:p-6 border-b border-zinc-200">
          <h3 class="text-lg font-bold text-zinc-900">{{ title }}</h3>
        </div>
      }

      <div [class]="contentClass()">
        <ng-content></ng-content>
      </div>

      @if (footer) {
        <div class="p-4 sm:p-6 border-t border-zinc-200 bg-zinc-50 rounded-b-lg">
          <ng-content select="[card-footer]"></ng-content>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent {
  @Input() title: string | null = null;
  @Input() variant: CardVariant = 'elevated';
  @Input() footer = false;
  @Input() padding: 'sm' | 'md' | 'lg' = 'md';
  @Input() testId: string | null = null;

  cardClass(): string {
    const base = 'rounded-lg overflow-hidden';
    const variantClass = {
      elevated: 'bg-white shadow-md hover:shadow-lg transition-shadow',
      outlined: 'bg-stone-50 border border-zinc-200',
      flat: 'bg-zinc-50'
    }[this.variant];

    return `${base} ${variantClass}`;
  }

  contentClass(): string {
    const paddingMap = {
      sm: 'p-3 sm:p-4',
      md: 'p-4 sm:p-6',
      lg: 'p-6 sm:p-8'
    };

    return paddingMap[this.padding];
  }
}
