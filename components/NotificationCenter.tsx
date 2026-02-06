import { androidTextFix, createShadow, preventFontScaling } from '@/constants/AndroidStyles';
import Colors from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { AlertCircle, Bell, CheckCircle2, ExternalLink, X } from 'lucide-react-native';
import React from 'react';
import { Animated, Dimensions, FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { useColorScheme } from './useColorScheme';

const { height, width } = Dimensions.get('window');

interface Notification {
    id: string;
    title: string;
    time: string;
    read: boolean;
    activityId?: string;
    type?: 'new_activity' | 'activity_update' | 'reminder' | 'urgent' | 'clown_attendance';
}

export function NotificationCenter() {
    const { notificationsOpen, setNotificationsOpen, notifications, activities } = useApp();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const router = useRouter();

    const slideAnim = React.useRef(new Animated.Value(-height)).current;

    React.useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: notificationsOpen ? 0 : -height,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
        }).start();
    }, [notificationsOpen]);

    // Simplified to avoid lint error on private _value

    return (
        <View
            style={[StyleSheet.absoluteFill, { zIndex: notificationsOpen ? 1000 : -1 }]}
            pointerEvents={notificationsOpen ? 'auto' : 'none'}
        >
            {notificationsOpen && (
                <Pressable style={styles.overlay} onPress={() => setNotificationsOpen(false)}>
                    <Animated.View style={[styles.backdrop, { opacity: slideAnim.interpolate({ inputRange: [-height, 0], outputRange: [0, 0.4] }) }]} />
                </Pressable>
            )}

            <Animated.View style={[styles.container, { backgroundColor: colors.background, transform: [{ translateY: slideAnim }] }]}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity 
                        onPress={() => setNotificationsOpen(false)} 
                        style={[styles.closeButton, { backgroundColor: colors.border + '20' }]}
                        activeOpacity={0.7}
                    >
                        <X size={20} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>התראות</Text>
                    <TouchableOpacity>
                        <Text style={[styles.clearText, { color: colors.primary }]}>נקה הכל</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => {
                        const notification = item as Notification;
                        const hasActivity = notification.activityId && activities.some(a => a.id === notification.activityId);
                        const isUrgent = notification.title.includes('הקפצה') || notification.title.includes('דחופה');
                        
                        return (
                            <View style={[styles.notificationBubble, { 
                                backgroundColor: colors.card, 
                                borderColor: colors.border,
                                borderLeftColor: !notification.read ? colors.primary : colors.border,
                                borderLeftWidth: !notification.read ? 4 : 1,
                            }]}>
                                <View style={styles.notificationContent}>
                                    <View style={[styles.iconContainer, { 
                                        backgroundColor: notification.read 
                                            ? colors.border + '30' 
                                            : (isUrgent ? colors.error + '20' : colors.primary + '15') 
                                    }]}>
                                        {isUrgent ? (
                                            <AlertCircle size={20} color={notification.read ? colors.tabIconDefault : colors.error} />
                                        ) : (
                                            <CheckCircle2 size={20} color={notification.read ? colors.tabIconDefault : colors.success} />
                                        )}
                                    </View>
                                    
                                    <View style={styles.textContainer}>
                                        <Text style={[
                                            styles.notifTitle, 
                                            { 
                                                color: colors.text, 
                                                fontWeight: notification.read ? '500' : '700' 
                                            }
                                        ]}>
                                            {notification.title}
                                        </Text>
                                        <Text style={[styles.notifTime, { color: colors.tabIconDefault }]}>
                                            {notification.time}
                                        </Text>
                                    </View>
                                    
                                    {!notification.read && (
                                        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                                    )}
                                </View>
                                
                                {hasActivity && (
                                    <TouchableOpacity
                                        style={[styles.openActivityButton, { backgroundColor: colors.primary }]}
                                        onPress={() => {
                                            setNotificationsOpen(false);
                                            setTimeout(() => {
                                                router.push(`/activity/${notification.activityId}`);
                                            }, 300);
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <ExternalLink size={16} color="#fff" />
                                        <Text style={styles.openActivityText}>פתח אירוע</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Bell size={64} color={colors.border} />
                            <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
                                אין התראות חדשות
                            </Text>
                            <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
                                כל ההתראות שלך יופיעו כאן
                            </Text>
                        </View>
                    }
                />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
    },
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        maxHeight: height * 0.85,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingTop: 50,
        ...createShadow(8),
    },
    header: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        fontFamily: 'Inter',
        ...androidTextFix,
        ...preventFontScaling,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearText: {
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: 30,
    },
    notificationBubble: {
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        overflow: 'hidden',
        ...createShadow(3),
    },
    notificationContent: {
        flexDirection: 'row-reverse',
        padding: 16,
        alignItems: 'center',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    textContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    notifTitle: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'right',
        ...androidTextFix,
        ...preventFontScaling,
    },
    notifTime: {
        fontSize: 12,
        marginTop: 6,
        ...androidTextFix,
        ...preventFontScaling,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    openActivityButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 15,
        ...createShadow(2),
    },
    openActivityText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        marginRight: 8,
        ...androidTextFix,
        ...preventFontScaling,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyText: {
        marginTop: 20,
        fontSize: 18,
        fontWeight: '700',
        ...androidTextFix,
        ...preventFontScaling,
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 14,
        ...androidTextFix,
        ...preventFontScaling,
    },
});
