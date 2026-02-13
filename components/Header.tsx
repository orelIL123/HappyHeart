import Colors from '@/constants/Colors';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { Bell, ChevronRight, Menu } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from './useColorScheme';

interface HeaderProps {
    title: string;
    showBackButton?: boolean;
}

export function Header({ title, showBackButton = true }: HeaderProps) {
    const { setSidebarOpen, setNotificationsOpen, notifications } = useApp();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            {/* Right side: back button OR hamburger menu */}
            <View style={styles.side}>
                {showBackButton ? (
                    <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => router.back()}
                    >
                        <ChevronRight size={22} color={colors.text} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => setSidebarOpen(true)}
                    >
                        <Menu size={22} color={colors.text} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {title}
            </Text>

            {/* Left side: notifications bell */}
            <View style={styles.side}>
                <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => setNotificationsOpen(true)}
                >
                    <Bell size={22} color={colors.text} />
                    {unreadCount > 0 && (
                        <View style={[styles.badge, { backgroundColor: colors.error }]}>
                            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
    },
    side: {
        width: 44,
        alignItems: 'center',
    },
    title: {
        flex: 1,
        fontSize: 18,
        fontWeight: '800',
        fontFamily: 'Inter',
        textAlign: 'center',
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    badge: {
        position: 'absolute',
        top: -2,
        left: -2,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    badgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '800',
    },
});
