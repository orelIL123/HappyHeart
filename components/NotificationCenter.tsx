import Colors from '@/constants/Colors';
import { AlertCircle, Bell, CheckCircle2, X } from 'lucide-react-native';
import React from 'react';
import { Animated, Dimensions, FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { useColorScheme } from './useColorScheme';

const { height, width } = Dimensions.get('window');

export function NotificationCenter() {
    const { notificationsOpen, setNotificationsOpen, notifications } = useApp();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

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
                    <TouchableOpacity onPress={() => setNotificationsOpen(false)} style={styles.closeButton}>
                        <X size={24} color={colors.text} />
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
                    renderItem={({ item }) => (
                        <TouchableOpacity style={[styles.notificationItem, { borderBottomColor: colors.border }]}>
                            <View style={[styles.iconContainer, { backgroundColor: item.read ? colors.border : colors.primary + '15' }]}>
                                {item.title.includes('הקפצה') ? (
                                    <AlertCircle size={18} color={item.read ? colors.tabIconDefault : colors.primary} />
                                ) : (
                                    <CheckCircle2 size={18} color={item.read ? colors.tabIconDefault : colors.success} />
                                )}
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={[styles.notifTitle, { color: colors.text, fontWeight: item.read ? '400' : '700' }]}>{item.title}</Text>
                                <Text style={[styles.notifTime, { color: colors.tabIconDefault }]}>{item.time}</Text>
                            </View>
                            {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Bell size={48} color={colors.border} />
                            <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>אין התראות חדשות</Text>
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
        maxHeight: height * 0.8,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingTop: 50,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
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
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Inter',
    },
    closeButton: {
        padding: 5,
    },
    clearText: {
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        paddingBottom: 30,
    },
    notificationItem: {
        flexDirection: 'row-reverse',
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 15,
    },
    textContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    notifTitle: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'right',
    },
    notifTime: {
        fontSize: 12,
        marginTop: 4,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 10,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 50,
    },
    emptyText: {
        marginTop: 15,
        fontSize: 16,
    },
});
