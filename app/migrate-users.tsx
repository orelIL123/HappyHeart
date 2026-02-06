/**
 * Migration screen - for one-time use to move pending_clowns to users
 * Access this at /migrate-users
 */

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { db } from '@/config/firebaseConfig';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MigrateUsersScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const [migrating, setMigrating] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (message: string) => {
        console.log(message);
        setLogs(prev => [...prev, message]);
    };

    const migratePendingToUsers = async () => {
        setMigrating(true);
        setLogs([]);
        addLog('🚀 Starting migration from pending_clowns to users...');

        try {
            // Get all pending clowns
            const pendingSnapshot = await getDocs(collection(db, 'pending_clowns'));

            if (pendingSnapshot.empty) {
                addLog('✅ No pending clowns to migrate');
                setMigrating(false);
                return;
            }

            addLog(`📋 Found ${pendingSnapshot.size} pending clowns to migrate`);

            for (const docSnapshot of pendingSnapshot.docs) {
                const userData = docSnapshot.data();
                const userId = docSnapshot.id;

                addLog(`\n📝 Migrating user: ${userData.name} (${userId})`);

                // Create user in users collection with approved status
                const userRef = doc(db, 'users', userId);
                await setDoc(userRef, {
                    ...userData,
                    approvalStatus: 'approved',
                    role: userData.role || 'clown',
                    createdAt: userData.createdAt || new Date().toISOString()
                });

                addLog(`  ✅ Created in users collection`);

                // Delete from pending_clowns
                await deleteDoc(doc(db, 'pending_clowns', userId));
                addLog(`  🗑️  Removed from pending_clowns`);
            }

            addLog('\n🎉 Migration completed successfully!');
            addLog('All pending users have been approved and moved to the users collection.');

        } catch (error: any) {
            addLog(`❌ Migration failed: ${error.message}`);
            console.error('Migration error:', error);
        } finally {
            setMigrating(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <Text style={[styles.title, { color: colors.text }]}>העברת משתמשים</Text>
                <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
                    כלי חד-פעמי להעברת משתמשים מ-pending_clowns ל-users
                </Text>

                <TouchableOpacity
                    style={[
                        styles.button,
                        { backgroundColor: colors.primary },
                        migrating && { opacity: 0.5 }
                    ]}
                    onPress={migratePendingToUsers}
                    disabled={migrating}
                >
                    {migrating ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>הרץ העברה</Text>
                    )}
                </TouchableOpacity>

                <ScrollView
                    style={[styles.logContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
                    contentContainerStyle={styles.logContent}
                >
                    {logs.length === 0 ? (
                        <Text style={[styles.emptyLog, { color: colors.tabIconDefault }]}>
                            לחץ על "הרץ העברה" כדי להתחיל
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
