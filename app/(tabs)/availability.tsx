import { Header } from '@/components/Header';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { AvailabilitySlot } from '@/constants/MockData';
import { getRegionForLocation, RegionId, REGIONS } from '@/constants/Regions';
import { useApp } from '@/context/AppContext';
import { firebaseService } from '@/services/firebaseService';
import { notificationService } from '@/services/notificationService';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Plus, Trash2, Zap } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const pad = (n: number) => String(n).padStart(2, '0');
const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hourOptions = Array.from({ length: 24 }, (_, h) => pad(h));
const minuteOptions = ['00', '15', '30', '45'];

const monthLabel = (date: Date) => date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

const buildCalendarCells = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = firstDay.getDay();

  const cells: Array<{ date?: Date }> = [];
  for (let i = 0; i < leading; i++) cells.push({});
  for (let day = 1; day <= daysInMonth; day++) cells.push({ date: new Date(year, month, day) });
  while (cells.length % 7 !== 0) cells.push({});
  return cells;
};

export default function AvailabilityScreen() {
  const {
    isAvailable,
    toggleAvailability,
    saveFutureAvailabilitySlots,
    availabilityDuration,
    availabilityRegions,
    registerForNotifications,
    currentUser
  } = useApp();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const durations = [
    { id: '1h', label: 'שעה' },
    { id: '2h', label: 'שעתיים' },
    { id: '4h', label: '4 שעות' },
    { id: 'today', label: 'עד סוף היום' },
  ];

  const initialRegion = getRegionForLocation(currentUser?.preferredArea || 'מרכז');

  const [selectedDuration, setSelectedDuration] = useState(durations[1].id);
  const [selectedRegions, setSelectedRegions] = useState<RegionId[]>([initialRegion]);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(toYmd(new Date()));
  const [selectedHour, setSelectedHour] = useState('10');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [slotDuration, setSlotDuration] = useState('2h');
  const [slotRegions, setSlotRegions] = useState<RegionId[]>([initialRegion]);
  const [futureSlots, setFutureSlots] = useState<AvailabilitySlot[]>(currentUser?.futureAvailabilitySlots || []);

  useEffect(() => {
    setFutureSlots(currentUser?.futureAvailabilitySlots || []);
  }, [currentUser?.futureAvailabilitySlots]);

  useEffect(() => {
    if (availabilityRegions.length > 0) {
      setSelectedRegions(availabilityRegions);
      setSlotRegions(availabilityRegions);
    }
  }, [availabilityRegions]);

  const cells = useMemo(() => buildCalendarCells(currentMonth), [currentMonth]);

  const toggleRegion = (
    current: RegionId[],
    region: RegionId,
    setter: React.Dispatch<React.SetStateAction<RegionId[]>>
  ) => {
    if (current.includes(region)) {
      setter(current.filter(r => r !== region));
      return;
    }
    setter([...current, region]);
  };

  const addFutureSlot = () => {
    const now = new Date();
    const selectedDateTime = new Date(`${selectedDate}T${selectedHour}:${selectedMinute}:00`);

    if (selectedDateTime.getTime() <= now.getTime()) {
      Alert.alert('שעה לא תקינה', 'אפשר להוסיף זמינות עתידית בלבד.');
      return;
    }

    if (slotRegions.length === 0) {
      Alert.alert('חסר אזור', 'בחר לפחות אזור אחד עבור המועד.');
      return;
    }

    const newSlot: AvailabilitySlot = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: selectedDate,
      startTime: `${selectedHour}:${selectedMinute}`,
      duration: slotDuration,
      location: slotRegions.join(', '),
    };

    const updated = [...futureSlots, newSlot].sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
    setFutureSlots(updated);
    Alert.alert('נוסף', 'התווסף מועד זמינות עתידי.');
  };

  const removeFutureSlot = (slotId: string) => {
    setFutureSlots(prev => prev.filter(slot => slot.id !== slotId));
  };

  const saveAvailabilityNow = () => {
    if (!isAvailable && selectedRegions.length === 0) {
      Alert.alert('חסר אזור', 'יש לבחור לפחות אזור אחד לפני הפעלת זמינות.');
      return;
    }
    toggleAvailability(
      isAvailable ? availabilityDuration || selectedDuration : selectedDuration,
      isAvailable ? availabilityRegions : selectedRegions,
      futureSlots
    );
  };

  const persistSlotsOnly = async () => {
    if (!currentUser) return;
    const regionsToSave = isAvailable ? availabilityRegions : selectedRegions;
    if (regionsToSave.length === 0) {
      Alert.alert('חסר אזור', 'יש לבחור לפחות אזור אחד לפני שמירה.');
      return;
    }
    try {
      await saveFutureAvailabilitySlots(
        futureSlots,
        regionsToSave,
        availabilityDuration || selectedDuration
      );
      Alert.alert('נשמר', 'הזמינות העתידית עודכנה בהצלחה.');
    } catch (error) {
      Alert.alert('שגיאה', 'לא הצלחנו לשמור את הזמינות העתידית.');
    }
  };

  const runNotificationSelfCheck = async () => {
    if (!currentUser) return;
    try {
      await registerForNotifications();
      const tokenRows = await firebaseService.getUserPushTokens([currentUser.id]);
      const token = tokenRows[0]?.pushToken;

      await notificationService.sendLocalNotification(
        'בדיקת התראה 🔔',
        'זוהי התראת בדיקה אישית ממסך הזמינות.'
      );

      Alert.alert(
        'בדיקה הושלמה',
        token
          ? 'נמצא טוקן עדכונים והתראת בדיקה נשלחה בהצלחה.'
          : 'לא נמצא טוקן עדכונים כרגע, אבל התראת בדיקה מקומית נשלחה.'
      );
    } catch (error) {
      Alert.alert('שגיאה', 'בדיקת ההתראות נכשלה. נסה שוב.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="זמינות" showBackButton={false} />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={[styles.statusCard, { backgroundColor: isAvailable ? colors.success + '15' : colors.card, borderColor: isAvailable ? colors.success : colors.border }]}> 
            <View style={styles.statusHeader}>
              <Zap size={32} color={isAvailable ? colors.success : colors.tabIconDefault} fill={isAvailable ? colors.success : 'none'} />
              <View style={styles.statusTextContainer}>
                <Text style={[styles.statusTitle, { color: colors.text }]}>{isAvailable ? 'אתה זמין להקפצה!' : 'כרגע לא זמין'}</Text>
                <Text style={[styles.statusSub, { color: colors.tabIconDefault }]}>
                  {isAvailable
                    ? `זמין באזורים: ${availabilityRegions.join(', ')} למשך ${durations.find(d => d.id === availabilityDuration)?.label || ''}`
                    : 'הפעל זמינות כדי לקבל התראות על הקפצות באזורך'}
                </Text>
              </View>
              <Switch
                value={isAvailable}
                onValueChange={saveAvailabilityNow}
                trackColor={{ false: '#767577', true: colors.success }}
                thumbColor="#f4f3f4"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.testNotificationButton, { borderColor: colors.primary }]}
            onPress={runNotificationSelfCheck}
          >
            <Text style={[styles.testNotificationText, { color: colors.primary }]}>בדיקת טוקן/התראה</Text>
          </TouchableOpacity>

          {!isAvailable && (
            <View style={styles.settingsSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>הגדרות זמינות מיידית</Text>

              <View style={styles.settingGroup}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>בחר אזורים</Text>
                <View style={styles.cityGrid}>
                  {REGIONS.map(region => (
                    <TouchableOpacity
                      key={region.id}
                      style={[
                        styles.cityChip,
                        selectedRegions.includes(region.id) && { backgroundColor: colors.accent, borderColor: colors.accent },
                        { borderColor: colors.border }
                      ]}
                      onPress={() => toggleRegion(selectedRegions, region.id, setSelectedRegions)}
                    >
                      <Text style={[styles.cityChipText, selectedRegions.includes(region.id) ? { color: '#fff' } : { color: colors.text }]}>{region.label}</Text>
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
                      <Text style={[styles.durationText, selectedDuration === d.id ? { color: '#fff' } : { color: colors.text }]}>{d.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={[styles.mainButton, { backgroundColor: colors.primary }]} onPress={saveAvailabilityNow}>
                <Text style={styles.mainButtonText}>אני זמין עכשיו!</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.futureSection, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={styles.futureHeader}>
              <CalendarDays size={20} color={colors.primary} />
              <Text style={[styles.futureTitle, { color: colors.text }]}>זמינות עתידית (לוח חודשי)</Text>
            </View>

            <View style={styles.monthHeader}>
              <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                <ChevronLeft size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.monthLabel, { color: colors.text }]}>{monthLabel(currentMonth)}</Text>
              <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                <ChevronRight size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
              {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(day => (
                <Text key={day} style={[styles.weekDay, { color: colors.tabIconDefault }]}>{day}</Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((cell, idx) => {
                if (!cell.date) return <View key={`empty-${idx}`} style={styles.dayCell} />;

                const value = toYmd(cell.date);
                const isSelected = value === selectedDate;
                const hasSlot = futureSlots.some(slot => slot.date === value);

                return (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.dayCell,
                      styles.dayButton,
                      { borderColor: colors.border },
                      isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                      hasSlot && !isSelected && { backgroundColor: colors.primary + '12' },
                    ]}
                    onPress={() => setSelectedDate(value)}
                  >
                    <Text style={[styles.dayText, { color: isSelected ? '#fff' : colors.text }]}>{cell.date.getDate()}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.settingLabel, { color: colors.text, marginTop: 12 }]}>שעת התחלה</Text>
            <View style={styles.timeRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollChips}>
                {hourOptions.map(hour => (
                  <TouchableOpacity
                    key={`h-${hour}`}
                    style={[styles.timeChip, { borderColor: colors.border }, selectedHour === hour && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => setSelectedHour(hour)}
                  >
                    <Text style={[styles.timeChipText, { color: selectedHour === hour ? '#fff' : colors.text }]}>{hour}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollChips}>
                {minuteOptions.map(min => (
                  <TouchableOpacity
                    key={`m-${min}`}
                    style={[styles.timeChip, { borderColor: colors.border }, selectedMinute === min && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                    onPress={() => setSelectedMinute(min)}
                  >
                    <Text style={[styles.timeChipText, { color: selectedMinute === min ? '#fff' : colors.text }]}>{min}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={[styles.settingLabel, { color: colors.text }]}>משך</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollChips}>
              {durations.map(d => (
                <TouchableOpacity
                  key={`slot-${d.id}`}
                  style={[styles.slotChip, { borderColor: colors.border }, slotDuration === d.id && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setSlotDuration(d.id)}
                >
                  <Text style={[styles.slotChipText, { color: slotDuration === d.id ? '#fff' : colors.text }]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.settingLabel, { color: colors.text }]}>אזורים</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollChips}>
              {REGIONS.map(region => (
                <TouchableOpacity
                  key={`slot-region-${region.id}`}
                  style={[styles.slotChip, { borderColor: colors.border }, slotRegions.includes(region.id) && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                  onPress={() => toggleRegion(slotRegions, region.id, setSlotRegions)}
                >
                  <Text style={[styles.slotChipText, { color: slotRegions.includes(region.id) ? '#fff' : colors.text }]}>{region.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={[styles.addSlotButton, { backgroundColor: colors.primary }]} onPress={addFutureSlot}>
              <Plus size={18} color="#fff" />
              <Text style={styles.addSlotText}>הוסף מועד</Text>
            </TouchableOpacity>

            {futureSlots.length > 0 && (
              <View style={styles.slotsList}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 16 }]}>מועדים שנבחרו</Text>
                {futureSlots.map(slot => (
                  <View key={slot.id} style={[styles.slotItem, { borderColor: colors.border, backgroundColor: colors.background }]}> 
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.slotTitle, { color: colors.text }]}>{slot.date} | {slot.startTime}</Text>
                      <Text style={[styles.slotMeta, { color: colors.tabIconDefault }]}>{slot.location} | {durations.find(d => d.id === slot.duration)?.label || slot.duration}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeFutureSlot(slot.id)}>
                      <Trash2 size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity style={[styles.saveSlotsButton, { borderColor: colors.primary }]} onPress={persistSlotsOnly}>
                  <Clock3 size={16} color={colors.primary} />
                  <Text style={[styles.saveSlotsText, { color: colors.primary }]}>שמור זמינות עתידית</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {isAvailable && (
            <View style={[styles.alertBox, { backgroundColor: colors.success + '10', borderColor: colors.success }]}> 
              <Zap size={24} color={colors.success} fill={colors.success} />
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={[styles.alertText, { color: colors.text }]}>מצב הקפצה פעיל באזורי הבחירה שלך!</Text>
                <Text style={[styles.alertSubText, { color: colors.tabIconDefault }]}>האזורים הפעילים שלך: {availabilityRegions.join(', ')}. תקבל התראות רק באזורים שסימנת ולזמן שהוגדר.</Text>
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
    paddingBottom: Platform.OS === 'android' ? 130 : 90,
  },
  statusCard: {
    borderRadius: 24,
    padding: 22,
    borderWidth: 2,
    marginBottom: 22,
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
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  statusSub: {
    fontSize: 14,
    textAlign: 'right',
    marginTop: 4,
  },
  settingsSection: {
    marginTop: 2,
    marginBottom: 24,
  },
  testNotificationButton: {
    borderWidth: 1,
    borderRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  testNotificationText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 14,
  },
  settingGroup: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 10,
  },
  cityGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
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
    fontWeight: '700',
  },
  mainButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  futureSection: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  futureHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  futureTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  monthHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekDay: {
    width: '14.2%',
    textAlign: 'center',
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dayButton: {
    borderWidth: 1,
    borderRadius: 10,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '700',
  },
  timeRow: {
    marginBottom: 10,
    gap: 6,
  },
  scrollChips: {
    flexDirection: 'row-reverse',
    paddingVertical: 2,
  },
  timeChip: {
    minWidth: 50,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  timeChipText: {
    fontWeight: '700',
  },
  slotChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 8,
  },
  slotChipText: {
    fontWeight: '700',
    fontSize: 13,
  },
  addSlotButton: {
    marginTop: 12,
    borderRadius: 12,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row-reverse',
    gap: 8,
  },
  addSlotText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  slotsList: {
    marginTop: 16,
  },
  slotItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  slotTitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  slotMeta: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'right',
  },
  saveSlotsButton: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row-reverse',
    gap: 7,
  },
  saveSlotsText: {
    fontWeight: '700',
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
