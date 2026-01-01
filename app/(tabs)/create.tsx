import { Header } from '@/components/Header';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CITIES, INSTITUTIONS } from '@/constants/MockData';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { ShieldAlert, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CreateActivityScreen() {
    const { createActivity, currentUser } = useApp();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const router = useRouter();

    const departments = ['מיון ילדים', 'אונקולוגיה', 'כללי', 'טיפול נמרץ', 'יולדות'];
    const intensities = [
        { id: 'low', label: 'נמוכה', color: Colors[colorScheme].success },
        { id: 'medium', label: 'בינונית', color: Colors[colorScheme].secondary },
        { id: 'high', label: 'גבוהה', color: Colors[colorScheme].error },
    ];

    const [form, setForm] = useState({
        title: '',
        institution: INSTITUTIONS[0],
        location: CITIES[0],
        description: '',
        requiredClowns: '2',
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '12:00',
        type: 'one-time' as 'one-time' | 'recurring',
        contactPerson: '',
        contactPhone: '',
        intensity: 'medium' as 'low' | 'medium' | 'high',
        isUrgent: false,
        autoDelete: true,
    });

    const handleCreate = () => {
        if (!form.title || !form.description || !form.contactPerson || !form.contactPhone) {
            Alert.alert('שגיאה', 'אנא מלא את כל שדות החובה');
            return;
        }

        // Calculate expiration date (24 hours after end time) if auto-delete is enabled
        let expirationDate = undefined;
        if (form.autoDelete) {
            const endDateTime = new Date(`${form.date}T${form.endTime}:00Z`);
            endDateTime.setDate(endDateTime.getDate() + 1); // Add 1 day
            expirationDate = endDateTime.toISOString();
        }

        createActivity({
            title: form.title,
            institution: form.institution,
            location: form.location,
            description: form.description,
            requiredClowns: parseInt(form.requiredClowns),
            type: form.type,
            startTime: `${form.date}T${form.startTime}:00Z`,
            endTime: `${form.date}T${form.endTime}:00Z`,
            organizerId: currentUser?.id || '2',
            contactPerson: form.contactPerson,
            contactPhone: form.contactPhone,
            intensity: form.intensity,
            isUrgent: form.isUrgent,
            expirationDate,
        });

        Alert.alert('הצלחה', 'הפעילות נוצרה בהצלחה!');
        router.push('/');
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Header title="יצירת פעילות" />
            <ScrollView style={styles.container}>
                <View style={styles.form}>
                    <Text style={[styles.label, { color: colors.text }]}>כותרת הפעילות *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                        placeholder="למשל: יום הולדת במחלקת ילדים"
                        placeholderTextColor={colors.tabIconDefault}
                        value={form.title}
                        onChangeText={(text) => setForm({ ...form, title: text })}
                        textAlign="right"
                    />

                    <View style={styles.row}>
                        <View style={styles.flex1}>
                            <Text style={[styles.label, { color: colors.text }]}>מוסד</Text>
                            <View style={styles.pickerContainer}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                                    {INSTITUTIONS.map(inst => (
                                        <TouchableOpacity
                                            key={inst}
                                            style={[
                                                styles.chip,
                                                form.institution === inst && { backgroundColor: colors.primary, borderColor: colors.primary },
                                                { borderColor: colors.border }
                                            ]}
                                            onPress={() => setForm({ ...form, institution: inst })}
                                        >
                                            <Text style={[styles.chipText, form.institution === inst && { color: '#fff' }, { color: colors.text }]}>{inst}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                    </View>

                    <Text style={[styles.label, { color: colors.text }]}>איש קשר במוסד *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                        placeholder="שם מלא של איש הקשר"
                        placeholderTextColor={colors.tabIconDefault}
                        value={form.contactPerson}
                        onChangeText={(text) => setForm({ ...form, contactPerson: text })}
                        textAlign="right"
                    />

                    <Text style={[styles.label, { color: colors.text }]}>טלפון איש קשר *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                        placeholder="מספר טלפון"
                        placeholderTextColor={colors.tabIconDefault}
                        value={form.contactPhone}
                        onChangeText={(text) => setForm({ ...form, contactPhone: text })}
                        textAlign="right"
                        keyboardType="phone-pad"
                    />

                    <Text style={[styles.label, { color: colors.text }]}>רמת אינטנסיביות</Text>
                    <View style={styles.pickerContainer}>
                        <View style={styles.intensityRow}>
                            {intensities.map(intensity => (
                                <TouchableOpacity
                                    key={intensity.id}
                                    style={[
                                        styles.intensityChip,
                                        form.intensity === intensity.id && { backgroundColor: intensity.color, borderColor: intensity.color },
                                        { borderColor: colors.border }
                                    ]}
                                    onPress={() => setForm({ ...form, intensity: intensity.id as any })}
                                >
                                    <Text style={[styles.chipText, form.intensity === intensity.id && { color: '#fff' }, { color: colors.text }]}>
                                        {intensity.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={[styles.section, { backgroundColor: form.isUrgent ? colors.error + '10' : colors.card, borderColor: form.isUrgent ? colors.error : colors.border }]}>
                        <View style={styles.urgentRow}>
                            <Switch
                                value={form.isUrgent}
                                onValueChange={(v) => setForm({ ...form, isUrgent: v })}
                                trackColor={{ false: colors.border, true: colors.error }}
                                thumbColor="#fff"
                            />
                            <View style={styles.urgentRowRight}>
                                <View style={[styles.iconContainer, { backgroundColor: colors.error + '15' }]}>
                                    <ShieldAlert size={20} color={colors.error} />
                                </View>
                                <View>
                                    <Text style={[styles.rowTitle, { color: colors.text }]}>בקשה דחופה (הקפצה)</Text>
                                    <Text style={[styles.rowSubtitle, { color: colors.tabIconDefault }]}>התראה מיידית לכל הליצנים באזור</Text>
                                </View>
                            </View>
                        </View>
                        {form.isUrgent && (
                            <View style={styles.urgentWarning}>
                                <Text style={[styles.urgentWarningText, { color: colors.error }]}>
                                    שים לב: בקשה דחופה תשלח התראה מתפרצת לכל הליצנים המתאימים, גם מחוץ לשעות הפעילות.
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.urgentRow}>
                            <Switch
                                value={form.autoDelete}
                                onValueChange={(v) => setForm({ ...form, autoDelete: v })}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor="#fff"
                            />
                            <View style={styles.urgentRowRight}>
                                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                                    <Trash2 size={20} color={colors.primary} />
                                </View>
                                <View>
                                    <Text style={[styles.rowTitle, { color: colors.text }]}>מחיקה אוטומטית</Text>
                                    <Text style={[styles.rowSubtitle, { color: colors.tabIconDefault }]}>הסר פעילות זו מהלוח 24 שעות אחרי סיומה</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <Text style={[styles.label, { color: colors.text }]}>מיקום (עיר)</Text>
                    <View style={styles.pickerContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                            {CITIES.map(city => (
                                <TouchableOpacity
                                    key={city}
                                    style={[
                                        styles.chip,
                                        form.location === city && { backgroundColor: colors.primary, borderColor: colors.primary },
                                        { borderColor: colors.border }
                                    ]}
                                    onPress={() => setForm({ ...form, location: city })}
                                >
                                    <Text style={[styles.chipText, form.location === city && { color: '#fff' }, { color: colors.text }]}>{city}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.flex1}>
                            <Text style={[styles.label, { color: colors.text }]}>כמות ליצנים דרושה</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                                keyboardType="numeric"
                                value={form.requiredClowns}
                                onChangeText={(text) => setForm({ ...form, requiredClowns: text })}
                                textAlign="center"
                            />
                        </View>
                    </View>

                    <Text style={[styles.label, { color: colors.text }]}>תיאור הפעילות *</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                        placeholder="ספר קצת על הפעילות..."
                        placeholderTextColor={colors.tabIconDefault}
                        multiline
                        numberOfLines={4}
                        value={form.description}
                        onChangeText={(text) => setForm({ ...form, description: text })}
                        textAlign="right"
                    />

                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: colors.primary }]}
                        onPress={handleCreate}
                    >
                        <Text style={styles.submitButtonText}>פרסם פעילות</Text>
                    </TouchableOpacity>
                </View >
            </ScrollView >
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    form: {
        padding: 20,
        paddingBottom: 100,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'right',
        marginBottom: 8,
        marginTop: 15,
    },
    input: {
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 15,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        paddingTop: 12,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
    },
    flex1: {
        flex: 1,
    },
    pickerContainer: {
        marginBottom: 5,
    },
    chipRow: {
        flexDirection: 'row-reverse',
        paddingVertical: 5,
    },
    chip: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginLeft: 10,
    },
    chipText: {
        fontSize: 14,
    },
    submitButton: {
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 40,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    intensityRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
    },
    intensityChip: {
        flex: 1,
        height: 45,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    section: {
        marginTop: 20,
        marginBottom: 10,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    urgentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        justifyContent: 'space-between',
    },
    urgentRowRight: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    rowTitle: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'right',
    },
    rowSubtitle: {
        fontSize: 12,
        textAlign: 'right',
        marginTop: 2,
    },
    urgentWarning: {
        padding: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(239, 68, 68, 0.1)',
    },
    urgentWarningText: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'right',
        lineHeight: 18,
    },
});
