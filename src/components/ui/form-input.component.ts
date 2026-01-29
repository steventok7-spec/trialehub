

import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full">
      @if (label) {
        <label [for]="inputId" class="block text-sm font-semibold text-zinc-900 mb-2">
          {{ label }}
          @if (required) {
            <span class="text-red-500">*</span>
          }
        </label>
      }

      <input
        [id]="inputId"
        [type]="type"
        [placeholder]="placeholder"
        [value]="value"
        (input)="onInput($event)"
        (blur)="onBlur()"
        [disabled]="disabled"
        [required]="required"
        [class]="inputClass()"
        [attr.aria-label]="ariaLabel"
        [attr.aria-describedby]="errorId"
      />

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
      useExisting: forwardRef(() => FormInputComponent),
      multi: true
    }
  ]
})
export class FormInputComponent implements ControlValueAccessor {
  @Input() label: string | null = null;
  @Input() type: string = 'text';
  @Input() placeholder = '';
  @Input() error: string | null = null;
  @Input() helperText: string | null = null;
  @Input() disabled = false;
  @Input() required = false;
  @Input() ariaLabel: string | null = null;
  @Output() valueChange = new EventEmitter<string>();
  @Output() blurred = new EventEmitter<void>();

  value = '';
  readonly inputId = `input-${Math.random().toString(36).substr(2, 9)}`;
  readonly errorId = `${this.inputId}-error`;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  inputClass(): string {
    const base = 'w-full px-4 py-2.5 rounded-lg border-2 font-medium text-zinc-900 placeholder-zinc-400 transition-colors focus:outline-none';
    const borderClass = this.error
      ? 'border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500'
      : 'border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900';
    const disabledClass = this.disabled ? 'bg-zinc-50 cursor-not-allowed opacity-60' : 'bg-white';

    return `${base} ${borderClass} ${disabledClass}`;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
  }

  onBlur(): void {
    this.onTouched();
    this.blurred.emit();
  }

  writeValue(value: string): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
