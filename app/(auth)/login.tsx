import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { Lock, LogIn, Phone } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
    const { login, skipAuth } = useApp();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const router = useRouter();

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        console.log('Login attempt:', phone, password);
        if (phone && password) {
            login(phone, password);
            // Force navigation to main app after login
            setTimeout(() => {
                router.replace('/(tabs)');
            }, 100);
        } else {
            console.warn('Missing phone or password');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.topActions}>
                <TouchableOpacity
                    style={[styles.skipButtonContainer, { borderColor: colors.border }]}
                    onPress={skipAuth}
                >
                    <Text style={[styles.skipButtonText, { color: colors.tabIconDefault }]}>דלג</Text>
                </TouchableOpacity>
            </View>

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
                            placeholder="מספר טלפון"
                            placeholderTextColor={colors.tabIconDefault}
                            value={phone}
                            onChangeText={setPhone}
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
                        onPress={() => router.push('/(auth)/register')}
                    >
                        <Text style={[styles.registerText, { color: colors.text }]}>עוד לא רשום? </Text>
                        <Text style={[styles.registerLinkText, { color: colors.primary }]}>צור חשבון חדש</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.registerLink, { marginTop: 15 }]}
                        onPress={() => {
                            skipAuth();
                            setTimeout(() => {
                                router.replace('/(tabs)');
                            }, 100);
                        }}
                    >
                        <Text style={[styles.registerLinkText, { color: colors.tabIconDefault, fontWeight: 'normal' }]}>המשך ללא התחברות</Text>
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
    topActions: {
        paddingHorizontal: 20,
        paddingTop: 10,
        alignItems: 'flex-start',
    },
    header: {
        alignItems: 'center',
        marginBottom: 50,
    },
    title: {
        fontSize: 42,
        fontWeight: '900',
        fontFamily: 'Inter',
    },
    subtitle: {
        fontSize: 16,
        marginTop: 10,
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
    loginButton: {
        flexDirection: 'row-reverse',
        height: 55,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
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
        marginRight: 10,
    },
    registerLink: {
        flexDirection: 'row-reverse',
        justifyContent: 'center',
        marginTop: 25,
    },
    registerText: {
        fontSize: 14,
    },
    registerLinkText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    skipButtonContainer: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        borderWidth: 1,
    },
    skipButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
