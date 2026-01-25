
import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../components/ui/icon.component';

@Component({
  selector: 'app-sick-report-form',
  standalone: true,
  imports: [FormsModule, CommonModule, IconComponent],
  template: `
    <div class="fixed inset-0 z-50 overflow-y-auto">
      <div class="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm transition-opacity" (click)="close.emit()"></div>

      <div class="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4 text-center">
        <div class="relative transform overflow-hidden rounded-t-3xl sm:rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-md border border-zinc-100 animate-slide-up sm:animate-scale-in">
          
          <div class="bg-white px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold text-zinc-900">Report Sick</h2>
              <p class="text-xs text-zinc-500 mt-0.5">Notify admin of absence</p>
            </div>
            <button (click)="close.emit()" class="text-zinc-400 hover:text-zinc-600 transition-colors p-2 rounded-full hover:bg-zinc-100">
              <app-icon name="x" size="20" />
            </button>
          </div>

          <div class="px-6 py-8">
            <form (submit)="onSubmit($event)" class="space-y-6">
              <div>
                <label class="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Date of Absence</label>
                <input type="date" [(ngModel)]="formData.date" name="date" required class="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent focus:bg-white transition-all text-sm outline-none"/>
              </div>
              <div>
                <label class="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Symptoms or Notes</label>
                <textarea [(ngModel)]="formData.notes" name="notes" rows="4" placeholder="e.g., Fever, doctor's appointment" required class="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent focus:bg-white transition-all text-sm outline-none resize-none"></textarea>
              </div>
              
              <div class="pt-2 flex flex-col sm:flex-row justify-end gap-3">
                <button type="button" (click)="close.emit()" class="order-2 sm:order-1 px-6 py-3.5 bg-zinc-100 text-zinc-600 rounded-xl font-semibold hover:bg-zinc-200 transition-all active:scale-[0.98]">Cancel</button>
                <button type="submit" [disabled]="loading()" class="order-1 sm:order-2 px-6 py-3.5 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20 transition-all active:scale-[0.98]">
                  @if (loading()) {
                    <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  } @else {
                    <span>Submit Report</span>
                    <app-icon name="alert-circle" size="18" />
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SickReportFormComponent {
  employeeId = input.required<string>();
  close = output<void>();
  submitRequest = output<any>();

  loading = signal(false);
  formData = {
    date: new Date().toISOString().split('T')[0],
    notes: ''
  };

  onSubmit(event: Event) {
    event.preventDefault();
    if (!this.formData.date || !this.formData.notes) {
      return;
    }
    this.loading.set(true);
    this.submitRequest.emit({
      employeeId: this.employeeId(),
      ...this.formData
    });
  }
}
