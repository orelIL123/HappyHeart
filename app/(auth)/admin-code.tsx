import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Header } from '@/components/Header';
import { preventFontScaling, androidTextFix, createShadow } from '@/constants/AndroidStyles';
import { Shield, AlertCircle } from 'lucide-react-native';

// Admin code - in production, this should be stored securely
const ADMIN_CODE = '1234';

export default function AdminCodeScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [code, setCode] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const handleVerify = () => {
    if (isLocked) {
      Alert.alert('חסום', 'ניסיונות רבים מדי. נסה שוב מאוחר יותר.');
      return;
    }

    if (code === ADMIN_CODE) {
      setCode('');
      setAttempts(0);
      router.push({
        pathname: '/(auth)/register',
        params: { role: 'admin' }
      });
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setCode('');

      if (newAttempts >= 3) {
        setIsLocked(true);
        Alert.alert('שגיאה', 'ניסיונות רבים מדי. חסום למשך זמן.');
      } else {
        Alert.alert(
          'שגיאה',
          `קוד מנהל לא נכון. נסיונות נותרים: ${3 - newAttempts}`
        );
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="אימות מנהל" showBackButton={true} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: colors.error + '15' }]}>
            <Shield size={48} color={colors.error} />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          הזן קוד מנהל
        </Text>

        <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
          רק מנהלי מערכת מורשים יכולים להירשם עם קוד מיוחד זה
        </Text>

        <View style={[styles.warningBox, { backgroundColor: colors.error + '10', borderColor: colors.error + '30' }]}>
          <AlertCircle size={20} color={colors.error} />
          <Text style={[styles.warningText, { color: colors.error }]}>
            קוד זה נדרש רק להרשמת מנהלי מערכת
          </Text>
        </View>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
              borderWidth: 1,
            }
          ]}
          placeholder="הזן את הקוד"
          placeholderTextColor={colors.tabIconDefault}
          value={code}
          onChangeText={setCode}
          secureTextEntry
          textAlign="center"
          editable={!isLocked}
          {...androidTextFix}
        />

        <TouchableOpacity
          style={[
            styles.verifyButton,
            { backgroundColor: isLocked ? colors.tabIconDefault : colors.primary, opacity: isLocked ? 0.5 : 1 }
          ]}
          onPress={handleVerify}
          disabled={isLocked || code.length === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.verifyButtonText}>אימות</Text>
        </TouchableOpacity>

        {attempts > 0 && attempts < 3 && (
          <Text style={[styles.attemptsText, { color: colors.secondary }]}>
            נסיונות נותרים: {3 - attempts}
          </Text>
        )}

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButtonContainer}
        >
          <Text style={[styles.backButton, { color: colors.primary }]}>חזור</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: Platform.OS === 'android' ? 120 : 100,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    ...androidTextFix,
    ...preventFontScaling,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    ...androidTextFix,
    ...preventFontScaling,
  },
  warningBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    ...androidTextFix,
    ...preventFontScaling,
  },
  input: {
    height: 56,
    borderRadius: 14,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 18,
    letterSpacing: 2,
    ...androidTextFix,
    ...preventFontScaling,
  },
  verifyButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    ...createShadow(4),
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    ...androidTextFix,
    ...preventFontScaling,
  },
  attemptsText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 20,
    ...androidTextFix,
    ...preventFontScaling,
  },
  backButtonContainer: {
    padding: 12,
    alignItems: 'center',
  },
  backButton: {
    fontSize: 14,
    fontWeight: '600',
    ...androidTextFix,
    ...preventFontScaling,
  },
});
