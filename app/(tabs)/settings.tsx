import { Header } from '@/components/Header';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useApp } from '@/context/AppContext';
import { notificationService } from '@/services/notificationService';
import { Bell, CheckCircle, Map, MapPin, Moon, ShieldAlert, Timer, Zap } from 'lucide-react-native';
import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
    const { notificationPreferences, updateNotificationPreferences } = useApp();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const toggleMainEnabled = (value: boolean) => {
        updateNotificationPreferences({ enabled: value });
    };

    const setRadius = (radius: number) => {
        updateNotificationPreferences({ proximityRadius: radius });
    };

    const toggleType = (type: string, value: boolean) => {
        updateNotificationPreferences({
            types: {
                ...notificationPreferences.types,
                [type]: value,
            },
        });
    };

    const toggleRegion = (region: string) => {
        const currentSelected = notificationPreferences.preferredRegions || [];
        const newSelected = currentSelected.includes(region)
            ? currentSelected.filter(r => r !== region)
            : [...currentSelected, region];

        updateNotificationPreferences({ preferredRegions: newSelected });
    };

    const testNotification = async () => {
        if (!notificationPreferences.enabled) {
            Alert.alert('התראות כבויות', 'יש להפעיל את ההתראות הראשיות כדי לבצע את הבדיקה.');
            return;
        }
        await notificationService.sendLocalNotification(
            'בדיקת התראה 🔔',
            'זוהי התראת בדיקה מהאפליקציה שלכם. הכל עובד מצוין!'
        );
    };

    const toggleQuietHours = (value: boolean) => {
        updateNotificationPreferences({
            quietHours: {
                ...notificationPreferences.quietHours,
                enabled: value,
            },
        });
    };

    const radiusOptions = [
        { label: '5 ק״מ', value: 5 },
        { label: '10 ק״מ', value: 10 },
        { label: '20 ק״מ', value: 20 },
        { label: '50 ק״מ', value: 50 },
        { label: 'בכל מקום', value: 0 },
    ];

    const regionOptions = [
        { label: 'צפון', value: 'צפון' },
        { label: 'מרכז', value: 'מרכז' },
        { label: 'דרום', value: 'דרום' },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Header title="הגדרות" />
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            <Switch
                                value={notificationPreferences.enabled}
                                onValueChange={toggleMainEnabled}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor="#fff"
                            />
                        </View>
                        <View style={styles.rowRight}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                                <Bell size={20} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={[styles.rowTitle, { color: colors.text }]}>קבלת התראות</Text>
                                <Text style={[styles.rowSubtitle, { color: colors.tabIconDefault }]}>הפעלה או כיבוי של כל ההתראות</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {notificationPreferences.enabled && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>רדיוס התראות קרובות</Text>
                        </View>
                        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, padding: 15 }]}>
                            <View style={styles.radiusContainer}>
                                {radiusOptions.map((opt) => (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={[
                                            styles.radiusButton,
                                            {
                                                backgroundColor: notificationPreferences.proximityRadius === opt.value ? colors.primary : colors.background,
                                                borderColor: notificationPreferences.proximityRadius === opt.value ? colors.primary : colors.border
                                            }
                                        ]}
                                        onPress={() => setRadius(opt.value)}
                                    >
                                        <Text style={[
                                            styles.radiusLabel,
                                            { color: notificationPreferences.proximityRadius === opt.value ? '#fff' : colors.text }
                                        ]}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.proximityInfo}>
                                <MapPin size={14} color={colors.tabIconDefault} style={{ marginLeft: 6 }} />
                                <Text style={[styles.proximityText, { color: colors.tabIconDefault }]}>
                                    {notificationPreferences.proximityRadius === 0
                                        ? 'תקבלו התראות על פעילויות בכל רחבי הארץ'
                                        : `תקבלו התראות על פעילויות ברדיוס של ${notificationPreferences.proximityRadius} ק״מ ממך`}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>סוגי התראות</Text>
                        </View>
                        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <NotificationToggle
                                title="פעילויות חדשות"
                                subtitle="כשיש פעילות חדשה באזור שלך"
                                value={notificationPreferences.types.newActivity}
                                onValueChange={(v: boolean) => toggleType('newActivity', v)}
                                icon={<Zap size={20} color={colors.accent} />}
                                iconBg={colors.accent + '15'}
                                colors={colors}
                            />
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <NotificationToggle
                                title="עדכונים לפעילויות"
                                subtitle="כשמשתנים פרטים בפעילות שנרשמת אליה"
                                value={notificationPreferences.types.activityUpdate}
                                onValueChange={(v: boolean) => toggleType('activityUpdate', v)}
                                icon={<Bell size={20} color={colors.secondary} />}
                                iconBg={colors.secondary + '15'}
                                colors={colors}
                                isLast
                            />
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <NotificationToggle
                                title="בקשות דחופות"
                                subtitle="כשיש צורך מיידי בליצן רפואי"
                                value={notificationPreferences.types.urgent}
                                onValueChange={(v: boolean) => toggleType('urgent', v)}
                                icon={<ShieldAlert size={20} color={colors.error} />}
                                iconBg={colors.error + '15'}
                                colors={colors}
                            />
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <NotificationToggle
                                title="תזכורות"
                                subtitle="לפני תחילת פעילות"
                                value={notificationPreferences.types.reminder}
                                onValueChange={(v: boolean) => toggleType('reminder', v)}
                                icon={<Timer size={20} color={colors.playful} />}
                                iconBg={colors.playful + '15'}
                                colors={colors}
                            />
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <NotificationToggle
                                title="אישורי הגעה"
                                subtitle="כשיש שינוי בסטטוס ליצנים רשומים"
                                value={notificationPreferences.types.clownAttendance}
                                onValueChange={(v: boolean) => toggleType('clownAttendance', v)}
                                icon={<CheckCircle size={20} color={colors.primary} />}
                                iconBg={colors.primary + '15'}
                                colors={colors}
                                isLast
                            />
                        </View>

                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>התראות לפי אזור</Text>
                        </View>
                        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, padding: 15 }]}>
                            <View style={styles.row}>
                                <View style={styles.rowLeft}>
                                    <Switch
                                        value={notificationPreferences.types.regionalActivity}
                                        onValueChange={(v: boolean) => toggleType('regionalActivity', v)}
                                        trackColor={{ false: colors.border, true: colors.primary }}
                                        thumbColor="#fff"
                                    />
                                </View>
                                <View style={styles.rowRight}>
                                    <View style={[styles.iconContainer, { backgroundColor: colors.secondary + '15' }]}>
                                        <Map size={20} color={colors.secondary} />
                                    </View>
                                    <View>
                                        <Text style={[styles.rowTitle, { color: colors.text }]}>התראות אזוריות</Text>
                                        <Text style={[styles.rowSubtitle, { color: colors.tabIconDefault }]}>קבל התראות לפי אזור גיאוגרפי</Text>
                                    </View>
                                </View>
                            </View>

                            {notificationPreferences.types.regionalActivity && (
                                <>
                                    <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 15 }]} />
                                    <View style={styles.radiusContainer}>
                                        {regionOptions.map((opt) => (
                                            <TouchableOpacity
                                                key={opt.value}
                                                style={[
                                                    styles.radiusButton,
                                                    {
                                                        backgroundColor: notificationPreferences.preferredRegions?.includes(opt.value) ? colors.secondary : colors.background,
                                                        borderColor: notificationPreferences.preferredRegions?.includes(opt.value) ? colors.secondary : colors.border
                                                    }
                                                ]}
                                                onPress={() => toggleRegion(opt.value)}
                                            >
                                                <Text style={[
                                                    styles.radiusLabel,
                                                    { color: notificationPreferences.preferredRegions?.includes(opt.value) ? '#fff' : colors.text }
                                                ]}>
                                                    {opt.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            )}
                        </View>

                        <View style={{ marginTop: 30, paddingHorizontal: 10 }}>
                            <TouchableOpacity
                                style={[styles.testButton, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}
                                onPress={testNotification}
                            >
                                <Bell size={18} color={colors.primary} style={{ marginLeft: 8 }} />
                                <Text style={[styles.testButtonText, { color: colors.primary }]}>בצע בדיקת התראות</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>זמנים</Text>
                        </View>
                        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={styles.row}>
                                <View style={styles.rowLeft}>
                                    <Switch
                                        value={notificationPreferences.quietHours.enabled}
                                        onValueChange={toggleQuietHours}
                                        trackColor={{ false: colors.border, true: colors.primary }}
                                        thumbColor="#fff"
                                    />
                                </View>
                                <View style={styles.rowRight}>
                                    <View style={[styles.iconContainer, { backgroundColor: '#4F46E515' }]}>
                                        <Moon size={20} color="#4F46E5" />
                                    </View>
                                    <View>
                                        <Text style={[styles.rowTitle, { color: colors.text }]}>שעות שקט</Text>
                                        <Text style={[styles.rowSubtitle, { color: colors.tabIconDefault }]}>לא לקבל התראות בין 22:00 ל-07:00</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

function NotificationToggle({ title, subtitle, value, onValueChange, icon, iconBg, colors, isLast = false }: any) {
    return (
        <View style={[styles.row, isLast && { borderBottomWidth: 0 }]}>
            <View style={styles.rowLeft}>
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#fff"
                />
            </View>
            <View style={styles.rowRight}>
                <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                    {icon}
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
                    <Text style={[styles.rowSubtitle, { color: colors.tabIconDefault }]} numberOfLines={1}>{subtitle}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: Platform.OS === 'android' ? 130 : 100,
    },
    header: {
        marginBottom: 30,
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'right',
        lineHeight: 22,
    },
    sectionHeader: {
        marginTop: 25,
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        textAlign: 'right',
    },
    section: {
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        justifyContent: 'space-between',
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowRight: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 42,
        height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 15,
    },
    rowTitle: {
        fontSize: 17,
        fontWeight: '700',
        textAlign: 'right',
    },
    rowSubtitle: {
        fontSize: 13,
        textAlign: 'right',
        marginTop: 2,
    },
    divider: {
        height: 1,
        marginHorizontal: 16,
    },
    radiusContainer: {
        flexDirection: 'row-reverse',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
        marginBottom: 15,
    },
    radiusButton: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1.5,
        minWidth: 80,
        alignItems: 'center',
    },
    radiusLabel: {
        fontSize: 14,
        fontWeight: '800',
    },
    proximityInfo: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 5,
    },
    proximityText: {
        fontSize: 13,
        fontWeight: '600',
    },
    testButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 18,
        borderWidth: 1.5,
        borderStyle: 'dashed',
    },
    testButtonText: {
        fontSize: 16,
        fontWeight: '800',
    },
});
