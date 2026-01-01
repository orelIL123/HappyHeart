import Colors from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { CirclePlay, HelpCircle, LogOut, Settings, Shield, Star, User, X } from 'lucide-react-native';
import React from 'react';
import { Animated, Dimensions, Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { useColorScheme } from './useColorScheme';

const { width } = Dimensions.get('window');

export function Sidebar() {
    const { sidebarOpen, setSidebarOpen, currentUser, setUserRole, logout } = useApp();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const router = useRouter();

    const slideAnim = React.useRef(new Animated.Value(width)).current;

    React.useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: sidebarOpen ? 0 : width,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [sidebarOpen]);

    // Render logic simplified to avoid lint error on private _value

    const roles: { id: 'clown' | 'organizer' | 'admin', label: string, icon: any }[] = [
        { id: 'clown', label: 'ליצן רפואי', icon: User },
        { id: 'organizer', label: 'רכז מוסד', icon: Star },
        { id: 'admin', label: 'מנהל מערכת', icon: Shield },
    ];

    return (
        <View
            style={[StyleSheet.absoluteFill, { zIndex: sidebarOpen ? 999 : -1 }]}
            pointerEvents={sidebarOpen ? 'auto' : 'none'}
        >
            {sidebarOpen && (
                <Pressable style={styles.overlay} onPress={() => setSidebarOpen(false)}>
                    <Animated.View style={[styles.backdrop, { opacity: slideAnim.interpolate({ inputRange: [0, width], outputRange: [0.5, 0] }) }]} />
                </Pressable>
            )}

            <Animated.View style={[styles.container, { backgroundColor: colors.background, transform: [{ translateX: slideAnim }] }]}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => setSidebarOpen(false)}>
                        <X size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>תפריט</Text>
                </View>

                <View style={styles.profileSection}>
                    <Image source={{ uri: currentUser?.avatar }} style={styles.avatar} />
                    <View style={styles.profileInfo}>
                        <Text style={[styles.name, { color: colors.text }]}>{currentUser?.name}</Text>
                        <Text style={[styles.roleLabel, { color: colors.tabIconDefault }]}>
                            {roles.find(r => r.id === currentUser?.role)?.label}
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.tabIconDefault }]}>החלף תפקיד (לצורך דמו)</Text>
                    {roles.map((role) => (
                        <TouchableOpacity
                            key={role.id}
                            style={[
                                styles.roleButton,
                                { backgroundColor: currentUser?.role === role.id ? colors.primary + '15' : 'transparent' }
                            ]}
                            onPress={() => {
                                setUserRole(role.id);
                                setSidebarOpen(false);
                            }}
                        >
                            <role.icon size={20} color={currentUser?.role === role.id ? colors.primary : colors.tabIconDefault} />
                            <Text style={[
                                styles.roleButtonText,
                                { color: currentUser?.role === role.id ? colors.primary : colors.text }
                            ]}>
                                {role.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.tabIconDefault }]}>סיוע לליצן</Text>
                    <TouchableOpacity
                        style={styles.roleButton}
                        onPress={() => {
                            setSidebarOpen(false);
                            router.push('/clown-help');
                        }}
                    >
                        <CirclePlay size={20} color={colors.primary} />
                        <Text style={[styles.roleButtonText, { color: colors.text }]}>מדריכים וסרטונים</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.footerItem}>
                        <Settings size={20} color={colors.tabIconDefault} />
                        <Text style={[styles.footerText, { color: colors.text }]}>הגדרות</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.footerItem}>
                        <HelpCircle size={20} color={colors.tabIconDefault} />
                        <Text style={[styles.footerText, { color: colors.text }]}>עזרה ותמיכה</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.footerItem, { marginTop: 20 }]}
                        onPress={() => {
                            logout();
                            setSidebarOpen(false);
                            // Force navigation to auth screen
                            setTimeout(() => {
                                router.replace('/(auth)/login');
                            }, 100);
                        }}
                    >
                        <LogOut size={20} color={colors.error} />
                        <Text style={[styles.footerText, { color: colors.error }]}>התנתק</Text>
                    </TouchableOpacity>
                </View>
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
        right: 0,
        bottom: 0,
        width: width * 0.75,
        paddingTop: 50,
        elevation: 16,
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    header: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginRight: 15,
        fontFamily: 'Inter',
    },
    profileSection: {
        padding: 25,
        flexDirection: 'row-reverse',
        alignItems: 'center',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginLeft: 15,
    },
    profileInfo: {
        alignItems: 'flex-end',
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    roleLabel: {
        fontSize: 14,
        marginTop: 2,
    },
    section: {
        paddingHorizontal: 20,
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'right',
        marginBottom: 15,
        textTransform: 'uppercase',
    },
    roleButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        marginBottom: 8,
    },
    roleButtonText: {
        fontSize: 16,
        marginRight: 12,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginVertical: 20,
        marginHorizontal: 20,
    },
    footer: {
        paddingHorizontal: 20,
    },
    footerItem: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingVertical: 12,
    },
    footerText: {
        fontSize: 16,
        marginRight: 12,
        fontWeight: '500',
    },
});
