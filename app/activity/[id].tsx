import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Comment, User } from '@/constants/MockData';
import { useApp } from '@/context/AppContext';
import { firebaseService } from '@/services/firebaseService';
import { pushNotificationService } from '@/services/pushNotificationService';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, Building, Calendar as CalendarIcon, Clock, Heart, ImagePlus, MapPin, MessageCircle, Phone as PhoneIcon, Send, Share2, MessageCircle as WhatsAppIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ActivityDetailsScreen() {
    const { id } = useLocalSearchParams();
    const { activities, currentUser, joinActivity, leaveActivity } = useApp();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const router = useRouter();

    const [selectedParticipant, setSelectedParticipant] = React.useState<User | null>(null);
    const [participantsData, setParticipantsData] = useState<User[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isUpdatingImage, setIsUpdatingImage] = useState(false);

    const activity = activities.find(a => a.id === id);
    
    useEffect(() => {
        if (activity && activity.participants.length > 0) {
            firebaseService.getUsersByIds(activity.participants).then(setParticipantsData);
        } else {
            setParticipantsData([]);
        }
    }, [activity?.participants]);

    // Subscribe to comments
    useEffect(() => {
        if (!id) return;
        const unsubscribe = firebaseService.subscribeToComments(id, 
            (data) => {
                setComments(data);
            },
            (error) => {
                console.error('Error subscribing to comments:', error);
                // If there's an index error, try to load comments without orderBy
                if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
                    console.warn('Index missing for comments, trying fallback...');
                    firebaseService.getCommentsWithoutOrderBy(id).then(setComments).catch((err) => {
                        console.error('Fallback also failed:', err);
                        Alert.alert(
                            'שגיאה בטעינת תגובות',
                            'לא הצלחנו לטעון את התגובות. אנא נסה לרענן את הדף.',
                            [{ text: 'הבנתי' }]
                        );
                    });
                } else {
                    Alert.alert(
                        'שגיאה בטעינת תגובות',
                        'לא הצלחנו לטעון את התגובות. אנא נסה לרענן את הדף.',
                        [{ text: 'הבנתי' }]
                    );
                }
            }
        );
        return () => unsubscribe();
    }, [id]);

    if (!activity) return null;

    const isJoined = currentUser ? activity.participants.includes(currentUser.id) : false;
    const isFull = activity.participants.length >= activity.requiredClowns;
    const likes = activity.likes || [];
    const isLiked = currentUser ? likes.includes(currentUser.id) : false;
    const likesCount = likes.length;

    const startTime = new Date(activity.startTime);
    const dateStr = format(startTime, 'EEEE, d בMMMM', { locale: he });
    const timeStr = `${format(new Date(activity.endTime), 'HH:mm')} - ${format(startTime, 'HH:mm')}`;

    const handleJoin = () => {
        if (isJoined) {
            Alert.alert('ביטול הגעה', 'האם אתה בטוח שברצונך לבטל את הגעתך לפעילות?', [
                { text: 'לא', style: 'cancel' },
                { text: 'כן, בטל', onPress: () => leaveActivity(activity.id) },
            ]);
        } else {
            if (isFull) {
                Alert.alert('פעילות מלאה', 'כל המשבצות כבר תפוסות. תודה על הרצון הטוב!');
                return;
            }
            joinActivity(activity.id);
            Alert.alert('איזה כיף!', 'נרשמת בהצלחה לפעילות. נתראה שם!');
        }
    };

    const handleWhatsApp = (phone?: string) => {
        if (!phone) return;
        const cleanPhone = phone.replace(/[^\d]/g, '');
        const url = `whatsapp://send?phone=${cleanPhone}`;
        Linking.canOpenURL(url).then((supported: boolean) => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Linking.openURL(`https://wa.me/${cleanPhone}`);
            }
        });
    };

    const handleCall = (phone?: string) => {
        if (!phone) return;
        Linking.openURL(`tel:${phone}`);
    };

    const handleChangeActivityImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('הרשאה נדרשת', 'נדרשת גישה לגלריה להחלפת תמונה.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });
        if (result.canceled || !result.assets?.[0]) return;
        setIsUpdatingImage(true);
        try {
            await firebaseService.uploadActivityImage(activity.id, result.assets[0].uri);
            Alert.alert('הצלחה', 'תמונת הפעילות עודכנה');
        } catch (err) {
            console.error('Error updating activity image:', err);
            Alert.alert('שגיאה', 'לא ניתן היה לעדכן את התמונה');
        } finally {
            setIsUpdatingImage(false);
        }
    };

    const handleToggleLike = async () => {
        if (!currentUser) {
            Alert.alert('נדרש התחברות', 'אנא התחבר כדי לסמן לייק');
            return;
        }
        try {
            await firebaseService.toggleLike(activity.id, currentUser.id);
        } catch (error) {
            console.error('Error toggling like:', error);
            Alert.alert('שגיאה', 'לא הצלחנו לעדכן את הלייק. נסה שוב מאוחר יותר');
        }
    };

    const handleAddComment = async () => {
        if (!currentUser) {
            Alert.alert('נדרש התחברות', 'אנא התחבר כדי להוסיף תגובה');
            return;
        }
        if (!newComment.trim()) {
            Alert.alert('תגובה ריקה', 'אנא הזן תגובה');
            return;
        }
        
        setIsSubmittingComment(true);
        try {
            await firebaseService.addComment(
                activity.id,
                currentUser.id,
                currentUser.name,
                currentUser.avatar,
                newComment
            );
            setNewComment('');
            Alert.alert('הצלחה!', 'התגובה נוספה בהצלחה');

            // Send notifications to other commenters and activity organizer
            try {
                // Get all commenters for this activity
                const commenters = await firebaseService.getActivityCommenters(activity.id);
                
                // Get activity organizer
                const organizerId = activity.organizerId;
                
                // Combine commenters and organizer, exclude current user
                const userIdsToNotify = [
                    ...commenters.filter(id => id !== currentUser.id),
                    organizerId
                ].filter((id, index, self) => id && self.indexOf(id) === index); // Remove duplicates

                if (userIdsToNotify.length > 0) {
                    // Get push tokens for these users
                    const userTokens = await firebaseService.getUserPushTokens(userIdsToNotify);
                    
                    // Send push notifications
                    const pushTokens = userTokens
                        .filter(ut => ut.pushToken)
                        .map(ut => ut.pushToken as string);

                    if (pushTokens.length > 0) {
                        await pushNotificationService.sendPushNotifications(
                            pushTokens,
                            `תגובה חדשה ב${activity.title}`,
                            `${currentUser.name}: ${newComment.substring(0, 50)}${newComment.length > 50 ? '...' : ''}`,
                            { activityId: activity.id, type: 'comment_added' }
                        );
                    }

                    // Create notifications in Firestore for all users
                    const notificationPromises = userIdsToNotify.map(userId =>
                        firebaseService.createNotification(userId, {
                            type: 'comment_added',
                            title: `תגובה חדשה ב${activity.title}`,
                            body: `${currentUser.name}: ${newComment.substring(0, 100)}${newComment.length > 100 ? '...' : ''}`,
                            activityId: activity.id,
                            data: { commenterId: currentUser.id, commenterName: currentUser.name }
                        })
                    );
                    await Promise.all(notificationPromises);
                }
            } catch (notificationError) {
                console.error('Error sending notifications for comment:', notificationError);
                // Don't fail the comment creation if notifications fail
            }
        } catch (error: any) {
            console.error('Error adding comment:', error);
            let errorMessage = 'לא הצלחנו להוסיף את התגובה. נסה שוב מאוחר יותר';
            if (error?.message) {
                errorMessage = error.message;
            } else if (error?.code === 'permission-denied') {
                errorMessage = 'אין לך הרשאה להוסיף תגובה. אנא פנה למנהל המערכת.';
            }
            Alert.alert('שגיאה', errorMessage);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: string, commentUserId: string) => {
        if (!currentUser) return;
        
        const canDelete = currentUser.role === 'admin' || currentUser.id === commentUserId;
        if (!canDelete) {
            Alert.alert('אין הרשאה', 'רק מנהל או בעל התגובה יכולים למחוק אותה');
            return;
        }

        Alert.alert('מחיקת תגובה', 'האם אתה בטוח שברצונך למחוק את התגובה?', [
            { text: 'ביטול', style: 'cancel' },
            {
                text: 'מחק',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await firebaseService.deleteComment(commentId);
                    } catch (error) {
                        console.error('Error deleting comment:', error);
                        Alert.alert('שגיאה', 'לא הצלחנו למחוק את התגובה');
                    }
                }
            }
        ]);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: 'פרטי פעילות',
                    headerShown: true,
                    headerBackTitle: '',
                    headerRight: () => <Share2 size={24} color={colors.primary} />
                }}
            />

            <View style={[styles.imageHeader, { backgroundColor: colors.primary + '20' }]}>
                {activity.imageUrl ? (
                    <Image source={{ uri: activity.imageUrl }} style={styles.headerImage} resizeMode="cover" />
                ) : (
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=2076&auto=format&fit=crop' }}
                        style={[styles.headerImage, { opacity: 0.3 }]}
                    />
                )}
                {(currentUser?.role === 'organizer' || currentUser?.role === 'admin') && (
                    <TouchableOpacity
                        style={[styles.changeImageButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                        onPress={handleChangeActivityImage}
                        disabled={isUpdatingImage}
                    >
                        {isUpdatingImage ? <ActivityIndicator color="#fff" size="small" /> : <ImagePlus size={20} color="#fff" />}
                        <Text style={styles.changeImageButtonText}>החלף תמונה</Text>
                    </TouchableOpacity>
                )}
                <View style={styles.headerContent}>
                    <Text style={[styles.title, { color: colors.text }]}>{activity.title}</Text>
                    <View style={styles.badgeRow}>
                        {activity.department && (
                            <View style={[styles.deptBadge, { backgroundColor: colors.accent + '20' }]}>
                                <Text style={[styles.deptBadgeText, { color: colors.accent }]}>{activity.department}</Text>
                            </View>
                        )}
                        {activity.intensity && (
                            <View style={[styles.intensityBadge, {
                                backgroundColor: (activity.intensity === 'high' ? colors.error : activity.intensity === 'medium' ? colors.secondary : colors.success) + '20'
                            }]}>
                                <Text style={[styles.intensityBadgeText, {
                                    color: activity.intensity === 'high' ? colors.error : activity.intensity === 'medium' ? colors.secondary : colors.success
                                }]}>
                                    {activity.intensity === 'high' ? 'אינטנסיביות גבוהה' : activity.intensity === 'medium' ? 'אינטנסיביות בינונית' : 'אינטנסיביות נמוכה'}
                                </Text>
                            </View>
                        )}
                        {(currentUser?.role === 'organizer' || currentUser?.role === 'admin') && (
                            <TouchableOpacity
                                style={[styles.reinforceBadge, { backgroundColor: colors.error }]}
                                onPress={() => Alert.alert('גיוס תגבורת', 'הודעת Push נשלחה לכל הליצנים הזמינים באזור!')}
                            >
                                <AlertTriangle size={14} color="#fff" />
                                <Text style={styles.typeBadgeText}>גיוס תגבורת</Text>
                            </TouchableOpacity>
                        )}
                        <View style={[styles.typeBadge, { backgroundColor: colors.playful }]}>
                            <Text style={styles.typeBadgeText}>{activity.type === 'one-time' ? 'חד פעמי' : 'פעילות חוזרת'}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.infoSection}>
                <View style={styles.card}>
                    <View style={styles.infoRow}>
                        <Building size={20} color={colors.primary} />
                        <Text style={[styles.infoText, { color: colors.text }]}>{activity.institution}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <MapPin size={20} color={colors.primary} />
                        <Text style={[styles.infoText, { color: colors.text }]}>{activity.location}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <CalendarIcon size={20} color={colors.primary} />
                        <Text style={[styles.infoText, { color: colors.text }]}>{dateStr}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Clock size={20} color={colors.primary} />
                        <Text style={[styles.infoText, { color: colors.text }]}>{timeStr}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>תיאור הפעילות</Text>
                    <Text style={[styles.description, { color: colors.text }]}>{activity.description}</Text>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>ליצנים רשומים ({activity.participants.length}/{activity.requiredClowns})</Text>
                    </View>

                    <View style={styles.participantList}>
                        {participantsData.length === 0 ? (
                            <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>עדיין אין ליצנים רשומים. היה הראשון!</Text>
                        ) : (
                            participantsData.map(user => (
                                <TouchableOpacity
                                    key={user.id}
                                    style={styles.participantItem}
                                    onPress={() => setSelectedParticipant(user)}
                                >
                                    <View style={[styles.avatarGlow, { borderColor: colors.primary + '30' }]}>
                                        <Image source={{ uri: user.avatar }} style={styles.participantAvatar} />
                                    </View>
                                    <View style={[styles.nameBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <Text style={[styles.participantName, { color: colors.text }]}>{user.name}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </View>

                {/* Likes Section */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={[styles.likeSection, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={handleToggleLike}
                        disabled={!currentUser}
                    >
                        <Heart
                            size={24}
                            color={isLiked ? colors.error : colors.tabIconDefault}
                            fill={isLiked ? colors.error : 'none'}
                        />
                        <Text style={[styles.likeText, { color: colors.text }]}>
                            {likesCount > 0 ? `${likesCount} לייק${likesCount > 1 ? 'ים' : ''}` : 'הוסף לייק'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Comments Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MessageCircle size={20} color={colors.primary} />
                        <Text style={[styles.sectionTitle, { color: colors.text, marginRight: 10 }]}>
                            תגובות ({comments.length})
                        </Text>
                    </View>

                    {/* Comments List */}
                    {comments.length === 0 ? (
                        <View style={[styles.emptyCommentsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>אין תגובות עדיין. היה הראשון להגיב!</Text>
                        </View>
                    ) : (
                        <View style={styles.commentsList}>
                            {comments.map(comment => {
                                const commentDate = new Date(comment.createdAt);
                                const canDelete = currentUser && (currentUser.role === 'admin' || currentUser.id === comment.userId);
                                
                                return (
                                    <View key={comment.id} style={[styles.commentItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <View style={styles.commentHeader}>
                                            <Image source={{ uri: comment.userAvatar }} style={styles.commentAvatar} />
                                            <View style={styles.commentInfo}>
                                                <Text style={[styles.commentAuthor, { color: colors.text }]}>{comment.userName}</Text>
                                                <Text style={[styles.commentDate, { color: colors.tabIconDefault }]}>
                                                    {format(commentDate, 'd בMMMM, HH:mm', { locale: he })}
                                                </Text>
                                            </View>
                                            {canDelete && (
                                                <TouchableOpacity
                                                    onPress={() => handleDeleteComment(comment.id, comment.userId)}
                                                    style={styles.deleteCommentButton}
                                                >
                                                    <Text style={[styles.deleteCommentText, { color: colors.error }]}>מחק</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                        <Text style={[styles.commentText, { color: colors.text }]}>{comment.text}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* Add Comment Input */}
                    {currentUser && (
                        <View style={[styles.addCommentContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Image source={{ uri: currentUser.avatar }} style={styles.commentInputAvatar} />
                            <TextInput
                                style={[styles.commentInput, { color: colors.text, backgroundColor: colors.background }]}
                                placeholder="הוסף תגובה..."
                                placeholderTextColor={colors.tabIconDefault}
                                value={newComment}
                                onChangeText={setNewComment}
                                multiline
                                textAlign="right"
                                editable={!isSubmittingComment}
                            />
                            <TouchableOpacity
                                onPress={handleAddComment}
                                disabled={isSubmittingComment || !newComment.trim()}
                                style={[
                                    styles.sendButton,
                                    { backgroundColor: colors.primary },
                                    (isSubmittingComment || !newComment.trim()) && { opacity: 0.5 }
                                ]}
                            >
                                <Send size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Participant Details Modal */}
                <Modal
                    visible={!!selectedParticipant}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setSelectedParticipant(null)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                            {selectedParticipant && (
                                <>
                                    <Image source={{ uri: selectedParticipant.avatar }} style={styles.modalAvatar} />
                                    <Text style={[styles.modalName, { color: colors.text }]}>{selectedParticipant.name}</Text>
                                    <Text style={[styles.modalRole, { color: colors.tabIconDefault }]}>
                                        {selectedParticipant.role === 'clown' ? 'ליצן רפואי' : 'מארגן פעילות'}
                                    </Text>

                                    <View style={styles.modalActions}>
                                        <TouchableOpacity
                                            style={[styles.modalButton, { backgroundColor: '#25D366' }]}
                                            onPress={() => handleWhatsApp(selectedParticipant.phone)}
                                        >
                                            <WhatsAppIcon size={20} color="#fff" />
                                            <Text style={styles.modalButtonText}>וואטסאפ</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.modalButton, { backgroundColor: colors.primary }]}
                                            onPress={() => handleCall(selectedParticipant.phone)}
                                        >
                                            <PhoneIcon size={20} color="#fff" />
                                            <Text style={styles.modalButtonText}>שיחה</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.closeButton, { borderColor: colors.border }]}
                                        onPress={() => setSelectedParticipant(null)}
                                    >
                                        <Text style={[styles.closeButtonText, { color: colors.text }]}>סגור</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                </Modal>
            </View>

            <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TouchableOpacity
                    style={[
                        styles.joinButton,
                        { backgroundColor: isJoined ? colors.error : colors.primary },
                        !isJoined && isFull && { backgroundColor: colors.tabIconDefault }
                    ]}
                    onPress={handleJoin}
                    disabled={!isJoined && isFull}
                >
                    <Text style={styles.joinButtonText}>
                        {isJoined ? 'ביטול הגעה' : (isFull ? 'הפעילות מלאה' : 'הצטרף לפעילות')}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    imageHeader: {
        height: 200,
        justifyContent: 'flex-end',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
    },
    headerImage: {
        ...StyleSheet.absoluteFillObject,
    },
    changeImageButton: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    changeImageButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    headerContent: {
        zIndex: 1,
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'right',
        marginBottom: 10,
    },
    badgeRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
    },
    reinforceBadge: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginLeft: 10,
    },
    typeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    typeBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    deptBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginLeft: 10,
    },
    deptBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    intensityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginLeft: 10,
    },
    intensityBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    infoSection: {
        padding: 20,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: 'transparent',
        borderRadius: 20,
        padding: 10,
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        marginBottom: 15,
    },
    infoText: {
        fontSize: 16,
        marginRight: 10,
        fontWeight: '500',
    },
    section: {
        marginTop: 10,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'right',
        marginBottom: 10,
    },
    sectionHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'right',
    },
    participantList: {
        flexDirection: 'row-reverse',
        flexWrap: 'wrap',
        marginTop: 10,
    },
    participantItem: {
        alignItems: 'center',
        marginLeft: 15,
        marginBottom: 15,
    },
    participantAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 5,
        borderWidth: 2,
        borderColor: '#fff',
    },
    participantName: {
        fontSize: 12,
        fontWeight: '600',
    },
    emptyText: {
        textAlign: 'right',
        width: '100%',
        fontStyle: 'italic',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 90,
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopWidth: 1,
        flexDirection: 'row-reverse',
        justifyContent: 'center',
        alignItems: 'center',
    },
    joinButton: {
        width: '100%',
        height: 55,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    joinButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    avatarGlow: {
        padding: 3,
        borderRadius: 35,
        borderWidth: 2,
        marginBottom: 5,
    },
    nameBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        borderWidth: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '85%',
        borderRadius: 30,
        padding: 24,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    modalAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
        borderWidth: 4,
        borderColor: '#EF4444',
    },
    modalName: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    modalRole: {
        fontSize: 16,
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: 'row-reverse',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 20,
    },
    modalButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 15,
        marginHorizontal: 8,
        minWidth: 110,
        justifyContent: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginRight: 8,
    },
    closeButton: {
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 15,
        borderWidth: 1,
        marginTop: 10,
    },
    closeButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    likeSection: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        padding: 16,
        borderRadius: 15,
        borderWidth: 1,
        marginTop: 10,
    },
    likeText: {
        fontSize: 16,
        fontWeight: '600',
        marginRight: 10,
    },
    commentsList: {
        marginTop: 10,
    },
    commentItem: {
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        marginBottom: 12,
    },
    commentHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        marginBottom: 8,
    },
    commentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginLeft: 10,
    },
    commentInfo: {
        flex: 1,
    },
    commentAuthor: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    commentDate: {
        fontSize: 12,
    },
    commentText: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'right',
    },
    deleteCommentButton: {
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    deleteCommentText: {
        fontSize: 12,
        fontWeight: '600',
    },
    emptyCommentsContainer: {
        padding: 20,
        borderRadius: 15,
        borderWidth: 1,
        borderStyle: 'dashed',
        alignItems: 'center',
        marginTop: 10,
    },
    addCommentContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'flex-end',
        padding: 12,
        borderRadius: 15,
        borderWidth: 1,
        marginTop: 15,
    },
    commentInputAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginLeft: 10,
    },
    commentInput: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        fontSize: 15,
        marginRight: 10,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
