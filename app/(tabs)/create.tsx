import { Header } from '@/components/Header';
import { useColorScheme } from '@/components/useColorScheme';
import { androidButtonFix, androidTextFix, createShadow, preventFontScaling } from '@/constants/AndroidStyles';
import Colors from '@/constants/Colors';
import { CITIES, INSTITUTIONS } from '@/constants/MockData';
import { useApp } from '@/context/AppContext';
import { firebaseService } from '@/services/firebaseService';
import { formatPhoneNumber } from '@/utils/phoneFormatter';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ImagePlus, ShieldAlert, Trash2 } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

const pad = (n: number) => String(n).padStart(2, '0');

const buildDateOptions = () => {
  const today = new Date();
  return Array.from({ length: 60 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const label = d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', weekday: 'short' });
    return { value, label };
  });
};

const hourOptions = Array.from({ length: 24 }, (_, h) => pad(h));
const minuteOptions = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export default function CreateActivityScreen() {
  const { createActivity, currentUser } = useApp();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  if (!currentUser || (currentUser.role !== 'organizer' && currentUser.role !== 'admin')) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Header title="יצירת פעילות" showBackButton={true} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <ShieldAlert size={48} color={colors.error} />
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 16, textAlign: 'center' }}>
            רק רכזי פעילויות ומנהלים יכולים ליצור פעילויות
          </Text>
          <Text style={{ fontSize: 14, color: colors.tabIconDefault, marginTop: 8, textAlign: 'center' }}>
            אם אתה רוצה ליצור פעילויות, אנא פנה למנהל המערכת
          </Text>
          <TouchableOpacity
            style={{ marginTop: 24, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 12 }}
            onPress={() => router.back()}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>חזור</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const populations = ['ילדים', 'נוער', 'מבוגרים'];
  const dateOptions = useMemo(buildDateOptions, []);

  const [form, setForm] = useState({
    institution: INSTITUTIONS[0],
    customInstitution: '',
    city: CITIES[0],
    fullAddress: '',
    department: '',
    date: dateOptions[0]?.value || new Date().toISOString().split('T')[0],
    startHour: '10',
    startMinute: '00',
    endHour: '12',
    endMinute: '00',
    population: '',
    requiredClowns: '2',
    coordinatorName: '',
    coordinatorPhone: '+972',
    description: '',
    isUrgent: false,
    autoDelete: true,
  });

  const [activityImageUri, setActivityImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickActivityImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('הרשאה נדרשת', 'נדרשת גישה לגלריה להעלאת תמונה.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) setActivityImageUri(result.assets[0].uri);
  };

  const handleCreate = async () => {
    if (!form.city || !form.fullAddress || !form.description || !form.coordinatorName || !form.coordinatorPhone || !form.population) {
      Alert.alert('שגיאה', 'אנא מלא את כל שדות החובה');
      return;
    }

    const institutionName = form.institution === 'אחר' ? form.customInstitution.trim() : form.institution;
    if (form.institution === 'אחר' && !institutionName) {
      Alert.alert('שגיאה', 'אנא הזן שם מוסד');
      return;
    }

    const startTime = `${form.date}T${form.startHour}:${form.startMinute}:00Z`;
    const endTime = `${form.date}T${form.endHour}:${form.endMinute}:00Z`;

    if (new Date(endTime).getTime() <= new Date(startTime).getTime()) {
      Alert.alert('שגיאה', 'שעת הסיום חייבת להיות אחרי שעת ההתחלה');
      return;
    }

    const title = `${institutionName}${form.department ? ` - ${form.department}` : ''} - ${form.population}`;
    const approvalStatus = currentUser.role === 'admin' ? 'approved' : 'pending';

    const formattedCoordinatorPhone = formatPhoneNumber(form.coordinatorPhone);
    const wazeLink = `https://waze.com/ul?q=${encodeURIComponent(`${form.fullAddress}, ${form.city}`)}&navigate=yes`;

    let expirationDate = undefined;
    if (form.autoDelete) {
      const endDateTime = new Date(endTime);
      endDateTime.setDate(endDateTime.getDate() + 1);
      expirationDate = endDateTime.toISOString();
    }

    setIsSubmitting(true);
    try {
      const activityId = await createActivity({
        title,
        institution: institutionName,
        location: form.city,
        city: form.city,
        fullAddress: form.fullAddress,
        wazeLink,
        description: form.description,
        requiredClowns: parseInt(form.requiredClowns, 10),
        type: 'one-time',
        startTime,
        endTime,
        organizerId: currentUser.id,
        contactPerson: form.coordinatorName,
        contactPhone: formattedCoordinatorPhone,
        isUrgent: form.isUrgent,
        expirationDate,
        approvalStatus,
      });

      if (activityImageUri) {
        setUploadingImage(true);
        try {
          await firebaseService.uploadActivityImage(activityId, activityImageUri);
        } catch (imgErr) {
          console.error('Error uploading activity image:', imgErr);
          Alert.alert('הפעילות נוצרה', 'הפעילות נשמרה אך העלאת התמונה נכשלה.');
        } finally {
          setUploadingImage(false);
        }
      }

      Alert.alert('הצלחה', 'הפעילות נוצרה בהצלחה!');
      router.push('/');
    } catch (error: any) {
      console.error('Error creating activity:', error);
      let errorMessage = 'ארעה שגיאה ביצירת הפעילות';

      if (error?.code === 'permission-denied') {
        errorMessage = 'אין לך הרשאה ליצור פעילויות. אנא פנה למנהל המערכת.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert('שגיאה', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="יצירת פעילות" showBackButton={false} />
      <ScrollView style={styles.container}>
        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.text }]}>מוסד *</Text>
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
                  <Text style={[styles.chipText, form.institution === inst ? { color: '#fff' } : { color: colors.text }]}>{inst}</Text>
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

          <Text style={[styles.label, { color: colors.text }]}>מיקום - עיר *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {CITIES.map(city => (
              <TouchableOpacity
                key={city}
                style={[
                  styles.chip,
                  form.city === city && { backgroundColor: colors.accent, borderColor: colors.accent },
                  { borderColor: colors.border }
                ]}
                onPress={() => setForm({ ...form, city })}
              >
                <Text style={[styles.chipText, form.city === city ? { color: '#fff' } : { color: colors.text }]}>{city}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { color: colors.text }]}>כתובת מלאה *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="רחוב ומספר בית"
            placeholderTextColor={colors.tabIconDefault}
            value={form.fullAddress}
            onChangeText={(text) => setForm({ ...form, fullAddress: text })}
            textAlign="right"
          />

          <Text style={[styles.label, { color: colors.text }]}>מחלקה (לא חובה)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="למשל: מיון ילדים, אונקולוגיה וכו'"
            placeholderTextColor={colors.tabIconDefault}
            value={form.department}
            onChangeText={(text) => setForm({ ...form, department: text })}
            textAlign="right"
          />

          <Text style={[styles.label, { color: colors.text }]}>תאריך *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {dateOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.chip,
                  form.date === option.value && { backgroundColor: colors.primary, borderColor: colors.primary },
                  { borderColor: colors.border }
                ]}
                onPress={() => setForm({ ...form, date: option.value })}
              >
                <Text style={[styles.chipText, form.date === option.value ? { color: '#fff' } : { color: colors.text }]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { color: colors.text }]}>שעת התחלה *</Text>
          <View style={styles.timeRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeScroller}>
              {hourOptions.map(hour => (
                <TouchableOpacity
                  key={`start-h-${hour}`}
                  style={[styles.timeChip, form.startHour === hour && { backgroundColor: colors.primary }, { borderColor: colors.border }]}
                  onPress={() => setForm({ ...form, startHour: hour })}
                >
                  <Text style={[styles.timeChipText, { color: form.startHour === hour ? '#fff' : colors.text }]}>{hour}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeScroller}>
              {minuteOptions.map(min => (
                <TouchableOpacity
                  key={`start-m-${min}`}
                  style={[styles.timeChip, form.startMinute === min && { backgroundColor: colors.primary }, { borderColor: colors.border }]}
                  onPress={() => setForm({ ...form, startMinute: min })}
                >
                  <Text style={[styles.timeChipText, { color: form.startMinute === min ? '#fff' : colors.text }]}>{min}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>שעת סיום *</Text>
          <View style={styles.timeRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeScroller}>
              {hourOptions.map(hour => (
                <TouchableOpacity
                  key={`end-h-${hour}`}
                  style={[styles.timeChip, form.endHour === hour && { backgroundColor: colors.accent }, { borderColor: colors.border }]}
                  onPress={() => setForm({ ...form, endHour: hour })}
                >
                  <Text style={[styles.timeChipText, { color: form.endHour === hour ? '#fff' : colors.text }]}>{hour}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeScroller}>
              {minuteOptions.map(min => (
                <TouchableOpacity
                  key={`end-m-${min}`}
                  style={[styles.timeChip, form.endMinute === min && { backgroundColor: colors.accent }, { borderColor: colors.border }]}
                  onPress={() => setForm({ ...form, endMinute: min })}
                >
                  <Text style={[styles.timeChipText, { color: form.endMinute === min ? '#fff' : colors.text }]}>{min}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>אוכלוסיה *</Text>
          <View style={styles.pickerContainer}>
            <View style={styles.optionRow}>
              {populations.map(pop => (
                <TouchableOpacity
                  key={pop}
                  style={[
                    styles.optionChip,
                    form.population === pop && { backgroundColor: colors.primary, borderColor: colors.primary },
                    { borderColor: colors.border }
                  ]}
                  onPress={() => setForm({ ...form, population: pop })}
                >
                  <Text style={[styles.chipText, form.population === pop ? { color: '#fff' } : { color: colors.text }]}>
                    {pop}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>מספר ליצנים *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            keyboardType="numeric"
            value={form.requiredClowns}
            onChangeText={(text) => setForm({ ...form, requiredClowns: text })}
            textAlign="center"
          />

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
            placeholder="+972XXXXXXXXX"
            placeholderTextColor={colors.tabIconDefault}
            value={form.coordinatorPhone}
            onChangeText={(text) => setForm({ ...form, coordinatorPhone: text })}
            onBlur={() => setForm(prev => ({ ...prev, coordinatorPhone: formatPhoneNumber(prev.coordinatorPhone) }))}
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

          <Text style={[styles.label, { color: colors.text }]}>תמונת פעילות (לא חובה)</Text>
          <TouchableOpacity
            style={[styles.imagePickerBox, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handlePickActivityImage}
            disabled={uploadingImage}
          >
            {activityImageUri ? (
              <>
                <Image source={{ uri: activityImageUri }} style={styles.pickedImage} resizeMode="cover" />
                {uploadingImage && (
                  <View style={[StyleSheet.absoluteFill, styles.imageUploadOverlay]}>
                    <ActivityIndicator color="#fff" />
                  </View>
                )}
              </>
            ) : (
              <View style={styles.imagePickerPlaceholder}>
                <ImagePlus size={36} color={colors.tabIconDefault} />
                <Text style={[styles.imagePickerText, { color: colors.tabIconDefault }]}>לחץ להוספת תמונה</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }, (isSubmitting || uploadingImage) && { opacity: 0.7 }]}
            onPress={handleCreate}
            disabled={isSubmitting || uploadingImage}
          >
            {(isSubmitting || uploadingImage) ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>פרסם פעילות</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  timeRow: {
    gap: 8,
  },
  timeScroller: {
    flexDirection: 'row-reverse',
    paddingVertical: 4,
  },
  timeChip: {
    minWidth: 52,
    height: 42,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: '800',
    ...androidTextFix,
    ...preventFontScaling,
  },
  optionRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  optionChip: {
    flex: 1,
    height: 45,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
  imagePickerBox: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 8,
  },
  pickedImage: {
    width: '100%',
    height: '100%',
  },
  imageUploadOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 14,
    ...androidTextFix,
    ...preventFontScaling,
  },
});
