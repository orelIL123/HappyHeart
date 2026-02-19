import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, Alert, Platform } from 'react-native';
import { Header } from '@/components/Header';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useApp } from '@/context/AppContext';
import { CheckCircle, XCircle, Users, Activity as ActivityIcon, ShieldAlert } from 'lucide-react-native';
import { firebaseService } from '@/services/firebaseService';
import { User, Activity } from '@/constants/MockData';
import { androidTextFix, preventFontScaling, createShadow } from '@/constants/AndroidStyles';

export default function AdminDashboard() {
  const { currentUser, activities } = useApp();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [activeTab, setActiveTab] = useState<'pending-clowns' | 'pending-activities'>('pending-clowns');
  const [pendingClowns, setPendingClowns] = useState<User[]>([]);
  const [pendingActivities, setPendingActivities] = useState<Activity[]>([]);
  const [loadingClowns, setLoadingClowns] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    // Subscribe to pending clowns
    const unsubscribe = firebaseService.subscribeToPendingClowns((clowns) => {
      setPendingClowns(clowns);
      setLoadingClowns(false);
    });
    setLoadingClowns(true);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Filter pending activities
    const pending = activities.filter(a => a.approvalStatus === 'pending');
    setPendingActivities(pending);
    setLoadingActivities(false);
  }, [activities]);

  // Check if user is admin
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="ניהול" showBackButton={false} />
        <View style={styles.centerContent}>
          <View style={[styles.errorBox, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
            <ShieldAlert size={40} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>
              אין לך הרשאה לגשת לדף זה
            </Text>
            <Text style={[styles.errorSubtext, { color: colors.tabIconDefault }]}>
              רק מנהלי מערכת יכולים לגשת לניהול
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const handleApproveClown = async (clown: User) => {
    try {
      await firebaseService.approveClown(clown);
      Alert.alert('הצלחה', `${clown.name} אישור בהצלחה!`);
    } catch (error) {
      Alert.alert('שגיאה', 'חלה שגיאה בעת אישור הליצן');
    }
  };

  const handleRejectClown = async (clownId: string) => {
    Alert.alert(
      'דחיית ליצן',
      'האם אתה בטוח שברצונך לדחות את הליצן הזה?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'דחה',
          style: 'destructive',
          onPress: async () => {
            try {
              await firebaseService.rejectClown(clownId);
              Alert.alert('הצלחה', 'הליצן נדחה בהצלחה');
            } catch (error) {
              Alert.alert('שגיאה', 'חלה שגיאה בעת דחיית הליצן');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="ניהול מערכת" showBackButton={false} />
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'pending-clowns' && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 3,
            }
          ]}
          onPress={() => setActiveTab('pending-clowns')}
        >
          <Users size={20} color={activeTab === 'pending-clowns' ? colors.primary : colors.tabIconDefault} />
          <Text style={[
            styles.tabText,
            {
              color: activeTab === 'pending-clowns' ? colors.primary : colors.tabIconDefault,
              fontWeight: activeTab === 'pending-clowns' ? '700' : '600'
            }
          ]}>
            ליצנים ({pendingClowns.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'pending-activities' && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 3,
            }
          ]}
          onPress={() => setActiveTab('pending-activities')}
        >
          <ActivityIcon size={20} color={activeTab === 'pending-activities' ? colors.primary : colors.tabIconDefault} />
          <Text style={[
            styles.tabText,
            {
              color: activeTab === 'pending-activities' ? colors.primary : colors.tabIconDefault,
              fontWeight: activeTab === 'pending-activities' ? '700' : '600'
            }
          ]}>
            פעילויות ({pendingActivities.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'pending-clowns' && (
          <PendingClownsTab
            clowns={pendingClowns}
            loading={loadingClowns}
            colors={colors}
            onApprove={handleApproveClown}
            onReject={handleRejectClown}
          />
        )}
        {activeTab === 'pending-activities' && (
          <PendingActivitiesTab
            activities={pendingActivities}
            loading={loadingActivities}
            colors={colors}
          />
        )}
      </ScrollView>
    </View>
  );
}

interface PendingClownsTabProps {
  clowns: User[];
  loading: boolean;
  colors: any;
  onApprove: (clown: User) => void;
  onReject: (clownId: string) => void;
}

const PendingClownsTab: React.FC<PendingClownsTabProps> = ({ clowns, loading, colors, onApprove, onReject }) => {
  if (clowns.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Users size={48} color={colors.tabIconDefault} />
        <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
          אין ליצנים בהמתנה
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
          כל הליצנים שהגישו בקשה אושרו או נדחו
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      scrollEnabled={false}
      data={clowns}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.cardSubtitle, { color: colors.tabIconDefault }]}>
                {item.phone}
              </Text>
              {item.registrationDate && (
                <Text style={[styles.cardDate, { color: colors.tabIconDefault }]}>
                  נרשם: {new Date(item.registrationDate).toLocaleDateString('he-IL')}
                </Text>
              )}
            </View>
          </View>

          {item.preferredArea && (
            <Text style={[styles.cardArea, { color: colors.tabIconDefault }]}>
              📍 אזור מועדף: {item.preferredArea}
            </Text>
          )}

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.approveButton, { backgroundColor: colors.success }]}
              onPress={() => onApprove(item)}
            >
              <CheckCircle size={18} color="#fff" />
              <Text style={styles.actionButtonText}>אישור</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rejectButton, { backgroundColor: colors.error }]}
              onPress={() => onReject(item.id)}
            >
              <XCircle size={18} color="#fff" />
              <Text style={styles.actionButtonText}>דחייה</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      contentContainerStyle={styles.listContent}
    />
  );
};

