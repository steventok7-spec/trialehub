

import { Injectable, signal } from '@angular/core';

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number; // 0-100
}

@Injectable({ providedIn: 'root' })
export class LoadingService {
  state = signal<LoadingState>({ isLoading: false });
  private loadingStack: string[] = [];

  startLoading(key: string = 'default', message?: string): void {
    // Track multiple loading states with a stack
    if (!this.loadingStack.includes(key)) {
      this.loadingStack.push(key);
    }

    this.state.update(current => ({
      ...current,
      isLoading: true,
      message: message || current.message
    }));
  }

  stopLoading(key: string = 'default'): void {
    this.loadingStack = this.loadingStack.filter(k => k !== key);

    if (this.loadingStack.length === 0) {
      this.state.update(current => ({
        ...current,
        isLoading: false,
        message: undefined,
        progress: undefined
      }));
    }
  }

  setProgress(progress: number): void {
    this.state.update(current => ({
      ...current,
      progress: Math.min(100, Math.max(0, progress))
    }));
  }

  reset(): void {
    this.loadingStack = [];
    this.state.set({ isLoading: false });
  }
}
