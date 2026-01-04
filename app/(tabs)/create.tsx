import { Header } from '@/components/Header';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { createShadow, androidTextFix, preventFontScaling, androidButtonFix } from '@/constants/AndroidStyles';
import { CITIES, INSTITUTIONS } from '@/constants/MockData';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { ShieldAlert, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CreateActivityScreen() {
    const { createActivity, currentUser } = useApp();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const router = useRouter();

    const departments = ['מיון ילדים', 'אונקולוגיה', 'כללי', 'טיפול נמרץ', 'יולדות'];
    const populations = ['ילדים', 'נוער', 'מבוגרים'];
    const intensities = [
        { id: 'low', label: 'נמוכה', color: Colors[colorScheme].success },
        { id: 'medium', label: 'בינונית', color: Colors[colorScheme].secondary },
        { id: 'high', label: 'גבוהה', color: Colors[colorScheme].error },
    ];

    const [form, setForm] = useState({
        location: '',
        institution: INSTITUTIONS[0],
        customInstitution: '',
        department: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '12:00',
        population: '',
        requiredClowns: '2',
        coordinatorName: '',
        coordinatorPhone: '',
        description: '',
        intensity: 'medium' as 'low' | 'medium' | 'high',
        isUrgent: false,
        autoDelete: true,
    });

    const handleCreate = () => {
        if (!form.location || !form.description || !form.coordinatorName || !form.coordinatorPhone || !form.population) {
            Alert.alert('שגיאה', 'אנא מלא את כל שדות החובה');
            return;
        }

        const institutionName = form.institution === 'אחר' ? form.customInstitution : form.institution;
        if (form.institution === 'אחר' && !form.customInstitution) {
            Alert.alert('שגיאה', 'אנא הזן שם מוסד');
            return;
        }

        // Calculate expiration date (24 hours after end time) if auto-delete is enabled
        let expirationDate = undefined;
        if (form.autoDelete) {
            const endDateTime = new Date(`${form.date}T${form.endTime}:00Z`);
            endDateTime.setDate(endDateTime.getDate() + 1); // Add 1 day
            expirationDate = endDateTime.toISOString();
        }

        // Create title from the data
        const title = `${institutionName}${form.department ? ' - ' + form.department : ''} - ${form.population}`;

        createActivity({
            title: title,
            institution: institutionName,
            location: form.location,
            description: form.description,
            requiredClowns: parseInt(form.requiredClowns),
            type: 'one-time',
            startTime: `${form.date}T${form.startTime}:00Z`,
            endTime: `${form.date}T${form.endTime}:00Z`,
            organizerId: currentUser?.id || '2',
            contactPerson: form.coordinatorName,
            contactPhone: form.coordinatorPhone,
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
                    <Text style={[styles.label, { color: colors.text }]}>מיקום *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                        placeholder="למשל: בית אבות, הוסטל, בית חולים וכו'"
                        placeholderTextColor={colors.tabIconDefault}
                        value={form.location}
                        onChangeText={(text) => setForm({ ...form, location: text })}
                        textAlign="right"
                    />

                    <Text style={[styles.label, { color: colors.text }]}>מוסד</Text>
                    <View style={styles.pickerContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                            {[...INSTITUTIONS, 'אחר'].map(inst => (
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

                    {form.institution === 'אחר' && (
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border, marginTop: 10 }]}
                            placeholder="הזן שם מוסד"
                            placeholderTextColor={colors.tabIconDefault}
                            value={form.customInstitution}
                            onChangeText={(text) => setForm({ ...form, customInstitution: text })}
                            textAlign="right"
                        />
                    )}

                    <Text style={[styles.label, { color: colors.text }]}>מחלקה (לא חובה)</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                        placeholder="למשל: מיון ילדים, אונקולוגיה וכו'"
                        placeholderTextColor={colors.tabIconDefault}
                        value={form.department}
                        onChangeText={(text) => setForm({ ...form, department: text })}
                        textAlign="right"
                    />

                    <View style={styles.row}>
                        <View style={styles.flex1}>
                            <Text style={[styles.label, { color: colors.text }]}>תאריך *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                                value={form.date}
                                onChangeText={(text) => setForm({ ...form, date: text })}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={colors.tabIconDefault}
                                textAlign="center"
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.flex1}>
                            <Text style={[styles.label, { color: colors.text }]}>שעת התחלה *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                                value={form.startTime}
                                onChangeText={(text) => setForm({ ...form, startTime: text })}
                                placeholder="HH:MM"
                                placeholderTextColor={colors.tabIconDefault}
                                textAlign="center"
                            />
                        </View>
                        <View style={styles.flex1}>
                            <Text style={[styles.label, { color: colors.text }]}>שעת סיום *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border, marginLeft: 10 }]}
                                value={form.endTime}
                                onChangeText={(text) => setForm({ ...form, endTime: text })}
                                placeholder="HH:MM"
                                placeholderTextColor={colors.tabIconDefault}
                                textAlign="center"
                            />
                        </View>
                    </View>

                    <Text style={[styles.label, { color: colors.text }]}>אוכלוסיה *</Text>
                    <View style={styles.pickerContainer}>
                        <View style={styles.intensityRow}>
                            {populations.map(pop => (
                                <TouchableOpacity
                                    key={pop}
                                    style={[
                                        styles.intensityChip,
                                        form.population === pop && { backgroundColor: colors.primary, borderColor: colors.primary },
                                        { borderColor: colors.border }
                                    ]}
                                    onPress={() => setForm({ ...form, population: pop })}
                                >
                                    <Text style={[styles.chipText, form.population === pop && { color: '#fff' }, { color: colors.text }]}>
                                        {pop}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.flex1}>
                            <Text style={[styles.label, { color: colors.text }]}>מספר ליצנים *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                                keyboardType="numeric"
                                value={form.requiredClowns}
                                onChangeText={(text) => setForm({ ...form, requiredClowns: text })}
                                textAlign="center"
                            />
                        </View>
                    </View>

                    <Text style={[styles.label, { color: colors.text }]}>שם רכז פעילות *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                        placeholder="שם מלא של רכז הפעילות"
                        placeholderTextColor={colors.tabIconDefault}
                        value={form.coordinatorName}
                        onChangeText={(text) => setForm({ ...form, coordinatorName: text })}
                        textAlign="right"
                    />

                    <Text style={[styles.label, { color: colors.text }]}>מספר טלפון של הרכז לבירורים *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                        placeholder="מספר טלפון"
                        placeholderTextColor={colors.tabIconDefault}
                        value={form.coordinatorPhone}
                        onChangeText={(text) => setForm({ ...form, coordinatorPhone: text })}
                        textAlign="right"
                        keyboardType="phone-pad"
                    />


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
        paddingBottom: Platform.OS === 'android' ? 120 : 100,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'right',
        marginBottom: 8,
        marginTop: 15,
        ...androidTextFix,
        ...preventFontScaling,
    },
    input: {
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 15,
        fontSize: 16,
        ...androidTextFix,
        ...preventFontScaling,
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
        ...androidTextFix,
        ...preventFontScaling,
    },
    submitButton: {
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 40,
        ...createShadow(4),
        ...androidButtonFix,
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
        ...androidTextFix,
        ...preventFontScaling,
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
        ...androidTextFix,
        ...preventFontScaling,
    },
    rowSubtitle: {
        fontSize: 12,
        textAlign: 'right',
        marginTop: 2,
        ...androidTextFix,
        ...preventFontScaling,
        flexShrink: 1,
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
        ...androidTextFix,
        ...preventFontScaling,
    },
});
