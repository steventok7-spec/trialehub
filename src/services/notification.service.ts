
import { Injectable, signal, computed, inject } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from '../auth/auth.service'; // Need Auth for user_id
import { supabase } from '../supabase.config';

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
        timestamp: n.created_at, // Map DB field to UI
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

        await this.loadNotifications();
        this.subscribeToNotifications();
        this.checkForBirthdays();
    }

    async loadNotifications() {
        const user = this.auth.currentUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (data) {
            this.notificationsSignal.set(data as AppNotification[]);
        }
    }

    subscribeToNotifications() {
        const user = this.auth.currentUser();
        if (!user) return;

        supabase.channel('public:notifications')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
                this.loadNotifications(); // Reload on any change
            })
            .subscribe();
    }

    async markAsRead(id: string) {
        // Optimistic UI update
        this.notificationsSignal.update(current =>
            current.map(n => n.id === id ? { ...n, is_read: true } : n)
        );

        // DB Update
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    }

    async markAllAsRead() {
        const user = this.auth.currentUser();
        if (!user) return;

        // Optimistic
        this.notificationsSignal.update(current =>
            current.map(n => ({ ...n, is_read: true }))
        );

        // DB Update
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    }

    private checkForBirthdays() {
        // Client-side simulation of Cron Job
        // Only runs if user is logged in
        const user = this.auth.currentUser();
        if (!user) return;

        this.api.getEmployees().subscribe(async employees => {
            const today = new Date();
            const month = today.getMonth() + 1;
            const day = today.getDate();

            const birthdayEmployees = employees.filter(emp => {
                const dobStr = (emp['date_of_birth'] || emp['birthday']) as string;
                if (!dobStr) return false;
                try {
                    const dob = new Date(dobStr);
                    return (dob.getMonth() + 1) === month && dob.getDate() === day;
                } catch { return false; }
            });

            if (birthdayEmployees.length > 0) {
                // Check if we already created a notification TODAY for this user
                const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();

                const { data: existing } = await supabase
                    .from('notifications')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('type', 'birthday')
                    .gte('created_at', startOfDay);

                if (!existing || existing.length === 0) {
                    // Insert notifications
                    const inserts = birthdayEmployees.map(emp => ({
                        user_id: user.id,
                        type: 'birthday',
                        title: '🎉 Birthday Today!',
                        message: `Today is ${emp.name}'s birthday! Wish them a happy birthday!`,
                        icon: '🎂',
                        is_read: false
                    }));

                    await supabase.from('notifications').insert(inserts);
                    // Subscription will auto-update UI
                }
            }
        });
    }
}
