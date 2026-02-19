import { Header } from '@/components/Header';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { Activity as ActivityIcon, Calendar, Heart, Users } from 'lucide-react-native';
import React from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

// Fallback for bottom safe area (home indicator on iOS)
const BOTTOM_INSET = Platform.OS === 'ios' ? 34 : 0;

export default function HomeScreen() {
  const { activities, currentUser } = useApp();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  // Stats
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - 7);

  const weeklySmiles = activities.reduce((acc, a) => acc + a.participants.length, 0);
  const monthlyActivities = activities.filter(a => {
    const d = new Date(a.startTime);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Count unique active clowns
  const activeClowns = new Set(activities.flatMap(a => a.participants)).size;
  const todayCount = activities.filter(a => {
    const d = new Date(a.startTime);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const todayKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  const pulse = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const isDark = colorScheme === 'dark';
  const bgGradientColor = isDark ? '#1a0a2e' : '#FDF0F8';

  return (
    <View style={[styles.container, { backgroundColor: bgGradientColor }]}>
      <Header title="שמחת הלב" showBackButton={false} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: 10, paddingBottom: BOTTOM_INSET + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Decorative hearts */}
          <View style={styles.decoHeartTopRight}>
            <Text style={styles.decoHeartText}>✦</Text>
          </View>
          <View style={styles.decoHeartBottomLeft}>
            <Heart size={28} color={colors.playful} strokeWidth={1.5} style={{ opacity: 0.35 }} />
          </View>

          {/* Main heart logo */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoCircle, { backgroundColor: colors.playful }]}>
              <Heart size={36} color="#fff" fill="#fff" />
            </View>
          </View>

          <Text style={[styles.appName, { color: colors.primary }]}>
            שמחת הלב
          </Text>

          <Text style={[styles.subtitle, { color: colors.secondary }]}>
            🎪 הקהילה של הליצנים הרפואיים
          </Text>

          <Text style={[styles.tagline, { color: colors.tabIconDefault }]}>
            מקום שבו אנחנו יוצרים חיוכים ומפיצים שמחה
          </Text>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.actionsContainer}>
          <Animated.View style={{ transform: [{ scale: pulse }], width: '100%' }}>
            <TouchableOpacity
              style={[styles.todayButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push({ pathname: '/(tabs)/board', params: { date: todayKey } })}
              activeOpacity={0.9}
            >
              <Calendar size={18} color="#fff" style={styles.actionIcon} />
              <Text style={styles.todayButtonText}>צפייה בפעילויות היום ({todayCount})</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Join Community → Profile */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.accent }]}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.85}
          >
            <Users size={20} color="#fff" style={styles.actionIcon} />
            <Text style={styles.actionBtnText}>הצטרף לקהילה</Text>
          </TouchableOpacity>

          {/* Availability */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnMiddle, { backgroundColor: colors.secondary }]}
            onPress={() => router.push('/(tabs)/availability')}
            activeOpacity={0.85}
          >
            <Calendar size={20} color="#fff" style={styles.actionIcon} />
            <Text style={styles.actionBtnText}>זמינות</Text>
          </TouchableOpacity>

          {/* Activity Board */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/board')}
            activeOpacity={0.85}
          >
            <ActivityIcon size={20} color="#fff" style={styles.actionIcon} />
            <Text style={styles.actionBtnText}>לוח פעילויות</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {/* Smiles this week */}
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIconCircle, { backgroundColor: colors.secondary + '22' }]}>
              <Heart size={24} color={colors.secondary} fill={colors.secondary} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {weeklySmiles.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>
              חיוכים השבוע
            </Text>
          </View>

          {/* Monthly activities */}
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIconCircle, { backgroundColor: colors.playful + '22' }]}>
              <Calendar size={24} color={colors.playful} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {monthlyActivities}
            </Text>
            <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>
              פעילויות החודש
            </Text>
          </View>

          {/* Active clowns */}
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIconCircle, { backgroundColor: colors.primary + '22' }]}>
              <Users size={24} color={colors.primary} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {activeClowns}
            </Text>
            <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>
              ליצנים פעילים
            </Text>
          </View>
        </View>

        {/* Welcome message for logged in user */}
        {currentUser && (
          <View style={[styles.welcomeCard, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
            <Text style={[styles.welcomeText, { color: colors.primary }]}>
              ✨ שלום, {currentUser.name}!
            </Text>
            <Text style={[styles.welcomeSub, { color: colors.tabIconDefault }]}>
              {currentUser.role === 'clown' ? 'מוכן להפיץ שמחה היום?' :
               currentUser.role === 'organizer' ? 'יש פעילויות חדשות לתאם?' :
               'בדוק את לוח הניהול'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = (width - 60) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingVertical: 20,
    width: '100%',
    position: 'relative',
  },
  decoHeartTopRight: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  decoHeartText: {
    fontSize: 28,
    color: '#F0C040',
    opacity: 0.7,
  },
  decoHeartBottomLeft: {
    position: 'absolute',
    bottom: 20,
    right: 10,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: 38,
    fontWeight: '900',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Action buttons
  actionsContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: 10,
    marginTop: 28,
    width: '100%',
    flexWrap: 'wrap',
  },
  todayButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 26,
    width: '100%',
    marginBottom: 10,
  },
  todayButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
    fontFamily: 'Inter',
  },
  actionBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 50,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnMiddle: {
    // slightly wider for middle button
    paddingHorizontal: 22,
  },
  actionIcon: {
    marginLeft: 6,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    fontFamily: 'Inter',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: 32,
    width: '100%',
    gap: 10,
  },
  statCard: {
    width: CARD_WIDTH,
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '600',
  },

  // Welcome card
  welcomeCard: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 13,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
});
