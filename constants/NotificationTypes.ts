export type NotificationType = 'new_activity' | 'activity_update' | 'proximity_alert' | 'reminder' | 'urgent' | 'clown_attendance' | 'regional_activity';

export interface NotificationPayload {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, any>;
    timestamp: string;
    read: boolean;
}

export interface NotificationPreferences {
    enabled: boolean;
    proximityRadius: number; // in km (5, 10, 20, 50, 0 for anywhere)
    types: {
        newActivity: boolean;
        activityUpdate: boolean;
        proximityAlert: boolean;
        reminder: boolean;
        urgent: boolean;
        clownAttendance: boolean;
        regionalActivity: boolean;
    };
    preferredRegions: string[]; // ['צפון', 'מרכז', 'דרום']
    quietHours: {
        enabled: boolean;
        start: string; // HH:mm
        end: string; // HH:mm
    };
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
    enabled: true,
    proximityRadius: 20,
    types: {
        newActivity: true,
        activityUpdate: true,
        proximityAlert: true,
        reminder: true,
        urgent: true,
        clownAttendance: true,
        regionalActivity: true,
    },
    preferredRegions: ['מרכז'],
    quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
    },
};
