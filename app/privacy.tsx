import { useColorScheme } from '@/components/useColorScheme';
import MyColors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PrivacyScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = MyColors[colorScheme ?? 'light'];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-forward" size={28} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>מדיניות פרטיות</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>1. כללי</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    עמותת "שמחת הלב" מכבדת את פרטיות המשתמשים באפליקציה. מסמך זה מפרט את אופן איסוף המידע והשימוש בו.
                </Text>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>2. איסוף מידע</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    האפליקציה אוספת מידע אישי שנמסר על ידי המשתמש מרצונו החופשי בעת ההרשמה, כגון: שם מלא, מספר טלפון, כתובת אימייל ותמונת פרופיל. כמו כן, נאסף מידע טכני כגון סוג המכשיר וגרסת מערכת ההפעלה.
                </Text>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>3. השימוש במידע</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    המידע משמש לצרכים הבאים:
                    {"\n"}• ניהול ורישום להתנדבויות.
                    {"\n"}• שליחת התראות ועדכונים רלוונטיים.
                    {"\n"}• שיפור חוויית המשתמש באפליקציה.
                    {"\n"}• אימות זהות המשתמש.
                </Text>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>4. שיתוף מידע עם צדדים שלישיים</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    העמותה לא תעביר את פרטיך לצדדים שלישיים ללא הסכמתך, למעט במקרים הבאים:
                    {"\n"}• על פי דרישת חוק או צו שיפוטי.
                    {"\n"}• במסגרת ניהול הפעילות השוטפת (למשל, שירותי ענן של Google Firebase).
                </Text>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>5. אבטחת מידע</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    אנו מיישמים מערכות ונהלים מתקדמים לאבטחת מידע כדי להגן על המידע האישי שלך, אך איננו יכולים להבטיח חסינות מוחלטת מפני גישה בלתי מורשית.
                </Text>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>6. זכות לעיין במידע ולמחוק אותו</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    המשתמש רשאי לעיין במידע שנאסף עליו ולבקש את תיקונו או מחיקתו על ידי פנייה למנהלי העמותה.
                </Text>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>7. פנייה אלינו</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    בכל שאלה בנושא פרטיות ניתן לפנות אלינו דרך מנהלי המערכת באפליקציה.
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
