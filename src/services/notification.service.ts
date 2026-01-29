
import { Injectable, signal, computed, inject } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from '../auth/auth.service';

export interface AppNotification {
    id: string;
    user_id?: string;
    type: 'birthday' | 'system';
    title: string;
    message: string;
    icon: string;
    created_at?: string;
    is_read: boolean;
    timestamp?: string; // UI compat
    read?: boolean;     // UI compat
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private api = inject(ApiService);
    private auth = inject(AuthService);

    // State
    private notificationsSignal = signal<AppNotification[]>([]);

    // Public Signals
    notifications = computed(() => this.notificationsSignal().map(n => ({
        ...n,
        timestamp: n.created_at,
        read: n.is_read
    })));

    unreadCount = computed(() => this.notificationsSignal().filter(n => !n.is_read).length);

    constructor() {
        // Removed automatic init() call to prevent loading notifications before auth is ready
        // Services will call initializeForUser() after successful login
    }

    /**
     * Initialize notifications for the logged-in user
     * Must be called after authentication is confirmed
     */
    async initializeForUser() {
        const user = this.auth.currentUser();
        if (!user) {
            console.warn('NotificationService: Cannot initialize without authenticated user');
            return;
        }

        // PHASE 0: Stubbed out - Firebase implementation pending
        console.warn('NotificationService.initializeForUser() is stubbed - Supabase removed, awaiting Firebase implementation');
    }

    async loadNotifications() {
        const user = this.auth.currentUser();
        if (!user) return;

        // PHASE 0: Stubbed out - Firebase implementation pending
        console.warn('NotificationService.loadNotifications() is stubbed - Supabase removed, awaiting Firebase implementation');
        this.notificationsSignal.set([]);
    }

    subscribeToNotifications() {
        const user = this.auth.currentUser();
        if (!user) return;

        // PHASE 0: Stubbed out - Firebase implementation pending
        console.warn('NotificationService.subscribeToNotifications() is stubbed - Supabase removed, awaiting Firebase implementation');
    }

    async markAsRead(id: string) {
        // Optimistic UI update
        this.notificationsSignal.update(current =>
            current.map(n => n.id === id ? { ...n, is_read: true } : n)
        );

        // PHASE 0: DB update stubbed out
        console.warn('NotificationService.markAsRead() is stubbed - Supabase removed, awaiting Firebase implementation');
    }

    async markAllAsRead() {
        const user = this.auth.currentUser();
        if (!user) return;

        // Optimistic
        this.notificationsSignal.update(current =>
            current.map(n => ({ ...n, is_read: true }))
        );

        // PHASE 0: DB update stubbed out
        console.warn('NotificationService.markAllAsRead() is stubbed - Supabase removed, awaiting Firebase implementation');
    }

    private checkForBirthdays() {
        // PHASE 0: Stubbed out - Firebase implementation pending
        console.warn('NotificationService.checkForBirthdays() is stubbed - Supabase removed, awaiting Firebase implementation');
    }
}
