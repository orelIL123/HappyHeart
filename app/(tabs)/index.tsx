import { ActivityCard } from '@/components/ActivityCard';
import { Header } from '@/components/Header';
import { TopTabs } from '@/components/TopTabs';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { Activity as ActivityIcon, Calendar, Search } from 'lucide-react-native';
import React, { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ActivityBoardScreen() {
  const { activities, currentUser } = useApp();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.institution.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = !selectedCity || activity.location === selectedCity;
    const matchesMine = activeTab === 'all' || (currentUser && (activity.participants.includes(currentUser.id) || activity.organizerId === currentUser.id));
    return matchesSearch && matchesCity && matchesMine;
  });

  const cities = Array.from(new Set(activities.map(a => a.location)));

  const tabs = [
    { id: 'all', label: 'כל הפעילויות' },
    { id: 'mine', label: 'הפעילויות שלי' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="לוח אירועים" showBackButton={false} />

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

      <TopTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={(id) => setActiveTab(id as 'all' | 'mine')}
      />

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/availability')}
        >
          <Calendar size={20} color="#fff" />
          <Text style={styles.actionButtonText}>עדכון זמינות</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.playful }]}
          onPress={() => router.push('/create')}
        >
          <ActivityIcon size={20} color="#fff" />
          <Text style={styles.actionButtonText}>יצירת פעילות</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cityFilterSection}>
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
    marginVertical: 10,
  },
  quickActions: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 5,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 15,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '800',
    marginRight: 8,
    fontSize: 13,
    fontFamily: 'Inter',
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
