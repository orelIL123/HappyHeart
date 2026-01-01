import { Header } from '@/components/Header';
import { PendingClownCard } from '@/components/PendingClownCard';
import { StatCard } from '@/components/StatCard';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { User } from '@/constants/MockData';
import { useApp } from '@/context/AppContext';
import { firebaseService } from '@/services/firebaseService';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Award, Calendar, ChevronLeft, Info, LogOut, PlusCircle, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
    const { currentUser, logout, approveClown, rejectClown, isLoadingSession, updateUserProfile, activities } = useApp();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const router = useRouter();

    const [pendingClowns, setPendingClowns] = useState<User[]>([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (currentUser?.role === 'admin') {
            const unsubscribe = firebaseService.subscribeToPendingClowns((clowns) => {
                setPendingClowns(clowns);
            });
            return () => unsubscribe();
        }
    }, [currentUser]);

    const activitiesDone = currentUser ? activities.filter(a => a.participants.includes(currentUser.id)).length : 0;
    const activitiesCreated = currentUser ? activities.filter(a => a.organizerId === currentUser.id).length : 0;

    console.log('ProfileScreen: Rendering, isLoading:', isLoadingSession, 'currentUser:', currentUser?.name);

    if (isLoadingSession || !currentUser) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ color: colors.text, fontSize: 18, marginTop: 10 }}>טוען פרופיל...</Text>
            </View>
        );
    }

    const handleApprove = async (clown: User) => {
        Alert.alert(
            'אישור ליצן',
            `האם אתה בטוח שברצונך לאשר את ${clown.name}?`,
            [
                { text: 'ביטול', style: 'cancel' },
                {
                    text: 'אשר',
                    onPress: async () => {
                        try {
                            await approveClown(clown);
                            Alert.alert('הצלחה', 'הליצן אושר בהצלחה!');
                        } catch (error) {
                            Alert.alert('שגיאה', 'חלה שגיאה באישור הליצן');
                        }
                    }
                }
            ]
        );
    };

    const handleReject = async (clownId: string) => {
        Alert.alert(
            'דחיית ליצן',
            'האם אתה בטוח שברצונך לדחות את הבקשה?',
            [
                { text: 'ביטול', style: 'cancel' },
                {
                    text: 'דחה',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await rejectClown(clownId);
                            Alert.alert('הצלחה', 'הבקשה נדחתה');
                        } catch (error) {
                            Alert.alert('שגיאה', 'חלה שגיאה בדחיית הבקשה');
                        }
                    }
                }
            ]
        );
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('שגיאה', 'מצטערים, אנחנו צריכים גישה לגלריה כדי לשנות את התמונה');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setUploading(true);
            try {
                const downloadURL = await firebaseService.uploadProfileImage(currentUser.id, result.assets[0].uri);
                await updateUserProfile({ avatar: downloadURL });
                Alert.alert('הצלחה', 'תמונת הפרופיל עודכנה בהצלחה');
            } catch (error) {
                console.error('Upload Error:', error);
                Alert.alert('שגיאה', 'חלה שגיאה בהעלאת התמונה');
            } finally {
                setUploading(false);
            }
        }
    };

    const roles: { id: 'clown' | 'organizer' | 'admin'; label: string }[] = [
        { id: 'clown', label: 'ליצן רפואי' },
        { id: 'organizer', label: 'מארגן/רכז' },
        { id: 'admin', label: 'אדמין' },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Header title="פרופיל" />
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={[styles.avatarContainer, { borderColor: colors.primary }]}
                        onPress={handlePickImage}
                        disabled={uploading}
                    >
                        <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
                        {uploading && (
                            <View style={[StyleSheet.absoluteFill, styles.uploadOverlay]}>
                                <ActivityIndicator color="#fff" />
                            </View>
                        )}
                        <View style={[styles.roleBadge, { backgroundColor: colors.primary }]}>
                            <Award size={14} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={[styles.name, { color: colors.text }]}>{currentUser.name}</Text>
                    <View style={[styles.roleTag, { backgroundColor: colors.primary + '15' }]}>
                        <Text style={[styles.roleTagText, { color: colors.primary }]}>
                            {currentUser.role === 'admin' ? 'מנהל מערכת' : currentUser.role === 'organizer' ? 'מארגן פעילויות' : 'ליצן רפואי'}
                        </Text>
                    </View>
                </View>

                <View style={styles.statsSection}>
                    <StatCard
                        label="פעילויות שנעשו"
                        value={activitiesDone}
                        icon={<Calendar size={20} color={colors.primary} />}
                        color={colors.primary}
                    />
                    <StatCard
                        label="פעילויות שיוצרו"
                        value={activitiesCreated}
                        icon={<PlusCircle size={20} color={colors.playful} />}
                        color={colors.playful}
                    />
                    {currentUser.role === 'admin' && (
                        <StatCard
                            label="ליצנים ממתינים"
                            value={pendingClowns.length}
                            icon={<Users size={20} color={colors.secondary} />}
                            color={colors.secondary}
                        />
                    )}
                </View>

                {currentUser.role === 'admin' && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Users size={20} color={colors.primary} />
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>אישור ליצנים ממתינים ({pendingClowns.length})</Text>
                        </View>

                        {pendingClowns.length === 0 ? (
                            <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>אין בקשות הממתינות לאישור</Text>
                            </View>
                        ) : (
                            pendingClowns.map(clown => (
                                <PendingClownCard
                                    key={clown.id}
                                    clown={clown}
                                    onApprove={handleApprove}
                                    onReject={handleReject}
                                />
                            ))
                        )}
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>מידע וניהול</Text>

                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.menuItemContent}>
                            <View style={[styles.menuIconContainer, { backgroundColor: colors.accent + '15' }]}>
                                <Info size={20} color={colors.accent} />
                            </View>
                            <Text style={[styles.menuItemText, { color: colors.text }]}>תעודת ליצן רפואי</Text>
                        </View>
                        <ChevronLeft size={20} color={colors.tabIconDefault} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}
                        onPress={() => {
                            console.log('ProfileScreen: Logout pressed');
                            logout();
                            setTimeout(() => {
                                router.replace('/(auth)/login');
                            }, 100);
                        }}
                    >
                        <View style={styles.menuItemContent}>
                            <View style={[styles.menuIconContainer, { backgroundColor: colors.error + '15' }]}>
                                <LogOut size={20} color={colors.error} />
                            </View>
                            <Text style={[styles.menuItemText, { color: colors.error }]}>התנתקות מהמערכת</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 120,
    },
    header: {
        alignItems: 'center',
        padding: 40,
        paddingBottom: 20,
    },
    avatarContainer: {
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 4,
        padding: 5,
        marginBottom: 20,
        position: 'relative',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    uploadOverlay: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 65,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roleBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    name: {
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 8,
    },
    roleTag: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
    },
    roleTagText: {
        fontSize: 14,
        fontWeight: '800',
    },
    statsSection: {
        flexDirection: 'row-reverse',
        paddingHorizontal: 15,
        marginBottom: 30,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 16,
        textAlign: 'right',
    },
    sectionHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyContainer: {
        padding: 30,
        borderRadius: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
    },
    menuItem: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    menuItemContent: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 15,
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'right',
    },
});
