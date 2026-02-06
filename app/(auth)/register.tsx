import { useColorScheme } from '@/components/useColorScheme';
import { storage } from '@/config/firebaseConfig';
import { androidButtonFix, androidTextFix, createShadow, preventFontScaling } from '@/constants/AndroidStyles';
import Colors from '@/constants/Colors';
import { firebaseService } from '@/services/firebaseService';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { AlertCircle, ArrowRight, CheckCircle, ChevronDown, FileUp, Heart, Info, Lock, MapPin, Phone, Sparkles, User, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showPasswordInfo, setShowPasswordInfo] = useState(false);
    const [showCertInfo, setShowCertInfo] = useState(false);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

    // Validation functions
    const validateName = (name: string): string | null => {
        if (!name.trim()) return 'שם מלא הוא שדה חובה';
        if (name.trim().length < 2) return 'השם חייב להכיל לפחות 2 תווים';
        return null;
    };

    const validatePhone = (phone: string): string | null => {
        if (!phone.trim()) return 'מספר טלפון הוא שדה חובה';
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length < 9 || phoneDigits.length > 10) {
            return 'מספר טלפון לא תקין (9-10 ספרות)';
        }
        return null;
    };

    const validatePassword = (password: string): string | null => {
        if (!password) return 'סיסמה היא שדה חובה';
        if (password.length < 6) return 'הסיסמה חייבת להכיל לפחות 6 תווים';
        if (password.length > 50) return 'הסיסמה ארוכה מדי (מקסימום 50 תווים)';
        return null;
    };

    const validateForm = (): boolean => {
        const errors: { [key: string]: string } = {};
        
        const nameError = validateName(form.name);
        if (nameError) errors.name = nameError;
        
        const phoneError = validatePhone(form.phone);
        if (phoneError) errors.phone = phoneError;
        
        const passwordError = validatePassword(form.password);
        if (passwordError) errors.password = passwordError;

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

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
                            Alert.alert(
                                'הרשאה נדרשת',
                                'אנחנו צריכים גישה לגלריה כדי להעלות תמונה. אנא אפשר גישה בהגדרות המכשיר.',
                                [{ text: 'הבנתי' }]
                            );
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
                            setFormErrors({ ...formErrors, certification: '' });
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
                                setFormErrors({ ...formErrors, certification: '' });
                            }
                        } catch (error) {
                            console.error('Document picker error:', error);
                            Alert.alert('שגיאה', 'חלה שגיאה בבחירת הקובץ. נסה שוב.');
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
            Alert.alert('שגיאה בהעלאה', errorMessage);
            return null;
        } finally {
            setUploadingCert(false);
        }
    };

    const handleRegister = async () => {
        // Validate form
        if (!validateForm()) {
            Alert.alert(
                'פרטים חסרים',
                'אנא מלא את כל השדות הנדרשים ותקן את השגיאות לפני המשך.',
                [{ text: 'הבנתי' }]
            );
            return;
        }

        if (uploadingCert || isSubmitting) {
            return;
        }

        // Show confirmation dialog
        Alert.alert(
            'אישור הרשמה',
            'האם אתה בטוח שברצונך להצטרף לנבחרת HappyHart?',
            [
                { text: 'ביטול', style: 'cancel' },
                {
                    text: 'כן, הצטרף',
                    onPress: async () => {
                        try {
                            setIsSubmitting(true);
                            
                            // Show progress alert
                            Alert.alert(
                                'מעבד את הבקשה...',
                                'אנא המתן בזמן שאנו יוצרים את החשבון שלך.',
                                [],
                                { cancelable: false }
                            );

                            let certificationUrl: string | null = null;
                            
                            if (certificationFile) {
                                certificationUrl = await uploadCertification();
                                if (!certificationUrl) {
                                    setIsSubmitting(false);
                                    return;
                                }
                            }

                            const phoneDigits = form.phone.replace(/\D/g, '');
                            const email = `${phoneDigits}@happyhart.app`;

                            const userData = {
                                name: form.name.trim(),
                                phone: form.phone,
                                password: form.password,
                                email: email,
                                preferredArea: form.location.trim() || '',
                                role: 'clown' as const,
                                avatar: 'https://i.pravatar.cc/150?u=' + encodeURIComponent(form.name),
                                approvalStatus: 'approved' as const,
                                ...(certificationUrl && { certificationUrl })
                            };

                            await firebaseService.registerWithEmailAndPassword(email, form.password, userData);
                            
                            // Automatically login after registration
                            await firebaseService.loginWithEmailAndPassword(email, form.password);

                            // Success message
                            Alert.alert(
                                'ברוכים הבאים! 🎉',
                                'ההרשמה הושלמה בהצלחה! אתה יכול כעת להתחיל להשתמש באפליקציה.',
                                [
                                    {
                                        text: 'התחל',
                                        onPress: () => router.replace('/(tabs)')
                                    }
                                ]
                            );
                        } catch (error: any) {
                            setIsSubmitting(false);
                            console.error('Registration failed:', error);
                            
                            let errorMessage = 'ההרשמה נכשלה. נסה שוב מאוחר יותר.';
                            
                            if (error?.message && typeof error.message === 'string') {
                                errorMessage = error.message;
                            } else if (error?.code === 'auth/email-already-in-use') {
                                errorMessage = 'כתובת האימייל כבר בשימוש. אם אתה כבר רשום, נסה להתחבר במקום.';
                            } else if (error?.code === 'auth/invalid-email') {
                                errorMessage = 'כתובת אימייל לא תקינה.';
                            } else if (error?.code === 'auth/weak-password') {
                                errorMessage = 'הסיסמה חלשה מדי. אנא בחר סיסמה חזקה יותר (לפחות 6 תווים).';
                            } else if (error?.code === 'auth/network-request-failed') {
                                errorMessage = 'בעיית רשת. אנא בדוק את החיבור לאינטרנט ונסה שוב.';
                            } else if (error?.code === 'auth/too-many-requests') {
                                errorMessage = 'יותר מדי ניסיונות. אנא נסה שוב מאוחר יותר.';
                            }
                            
                            Alert.alert('שגיאה בהרשמה', errorMessage);
                        }
                    }
                }
            ]
        );
    };

    const getFormProgress = (): number => {
        let completed = 0;
        if (form.name.trim()) completed++;
        if (form.phone.trim()) completed++;
        if (form.password) completed++;
        if (form.location.trim()) completed++;
        if (certificationFile) completed++;
        return (completed / 5) * 100;
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ArrowRight size={24} color={colors.text} />
                    </TouchableOpacity>

                    {/* Welcome Section */}
                    <View style={styles.welcomeSection}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                            <Heart size={32} color={colors.primary} fill={colors.primary} />
                        </View>
                        <Text style={[styles.title, { color: colors.text }]}>הצטרף לנבחרת HappyHart</Text>
                        <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
                            ביחד נביא שמחה וצחוק למקומות שצריכים את זה הכי הרבה
                        </Text>
                    </View>

                    {/* Info Banner */}
                    <TouchableOpacity
                        style={[styles.infoBanner, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}
                        onPress={() => setShowInfoModal(true)}
                    >
                        <Info size={20} color={colors.primary} />
                        <Text style={[styles.infoBannerText, { color: colors.primary }]}>
                            מה זה HappyHart?
                        </Text>
                        <ChevronDown size={16} color={colors.primary} />
                    </TouchableOpacity>

                    {/* Progress Indicator */}
                    <View style={styles.progressSection}>
                        <View style={styles.progressHeader}>
                            <Text style={[styles.progressLabel, { color: colors.text }]}>התקדמות ההרשמה</Text>
                            <Text style={[styles.progressPercent, { color: colors.primary }]}>
                                {Math.round(getFormProgress())}%
                            </Text>
                        </View>
                        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                            <View 
                                style={[
                                    styles.progressFill, 
                                    { 
                                        width: `${getFormProgress()}%`,
                                        backgroundColor: colors.primary 
                                    }
                                ]} 
                            />
                        </View>
                    </View>

                    {/* Form Section */}
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={[styles.label, { color: colors.text }]}>שם מלא *</Text>
                                {formErrors.name && (
                                    <View style={styles.errorIcon}>
                                        <AlertCircle size={14} color={colors.error} />
                                    </View>
                                )}
                            </View>
                            <View style={[
                                styles.inputContainer, 
                                { 
                                    backgroundColor: colors.card, 
                                    borderColor: formErrors.name ? colors.error : colors.border 
                                }
                            ]}>
                                <User size={20} color={formErrors.name ? colors.error : colors.tabIconDefault} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="הזן שם מלא"
                                    placeholderTextColor={colors.tabIconDefault}
                                    value={form.name}
                                    onChangeText={(text) => {
                                        setForm({ ...form, name: text });
                                        if (formErrors.name) {
                                            const error = validateName(text);
                                            setFormErrors({ ...formErrors, name: error || '' });
                                        }
                                    }}
                                    onBlur={() => {
                                        const error = validateName(form.name);
                                        setFormErrors({ ...formErrors, name: error || '' });
                                    }}
                                    textAlign="right"
                                />
                            </View>
                            {formErrors.name && (
                                <Text style={[styles.errorText, { color: colors.error }]}>{formErrors.name}</Text>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={[styles.label, { color: colors.text }]}>מספר טלפון *</Text>
                                {formErrors.phone && (
                                    <View style={styles.errorIcon}>
                                        <AlertCircle size={14} color={colors.error} />
                                    </View>
                                )}
                            </View>
                            <View style={[
                                styles.inputContainer, 
                                { 
                                    backgroundColor: colors.card, 
                                    borderColor: formErrors.phone ? colors.error : colors.border 
                                }
                            ]}>
                                <Phone size={20} color={formErrors.phone ? colors.error : colors.tabIconDefault} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="050-1234567"
                                    placeholderTextColor={colors.tabIconDefault}
                                    value={form.phone}
                                    onChangeText={(text) => {
                                        setForm({ ...form, phone: text });
                                        if (formErrors.phone) {
                                            const error = validatePhone(text);
                                            setFormErrors({ ...formErrors, phone: error || '' });
                                        }
                                    }}
                                    onBlur={() => {
                                        const error = validatePhone(form.phone);
                                        setFormErrors({ ...formErrors, phone: error || '' });
                                    }}
                                    keyboardType="phone-pad"
                                    textAlign="right"
                                />
                            </View>
                            {formErrors.phone && (
                                <Text style={[styles.errorText, { color: colors.error }]}>{formErrors.phone}</Text>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={[styles.label, { color: colors.text }]}>סיסמה *</Text>
                                <TouchableOpacity onPress={() => setShowPasswordInfo(true)}>
                                    <Info size={16} color={colors.tabIconDefault} />
                                </TouchableOpacity>
                                {formErrors.password && (
                                    <View style={styles.errorIcon}>
                                        <AlertCircle size={14} color={colors.error} />
                                    </View>
                                )}
                            </View>
                            <View style={[
                                styles.inputContainer, 
                                { 
                                    backgroundColor: colors.card, 
                                    borderColor: formErrors.password ? colors.error : colors.border 
                                }
                            ]}>
                                <Lock size={20} color={formErrors.password ? colors.error : colors.tabIconDefault} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="לפחות 6 תווים"
                                    placeholderTextColor={colors.tabIconDefault}
                                    value={form.password}
                                    onChangeText={(text) => {
                                        setForm({ ...form, password: text });
                                        if (formErrors.password) {
                                            const error = validatePassword(text);
                                            setFormErrors({ ...formErrors, password: error || '' });
                                        }
                                    }}
                                    onBlur={() => {
                                        const error = validatePassword(form.password);
                                        setFormErrors({ ...formErrors, password: error || '' });
                                    }}
                                    secureTextEntry
                                    textAlign="right"
                                />
                            </View>
                            {formErrors.password && (
                                <Text style={[styles.errorText, { color: colors.error }]}>{formErrors.password}</Text>
                            )}
                            {form.password && !formErrors.password && (
                                <View style={styles.successIndicator}>
                                    <CheckCircle size={14} color={colors.success} />
                                    <Text style={[styles.successText, { color: colors.success }]}>סיסמה תקינה</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={[styles.label, { color: colors.text }]}>מקום מגורים</Text>
                                <Text style={[styles.optionalLabel, { color: colors.tabIconDefault }]}>אופציונלי</Text>
                            </View>
                            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <MapPin size={20} color={colors.tabIconDefault} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="למשל: תל אביב, ירושלים"
                                    placeholderTextColor={colors.tabIconDefault}
                                    value={form.location}
                                    onChangeText={(text) => setForm({ ...form, location: text })}
                                    textAlign="right"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={[styles.label, { color: colors.text }]}>תעודת ליצן רפואי</Text>
                                <TouchableOpacity onPress={() => setShowCertInfo(true)}>
                                    <Info size={16} color={colors.tabIconDefault} />
                                </TouchableOpacity>
                                <Text style={[styles.optionalLabel, { color: colors.tabIconDefault }]}>אופציונלי</Text>
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.uploadButton, 
                                    { 
                                        backgroundColor: certificationFile ? colors.success + '10' : colors.card, 
                                        borderColor: certificationFile ? colors.success : colors.primary, 
                                        borderStyle: 'dashed' 
                                    }
                                ]}
                                onPress={handlePickDocument}
                                disabled={uploadingCert || isSubmitting}
                            >
                                {uploadingCert ? (
                                    <>
                                        <ActivityIndicator size="small" color={colors.primary} />
                                        <Text style={[styles.uploadButtonText, { color: colors.primary }]}>
                                            מעלה תעודה...
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <FileUp size={24} color={certificationFile ? colors.success : colors.primary} />
                                        <Text style={[styles.uploadButtonText, { color: certificationFile ? colors.success : colors.primary }]}>
                                            {certificationFile ? 'תעודה נבחרה' : 'צרף תעודת ליצן (תמונה או PDF)'}
                                        </Text>
                                    </>
                                )}
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
                            style={[
                                styles.submitButton, 
                                { 
                                    backgroundColor: colors.primary,
                                    opacity: (uploadingCert || isSubmitting) ? 0.6 : 1
                                }
                            ]}
                            onPress={handleRegister}
                            disabled={uploadingCert || isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <ActivityIndicator size="small" color="#fff" />
                                    <Text style={styles.submitButtonText}>מעבד את הבקשה...</Text>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={20} color="#fff" />
                                    <Text style={styles.submitButtonText}>הצטרף לנבחרת</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <Text style={[styles.termsText, { color: colors.tabIconDefault }]}>
                            על ידי ההרשמה, אתה מסכים לתנאי השימוש ומדיניות הפרטיות שלנו
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Info Modal */}
            <Modal
                visible={showInfoModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowInfoModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <View style={[styles.modalIconContainer, { backgroundColor: colors.primary + '15' }]}>
                                <Heart size={24} color={colors.primary} fill={colors.primary} />
                            </View>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>מה זה HappyHart?</Text>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <Text style={[styles.modalText, { color: colors.text }]}>
                                <Text style={styles.boldText}>HappyHart</Text> היא פלטפורמה דיגיטלית שמחברת בין ליצנים רפואיים לבין מוסדות רפואיים וקהילתיים שזקוקים לפעילויות שמחה וצחוק.
                            </Text>
                            <Text style={[styles.modalText, { color: colors.text, marginTop: 15 }]}>
                                <Text style={styles.boldText}>איך זה עובד?</Text>
                            </Text>
                            <View style={styles.bulletList}>
                                <View style={styles.bulletItem}>
                                    <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
                                    <Text style={[styles.bulletText, { color: colors.text }]}>
                                        רכזים יוצרים פעילויות במוסדות שונים
                                    </Text>
                                </View>
                                <View style={styles.bulletItem}>
                                    <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
                                    <Text style={[styles.bulletText, { color: colors.text }]}>
                                        ליצנים רואים פעילויות באזור שלהם ומצטרפים
                                    </Text>
                                </View>
                                <View style={styles.bulletItem}>
                                    <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
                                    <Text style={[styles.bulletText, { color: colors.text }]}>
                                        כולם נהנים מפעילות שמחה ומשמעותית יחד
                                    </Text>
                                </View>
                            </View>
                            <Text style={[styles.modalText, { color: colors.text, marginTop: 15 }]}>
                                <Text style={styles.boldText}>למה להצטרף?</Text>
                            </Text>
                            <View style={styles.bulletList}>
                                <View style={styles.bulletItem}>
                                    <Text style={[styles.bullet, { color: colors.success }]}>✓</Text>
                                    <Text style={[styles.bulletText, { color: colors.text }]}>
                                        להיות חלק מקהילה משמעותית
                                    </Text>
                                </View>
                                <View style={styles.bulletItem}>
                                    <Text style={[styles.bullet, { color: colors.success }]}>✓</Text>
                                    <Text style={[styles.bulletText, { color: colors.text }]}>
                                        להביא שמחה למקומות שצריכים את זה
                                    </Text>
                                </View>
                                <View style={styles.bulletItem}>
                                    <Text style={[styles.bullet, { color: colors.success }]}>✓</Text>
                                    <Text style={[styles.bulletText, { color: colors.text }]}>
                                        לנהל את הפעילויות שלך בקלות
                                    </Text>
                                </View>
                            </View>
                        </ScrollView>
                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: colors.primary }]}
                            onPress={() => setShowInfoModal(false)}
                        >
                            <Text style={styles.modalButtonText}>הבנתי, תודה!</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Password Info Modal */}
            <Modal
                visible={showPasswordInfo}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowPasswordInfo(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>דרישות סיסמה</Text>
                        <View style={styles.bulletList}>
                            <View style={styles.bulletItem}>
                                <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
                                <Text style={[styles.bulletText, { color: colors.text }]}>
                                    לפחות 6 תווים
                                </Text>
                            </View>
                            <View style={styles.bulletItem}>
                                <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
                                <Text style={[styles.bulletText, { color: colors.text }]}>
                                    מומלץ: שילוב של אותיות ומספרים
                                </Text>
                            </View>
                            <View style={styles.bulletItem}>
                                <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
                                <Text style={[styles.bulletText, { color: colors.text }]}>
                                    שמור את הסיסמה במקום בטוח
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: colors.primary }]}
                            onPress={() => setShowPasswordInfo(false)}
                        >
                            <Text style={styles.modalButtonText}>הבנתי</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Certification Info Modal */}
            <Modal
                visible={showCertInfo}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowCertInfo(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>אודות תעודת ליצן רפואי</Text>
                        <Text style={[styles.modalText, { color: colors.text }]}>
                            העלאת תעודת ליצן רפואי היא אופציונלית, אך מומלצת מאוד. התעודה עוזרת לנו לוודא שאתה ליצן מוסמך ומקצועי.
                        </Text>
                        <Text style={[styles.modalText, { color: colors.text, marginTop: 15 }]}>
                            <Text style={styles.boldText}>סוגי קבצים נתמכים:</Text>
                        </Text>
                        <View style={styles.bulletList}>
                            <View style={styles.bulletItem}>
                                <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
                                <Text style={[styles.bulletText, { color: colors.text }]}>
                                    תמונות (JPG, PNG)
                                </Text>
                            </View>
                            <View style={styles.bulletItem}>
                                <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
                                <Text style={[styles.bulletText, { color: colors.text }]}>
                                    קבצי PDF
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: colors.primary }]}
                            onPress={() => setShowCertInfo(false)}
                        >
                            <Text style={styles.modalButtonText}>הבנתי</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: Platform.OS === 'android' ? 100 : 40,
    },
    backButton: {
        alignSelf: 'flex-end',
        marginBottom: 20,
        padding: 8,
    },
    welcomeSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        fontFamily: 'Inter',
        textAlign: 'center',
        marginBottom: 10,
        ...androidTextFix,
        ...preventFontScaling,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
        ...androidTextFix,
        ...preventFontScaling,
    },
    infoBanner: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 24,
        gap: 10,
    },
    infoBannerText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        ...androidTextFix,
        ...preventFontScaling,
    },
    progressSection: {
        marginBottom: 30,
    },
    progressHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 14,
        fontWeight: '600',
        ...androidTextFix,
        ...preventFontScaling,
    },
    progressPercent: {
        fontSize: 14,
        fontWeight: '700',
        ...androidTextFix,
        ...preventFontScaling,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 20,
    },
    labelRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    label: {
        fontSize: 15,
        fontWeight: '700',
        ...androidTextFix,
        ...preventFontScaling,
    },
    optionalLabel: {
        fontSize: 12,
        fontStyle: 'italic',
        ...androidTextFix,
        ...preventFontScaling,
    },
    errorIcon: {
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        height: 56,
        borderRadius: 16,
        borderWidth: 1.5,
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        marginRight: 12,
        fontSize: 16,
        ...androidTextFix,
        ...preventFontScaling,
    },
    errorText: {
        fontSize: 12,
        marginTop: 6,
        marginRight: 4,
        ...androidTextFix,
        ...preventFontScaling,
    },
    successIndicator: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        marginTop: 6,
        gap: 6,
    },
    successText: {
        fontSize: 12,
        fontWeight: '600',
        ...androidTextFix,
        ...preventFontScaling,
    },
    uploadButton: {
        flexDirection: 'row-reverse',
        height: 70,
        borderRadius: 16,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: '600',
        ...androidTextFix,
        ...preventFontScaling,
    },
    filePreview: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 12,
        gap: 12,
    },
    previewImage: {
        width: 40,
        height: 40,
        borderRadius: 8,
    },
    fileName: {
        flex: 1,
        fontSize: 14,
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
    submitButton: {
        flexDirection: 'row-reverse',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 16,
        gap: 10,
        ...createShadow(5),
        ...androidButtonFix,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        ...androidTextFix,
        ...preventFontScaling,
    },
    termsText: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
        ...androidTextFix,
        ...preventFontScaling,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    modalIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        textAlign: 'center',
        ...androidTextFix,
        ...preventFontScaling,
    },
    modalBody: {
        marginBottom: 20,
    },
    modalText: {
        fontSize: 15,
        lineHeight: 24,
        textAlign: 'right',
        ...androidTextFix,
        ...preventFontScaling,
    },
    boldText: {
        fontWeight: '700',
    },
    bulletList: {
        marginTop: 12,
    },
    bulletItem: {
        flexDirection: 'row-reverse',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    bullet: {
        fontSize: 18,
        marginLeft: 8,
        marginTop: 2,
    },
    bulletText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'right',
        ...androidTextFix,
        ...preventFontScaling,
    },
    modalButton: {
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        ...createShadow(3),
        ...androidButtonFix,
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        ...androidTextFix,
        ...preventFontScaling,
    },
});
