import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Users, Briefcase, Shield } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Header } from '@/components/Header';
import { preventFontScaling, androidTextFix, createShadow } from '@/constants/AndroidStyles';

export default function RoleSelectScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [selectedRole, setSelectedRole] = useState<'clown' | 'organizer' | 'admin' | null>(null);

  const roles = [
    {
      id: 'clown',
      label: 'ליצן',
      description: 'הצטרף כליצן רפואי להקפצת חולים',
      icon: Users,
      color: colors.secondary,
    },
    {
      id: 'organizer',
      label: 'רכז פעילות',
      description: 'ארגן ותאם פעילויות בבתי חולים',
      icon: Briefcase,
      color: colors.accent,
    },
    {
      id: 'admin',
      label: 'מנהל מערכת',
      description: 'ניהול מערכת, ליצנים ופעילויות',
      icon: Shield,
      color: colors.error,
    },
  ];

  const handleContinue = () => {
    if (selectedRole === 'admin') {
      router.push({
        pathname: '/(auth)/admin-code',
        params: { role: selectedRole }
      });
    } else {
      router.push({
        pathname: '/(auth)/register',
        params: { role: selectedRole }
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="בחירת תפקיד" showBackButton={true} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.mainTitle, { color: colors.text }]}>
          בחר את התפקיד שלך
        </Text>
        <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
          בחר את התפקיד המתאים לך בקהילת שמחת הלב
        </Text>

        <View style={styles.rolesContainer}>
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <TouchableOpacity
                key={role.id}
                style={[
                  styles.roleCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: selectedRole === role.id ? role.color : colors.border,
                    borderWidth: selectedRole === role.id ? 2 : 1,
                  }
                ]}
                onPress={() => setSelectedRole(role.id as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.roleIcon, { backgroundColor: role.color + '20' }]}>
                  <Icon size={36} color={role.color} />
                </View>
                <Text style={[styles.roleLabel, { color: colors.text }]}>
                  {role.label}
                </Text>
                <Text style={[styles.roleDescription, { color: colors.tabIconDefault }]}>
                  {role.description}
                </Text>
                {selectedRole === role.id && (
                  <View style={[styles.checkmark, { backgroundColor: role.color }]}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: colors.primary, opacity: selectedRole ? 1 : 0.5 }
          ]}
          onPress={handleContinue}
          disabled={!selectedRole}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>המשך</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonContainer}>
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
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 8,
    ...androidTextFix,
    ...preventFontScaling,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 30,
    lineHeight: 22,
    ...androidTextFix,
    ...preventFontScaling,
  },
  rolesContainer: {
    marginBottom: 30,
  },
  roleCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
    ...createShadow(2),
  },
  roleIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
    ...androidTextFix,
    ...preventFontScaling,
  },
  roleDescription: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    ...androidTextFix,
    ...preventFontScaling,
  },
  checkmark: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    ...createShadow(4),
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
