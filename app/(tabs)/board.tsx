import { ActivityCard } from '@/components/ActivityCard';
import { Header } from '@/components/Header';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getRegionForLocation, REGIONS, RegionId } from '@/constants/Regions';
import { useApp } from '@/context/AppContext';
import { useLocalSearchParams } from 'expo-router';
import { CalendarDays, Clock3, Search } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function ActivityBoardScreen() {
  const { activities, currentUser } = useApp();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const params = useLocalSearchParams<{ date?: string }>();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<RegionId | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(params.date || null);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);

  const cities = useMemo(() => Array.from(new Set(activities.map(a => a.city || a.location))), [activities]);
  const dateOptions = useMemo(() => Array.from(new Set(activities.map(a => ymd(new Date(a.startTime))))).sort(), [activities]);

  const filteredActivities = activities.filter(activity => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      activity.title.toLowerCase().includes(q) ||
      activity.institution.toLowerCase().includes(q) ||
      (activity.description && activity.description.toLowerCase().includes(q));

    const city = activity.city || activity.location;
    const matchesRegion = !selectedRegion || getRegionForLocation(city) === selectedRegion;
    const matchesCity = !selectedCity || city === selectedCity;

    const activityDate = ymd(new Date(activity.startTime));
    const activityHour = pad(new Date(activity.startTime).getHours());
    const matchesDate = !selectedDate || activityDate === selectedDate;
    const matchesHour = !selectedHour || activityHour === selectedHour;

    return matchesSearch && matchesRegion && matchesCity && matchesDate && matchesHour;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Header title="לוח פעילויות" showBackButton={false} />

      <View style={styles.searchSection}>
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Search size={20} color={colors.tabIconDefault} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="חיפוש פעילות או מוסד..."
            placeholderTextColor={colors.tabIconDefault}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
          />
        </View>
      </View>

      <View style={styles.regionFilterSection}>
        <Text style={[styles.filterLabel, { color: colors.tabIconDefault }]}>אזור:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, !selectedRegion && { backgroundColor: colors.primary, borderColor: colors.primary }, { borderColor: colors.border }]}
            onPress={() => setSelectedRegion(null)}
          >
            <Text style={[styles.filterText, !selectedRegion ? { color: '#fff' } : { color: colors.tabIconDefault }]}>הכל</Text>
          </TouchableOpacity>
          {REGIONS.map(r => (
            <TouchableOpacity
              key={r.id}
              style={[styles.filterChip, selectedRegion === r.id && { backgroundColor: colors.primary, borderColor: colors.primary }, { borderColor: colors.border }]}
              onPress={() => setSelectedRegion(r.id)}
            >
              <Text style={[styles.filterText, selectedRegion === r.id ? { color: '#fff' } : { color: colors.tabIconDefault }]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.cityFilterSection}>
        <Text style={[styles.filterLabel, { color: colors.tabIconDefault }]}>עיר:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, !selectedCity && { backgroundColor: colors.primary, borderColor: colors.primary }, { borderColor: colors.border }]}
            onPress={() => setSelectedCity(null)}
          >
            <Text style={[styles.filterText, !selectedCity ? { color: '#fff' } : { color: colors.tabIconDefault }]}>הכל</Text>
          </TouchableOpacity>
          {cities.map(city => (
            <TouchableOpacity
              key={city}
              style={[styles.filterChip, selectedCity === city && { backgroundColor: colors.primary, borderColor: colors.primary }, { borderColor: colors.border }]}
              onPress={() => setSelectedCity(city)}
            >
              <Text style={[styles.filterText, selectedCity === city ? { color: '#fff' } : { color: colors.tabIconDefault }]}>{city}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.datetimeSection}>
        <Text style={[styles.filterLabel, { color: colors.tabIconDefault }]}>מועד:</Text>

        <View style={styles.inlineFilterHeader}>
          <CalendarDays size={14} color={colors.tabIconDefault} />
          <Text style={[styles.inlineFilterTitle, { color: colors.tabIconDefault }]}>תאריך</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, !selectedDate && { backgroundColor: colors.accent, borderColor: colors.accent }, { borderColor: colors.border }]}
            onPress={() => setSelectedDate(null)}
          >
            <Text style={[styles.filterText, !selectedDate ? { color: '#fff' } : { color: colors.tabIconDefault }]}>הכל</Text>
          </TouchableOpacity>
          {dateOptions.map(date => (
            <TouchableOpacity
              key={date}
              style={[styles.filterChip, selectedDate === date && { backgroundColor: colors.accent, borderColor: colors.accent }, { borderColor: colors.border }]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[styles.filterText, selectedDate === date ? { color: '#fff' } : { color: colors.tabIconDefault }]}>{date}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.inlineFilterHeader}>
          <Clock3 size={14} color={colors.tabIconDefault} />
          <Text style={[styles.inlineFilterTitle, { color: colors.tabIconDefault }]}>שעה</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, !selectedHour && { backgroundColor: colors.accent, borderColor: colors.accent }, { borderColor: colors.border }]}
            onPress={() => setSelectedHour(null)}
          >
            <Text style={[styles.filterText, !selectedHour ? { color: '#fff' } : { color: colors.tabIconDefault }]}>הכל</Text>
          </TouchableOpacity>
          {Array.from({ length: 24 }, (_, h) => pad(h)).map(hour => (
            <TouchableOpacity
              key={hour}
              style={[styles.filterChip, selectedHour === hour && { backgroundColor: colors.accent, borderColor: colors.accent }, { borderColor: colors.border }]}
              onPress={() => setSelectedHour(hour)}
            >
              <Text style={[styles.filterText, selectedHour === hour ? { color: '#fff' } : { color: colors.tabIconDefault }]}>{hour}:00</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredActivities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ActivityCard
            activity={item}
            isJoined={currentUser ? item.participants.includes(currentUser.id) : false}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>לא נמצאו פעילויות מתאימות</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'right',
    paddingHorizontal: 20,
  },
  regionFilterSection: {
    marginVertical: 4,
  },
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginRight: 10,
    fontSize: 16,
    fontFamily: 'Inter',
  },
  cityFilterSection: {
    marginVertical: 4,
  },
  datetimeSection: {
    marginVertical: 4,
  },
  inlineFilterHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  inlineFilterTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterScroll: {
    paddingHorizontal: 20,
    flexDirection: 'row-reverse',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 10,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter',
  },
});
