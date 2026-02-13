import { Header } from '@/components/Header';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CITIES } from '@/constants/MockData';
import { useApp } from '@/context/AppContext';
import { Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function AvailabilityScreen() {
  const { isAvailable, toggleAvailability, availabilityDuration, availabilityLocation, currentUser } = useApp();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const durations = [
    { id: '1h', label: 'שעה' },
    { id: '2h', label: 'שעתיים' },
    { id: '4h', label: '4 שעות' },
    { id: 'today', label: 'עד סוף היום' },
  ];

  const [selectedDuration, setSelectedDuration] = useState(durations[1].id);
  const [selectedCity, setSelectedCity] = useState(currentUser?.preferredArea || CITIES[0]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="זמינות" showBackButton={false} />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={[styles.statusCard, { backgroundColor: isAvailable ? colors.success + '15' : colors.card, borderColor: isAvailable ? colors.success : colors.border }]}>
            <View style={styles.statusHeader}>
              <Zap size={32} color={isAvailable ? colors.success : colors.tabIconDefault} fill={isAvailable ? colors.success : 'none'} />
              <View style={styles.statusTextContainer}>
                <Text style={[styles.statusTitle, { color: colors.text }]}>
                  {isAvailable ? 'אתה זמין להקפצה!' : 'כרגע לא זמין'}
                </Text>
                <Text style={[styles.statusSub, { color: colors.tabIconDefault }]}>
                  {isAvailable ? `נמצא ב${selectedCity} למשך ${durations.find(d => d.id === availabilityDuration)?.label || ''}` : 'הפעל זמינות כדי לקבל התראות על הקפצות באזורך'}
                </Text>
              </View>
              <Switch
                value={isAvailable}
                onValueChange={() => toggleAvailability(selectedDuration, selectedCity)}
                trackColor={{ false: '#767577', true: colors.success }}
                thumbColor={isAvailable ? '#f4f3f4' : '#f4f3f4'}
              />
            </View>
          </View>

          {!isAvailable && (
            <View style={styles.settingsSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>הגדרות זמינות</Text>

              <View style={styles.settingGroup}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>בחר מיקום</Text>
                <View style={styles.cityGrid}>
                  {CITIES.map(city => (
                    <TouchableOpacity
                      key={city}
                      style={[
                        styles.cityChip,
                        selectedCity === city && { backgroundColor: colors.accent, borderColor: colors.accent },
                        { borderColor: colors.border }
                      ]}
                      onPress={() => setSelectedCity(city)}
                    >
                      <Text style={[styles.cityChipText, selectedCity === city && { color: '#fff' }, { color: colors.text }]}>{city}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.settingGroup}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>לכמה זמן?</Text>
                <View style={styles.durationRow}>
                  {durations.map(d => (
                    <TouchableOpacity
                      key={d.id}
                      style={[
                        styles.durationOption,
                        selectedDuration === d.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                        { borderColor: colors.border }
                      ]}
                      onPress={() => setSelectedDuration(d.id)}
                    >
                      <Text style={[styles.durationText, selectedDuration === d.id && { color: '#fff' }, { color: colors.text }]}>{d.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: colors.primary }]}
                onPress={() => toggleAvailability(selectedDuration, selectedCity)}
              >
                <Text style={styles.mainButtonText}>אני זמין עכשיו!</Text>
              </TouchableOpacity>
            </View>
          )}

          {isAvailable && (
            <View style={[styles.alertBox, { backgroundColor: colors.success + '10', borderColor: colors.success }]}>
              <Zap size={24} color={colors.success} fill={colors.success} />
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={[styles.alertText, { color: colors.text }]}>
                  מצב הקפצה פעיל ב{availabilityLocation}!
                </Text>
                <Text style={[styles.alertSubText, { color: colors.tabIconDefault }]}>
                  המיקום שלך עודכן כרגע ל{availabilityLocation}. תקבל התראות דחופות לפני כולם באזור זה.
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 30,
  },
  statusCard: {
    borderRadius: 24,
    padding: 25,
    borderWidth: 2,
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  statusHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusTextContainer: {
    flex: 1,
    paddingRight: 15,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  statusSub: {
    fontSize: 14,
    textAlign: 'right',
    marginTop: 4,
  },
  settingsSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 20,
  },
  settingGroup: {
    marginBottom: 25,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 12,
  },
  cityGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  cityChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginLeft: 10,
    marginBottom: 10,
  },
  cityChipText: {
    fontSize: 14,
  },
  durationRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  durationOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  durationText: {
    fontSize: 13,
    fontWeight: '600',
  },
  mainButton: {
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  alertBox: {
    flexDirection: 'row-reverse',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 20,
  },
  alertText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  alertSubText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
});
