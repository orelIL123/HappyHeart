/**
 * Admin cleanup screen - for manual database cleanup
 * Access this at /admin-cleanup
 */

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { db, auth } from '@/config/firebaseConfig';
import { collection, getDocs, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminCleanupScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const [working, setWorking] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (message: string) => {
        console.log(message);
        setLogs(prev => [...prev, message]);
    };

    const cleanAndSetup = async () => {
        setWorking(true);
        setLogs([]);
        addLog('🧹 Starting cleanup and setup...\n');

        try {
            // Step 1: Delete all documents from pending_clowns
            addLog('Step 1: Cleaning pending_clowns collection...');
            const pendingSnapshot = await getDocs(collection(db, 'pending_clowns'));
            for (const docSnapshot of pendingSnapshot.docs) {
                addLog(`  🗑️  Deleting: ${docSnapshot.data().name || docSnapshot.id}`);
                await deleteDoc(doc(db, 'pending_clowns', docSnapshot.id));
            }
            addLog(`✅ Deleted ${pendingSnapshot.size} pending_clowns\n`);

            // Step 2: Delete all documents from users (except current session)
            addLog('Step 2: Cleaning users collection...');
            const usersSnapshot = await getDocs(collection(db, 'users'));
            for (const docSnapshot of usersSnapshot.docs) {
                addLog(`  🗑️  Deleting: ${docSnapshot.data().name || docSnapshot.id}`);
                await deleteDoc(doc(db, 'users', docSnapshot.id));
            }
            addLog(`✅ Deleted ${usersSnapshot.size} users\n`);

            // Step 3: Create a fresh test user
            addLog('Step 3: Creating fresh test user...');

            const testEmail = '0523985505@happyhart.app';
            const testPassword = '112233';

            try {
                // Create user in Authentication
                const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
                const authUser = userCredential.user;
                addLog(`  ✅ Created auth user: ${authUser.uid}`);

                // Create user in Firestore as admin
                const userData = {
                    name: 'אוראל אהרון',
                    phone: '0523985505',
                    email: testEmail,
                    preferredArea: 'תל אביב',
                    role: 'admin',
                    avatar: 'https://i.pravatar.cc/150?u=oral',
                    approvalStatus: 'approved',
                    authUid: authUser.uid,
                    createdAt: new Date().toISOString()
                };

                await setDoc(doc(db, 'users', authUser.uid), userData);
                addLog(`  ✅ Created user in Firestore with admin role\n`);

                addLog('🎉 Setup completed successfully!\n');
                addLog('📝 Test user credentials:');
                addLog('   Phone: 0523985505');
                addLog('   Password: 112233');
                addLog('   Role: admin');
                addLog('\n👉 You can now close this screen and login!');

            } catch (error: any) {
                if (error.code === 'auth/email-already-in-use') {
                    addLog('⚠️  User already exists in Auth.');
                    addLog('Please delete the user from Firebase Console first,');
                    addLog('or use a different phone number.');
                } else {
                    throw error;
                }
            }

        } catch (error: any) {
            addLog(`\n❌ Error: ${error.message}`);
            console.error('Cleanup error:', error);
        } finally {
            setWorking(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <Text style={[styles.title, { color: colors.text }]}>ניקוי והתקנה</Text>
                <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
                    מחק את כל המשתמשים ויצור משתמש טרי לבדיקה
                </Text>

                <TouchableOpacity
                    style={[
                        styles.button,
                        { backgroundColor: colors.error },
                        working && { opacity: 0.5 }
                    ]}
                    onPress={cleanAndSetup}
                    disabled={working}
                >
                    {working ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>🗑️ נקה והתקן מחדש</Text>
                    )}
                </TouchableOpacity>

                <ScrollView
                    style={[styles.logContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
                    contentContainerStyle={styles.logContent}
                >
                    {logs.length === 0 ? (
                        <Text style={[styles.emptyLog, { color: colors.tabIconDefault }]}>
                            לחץ על הכפתור למעלה כדי להתחיל
                        </Text>
                    ) : (
                        logs.map((log, index) => (
                            <Text key={index} style={[styles.logText, { color: colors.text }]}>
                                {log}
                            </Text>
                        ))
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 30,
        textAlign: 'center',
    },
    button: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    logContainer: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1,
        padding: 15,
    },
    logContent: {
        paddingBottom: 20,
    },
    emptyLog: {
        textAlign: 'center',
        fontSize: 16,
    },
    logText: {
        fontSize: 14,
        marginBottom: 5,
        fontFamily: 'monospace',
    },
});
