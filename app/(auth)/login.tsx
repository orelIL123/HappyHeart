import { useColorScheme } from '@/components/useColorScheme';
import { androidButtonFix, androidTextFix, createShadow, preventFontScaling } from '@/constants/AndroidStyles';
import Colors from '@/constants/Colors';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { Lock, LogIn, Phone } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
    const { login } = useApp();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const router = useRouter();

    const [phoneOrEmail, setPhoneOrEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        const trimmedInput = (phoneOrEmail || '').trim();
        const trimmedPassword = (password || '').trim();
        if (!trimmedInput || !trimmedPassword) {
            alert('אנא מלא מספר טלפון או אימייל וסיסמה');
            return;
        }
        try {
            await login(trimmedInput, trimmedPassword);
                // Wait a bit for auth state to update, then navigate
            setTimeout(() => {
                router.replace('/(tabs)');
            }, 500);
        } catch (error: any) {
            console.error('Login error:', error);
            const errorMessage = error?.message || 'שם משתמש או סיסמה שגויים. נסה שוב.';
            alert(errorMessage);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>שמחת הלב</Text>
                    <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>התחברות למערכת הליצנים</Text>
                </View>

                <View style={styles.form}>
                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Phone size={20} color={colors.tabIconDefault} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="מספר טלפון או אימייל"
                            placeholderTextColor={colors.tabIconDefault}
                            value={phoneOrEmail}
                            onChangeText={setPhoneOrEmail}
                            keyboardType="default"
                            autoCapitalize="none"
                            autoCorrect={false}
                            textAlign="right"
                        />
                    </View>

                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Lock size={20} color={colors.tabIconDefault} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="סיסמה"
                            placeholderTextColor={colors.tabIconDefault}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            textAlign="right"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.loginButton, { backgroundColor: colors.primary }]}
                        onPress={handleLogin}
                    >
                        <LogIn size={20} color="#fff" />
                        <Text style={styles.loginButtonText}>התחבר</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.registerLink}
                        onPress={() => router.push('/(auth)/role-select')}
                    >
                        <Text style={[styles.registerText, { color: colors.text }]}>עוד לא רשום? </Text>
                        <Text style={[styles.registerLinkText, { color: colors.primary }]}>צור חשבון חדש</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 30,
        justifyContent: 'center',
        marginTop: -50,
    },
    header: {
        alignItems: 'center',
        marginBottom: 50,
    },
    title: {
        fontSize: 42,
        fontWeight: '900',
        fontFamily: 'Inter',
        ...androidTextFix,
        ...preventFontScaling,
    },
    subtitle: {
        fontSize: 16,
        marginTop: 10,
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
    loginButton: {
        flexDirection: 'row-reverse',
        height: 55,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        ...createShadow(5),
        ...androidButtonFix,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 10,
        ...androidTextFix,
        ...preventFontScaling,
    },
    registerLink: {
        flexDirection: 'row-reverse',
        justifyContent: 'center',
        marginTop: 25,
    },
    registerText: {
        fontSize: 14,
        ...androidTextFix,
        ...preventFontScaling,
    },
    registerLinkText: {
        fontSize: 14,
        fontWeight: 'bold',
        ...androidTextFix,
        ...preventFontScaling,
    },
});
