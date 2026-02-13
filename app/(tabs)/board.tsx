import { ActivityCard } from '@/components/ActivityCard';
import { Header } from '@/components/Header';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useApp } from '@/context/AppContext';
import { getRegionForLocation, REGIONS, RegionId } from '@/constants/Regions';
import { Search } from 'lucide-react-native';
import React, { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ActivityBoardScreen() {
  const { activities, currentUser } = useApp();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<RegionId | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const filteredActivities = activities.filter(activity => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      activity.title.toLowerCase().includes(q) ||
      activity.institution.toLowerCase().includes(q) ||
      (activity.description && activity.description.toLowerCase().includes(q));
    const matchesRegion = !selectedRegion || getRegionForLocation(activity.location) === selectedRegion;
    const matchesCity = !selectedCity || activity.location === selectedCity;
    return matchesSearch && matchesRegion && matchesCity;
  });

  const cities = Array.from(new Set(activities.map(a => a.location)));

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
            style={[
              styles.filterChip,
              !selectedRegion && { backgroundColor: colors.primary, borderColor: colors.primary },
              { borderColor: colors.border }
            ]}
            onPress={() => setSelectedRegion(null)}
          >
            <Text style={[styles.filterText, !selectedRegion ? { color: '#fff' } : { color: colors.tabIconDefault }]}>הכל</Text>
          </TouchableOpacity>
          {REGIONS.map(r => (
            <TouchableOpacity
              key={r.id}
              style={[
                styles.filterChip,
                selectedRegion === r.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                { borderColor: colors.border }
              ]}
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
            style={[
              styles.filterChip,
              !selectedCity && { backgroundColor: colors.primary, borderColor: colors.primary },
              { borderColor: colors.border }
            ]}
            onPress={() => setSelectedCity(null)}
          >
            <Text style={[styles.filterText, !selectedCity ? { color: '#fff' } : { color: colors.tabIconDefault }]}>הכל</Text>
          </TouchableOpacity>
          {cities.map(city => (
            <TouchableOpacity
              key={city}
              style={[
                styles.filterChip,
                selectedCity === city && { backgroundColor: colors.primary, borderColor: colors.primary },
                { borderColor: colors.border }
              ]}
              onPress={() => setSelectedCity(city)}
            >
              <Text style={[styles.filterText, selectedCity === city ? { color: '#fff' } : { color: colors.tabIconDefault }]}>{city}</Text>
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
    marginVertical: 6,
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
    marginVertical: 6,
  },
  filterScroll: {
    paddingHorizontal: 20,
    flexDirection: 'row-reverse',
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 10,
  },
  filterText: {
    fontSize: 14,
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
