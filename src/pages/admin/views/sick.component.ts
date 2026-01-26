
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { IconComponent } from '../../../components/ui/icon.component';
import { Request } from '../../../models';

@Component({
  selector: 'admin-sick',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden min-h-[50vh]">
      @if (loading()) {
        <div class="flex flex-col items-center justify-center h-full py-32">
          <div class="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mb-4"></div>
          <p class="text-zinc-500 font-medium">Loading sick reports...</p>
        </div>
      } @else if (requests().length === 0) {
        <div class="flex flex-col items-center justify-center h-full py-32 px-6 text-center">
           <div class="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 text-rose-500 shadow-sm border border-rose-100">
              <app-icon name="heart-pulse" size="40"/>
           </div>
           <h3 class="text-zinc-900 font-bold text-xl mb-1 tracking-tight">No Sick Reports</h3>
           <p class="text-zinc-500 max-w-xs mx-auto text-sm">There are no new sick leave reports submitted.</p>
        </div>
      } @else {
        <div class="p-6 space-y-4">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-lg text-zinc-900">Sick Reports</h3>
            <span class="text-sm text-zinc-500">{{ requests().length }} total</span>
          </div>
          @for (req of requests(); track req.id) {
            <div class="p-5 border border-zinc-100 rounded-2xl hover:border-zinc-200 transition-colors">
              <div class="flex justify-between items-start gap-4">
                <div class="flex-1 min-w-0">
                  <p class="font-bold text-zinc-900 text-lg">{{ req.profiles?.name || 'Unknown Employee' }}</p>
                  <p class="text-sm text-zinc-500 mt-1">
                    {{ req.start_date }}
                  </p>
                  @if (req.reason) {
                    <p class="text-sm text-zinc-600 mt-2 bg-zinc-50 p-3 rounded-lg">{{ req.reason }}</p>
                  }
                </div>
                <span class="px-3 py-1.5 text-xs font-bold rounded-full uppercase tracking-wide flex-shrink-0"
                  [class.bg-amber-100]="req.status === 'pending'"
                  [class.text-amber-700]="req.status === 'pending'"
                  [class.bg-emerald-100]="req.status === 'approved'"
                  [class.text-emerald-700]="req.status === 'approved'"
                  [class.bg-red-100]="req.status === 'rejected'"
                  [class.text-red-700]="req.status === 'rejected'">
                  {{ req.status }}
                </span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class AdminSick implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  requests = signal<Request[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.loading.set(true);
    this.api.getRequests('sick').subscribe({
      next: (data) => {
        this.requests.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load sick reports');
        this.loading.set(false);
      }
    });
  }
}
