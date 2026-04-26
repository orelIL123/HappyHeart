import { Header } from '@/components/Header';
import { useColorScheme } from '@/components/useColorScheme';
import { androidButtonFix, androidTextFix, createShadow, preventFontScaling } from '@/constants/AndroidStyles';
import Colors from '@/constants/Colors';
import { CITIES, INSTITUTIONS, User } from '@/constants/MockData';
import { useApp } from '@/context/AppContext';
import { ActivityMediaUpload, firebaseService } from '@/services/firebaseService';
import { formatPhoneNumber } from '@/utils/phoneFormatter';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Building2, Clock3, FileText, ImagePlus, Phone, PlayCircle, ShieldAlert, Sparkles, Trash2 } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
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

type StepId = 0 | 1 | 2 | 3 | 4;

export default function CreateActivityScreen() {
  const { createActivity, currentUser } = useApp();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const populations = ['ילדים', 'נוער', 'מבוגרים'];
  const dateOptions = useMemo(buildDateOptions, []);

  const [step, setStep] = useState<StepId>(0);
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

  const [activityMedia, setActivityMedia] = useState<ActivityMediaUpload | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coordinators, setCoordinators] = useState<User[]>([]);
  const [activityCreationOpenToAll, setActivityCreationOpenToAll] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  const institutionName = form.institution === 'אחר' ? form.customInstitution.trim() : form.institution;
  const canCreateActivities = !!currentUser && (
    currentUser.role === 'admin' ||
    currentUser.role === 'organizer' ||
    activityCreationOpenToAll
  );

  useEffect(() => {
    const loadCoordinators = async () => {
      try {
        const users = await firebaseService.getAllUsers();
        setCoordinators(users.filter(user => user.role === 'organizer' || user.role === 'admin'));
      } catch (error) {
        console.error('Failed to load coordinators:', error);
      }
    };
    loadCoordinators();
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        const settings = await firebaseService.getAppSettings();
        if (mounted) {
          setActivityCreationOpenToAll(settings.activityCreationOpenToAll);
        }
      } catch (error) {
        console.error('Failed to load app settings:', error);
      } finally {
        if (mounted) {
          setIsLoadingPermissions(false);
        }
      }
    };

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const PHOTO_ACCESS_MESSAGE =
    'האפליקציה משתמשת בגלריה כדי לאפשר לך להעלות תמונות וסרטוני הסבר לפעילויות בתוך האפליקציה.';

  const handlePickActivityMedia = async () => {
    Alert.alert(
      'בחירת מדיה',
      PHOTO_ACCESS_MESSAGE + '\n\nלהמשיך ולאפשר גישה?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'הבנתי, המשך',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('הרשאה נדרשת', 'נדרשת גישה לגלריה להעלאת תמונה או וידאו.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images', 'videos'],
              allowsEditing: false,
              quality: 0.8,
            });
            if (!result.canceled && result.assets?.[0]) {
              const asset = result.assets[0];
              setActivityMedia({
                uri: asset.uri,
                type: asset.type === 'video' ? 'video' : 'image',
                fileName: asset.fileName,
                mimeType: asset.mimeType,
              });

              if (asset.type === 'video' && asset.width && asset.height) {
                const ratio = asset.width / asset.height;
                if (Math.abs(ratio - 16 / 9) > 0.2) {
                  Alert.alert('הערה', 'מומלץ לבחור וידאו ביחס 16:9 כדי שייראה נכון במסך הפעילות.');
                }
              }
            }
          },
        },
      ]
    );
  };

  const validateStep = (targetStep: StepId) => {
    if (targetStep === 1) {
      if (!institutionName || !form.city || !form.fullAddress) {
        Alert.alert('שדות חסרים', 'יש למלא מוסד, עיר וכתובת מלאה לפני המשך.');
        return false;
      }
    }

    if (targetStep === 2) {
      if (!form.date || !form.population || !form.requiredClowns) {
        Alert.alert('שדות חסרים', 'יש למלא תאריך, אוכלוסיה ומספר ליצנים.');
        return false;
      }
      const startTime = `${form.date}T${form.startHour}:${form.startMinute}:00Z`;
      const endTime = `${form.date}T${form.endHour}:${form.endMinute}:00Z`;
      if (new Date(endTime).getTime() <= new Date(startTime).getTime()) {
        Alert.alert('שגיאה', 'שעת הסיום חייבת להיות אחרי שעת ההתחלה');
        return false;
      }
    }

    if (targetStep === 3) {
      if (!form.coordinatorName || !form.coordinatorPhone) {
        Alert.alert('שדות חסרים', 'יש למלא פרטי רכז פעילות.');
        return false;
      }
    }

    return true;
  };

  const goNext = () => {
    if (step === 4) return;
    const nextStep = (step + 1) as StepId;
    if (!validateStep(nextStep)) return;
    setStep(nextStep);
  };

  const goBack = () => {
    if (step === 0) {
      router.back();
      return;
    }
    setStep((step - 1) as StepId);
  };

  const handleCreate = async () => {
    if (!currentUser) {
      Alert.alert('שגיאה', 'נדרשת התחברות כדי לפרסם פעילות.');
      return;
    }

    if (!form.description || !form.coordinatorName || !form.coordinatorPhone || !form.population || !form.fullAddress || !institutionName) {
      Alert.alert('שגיאה', 'אנא מלא את כל שדות החובה');
      return;
    }

    const startTime = `${form.date}T${form.startHour}:${form.startMinute}:00Z`;
    const endTime = `${form.date}T${form.endHour}:${form.endMinute}:00Z`;
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

      if (activityMedia) {
        setUploadingMedia(true);
        try {
          await firebaseService.uploadActivityMedia(activityId, activityMedia);
        } catch (mediaErr: any) {
          console.error('Error uploading activity media:', mediaErr);
          Alert.alert('הפעילות נוצרה', mediaErr?.message || 'המדיה לא עלתה. אפשר להוסיף אותה מחדש בהמשך.');
        } finally {
          setUploadingMedia(false);
        }
      }

      Alert.alert('הצלחה', 'הפעילות נוצרה בהצלחה!');
      router.push('/');
    } catch (error: any) {
      console.error('Error creating activity:', error);
      Alert.alert('שגיאה', error?.message || 'ארעה שגיאה ביצירת הפעילות');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitles = ['מוסד ומיקום', 'מועד והרכב', 'פרטי קשר', 'תוכן ומדיה', 'סיכום'];

  if (isLoadingPermissions) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Header title="יצירת פעילות" showBackButton={true} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!currentUser || !canCreateActivities) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Header title="יצירת פעילות" showBackButton={true} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <ShieldAlert size={48} color={colors.error} />
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 16, textAlign: 'center' }}>
            כרגע רק רכזי פעילויות ומנהלים יכולים ליצור פעילויות
          </Text>
          <Text style={{ fontSize: 14, color: colors.tabIconDefault, marginTop: 10, textAlign: 'center' }}>
            מנהל יכול לפתוח את אפשרות הפרסום לכל המשתמשים מתוך ההגדרות.
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

  const renderStep = () => {
    if (step === 0) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.iconTitleRow}><Building2 size={18} color={colors.primary} /><Text style={[styles.stepTitle, { color: colors.text }]}>{stepTitles[0]}</Text></View>
          <Text style={[styles.label, { color: colors.text }]}>מוסד *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {[...INSTITUTIONS, 'אחר'].map(inst => (
              <TouchableOpacity key={inst} style={[styles.chip, form.institution === inst && { backgroundColor: colors.primary, borderColor: colors.primary }, { borderColor: colors.border }]} onPress={() => setForm({ ...form, institution: inst })}>
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
              <TouchableOpacity key={city} style={[styles.chip, form.city === city && { backgroundColor: colors.accent, borderColor: colors.accent }, { borderColor: colors.border }]} onPress={() => setForm({ ...form, city })}>
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
            placeholder="למשל: מיון ילדים"
            placeholderTextColor={colors.tabIconDefault}
            value={form.department}
            onChangeText={(text) => setForm({ ...form, department: text })}
            textAlign="right"
          />
        </View>
      );
    }

    if (step === 1) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.iconTitleRow}><Clock3 size={18} color={colors.primary} /><Text style={[styles.stepTitle, { color: colors.text }]}>{stepTitles[1]}</Text></View>
          <Text style={[styles.label, { color: colors.text }]}>תאריך *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {dateOptions.map(option => (
              <TouchableOpacity key={option.value} style={[styles.chip, form.date === option.value && { backgroundColor: colors.primary, borderColor: colors.primary }, { borderColor: colors.border }]} onPress={() => setForm({ ...form, date: option.value })}>
                <Text style={[styles.chipText, form.date === option.value ? { color: '#fff' } : { color: colors.text }]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { color: colors.text }]}>שעת התחלה *</Text>
          <View style={styles.timeRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeScroller}>
              {hourOptions.map(hour => (
                <TouchableOpacity key={`start-h-${hour}`} style={[styles.timeChip, form.startHour === hour && { backgroundColor: colors.primary }, { borderColor: colors.border }]} onPress={() => setForm({ ...form, startHour: hour })}>
                  <Text style={[styles.timeChipText, { color: form.startHour === hour ? '#fff' : colors.text }]}>{hour}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeScroller}>
              {minuteOptions.map(min => (
                <TouchableOpacity key={`start-m-${min}`} style={[styles.timeChip, form.startMinute === min && { backgroundColor: colors.primary }, { borderColor: colors.border }]} onPress={() => setForm({ ...form, startMinute: min })}>
                  <Text style={[styles.timeChipText, { color: form.startMinute === min ? '#fff' : colors.text }]}>{min}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>שעת סיום *</Text>
          <View style={styles.timeRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeScroller}>
              {hourOptions.map(hour => (
                <TouchableOpacity key={`end-h-${hour}`} style={[styles.timeChip, form.endHour === hour && { backgroundColor: colors.accent }, { borderColor: colors.border }]} onPress={() => setForm({ ...form, endHour: hour })}>
                  <Text style={[styles.timeChipText, { color: form.endHour === hour ? '#fff' : colors.text }]}>{hour}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeScroller}>
              {minuteOptions.map(min => (
                <TouchableOpacity key={`end-m-${min}`} style={[styles.timeChip, form.endMinute === min && { backgroundColor: colors.accent }, { borderColor: colors.border }]} onPress={() => setForm({ ...form, endMinute: min })}>
                  <Text style={[styles.timeChipText, { color: form.endMinute === min ? '#fff' : colors.text }]}>{min}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>אוכלוסיה *</Text>
          <View style={styles.optionRow}>
            {populations.map(pop => (
              <TouchableOpacity key={pop} style={[styles.optionChip, form.population === pop && { backgroundColor: colors.primary, borderColor: colors.primary }, { borderColor: colors.border }]} onPress={() => setForm({ ...form, population: pop })}>
                <Text style={[styles.chipText, form.population === pop ? { color: '#fff' } : { color: colors.text }]}>{pop}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>מספר ליצנים *</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} keyboardType="numeric" value={form.requiredClowns} onChangeText={(text) => setForm({ ...form, requiredClowns: text })} textAlign="center" />
        </View>
      );
    }

    if (step === 2) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.iconTitleRow}><Phone size={18} color={colors.primary} /><Text style={[styles.stepTitle, { color: colors.text }]}>{stepTitles[2]}</Text></View>
          <Text style={[styles.label, { color: colors.text }]}>בחר רכז מהרשימה (אופציונלי)</Text>
          {coordinators.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {coordinators.map((coordinator) => (
                <TouchableOpacity
                  key={coordinator.id}
                  style={[
                    styles.chip,
                    form.coordinatorName === coordinator.name && { backgroundColor: colors.secondary, borderColor: colors.secondary },
                    { borderColor: colors.border }
                  ]}
                  onPress={() =>
                    setForm({
                      ...form,
                      coordinatorName: coordinator.name,
                      coordinatorPhone: coordinator.phone ? formatPhoneNumber(coordinator.phone) : form.coordinatorPhone,
                    })
                  }
                >
                  <Text style={[styles.chipText, form.coordinatorName === coordinator.name ? { color: '#fff' } : { color: colors.text }]}>
                    {coordinator.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={[styles.rowSubtitle, { color: colors.tabIconDefault, textAlign: 'right' }]}>
              אין כרגע רכזים זמינים ברשימה. ניתן להזין ידנית.
            </Text>
          )}

          <Text style={[styles.label, { color: colors.text }]}>שם רכז פעילות *</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="שם מלא" placeholderTextColor={colors.tabIconDefault} value={form.coordinatorName} onChangeText={(text) => setForm({ ...form, coordinatorName: text })} textAlign="right" />

          <Text style={[styles.label, { color: colors.text }]}>טלפון לבירורים *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="+972XXXXXXXXX"
            placeholderTextColor={colors.tabIconDefault}
            value={form.coordinatorPhone}
            onChangeText={(text) => setForm({ ...form, coordinatorPhone: text })}
            onBlur={() => setForm(prev => ({ ...prev, coordinatorPhone: formatPhoneNumber(prev.coordinatorPhone) }))}
            keyboardType="phone-pad"
            textAlign="right"
          />

          <View style={[styles.toggleCard, { backgroundColor: form.isUrgent ? colors.error + '10' : colors.background, borderColor: form.isUrgent ? colors.error : colors.border }]}> 
            <View style={styles.toggleRow}>
              <Switch value={form.isUrgent} onValueChange={(v) => setForm({ ...form, isUrgent: v })} trackColor={{ false: colors.border, true: colors.error }} thumbColor="#fff" />
              <View style={styles.toggleRight}>
                <View style={[styles.iconContainer, { backgroundColor: colors.error + '15' }]}><ShieldAlert size={18} color={colors.error} /></View>
                <View>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>בקשה דחופה (הקפצה)</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.tabIconDefault }]}>התראה מיידית לכל הליצנים באזור</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.toggleCard, { backgroundColor: colors.background, borderColor: colors.border }]}> 
            <View style={styles.toggleRow}>
              <Switch value={form.autoDelete} onValueChange={(v) => setForm({ ...form, autoDelete: v })} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />
              <View style={styles.toggleRight}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}><Trash2 size={18} color={colors.primary} /></View>
                <View>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>מחיקה אוטומטית</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.tabIconDefault }]}>24 שעות אחרי סיום</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      );
    }

    if (step === 3) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.iconTitleRow}><FileText size={18} color={colors.primary} /><Text style={[styles.stepTitle, { color: colors.text }]}>{stepTitles[3]}</Text></View>
          <Text style={[styles.label, { color: colors.text }]}>תיאור הפעילות *</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="ספר קצת על הפעילות"
            placeholderTextColor={colors.tabIconDefault}
            multiline
            numberOfLines={4}
            value={form.description}
            onChangeText={(text) => setForm({ ...form, description: text })}
            textAlign="right"
          />

          <Text style={[styles.label, { color: colors.text }]}>תמונה או וידאו הסבר 16:9 (לא חובה)</Text>
          <TouchableOpacity style={[styles.imagePickerBox, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={handlePickActivityMedia} disabled={uploadingMedia}>
            {activityMedia ? (
              <>
                {activityMedia.type === 'image' ? (
                  <Image source={{ uri: activityMedia.uri }} style={styles.pickedImage} resizeMode="cover" />
                ) : (
                  <View style={styles.videoPlaceholder}>
                    <PlayCircle size={44} color={colors.primary} />
                    <Text style={[styles.videoPlaceholderTitle, { color: colors.text }]}>נבחר וידאו להסבר</Text>
                    <Text style={[styles.videoPlaceholderText, { color: colors.tabIconDefault }]}>הסרטון יעלה יחד עם הפעילות וייפתח מכרטיס הפעילות</Text>
                  </View>
                )}
                {uploadingMedia && (
                  <View style={[StyleSheet.absoluteFill, styles.imageUploadOverlay]}>
                    <ActivityIndicator color="#fff" />
                  </View>
                )}
              </>
            ) : (
              <View style={styles.imagePickerPlaceholder}>
                <ImagePlus size={34} color={colors.tabIconDefault} />
                <Text style={[styles.imagePickerText, { color: colors.tabIconDefault }]}>לחץ להוספת תמונה או וידאו</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.stepBody}>
        <View style={styles.iconTitleRow}><Sparkles size={18} color={colors.primary} /><Text style={[styles.stepTitle, { color: colors.text }]}>{stepTitles[4]}</Text></View>
        <View style={[styles.summaryCard, { borderColor: colors.border, backgroundColor: colors.background }]}> 
          <Text style={[styles.summaryTitle, { color: colors.text }]}>{`${institutionName}${form.department ? ` - ${form.department}` : ''} - ${form.population || ''}`}</Text>
          <Text style={[styles.summaryMeta, { color: colors.tabIconDefault }]}>{`${form.city}, ${form.fullAddress}`}</Text>
          <Text style={[styles.summaryMeta, { color: colors.tabIconDefault }]}>{`${form.date} | ${form.startHour}:${form.startMinute} - ${form.endHour}:${form.endMinute}`}</Text>
          <Text style={[styles.summaryMeta, { color: colors.tabIconDefault }]}>{`רכז: ${form.coordinatorName} | ${form.coordinatorPhone}`}</Text>
          <Text style={[styles.summaryMeta, { color: colors.tabIconDefault }]}>{`ליצנים: ${form.requiredClowns}`}</Text>
        </View>

        <TouchableOpacity style={[styles.publishButton, { backgroundColor: colors.primary }, isSubmitting && { opacity: 0.7 }]} onPress={handleCreate} disabled={isSubmitting || uploadingMedia}>
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.publishButtonText}>פרסם פעילות</Text>}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="יצירת פעילות" showBackButton={false} />

      <View style={styles.progressWrap}>
        {stepTitles.map((label, idx) => {
          const active = idx === step;
          const done = idx < step;
          return (
            <View key={label} style={styles.progressItem}>
              <View style={[styles.progressDot, { backgroundColor: done || active ? colors.primary : colors.border }]} />
              <Text style={[styles.progressText, { color: done || active ? colors.primary : colors.tabIconDefault }]} numberOfLines={1}>{label}</Text>
            </View>
          );
        })}
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.form}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {renderStep()}
        </View>
      </ScrollView>

      <View style={[styles.footerNav, { backgroundColor: colors.card, borderTopColor: colors.border }]}> 
        <TouchableOpacity style={[styles.navBtn, { borderColor: colors.border }]} onPress={goBack}>
          <ArrowRight size={16} color={colors.text} />
          <Text style={[styles.navBtnText, { color: colors.text }]}>{step === 0 ? 'חזור' : 'אחורה'}</Text>
        </TouchableOpacity>

        {step < 4 && (
          <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={goNext}>
            <Text style={[styles.navBtnText, { color: '#fff' }]}>המשך</Text>
            <ArrowLeft size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: {
    padding: 14,
    paddingBottom: Platform.OS === 'android' ? 110 : 90,
  },
  progressWrap: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 2,
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '700',
    ...androidTextFix,
    ...preventFontScaling,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    ...createShadow(2),
  },
  stepBody: {
    gap: 2,
  },
  iconTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '900',
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
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  videoPlaceholderTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '800',
    ...androidTextFix,
    ...preventFontScaling,
  },
  videoPlaceholderText: {
    marginTop: 6,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    ...androidTextFix,
    ...preventFontScaling,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'right',
    ...androidTextFix,
    ...preventFontScaling,
  },
  summaryMeta: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'right',
    ...androidTextFix,
    ...preventFontScaling,
  },
  publishButton: {
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    ...createShadow(4),
    ...androidButtonFix,
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    ...androidTextFix,
    ...preventFontScaling,
  },
  footerNav: {
    height: 68,
    borderTopWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    height: 42,
    minWidth: 96,
    borderRadius: 21,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  navBtnText: {
    fontSize: 14,
    fontWeight: '800',
    ...androidTextFix,
    ...preventFontScaling,
  },
});