interface PendingActivitiesTabProps {
  activities: Activity[];
  loading: boolean;
  colors: any;
}

const PendingActivitiesTab: React.FC<PendingActivitiesTabProps> = ({ activities, loading, colors }) => {
  if (activities.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIcon size={48} color={colors.tabIconDefault} />
        <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
          אין פעילויות בהמתנה
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
          כל הפעילויות שהוגשו אושרו או נדחו
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      scrollEnabled={false}
      data={activities}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.cardSubtitle, { color: colors.tabIconDefault }]}>
                {item.institution}
              </Text>
              <Text style={[styles.cardLocation, { color: colors.tabIconDefault }]}>
                📍 {item.location}
              </Text>
            </View>
          </View>

          <Text style={[styles.cardDescription, { color: colors.tabIconDefault }]}>
            {item.description}
          </Text>

          <View style={styles.activityMeta}>
            <Text style={[styles.metaItem, { color: colors.tabIconDefault }]}>
              👥 {item.requiredClowns} ליצנים נדרשים
            </Text>
            <Text style={[styles.metaItem, { color: colors.tabIconDefault }]}>
              🕐 {new Date(item.startTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.approveButton, { backgroundColor: colors.success }]}
              onPress={() => Alert.alert('בקרוב', 'פונקציית אישור פעילות תיושם בעדכון הבא')}
            >
              <CheckCircle size={18} color="#fff" />
              <Text style={styles.actionButtonText}>אישור</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rejectButton, { backgroundColor: colors.error }]}
              onPress={() => Alert.alert('בקרוב', 'פונקציית דחיית פעילות תיושם בעדכון הבא')}
            >
              <XCircle size={18} color="#fff" />
              <Text style={styles.actionButtonText}>דחייה</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorBox: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 16,
    ...androidTextFix,
    ...preventFontScaling,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    ...androidTextFix,
    ...preventFontScaling,
  },
  tabsContainer: {
    flexDirection: 'row-reverse',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    ...androidTextFix,
    ...preventFontScaling,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  listContent: {
    paddingBottom: Platform.OS === 'android' ? 100 : 40,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    ...createShadow(2),
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    ...androidTextFix,
    ...preventFontScaling,
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 4,
    ...androidTextFix,
    ...preventFontScaling,
  },
  cardDate: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
    ...androidTextFix,
    ...preventFontScaling,
  },
  cardLocation: {
    fontSize: 13,
    marginTop: 4,
    ...androidTextFix,
    ...preventFontScaling,
  },
  cardArea: {
    fontSize: 12,
    marginBottom: 12,
    ...androidTextFix,
    ...preventFontScaling,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    ...androidTextFix,
    ...preventFontScaling,
  },
  activityMeta: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  metaItem: {
    fontSize: 12,
    ...androidTextFix,
    ...preventFontScaling,
  },
  cardActions: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...createShadow(2),
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...createShadow(2),
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    ...androidTextFix,
    ...preventFontScaling,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    ...androidTextFix,
    ...preventFontScaling,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    ...androidTextFix,
    ...preventFontScaling,
  },
});
