import { ActivityCard } from '@/components/ActivityCard';
import { Header } from '@/components/Header';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Activity } from '@/constants/MockData';
import { getRegionForLocation, REGIONS, RegionId } from '@/constants/Regions';
import { useApp } from '@/context/AppContext';
import { CalendarDays, Navigation, Search } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { FlatList, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type PeriodFilter = 'today' | 'lastWeek' | 'lastMonth' | null;

export default function ActivityBoardScreen() {
  const { activities, currentUser } = useApp();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const listRef = React.useRef<FlatList<Activity>>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<RegionId | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>(null);

  const filteredActivities = activities.filter(activity => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      activity.title.toLowerCase().includes(q) ||
      activity.institution.toLowerCase().includes(q) ||
      (activity.description && activity.description.toLowerCase().includes(q));

    const city = activity.city || activity.location;
    const matchesRegion = !selectedRegion || getRegionForLocation(city) === selectedRegion;

    const start = new Date(activity.startTime);
    const now = new Date();
    const activityDayStart = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const daysDiff = Math.floor((todayStart - activityDayStart) / (1000 * 60 * 60 * 24));
    const isToday = activityDayStart === todayStart;
    const inLastWeek = daysDiff >= 0 && daysDiff <= 6;
    const inLastMonth = daysDiff >= 0 && daysDiff <= 29;
    const matchesPeriod =
      !selectedPeriod ||
      (selectedPeriod === 'today' && isToday) ||
      (selectedPeriod === 'lastWeek' && inLastWeek) ||
      (selectedPeriod === 'lastMonth' && inLastMonth);

    return matchesSearch && matchesRegion && matchesPeriod;
  });

  const now = new Date();
  const nearestUpcomingId = useMemo(() => {
    const candidates = filteredActivities
      .filter(activity => new Date(activity.endTime).getTime() >= now.getTime())
      .map(activity => ({
        id: activity.id,
        score: Math.max(0, new Date(activity.startTime).getTime() - now.getTime()),
      }))
      .sort((a, b) => a.score - b.score);

    return candidates[0]?.id || null;
  }, [filteredActivities, now]);

  const jumpToNearest = () => {
    if (!nearestUpcomingId) return;
    const targetIndex = filteredActivities.findIndex(activity => activity.id === nearestUpcomingId);
    if (targetIndex < 0) return;
    listRef.current?.scrollToIndex({ index: targetIndex, animated: true, viewPosition: 0.1 });
  };

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

      <View style={styles.datetimeSection}>
        <Text style={[styles.filterLabel, { color: colors.tabIconDefault }]}>מועד פעילות:</Text>

        <View style={styles.inlineFilterHeader}>
          <CalendarDays size={14} color={colors.tabIconDefault} />
          <Text style={[styles.inlineFilterTitle, { color: colors.tabIconDefault }]}>טווח זמן</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, !selectedPeriod && { backgroundColor: colors.accent, borderColor: colors.accent }, { borderColor: colors.border }]}
            onPress={() => setSelectedPeriod(null)}
          >
            <Text style={[styles.filterText, !selectedPeriod ? { color: '#fff' } : { color: colors.tabIconDefault }]}>הכל</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedPeriod === 'today' && { backgroundColor: colors.accent, borderColor: colors.accent }, { borderColor: colors.border }]}
            onPress={() => setSelectedPeriod('today')}
          >
            <Text style={[styles.filterText, selectedPeriod === 'today' ? { color: '#fff' } : { color: colors.tabIconDefault }]}>היום</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedPeriod === 'lastWeek' && { backgroundColor: colors.accent, borderColor: colors.accent }, { borderColor: colors.border }]}
            onPress={() => setSelectedPeriod('lastWeek')}
          >
            <Text style={[styles.filterText, selectedPeriod === 'lastWeek' ? { color: '#fff' } : { color: colors.tabIconDefault }]}>השבוע האחרון</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedPeriod === 'lastMonth' && { backgroundColor: colors.accent, borderColor: colors.accent }, { borderColor: colors.border }]}
            onPress={() => setSelectedPeriod('lastMonth')}
          >
            <Text style={[styles.filterText, selectedPeriod === 'lastMonth' ? { color: '#fff' } : { color: colors.tabIconDefault }]}>החודש האחרון</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {nearestUpcomingId && (
        <View style={styles.jumpContainer}>
          <TouchableOpacity style={[styles.jumpButton, { backgroundColor: colors.success }]} onPress={jumpToNearest}>
            <Navigation size={16} color="#fff" />
            <Text style={styles.jumpButtonText}>הקרוב ביותר</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        ref={listRef}
        data={filteredActivities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ActivityCard
            activity={item}
            isJoined={currentUser ? item.participants.includes(currentUser.id) : false}
            isPast={new Date(item.endTime).getTime() < now.getTime()}
            isNearest={item.id === nearestUpcomingId}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>לא נמצאו פעילויות מתאימות</Text>
          </View>
        }
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: Math.max(0, Math.min(info.index, filteredActivities.length - 1)),
              animated: true,
              viewPosition: 0.1,
            });
          }, 250);
        }}
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
  jumpContainer: {
    paddingHorizontal: 20,
    marginTop: 2,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  jumpButton: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  jumpButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Inter',
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 130 : 100,
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
