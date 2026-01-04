import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { createShadow, androidTextFix, preventFontScaling, androidButtonFix } from '@/constants/AndroidStyles';
import { useApp } from '@/context/AppContext';
import { firebaseService } from '@/services/firebaseService';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebaseConfig';
import { ArrowRight, FileUp, Lock, MapPin, Phone, User, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const router = useRouter();

    const [form, setForm] = useState({
        name: '',
        phone: '',
        password: '',
        location: '',
    });
    const [certificationFile, setCertificationFile] = useState<{ uri: string; name: string; type: 'image' | 'pdf' } | null>(null);
    const [uploadingCert, setUploadingCert] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handlePickDocument = async () => {
        Alert.alert(
            'בחר סוג קובץ',
            'איך תרצה להעלות את התעודה?',
            [
                { text: 'ביטול', style: 'cancel' },
                {
                    text: 'תמונה',
                    onPress: async () => {
                        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (status !== 'granted') {
                            Alert.alert('שגיאה', 'מצטערים, אנחנו צריכים גישה לגלריה כדי להעלות תמונה');
                            return;
                        }

                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ['images'],
                            allowsEditing: true,
                            quality: 0.8,
                        });

                        if (!result.canceled && result.assets && result.assets.length > 0) {
                            setCertificationFile({
                                uri: result.assets[0].uri,
                                name: result.assets[0].fileName || 'certification.jpg',
                                type: 'image'
                            });
                        }
                    }
                },
                {
                    text: 'PDF',
                    onPress: async () => {
                        try {
                            const result = await DocumentPicker.getDocumentAsync({
                                type: 'application/pdf',
                                copyToCacheDirectory: true,
                            });

                            if (!result.canceled && result.assets && result.assets.length > 0) {
                                setCertificationFile({
                                    uri: result.assets[0].uri,
                                    name: result.assets[0].name,
                                    type: 'pdf'
                                });
                            }
                        } catch (error) {
                            console.error('Document picker error:', error);
                            Alert.alert('שגיאה', 'חלה שגיאה בבחירת הקובץ');
                        }
                    }
                }
            ]
        );
    };

    const uploadCertification = async (): Promise<string | null> => {
        if (!certificationFile) return null;

        try {
            setUploadingCert(true);
            const response = await fetch(certificationFile.uri);
            if (!response.ok) {
                throw new Error('Failed to fetch file');
            }
            const blob = await response.blob();
            const fileExtension = certificationFile.type === 'pdf' ? 'pdf' : certificationFile.uri.split('.').pop() || 'jpg';
            const fileName = `certifications/${Date.now()}_${certificationFile.name}`;
            const storageRef = ref(storage, fileName);
            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);
            return downloadURL;
        } catch (error: any) {
            console.error('Upload error:', error);
            const errorMessage = error?.message || 'חלה שגיאה בהעלאת הקובץ';
            Alert.alert('שגיאה', errorMessage);
            return null;
        } finally {
            setUploadingCert(false);
        }
    };

    const handleRegister = async () => {
        if (!form.name || !form.phone || !form.password) {
            Alert.alert('פרטים חסרים', 'אנא מלא את כל שדות החובה');
            return;
        }

        if (uploadingCert) {
            return; // Prevent double submission
        }

        // Prevent multiple submissions
        if (isSubmitted) {
            return;
        }

        try {
            console.log('Starting registration process...');
            let certificationUrl: string | null = null;
            
            if (certificationFile) {
                console.log('Uploading certification file...');
                certificationUrl = await uploadCertification();
                if (!certificationUrl) {
                    // User already got an alert from uploadCertification
                    return;
                }
                console.log('Certification uploaded successfully');
            }

            // Generate email from phone number (or use a pattern)
            // Format: phone@happyhart.app (e.g., 0501234567@happyhart.app)
            const phoneDigits = form.phone.replace(/\D/g, '');
            if (!phoneDigits || phoneDigits.length < 9) {
                Alert.alert('מספר טלפון לא תקין', 'אנא הזן מספר טלפון תקין');
                return;
            }
            
            const email = `${phoneDigits}@happyhart.app`;
            console.log('Generated email:', email);

            const userData = {
                name: form.name,
                phone: form.phone,
                password: form.password,
                email: email,
                preferredArea: form.location || '',
                role: 'clown' as const,
                avatar: 'https://i.pravatar.cc/150?u=' + encodeURIComponent(form.name),
                approvalStatus: 'pending' as const,
                ...(certificationUrl && { certificationUrl })
            };

            console.log('Creating user in Firebase Auth...');
            // Create user in Firebase Auth and Firestore
            await firebaseService.registerWithEmailAndPassword(email, form.password, userData);
            console.log('User created successfully!');
            setIsSubmitted(true);
        } catch (error: any) {
            console.error('Registration failed with error:', error);
            console.error('Error details:', {
                code: error?.code,
                message: error?.message,
                stack: error?.stack
            });
            
            let errorMessage = 'ההרשמה נכשלה. נסה שוב מאוחר יותר.';
            
            // Check if error has a message (from our custom error handling)
            if (error?.message && typeof error.message === 'string') {
                errorMessage = error.message;
            } else if (error?.code === 'auth/email-already-in-use') {
                errorMessage = 'כתובת האימייל כבר בשימוש. אם אתה כבר רשום, נסה להתחבר במקום';
            } else if (error?.code === 'auth/invalid-email') {
                errorMessage = 'כתובת אימייל לא תקינה';
            } else if (error?.code === 'auth/weak-password') {
                errorMessage = 'הסיסמה חלשה מדי. אנא בחר סיסמה חזקה יותר (לפחות 6 תווים)';
            } else if (error?.code === 'auth/operation-not-allowed') {
                errorMessage = 'פעולת ההרשמה לא מאופשרת. אנא פנה למנהל המערכת';
            } else if (error?.code === 'auth/network-request-failed') {
                errorMessage = 'בעיית רשת. אנא בדוק את החיבור לאינטרנט ונסה שוב';
            } else if (error?.code === 'auth/too-many-requests') {
                errorMessage = 'יותר מדי ניסיונות. אנא נסה שוב מאוחר יותר';
            }
            
            Alert.alert('שגיאה בהרשמה', errorMessage);
        }
    };

    if (isSubmitted) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 30 }]}>
                <View style={[styles.successCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.successTitle, { color: colors.text }]}>בקשתך התקבלה!</Text>
                    <Text style={[styles.successText, { color: colors.tabIconDefault }]}>
                        בקשת ההצטרפות שלך הועברה למנהלים לאישור. תקבל הודעה ברגע שהחשבון שלך יאושר.
                    </Text>
                    <TouchableOpacity
                        style={[styles.loginButton, { backgroundColor: colors.primary, width: '100%', marginTop: 30 }]}
                        onPress={() => router.replace('/(auth)/login')}
                    >
                        <Text style={styles.loginButtonText}>חזור להתחברות</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ArrowRight size={24} color={colors.text} />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>הצטרפות לנבחרת</Text>
                        <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>מלא את הפרטים כדי להתחיל</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <User size={20} color={colors.tabIconDefault} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="שם מלא"
                                placeholderTextColor={colors.tabIconDefault}
                                value={form.name}
                                onChangeText={(text) => setForm({ ...form, name: text })}
                                textAlign="right"
                            />
                        </View>

                        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Phone size={20} color={colors.tabIconDefault} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="מספר טלפון"
                                placeholderTextColor={colors.tabIconDefault}
                                value={form.phone}
                                onChangeText={(text) => setForm({ ...form, phone: text })}
                                keyboardType="phone-pad"
                                textAlign="right"
                            />
                        </View>

                        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Lock size={20} color={colors.tabIconDefault} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="סיסמה"
                                placeholderTextColor={colors.tabIconDefault}
                                value={form.password}
                                onChangeText={(text) => setForm({ ...form, password: text })}
                                secureTextEntry
                                textAlign="right"
                            />
                        </View>

                        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <MapPin size={20} color={colors.tabIconDefault} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="מקום מגורים"
                                placeholderTextColor={colors.tabIconDefault}
                                value={form.location}
                                onChangeText={(text) => setForm({ ...form, location: text })}
                                textAlign="right"
                            />
                        </View>

                        <View>
                            <TouchableOpacity
                                style={[styles.uploadButton, { backgroundColor: colors.card, borderColor: colors.primary, borderStyle: 'dashed' }]}
                                onPress={handlePickDocument}
                                disabled={uploadingCert}
                            >
                                <FileUp size={24} color={colors.primary} />
                                <Text style={[styles.uploadButtonText, { color: colors.primary }]}>
                                    {certificationFile ? certificationFile.name : 'צרף תעודת ליצן (תמונה או PDF)'}
                                </Text>
                            </TouchableOpacity>
                            {certificationFile && (
                                <View style={[styles.filePreview, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    {certificationFile.type === 'image' ? (
                                        <Image source={{ uri: certificationFile.uri }} style={styles.previewImage} />
                                    ) : (
                                        <FileUp size={20} color={colors.primary} />
                                    )}
                                    <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                                        {certificationFile.name}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => setCertificationFile(null)}
                                        style={[styles.removeButton, { backgroundColor: colors.error + '15' }]}
                                    >
                                        <X size={16} color={colors.error} />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.loginButton, { backgroundColor: colors.primary, opacity: uploadingCert ? 0.6 : 1 }]}
                            onPress={handleRegister}
                            disabled={uploadingCert}
                        >
                            <Text style={styles.loginButtonText}>
                                {uploadingCert ? 'מעלה תעודה...' : 'שלח בקשת הצטרפות'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 30,
        paddingTop: 20,
        paddingBottom: Platform.OS === 'android' ? 100 : 40,
    },
    backButton: {
        alignSelf: 'flex-end',
        marginBottom: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        fontFamily: 'Inter',
        ...androidTextFix,
        ...preventFontScaling,
    },
    subtitle: {
        fontSize: 16,
        marginTop: 5,
        ...androidTextFix,
        ...preventFontScaling,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        height: 55,
        borderRadius: 15,
        borderWidth: 1,
        paddingHorizontal: 15,
        marginBottom: 15,
    },
    input: {
        flex: 1,
        marginRight: 10,
        fontSize: 16,
        ...androidTextFix,
        ...preventFontScaling,
    },
    uploadButton: {
        flexDirection: 'row-reverse',
        height: 70,
        borderRadius: 15,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
        marginTop: 10,
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 15,
        ...androidTextFix,
        ...preventFontScaling,
        flexShrink: 1,
    },
    loginButton: {
        height: 55,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        ...createShadow(5),
        ...androidButtonFix,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        ...androidTextFix,
        ...preventFontScaling,
    },
    successCard: {
        padding: 30,
        borderRadius: 25,
        borderWidth: 1,
        alignItems: 'center',
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 15,
        textAlign: 'center',
        ...androidTextFix,
        ...preventFontScaling,
    },
    successText: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        ...androidTextFix,
        ...preventFontScaling,
    },
    filePreview: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 10,
    },
    previewImage: {
        width: 40,
        height: 40,
        borderRadius: 8,
        marginLeft: 10,
    },
    fileName: {
        flex: 1,
        fontSize: 14,
        marginRight: 10,
        ...androidTextFix,
        ...preventFontScaling,
    },
    removeButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
