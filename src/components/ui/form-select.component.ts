

import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

@Component({
  selector: 'app-form-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full">
      @if (label) {
        <label [for]="selectId" class="block text-sm font-semibold text-zinc-900 mb-2">
          {{ label }}
          @if (required) {
            <span class="text-red-500">*</span>
          }
        </label>
      }

      <select
        [id]="selectId"
        [value]="value"
        (change)="onChange($event)"
        (blur)="onBlur()"
        [disabled]="disabled"
        [required]="required"
        [class]="selectClass()"
        [attr.aria-label]="ariaLabel"
        [attr.aria-describedby]="errorId"
      >
        @if (placeholder) {
          <option value="" disabled>{{ placeholder }}</option>
        }
        @for (option of options; track option.value) {
          <option [value]="option.value" [disabled]="option.disabled">
            {{ option.label }}
          </option>
        }
      </select>

      @if (error) {
        <p [id]="errorId" class="text-red-600 text-sm mt-1">{{ error }}</p>
      }
      @if (helperText && !error) {
        <p class="text-zinc-500 text-sm mt-1">{{ helperText }}</p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormSelectComponent),
      multi: true
    }
  ]
})
export class FormSelectComponent implements ControlValueAccessor {
  @Input() label: string | null = null;
  @Input() placeholder = '-- Select --';
  @Input() options: SelectOption[] = [];
  @Input() error: string | null = null;
  @Input() helperText: string | null = null;
  @Input() disabled = false;
  @Input() required = false;
  @Input() ariaLabel: string | null = null;
  @Output() valueChange = new EventEmitter<string | number>();
  @Output() blurred = new EventEmitter<void>();

  value: string | number = '';
  readonly selectId = `select-${Math.random().toString(36).substr(2, 9)}`;
  readonly errorId = `${this.selectId}-error`;

  private onChangeFunc: (value: string | number) => void = () => {};
  private onTouched: () => void = () => {};

  selectClass(): string {
    const base = 'w-full px-4 py-2.5 rounded-lg border-2 font-medium text-zinc-900 bg-white cursor-pointer transition-colors focus:outline-none appearance-none';
    const borderClass = this.error
      ? 'border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500'
      : 'border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900';
    const disabledClass = this.disabled ? 'bg-zinc-50 cursor-not-allowed opacity-60' : '';

    return `${base} ${borderClass} ${disabledClass}`;
  }

  onChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.value = target.value;
    this.onChangeFunc(this.value);
    this.valueChange.emit(this.value);
  }

  onBlur(): void {
    this.onTouched();
    this.blurred.emit();
  }

  writeValue(value: string | number): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string | number) => void): void {
    this.onChangeFunc = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
