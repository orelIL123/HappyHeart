import { useColorScheme } from '@/components/useColorScheme';
import { androidTextFix, createShadow, preventFontScaling } from '@/constants/AndroidStyles';
import Colors from '@/constants/Colors';
import { Activity } from '@/constants/MockData';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Activity as ActivityIcon, Building, Calendar as CalendarIcon, Clock, Heart, MapPin, Users } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useApp } from '@/context/AppContext';
import { firebaseService } from '@/services/firebaseService';
import { useRouter } from 'expo-router';

interface ActivityCardProps {
    activity: Activity;
    isJoined?: boolean;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, isJoined }) => {
    const router = useRouter();
    const { currentUser } = useApp();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    
    const likes = activity.likes || [];
    const isLiked = currentUser ? likes.includes(currentUser.id) : false;
    const likesCount = likes.length;

    const startTime = new Date(activity.startTime);
    const dateStr = format(startTime, 'EEEE, d בMMMM', { locale: he });
    const timeStr = `${format(new Date(activity.endTime), 'HH:mm')} - ${format(startTime, 'HH:mm')}`;

    const intensityColor = activity.intensity === 'high' ? colors.error :
        activity.intensity === 'medium' ? colors.secondary :
            colors.success;

    const intensityLabel = activity.intensity === 'high' ? 'אינטנסיביות גבוהה' :
        activity.intensity === 'medium' ? 'אינטנסיביות בינונית' :
            'אינטנסיביות נמוכה';

    const handleToggleLike = async (e: any) => {
        e.stopPropagation();
        if (!currentUser) return;
        try {
            await firebaseService.toggleLike(activity.id, currentUser.id);
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push(`/activity/${activity.id}`)}
            style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={[styles.title, { color: colors.text }]}>{activity.title}</Text>
                    {activity.department && (
                        <View style={[styles.departmentBadge, { backgroundColor: colors.accent + '15' }]}>
                            <Text style={[styles.departmentText, { color: colors.accent }]}>{activity.department}</Text>
                        </View>
                    )}
                </View>
                {isJoined && (
                    <View style={[styles.joinedBadge, { backgroundColor: colors.success + '20' }]}>
                        <Text style={[styles.joinedText, { color: colors.success }]}>רשום!</Text>
                    </View>
                )}
            </View>

            <View style={styles.details}>
                <View style={styles.row}>
                    <Building size={16} color={colors.tabIconDefault} />
                    <Text style={[styles.detailText, { color: colors.text }]}>{activity.institution}</Text>
                </View>
                <View style={styles.row}>
                    <MapPin size={16} color={colors.tabIconDefault} />
                    <Text style={[styles.detailText, { color: colors.text }]}>{activity.location}</Text>
                </View>
                {activity.intensity && (
                    <View style={styles.row}>
                        <ActivityIcon size={16} color={intensityColor} />
                        <Text style={[styles.detailText, { color: intensityColor, fontWeight: '700' }]}>{intensityLabel}</Text>
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                <View style={styles.footerItem}>
                    <CalendarIcon size={14} color={colors.primary} />
                    <Text style={[styles.footerText, { color: colors.primary }]}>{dateStr}</Text>
                </View>
                <View style={styles.footerItem}>
                    <Clock size={14} color={colors.primary} />
                    <Text style={[styles.footerText, { color: colors.primary }]}>{timeStr}</Text>
                </View>
                <View style={styles.footerItem}>
                    <Users size={14} color={colors.playful} />
                    <Text style={[styles.footerText, { color: colors.playful }]}>
                        {activity.participants.length}/{activity.requiredClowns}
                    </Text>
                </View>
                <TouchableOpacity 
                    style={styles.footerItem}
                    onPress={handleToggleLike}
                    disabled={!currentUser}
                >
                    <Heart 
                        size={14} 
                        color={isLiked ? colors.error : colors.tabIconDefault}
                        fill={isLiked ? colors.error : 'none'}
                    />
                    {likesCount > 0 && (
                        <Text style={[styles.footerText, { 
                            color: isLiked ? colors.error : colors.tabIconDefault,
                            marginRight: 4
                        }]}>
                            {likesCount}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        ...createShadow(5),
    },
    header: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    titleContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        textAlign: 'right',
        fontFamily: 'Inter',
        marginBottom: 6,
        ...androidTextFix,
        ...preventFontScaling,
    },
    departmentBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    departmentText: {
        fontSize: 12,
        fontWeight: '800',
        ...androidTextFix,
        ...preventFontScaling,
    },
    joinedBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        marginLeft: 10,
    },
    joinedText: {
        fontSize: 12,
        fontWeight: '900',
        ...androidTextFix,
        ...preventFontScaling,
    },
    details: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailText: {
        fontSize: 14,
        marginRight: 10,
        textAlign: 'right',
        fontFamily: 'Inter',
        fontWeight: '600',
        ...androidTextFix,
        ...preventFontScaling,
        flexShrink: 1,
    },
    footer: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    footerItem: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        fontWeight: '800',
        marginRight: 6,
        fontFamily: 'Inter',
        ...androidTextFix,
        ...preventFontScaling,
    },
});
