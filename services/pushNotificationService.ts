
const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

interface PushNotificationMessage {
    to: string;
    sound: 'default';
    title: string;
    body: string;
    data?: Record<string, any>;
    priority?: 'default' | 'normal' | 'high';
    channelId?: string;
}

class PushNotificationService {
    /**
     * Send push notification to a single user by their push token
     */
    async sendPushNotification(
        pushToken: string,
        title: string,
        body: string,
        data?: Record<string, any>
    ): Promise<boolean> {
        if (!pushToken) {
            console.warn('No push token provided');
            return false;
        }

        try {
            const message: PushNotificationMessage = {
                to: pushToken,
                sound: 'default',
                title,
                body,
                data: data || {},
                priority: 'high',
            };

            const response = await fetch(EXPO_PUSH_API_URL, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-Encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });

            const result = await response.json();
            
            if (result.data?.status === 'ok') {
                console.log('Push notification sent successfully');
                return true;
            } else {
                console.error('Failed to send push notification:', result);
                return false;
            }
        } catch (error) {
            console.error('Error sending push notification:', error);
            return false;
        }
    }

    /**
     * Send push notifications to multiple users
     */
    async sendPushNotifications(
        pushTokens: string[],
        title: string,
        body: string,
        data?: Record<string, any>
    ): Promise<number> {
        if (pushTokens.length === 0) {
            return 0;
        }

        // Filter out invalid tokens
        const validTokens = pushTokens.filter(token => token && token.length > 0);
        if (validTokens.length === 0) {
            return 0;
        }

        try {
            const messages: PushNotificationMessage[] = validTokens.map(token => ({
                to: token,
                sound: 'default',
                title,
                body,
                data: data || {},
                priority: 'high',
            }));

            const response = await fetch(EXPO_PUSH_API_URL, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-Encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messages),
            });

            const results = await response.json();
            
            // Count successful sends
            let successCount = 0;
            if (Array.isArray(results.data)) {
                successCount = results.data.filter((r: any) => r.status === 'ok').length;
            } else if (results.data?.status === 'ok') {
                successCount = 1;
            }

            console.log(`Sent ${successCount}/${validTokens.length} push notifications`);
            return successCount;
        } catch (error) {
            console.error('Error sending push notifications:', error);
            return 0;
        }
    }

    /**
     * Send push notification to users by their user IDs
     * Requires fetching push tokens from Firestore first
     */
    async sendPushToUserIds(
        userIds: string[],
        title: string,
        body: string,
        data?: Record<string, any>,
        getUserPushTokens?: (userIds: string[]) => Promise<Array<{ userId: string; pushToken: string | null }>>
    ): Promise<number> {
        if (!getUserPushTokens || userIds.length === 0) {
            return 0;
        }

        try {
            const userTokens = await getUserPushTokens(userIds);
            const pushTokens = userTokens
                .filter(ut => ut.pushToken)
                .map(ut => ut.pushToken as string);

            if (pushTokens.length === 0) {
                console.log('No push tokens found for users');
                return 0;
            }

            return await this.sendPushNotifications(pushTokens, title, body, data);
        } catch (error) {
            console.error('Error sending push to user IDs:', error);
            return 0;
        }
    }
}

export const pushNotificationService = new PushNotificationService();
