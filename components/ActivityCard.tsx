import { useColorScheme } from '@/components/useColorScheme';
import { androidTextFix, createShadow, preventFontScaling } from '@/constants/AndroidStyles';
import Colors from '@/constants/Colors';
import { Activity } from '@/constants/MockData';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Building, Calendar as CalendarIcon, Clock, Heart, MapPin, PlayCircle, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useApp } from '@/context/AppContext';
import { firebaseService } from '@/services/firebaseService';
import { sanitizeAvatarUrl } from '@/utils/avatar';
import { useRouter } from 'expo-router';

interface ActivityCardProps {
    activity: Activity;
    isJoined?: boolean;
    isPast?: boolean;
    isNearest?: boolean;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, isJoined, isPast = false, isNearest = false }) => {
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

    const [participantAvatars, setParticipantAvatars] = useState<string[]>([]);
    const isCompactPast = isPast;

    useEffect(() => {
        let mounted = true;
        const fetchAvatars = async () => {
            if (!activity.participants?.length) {
                if (mounted) setParticipantAvatars([]);
                return;
            }
            try {
                const users = await firebaseService.getUsersByIds(activity.participants.slice(0, 4));
                if (mounted) {
                    setParticipantAvatars(users.map(user => sanitizeAvatarUrl(user.avatar)).filter(Boolean));
                }
            } catch (error) {
                console.error('Error loading participant avatars:', error);
            }
        };
        fetchAvatars();
        return () => { mounted = false; };
    }, [activity.participants]);

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
            style={[
                styles.container,
                {
                    backgroundColor: colors.card,
                    borderColor: isNearest ? colors.success : colors.border,
                    borderWidth: isNearest ? 2 : 1,
                    padding: isCompactPast ? 12 : 20,
                    borderRadius: isCompactPast ? 16 : 24,
                    marginBottom: isCompactPast ? 10 : 20,
                    opacity: isCompactPast ? 0.8 : 1,
                }
            ]}
        >
            <View style={styles.badgesContainer}>
                {isNearest && (
                    <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
                        <Text style={styles.statusBadgeText}>הקרוב ביותר</Text>
                    </View>
                )}
                {isPast && (
                    <View style={[styles.pastStatusBadge, { backgroundColor: colors.tabIconDefault }]}>
                        <Text style={styles.pastStatusBadgeText}>עבר זמנו</Text>
                    </View>
                )}
            </View>

            {activity.imageUrl ? (
                <Image
                    source={{ uri: activity.imageUrl }}
                    style={[
                        styles.cardImage,
                        isCompactPast && {
                            height: 72,
                            marginHorizontal: -12,
                            marginTop: -12,
                            marginBottom: 8,
                        }
                    ]}
                    resizeMode="cover"
                />
            ) : null}
            <View style={[styles.header, isCompactPast && { marginBottom: 8 }]}>
                <View style={styles.titleContainer}>
                    <Text style={[styles.title, { color: colors.text }, isCompactPast && { fontSize: 15, marginBottom: 3 }]}>{activity.title}</Text>
                    {(activity.department || activity.videoUrl) && (
                        <View style={styles.metaBadgesRow}>
                            {activity.department && (
                                <View style={[styles.departmentBadge, { backgroundColor: colors.accent + '15' }, isCompactPast && { paddingVertical: 2, paddingHorizontal: 7 }]}>
                                    <Text style={[styles.departmentText, { color: colors.accent }, isCompactPast && { fontSize: 10 }]}>{activity.department}</Text>
                                </View>
                            )}
                            {activity.videoUrl && (
                                <View style={[styles.departmentBadge, styles.mediaBadge, { backgroundColor: colors.primary + '15' }, isCompactPast && { paddingVertical: 2, paddingHorizontal: 7 }]}>
                                    <PlayCircle size={12} color={colors.primary} />
                                    <Text style={[styles.departmentText, { color: colors.primary }, isCompactPast && { fontSize: 10 }]}>וידאו</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
                {isJoined && (
                    <View style={[styles.joinedBadge, { backgroundColor: colors.success + '20' }, isCompactPast && { paddingVertical: 4, paddingHorizontal: 8 }]}>
                        <Text style={[styles.joinedText, { color: colors.success }, isCompactPast && { fontSize: 10 }]}>רשום!</Text>
                    </View>
                )}
            </View>

            <View style={[styles.details, isCompactPast && { marginBottom: 10 }]}>
                <View style={[styles.row, isCompactPast && { marginBottom: 5 }]}>
                    <Building size={16} color={colors.tabIconDefault} />
                    <Text style={[styles.detailText, { color: colors.text }, isCompactPast && { fontSize: 12 }]}>{activity.institution}</Text>
                </View>
                <View style={[styles.row, isCompactPast && { marginBottom: 5 }]}>
                    <MapPin size={16} color={colors.tabIconDefault} />
                    <Text style={[styles.detailText, { color: colors.text }, isCompactPast && { fontSize: 11 }]}>{activity.fullAddress || activity.location}</Text>
                </View>
                <View style={[styles.row, isCompactPast && { marginBottom: 4 }]}>
                    <Users size={16} color={colors.playful} />
                    <View style={styles.avatarStack}>
                        {participantAvatars.length === 0 ? (
                            <Text style={[styles.detailText, { color: colors.tabIconDefault }, isCompactPast && { fontSize: 11 }]}>אין נרשמים עדיין</Text>
                        ) : (
                            participantAvatars.map((avatar, index) => (
                                <Image
                                    key={`${avatar}-${index}`}
                                    source={{ uri: avatar }}
                                    style={[
                                        styles.participantAvatar,
                                        { right: index * 18 },
                                        isCompactPast && { width: 20, height: 20, borderRadius: 10 }
                                    ]}
                                />
                            ))
                        )}
                    </View>
                </View>
            </View>

            <View style={[styles.footer, isCompactPast && { paddingTop: 10 }]}>
                <View style={styles.footerItem}>
                    <CalendarIcon size={14} color={colors.primary} />
                    <Text style={[styles.footerText, { color: colors.primary }, isCompactPast && { fontSize: 10 }]}>{dateStr}</Text>
                </View>
                <View style={styles.footerItem}>
                    <Clock size={14} color={colors.primary} />
                    <Text style={[styles.footerText, { color: colors.primary }, isCompactPast && { fontSize: 10 }]}>{timeStr}</Text>
                </View>
                <View style={styles.footerItem}>
                    <Users size={14} color={colors.playful} />
                    <Text style={[styles.footerText, { color: colors.playful }, isCompactPast && { fontSize: 10 }]}>
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
                        }, isCompactPast && { fontSize: 10 }]}>
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
        overflow: 'hidden',
        ...createShadow(5),
    },
    cardImage: {
        width: '100%',
        height: 120,
        marginHorizontal: -20,
        marginTop: -20,
        marginBottom: 12,
    },
    badgesContainer: {
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 3,
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 6,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
    },
    statusBadgeText: {
        fontSize: 11,
        color: '#fff',
        fontWeight: '900',
        ...androidTextFix,
        ...preventFontScaling,
    },
    pastStatusBadge: {
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 999,
    },
    pastStatusBadgeText: {
        fontSize: 9,
        color: '#fff',
        fontWeight: '800',
        ...androidTextFix,
        ...preventFontScaling,
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
    metaBadgesRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6,
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
    mediaBadge: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
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
    avatarStack: {
        minHeight: 26,
        minWidth: 100,
        marginRight: 10,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    participantAvatar: {
        width: 26,
        height: 26,
        borderRadius: 13,
        position: 'absolute',
        borderWidth: 1.5,
        borderColor: '#fff',
    },
});
