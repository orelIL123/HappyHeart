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
import { Building2, Clock3, FileText, ImagePlus, MapPin, Phone, ShieldAlert, Sparkles, Trash2, Users } from 'lucide-react-native';
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

function SectionCard({ title, subtitle, icon, children, colors }: any) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
      <View style={styles.sectionHead}>
        <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '15' }]}>{icon}</View>
        <View style={styles.sectionTextWrap}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
          {!!subtitle && <Text style={[styles.sectionSubtitle, { color: colors.tabIconDefault }]}>{subtitle}</Text>}
        </View>
      </View>
      {children}
    </View>
  );
}

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

  const institutionName = form.institution === 'אחר' ? form.customInstitution.trim() : form.institution;
  const startTimeHuman = `${form.startHour}:${form.startMinute}`;
  const endTimeHuman = `${form.endHour}:${form.endMinute}`;
  const titlePreview = `${institutionName || 'מוסד'}${form.department ? ` - ${form.department}` : ''}${form.population ? ` - ${form.population}` : ''}`;

  const requiredChecks = [
    !!institutionName,
    !!form.city,
    !!form.fullAddress.trim(),
    !!form.date,
    !!form.population,
    !!form.coordinatorName.trim(),
    !!form.coordinatorPhone.trim(),
    !!form.description.trim(),
  ];
  const completion = Math.round((requiredChecks.filter(Boolean).length / requiredChecks.length) * 100);

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
      <ScrollView style={styles.container} contentContainerStyle={styles.form}>
        <View style={[styles.heroCard, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '35' }]}>
          <View style={styles.heroTop}>
            <Sparkles size={18} color={colors.primary} />
            <Text style={[styles.heroTitle, { color: colors.text }]}>טופס יצירת פעילות</Text>
          </View>
          <Text style={[styles.heroSub, { color: colors.tabIconDefault }]}>הטופס מחולק לשלבים ברורים כדי לפרסם אירוע מהר וללא טעויות.</Text>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}> 
            <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${completion}%` }]} />
          </View>
          <Text style={[styles.progressLabel, { color: colors.primary }]}>{completion}% הושלם</Text>
        </View>

        <SectionCard
          colors={colors}
          icon={<Building2 size={18} color={colors.primary} />}
          title="שלב 1: מוסד ומיקום"
          subtitle="בחר מוסד, עיר וכתובת מלאה"
        >
          <Text style={[styles.label, { color: colors.text }]}>מוסד *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {[...INSTITUTIONS, 'אחר'].map(inst => (
              <TouchableOpacity
                key={inst}
                style={[styles.chip, form.institution === inst && { backgroundColor: colors.primary, borderColor: colors.primary }, { borderColor: colors.border }]}
                onPress={() => setForm({ ...form, institution: inst })}
              >
                <Text style={[styles.chipText, form.institution === inst ? { color: '#fff' } : { color: colors.text }]}>{inst}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {form.institution === 'אחר' && (
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="הזן שם מוסד"
              placeholderTextColor={colors.tabIconDefault}
              value={form.customInstitution}
              onChangeText={(text) => setForm({ ...form, customInstitution: text })}
              textAlign="right"
            />
          )}

          <Text style={[styles.label, { color: colors.text }]}>עיר *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {CITIES.map(city => (
              <TouchableOpacity
                key={city}
                style={[styles.chip, form.city === city && { backgroundColor: colors.accent, borderColor: colors.accent }, { borderColor: colors.border }]}
                onPress={() => setForm({ ...form, city })}
              >
                <Text style={[styles.chipText, form.city === city ? { color: '#fff' } : { color: colors.text }]}>{city}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { color: colors.text }]}>כתובת מלאה *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="רחוב ומספר בית"
            placeholderTextColor={colors.tabIconDefault}
            value={form.fullAddress}
            onChangeText={(text) => setForm({ ...form, fullAddress: text })}
            textAlign="right"
          />

          <Text style={[styles.label, { color: colors.text }]}>מחלקה (לא חובה)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="למשל: מיון ילדים, אונקולוגיה וכו'"
            placeholderTextColor={colors.tabIconDefault}
            value={form.department}
            onChangeText={(text) => setForm({ ...form, department: text })}
            textAlign="right"
          />
        </SectionCard>

        <SectionCard
          colors={colors}
          icon={<Clock3 size={18} color={colors.primary} />}
          title="שלב 2: מועד והרכב"
          subtitle="בחירה בגלילה לתאריך, שעה וכמות ליצנים"
        >
          <Text style={[styles.label, { color: colors.text }]}>תאריך *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {dateOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[styles.chip, form.date === option.value && { backgroundColor: colors.primary, borderColor: colors.primary }, { borderColor: colors.border }]}
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
          <View style={styles.optionRow}>
            {populations.map(pop => (
              <TouchableOpacity
                key={pop}
                style={[styles.optionChip, form.population === pop && { backgroundColor: colors.primary, borderColor: colors.primary }, { borderColor: colors.border }]}
                onPress={() => setForm({ ...form, population: pop })}
              >
                <Text style={[styles.chipText, form.population === pop ? { color: '#fff' } : { color: colors.text }]}>{pop}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>מספר ליצנים *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            keyboardType="numeric"
            value={form.requiredClowns}
            onChangeText={(text) => setForm({ ...form, requiredClowns: text })}
            textAlign="center"
          />
        </SectionCard>

        <SectionCard
          colors={colors}
          icon={<Phone size={18} color={colors.primary} />}
          title="שלב 3: רכז ועדכונים"
          subtitle="פרטי קשר והתנהגות אירוע"
        >
          <Text style={[styles.label, { color: colors.text }]}>שם רכז פעילות *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="שם מלא של רכז הפעילות"
            placeholderTextColor={colors.tabIconDefault}
            value={form.coordinatorName}
            onChangeText={(text) => setForm({ ...form, coordinatorName: text })}
            textAlign="right"
          />

          <Text style={[styles.label, { color: colors.text }]}>טלפון לבירורים *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="+972XXXXXXXXX"
            placeholderTextColor={colors.tabIconDefault}
            value={form.coordinatorPhone}
            onChangeText={(text) => setForm({ ...form, coordinatorPhone: text })}
            onBlur={() => setForm(prev => ({ ...prev, coordinatorPhone: formatPhoneNumber(prev.coordinatorPhone) }))}
            textAlign="right"
            keyboardType="phone-pad"
          />

          <View style={[styles.toggleCard, { backgroundColor: form.isUrgent ? colors.error + '10' : colors.background, borderColor: form.isUrgent ? colors.error : colors.border }]}>
            <View style={styles.toggleRow}>
              <Switch
                value={form.isUrgent}
                onValueChange={(v) => setForm({ ...form, isUrgent: v })}
                trackColor={{ false: colors.border, true: colors.error }}
                thumbColor="#fff"
              />
              <View style={styles.toggleRight}>
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

          <View style={[styles.toggleCard, { backgroundColor: colors.background, borderColor: colors.border }]}> 
            <View style={styles.toggleRow}>
              <Switch
                value={form.autoDelete}
                onValueChange={(v) => setForm({ ...form, autoDelete: v })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
              <View style={styles.toggleRight}>
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
        </SectionCard>

        <SectionCard
          colors={colors}
          icon={<FileText size={18} color={colors.primary} />}
          title="שלב 4: תיאור ומדיה"
          subtitle="תוכן ברור ותמונה מושכת"
        >
          <Text style={[styles.label, { color: colors.text }]}>תיאור הפעילות *</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
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
            style={[styles.imagePickerBox, { backgroundColor: colors.background, borderColor: colors.border }]}
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
        </SectionCard>

        <View style={[styles.previewCard, { backgroundColor: colors.secondary + '10', borderColor: colors.secondary + '40' }]}> 
          <View style={styles.previewTitleRow}>
            <MapPin size={16} color={colors.secondary} />
            <Text style={[styles.previewTitle, { color: colors.text }]}>תצוגה מקדימה</Text>
          </View>
          <Text style={[styles.previewMain, { color: colors.text }]} numberOfLines={2}>{titlePreview}</Text>
          <Text style={[styles.previewMeta, { color: colors.tabIconDefault }]}>{form.city}, {form.fullAddress || 'כתובת לא הוזנה'}</Text>
          <Text style={[styles.previewMeta, { color: colors.tabIconDefault }]}>{form.date} | {startTimeHuman} - {endTimeHuman}</Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }, (isSubmitting || uploadingImage) && { opacity: 0.7 }]}
          onPress={handleCreate}
          disabled={isSubmitting || uploadingImage}
        >
          {(isSubmitting || uploadingImage) ? <ActivityIndicator color="#fff" /> : (
            <View style={styles.submitInner}>
              <Users size={18} color="#fff" />
              <Text style={styles.submitButtonText}>פרסם פעילות</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 16,
    paddingBottom: Platform.OS === 'android' ? 120 : 100,
    gap: 12,
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  heroTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '900',
    ...androidTextFix,
    ...preventFontScaling,
  },
  heroSub: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'right',
    ...androidTextFix,
    ...preventFontScaling,
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressLabel: {
    marginTop: 6,
    fontWeight: '800',
    textAlign: 'right',
    ...androidTextFix,
    ...preventFontScaling,
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    ...createShadow(2),
  },
  sectionHead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sectionTextWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    ...androidTextFix,
    ...preventFontScaling,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 1,
    ...androidTextFix,
    ...preventFontScaling,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 7,
    marginTop: 10,
    ...androidTextFix,
    ...preventFontScaling,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 13,
    fontSize: 15,
    ...androidTextFix,
    ...preventFontScaling,
  },
  textArea: {
    height: 100,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row-reverse',
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginLeft: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    ...androidTextFix,
    ...preventFontScaling,
  },
  timeRow: {
    gap: 6,
  },
  timeScroller: {
    flexDirection: 'row-reverse',
    paddingVertical: 4,
  },
  timeChip: {
    minWidth: 52,
    height: 40,
    borderWidth: 1,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '800',
    ...androidTextFix,
    ...preventFontScaling,
  },
  optionRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 8,
  },
  optionChip: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleCard: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    justifyContent: 'space-between',
  },
  toggleRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
    ...androidTextFix,
    ...preventFontScaling,
  },
  rowSubtitle: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 1,
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
    marginTop: 4,
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
  previewCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  previewTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '800',
    ...androidTextFix,
    ...preventFontScaling,
  },
  previewMain: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
    ...androidTextFix,
    ...preventFontScaling,
  },
  previewMeta: {
    marginTop: 3,
    fontSize: 12,
    textAlign: 'right',
    ...androidTextFix,
    ...preventFontScaling,
  },
  submitButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    ...createShadow(4),
    ...androidButtonFix,
  },
  submitInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    ...androidTextFix,
    ...preventFontScaling,
  },
});
