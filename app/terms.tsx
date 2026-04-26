import { useColorScheme } from '@/components/useColorScheme';
import MyColors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TermsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = MyColors[colorScheme ?? 'light'];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-forward" size={28} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>תנאי שימוש</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>1. הסכמה לתנאים</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    השימוש באפליקציית "שמחת הלב" (להלן: "האפליקציה") כפוף לתנאי השימוש המפורטים להלן. בעצם השימוש באפליקציה, הנך מביע את הסכמתך לתנאים אלו במלואם.
                </Text>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>2. תיאור השירות</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    האפליקציה משמשת לניהול פעילויות התנדבות של ליצנים רפואיים, כולל הרשמה לפעילויות, עדכון נוכחות וקבלת התראות.
                </Text>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>3. הצהרת המתנדב</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    המתנדב מצהיר כי הוא פועל בהתאם להנחיות "שמחת הלב" וכי כל המידע שנמסר על ידו הוא נכון ומדויק. המתנדב מתחייב לשמור על סודיות רפואית ופרטיות המטופלים בהם הוא נתקל במסגרת פעילותו.
                </Text>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>4. קניין רוחני</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    כל הזכויות באפליקציה, כולל עיצוב, קוד ותוכן, שמורות ל"שמחת הלב". אין להעתיק, להפיץ או להשתמש בתוכן האפליקציה ללא אישור מראש ובכתב.
                </Text>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>5. הגבלת אחריות</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    השימוש באפליקציה הוא על אחריות המשתמש בלבד. העמותה לא תהיה אחראית לכל נזק ישיר או עקיף שייגרם כתוצאה מהשימוש באפליקציה או מהסתמכות על המידע המופיע בה.
                </Text>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>6. שינויים בתנאים</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    העמותה שומרת לעצמה את הזכות לעדכן את תנאי השימוש מעת לעת. המשך השימוש באפליקציה לאחר שינוי התנאים מהווה הסכמה לתנאים החדשים.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'right',
    },
    text: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'right',
    },
});
