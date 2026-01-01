import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useApp } from '@/context/AppContext';
import { firebaseService } from '@/services/firebaseService';
import { Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { GraduationCap, Plus, X, Youtube } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface Tutorial {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    url: string;
    category: 'magic' | 'balloons' | 'tips';
    createdAt: string;
}

const CATEGORIES = [
    { id: 'magic', label: 'קסמים בסיסיים', icon: Youtube },
    { id: 'balloons', label: 'אמנות הבלונים', icon: Youtube },
    { id: 'tips', label: 'טיפים ומיומנויות', icon: GraduationCap },
];

export default function ClownHelpScreen() {
    const { currentUser } = useApp();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const isAdmin = currentUser?.role === 'admin';

    const [tutorials, setTutorials] = useState<Tutorial[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    // Form state
    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newCategory, setNewCategory] = useState<'magic' | 'balloons' | 'tips'>('magic');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const unsubscribe = firebaseService.subscribeToTutorials((data) => {
            setTutorials(data as Tutorial[]);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleOpenVideo = (url: string) => {
        WebBrowser.openBrowserAsync(url);
    };

    const extractYoutubeId = (url: string) => {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    const handleAddTutorial = async () => {
        if (!newTitle || !newUrl) {
            Alert.alert('שגיאה', 'יש להזין כותרת וקישור ליוטיוב');
            return;
        }

        const videoId = extractYoutubeId(newUrl);
        if (!videoId) {
            Alert.alert('שגיאה', 'קישור יוטיוב לא תקין');
            return;
        }

        setSubmitting(true);
        try {
            const thumbnail = `https://img.youtube.com/vi/${videoId}/0.jpg`;
            await firebaseService.createTutorial({
                title: newTitle,
                url: newUrl,
                description: newDescription,
                category: newCategory,
                thumbnail
            });

            setModalVisible(false);
            setNewTitle('');
            setNewUrl('');
            setNewDescription('');
            Alert.alert('הצלחה', 'המדריך נוסף בהצלחה');
        } catch (error) {
            console.error('Error adding tutorial:', error);
            Alert.alert('שגיאה', 'ארעה שגיאה בשמירת המדריך');
        } finally {
            setSubmitting(false);
        }
    };

    const renderCategory = (categoryId: string, title: string, icon: any) => {
        const Icon = icon;
        const categoryVideos = tutorials.filter(v => v.category === categoryId);

        if (categoryVideos.length === 0 && !loading) return null;

        return (
            <View style={styles.section} key={categoryId}>
                <View style={styles.sectionHeader}>
                    <Icon size={24} color={colors.primary} />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
                </View>
                {categoryVideos.map((video) => (
                    <TouchableOpacity
                        key={video.id}
                        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => handleOpenVideo(video.url)}
                    >
                        <Image source={{ uri: video.thumbnail }} style={styles.thumbnail} />
                        <View style={styles.cardContent}>
                            <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={1}>{video.title}</Text>
                            <Text style={[styles.videoDescription, { color: colors.tabIconDefault }]} numberOfLines={2}>{video.description}</Text>
                            <View style={styles.cardFooter}>
                                <Youtube size={16} color="#FF0000" />
                                <Text style={styles.playText}>צפה ביוטיוב</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: 'סיוע לליצן',
                    headerShown: true,
                    headerTitleAlign: 'center',
                    headerBackTitle: '',
                    headerRight: () => isAdmin ? (
                        <TouchableOpacity
                            onPress={() => setModalVisible(true)}
                            style={styles.headerButton}
                        >
                            <Plus size={24} color={colors.primary} />
                        </TouchableOpacity>
                    ) : null,
                }}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={[styles.headerSubtitle, { color: colors.tabIconDefault }]}>
                        כאן תמצאו כלים ועזרים שיעזרו לכם לשמח את הילדים בצורה הטובה ביותר
                    </Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
                ) : (
                    CATEGORIES.map(cat => renderCategory(cat.id, cat.label, cat.icon))
                )}

                {!loading && tutorials.length === 0 && (
                    <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>עדיין אין מדריכים זמינים.</Text>
                )}
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>הוספת מדריך חדש</Text>
                        </View>

                        <Text style={[styles.label, { color: colors.text }]}>כותרת המדריך</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            value={newTitle}
                            onChangeText={setNewTitle}
                            placeholder="לדוגמה: איך לעשות קסם עם מטבע"
                            placeholderTextColor={colors.tabIconDefault}
                            textAlign="right"
                        />

                        <Text style={[styles.label, { color: colors.text }]}>קישור ליוטיוב</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            value={newUrl}
                            onChangeText={setNewUrl}
                            placeholder="https://www.youtube.com/watch?v=..."
                            placeholderTextColor={colors.tabIconDefault}
                            textAlign="right"
                            autoCapitalize="none"
                        />

                        <Text style={[styles.label, { color: colors.text }]}>תיאור קצר</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border }]}
                            value={newDescription}
                            onChangeText={setNewDescription}
                            placeholder="תיאור קצר של המדריך..."
                            placeholderTextColor={colors.tabIconDefault}
                            textAlign="right"
                            multiline
                        />

                        <Text style={[styles.label, { color: colors.text }]}>קטגוריה</Text>
                        <View style={styles.categoryContainer}>
                            {CATEGORIES.map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.categoryChip,
                                        { borderColor: colors.border },
                                        newCategory === cat.id && { backgroundColor: colors.primary, borderColor: colors.primary }
                                    ]}
                                    onPress={() => setNewCategory(cat.id as any)}
                                >
                                    <Text style={[
                                        styles.categoryChipText,
                                        { color: colors.text },
                                        newCategory === cat.id && { color: '#FFF' }
                                    ]}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: colors.primary }]}
                            onPress={handleAddTutorial}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>הוסף מדריך</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerButton: {
        marginRight: 15,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 30,
        alignItems: 'center',
    },
    headerSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
        fontFamily: 'Inter',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
    },
    section: {
        marginBottom: 30,
    },
    sectionHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        marginBottom: 15,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'Inter',
    },
    card: {
        flexDirection: 'row-reverse',
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 15,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    thumbnail: {
        width: 120,
        height: 100,
    },
    cardContent: {
        flex: 1,
        padding: 12,
        alignItems: 'flex-end',
    },
    videoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'right',
    },
    videoDescription: {
        fontSize: 13,
        marginBottom: 8,
        textAlign: 'right',
        lineHeight: 18,
    },
    cardFooter: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6,
    },
    playText: {
        fontSize: 12,
        color: '#FF0000',
        fontWeight: '600',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 25,
        minHeight: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'right',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        fontSize: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    categoryContainer: {
        flexDirection: 'row-reverse',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 30,
    },
    categoryChip: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    submitButton: {
        borderRadius: 15,
        padding: 18,
        alignItems: 'center',
        marginBottom: 20,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
