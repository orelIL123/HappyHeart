import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useApp } from '@/context/AppContext';
import { firebaseService } from '@/services/firebaseService';
import { useRouter } from 'expo-router';
import { ArrowRight, FileUp, Lock, MapPin, Phone, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
    const { register } = useApp();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const router = useRouter();

    const [form, setForm] = useState({
        name: '',
        phone: '',
        password: '',
        location: '',
    });
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleRegister = async () => {
        if (form.name && form.phone && form.password) {
            try {
                await firebaseService.createPendingClown({
                    name: form.name,
                    phone: form.phone,
                    password: form.password,
                    preferredArea: form.location,
                    role: 'clown',
                    avatar: 'https://i.pravatar.cc/150?u=' + form.name,
                    certificationUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=2070&auto=format&fit=crop', // Dummy cert for now
                    approvalStatus: 'pending'
                });
                setIsSubmitted(true);
            } catch (error) {
                console.error('Registration failed:', error);
                Alert.alert('שגיאה', 'ההרשמה נכשלה. נסה שוב מאוחר יותר.');
            }
        } else {
            Alert.alert('פרטים חסרים', 'אנא מלא את כל שדות החובה');
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

                        <TouchableOpacity
                            style={[styles.uploadButton, { backgroundColor: colors.card, borderColor: colors.primary, borderStyle: 'dashed' }]}
                            onPress={() => Alert.alert('העלאת מסמך', 'כאן תתאפשר העלאת תעודת ליצן (צילום או PDF)')}
                        >
                            <FileUp size={24} color={colors.primary} />
                            <Text style={[styles.uploadButtonText, { color: colors.primary }]}>צרף תעודת ליצן</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.loginButton, { backgroundColor: colors.primary }]}
                            onPress={handleRegister}
                        >
                            <Text style={styles.loginButtonText}>שלח בקשת הצטרפות</Text>
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
        paddingBottom: 40,
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
    },
    subtitle: {
        fontSize: 16,
        marginTop: 5,
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
    },
    loginButton: {
        height: 55,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
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
    },
    successText: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
});
