import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AvailabilitySlot } from '../constants/MockData';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

class NotificationService {
    private getAvailabilityReminderKey(userId: string) {
        return `@availability_reminder_ids_${userId}`;
    }

    private toSlotDate(slot: AvailabilitySlot) {
        return new Date(`${slot.date}T${slot.startTime}:00`);
    }

    async registerForPushNotificationsAsync() {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.warn('Failed to get push token for push notification!');
                return;
            }

            // Get the token from expo-notifications
            try {
                const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
                if (!projectId) {
                    console.warn('Project ID not found, using default token method');
                }
                token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
                console.log('Push Token:', token);
            } catch (e) {
                console.error('Error getting push token:', e);
            }
        } else {
            console.log('Must use physical device for Push Notifications');
        }

        return token;
    }

    async sendLocalNotification(title: string, body: string, data?: any) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data: data || {},
                sound: 'default',
            },
            trigger: null, // immediate
        });
    }

    async scheduleReminder(title: string, body: string, triggerDate: Date, data?: any) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data: data || {},
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: triggerDate
            } as Notifications.NotificationTriggerInput,
        });
    }

    async syncAvailabilitySlotReminders(userId: string, slots: AvailabilitySlot[], enabled: boolean) {
        const storageKey = this.getAvailabilityReminderKey(userId);
        const rawIds = await AsyncStorage.getItem(storageKey);
        const existingIds: string[] = rawIds ? JSON.parse(rawIds) : [];

        await Promise.all(
            existingIds.map(async (id) => {
                try {
                    await Notifications.cancelScheduledNotificationAsync(id);
                } catch {
                    // Ignore stale ids that were already removed by the OS.
                }
            })
        );

        if (!enabled) {
            await AsyncStorage.setItem(storageKey, JSON.stringify([]));
            return;
        }

        const now = Date.now();
        const nextIds: string[] = [];

        for (const slot of slots) {
            const triggerDate = this.toSlotDate(slot);
            if (Number.isNaN(triggerDate.getTime()) || triggerDate.getTime() <= now) continue;

            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'תזכורת זמינות',
                    body: `הזמינות שלך מתחילה ב-${slot.startTime} ב${slot.location}`,
                    data: {
                        type: 'availability_slot_reminder',
                        slotId: slot.id,
                        slotDate: slot.date,
                        slotTime: slot.startTime,
                        location: slot.location,
                    },
                    sound: 'default',
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: triggerDate,
                } as Notifications.NotificationTriggerInput,
            });
            nextIds.push(id);
        }

        await AsyncStorage.setItem(storageKey, JSON.stringify(nextIds));
    }

    // Helper to calculate distance between two coordinates in km
    calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    }

    private deg2rad(deg: number) {
        return deg * (Math.PI / 180);
    }
}

export const notificationService = new NotificationService();
