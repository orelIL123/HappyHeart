import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '@/components/Header';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useApp } from '@/context/AppContext';
import { CheckCircle, XCircle, Users, Activity as ActivityIcon, ShieldAlert, Eye, Phone, MessageCircle, FileText } from 'lucide-react-native';
import { firebaseService } from '@/services/firebaseService';
import { User, Activity } from '@/constants/MockData';
import { formatPhoneNumber } from '@/utils/phoneFormatter';

export default function AdminDashboard() {
  const { currentUser, activities } = useApp();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'clowns' | 'activities'>('clowns');
  const [pendingClowns, setPendingClowns] = useState<User[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<User[]>([]);

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToPendingClowns((clowns) => {
      setPendingClowns(clowns);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadUsers = async () => {
      const users = await firebaseService.getAllUsers();
      if (mounted) {
        setApprovedUsers(users);
      }
    };
    loadUsers();
    return () => {
      mounted = false;
    };
  }, [pendingClowns.length]);

  const approvedClowns = useMemo(
    () => approvedUsers.filter(user => user.role === 'clown'),
    [approvedUsers]
  );

  const sortedActivities = useMemo(
    () => [...activities].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
    [activities]
  );
  const pendingActivities = useMemo(
    () => sortedActivities.filter(a => a.approvalStatus === 'pending'),
    [sortedActivities]
  );

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="ניהול" showBackButton={false} />
        <View style={styles.centerContent}>
          <View style={[styles.errorBox, { backgroundColor: colors.error + '15', borderColor: colors.error }]}> 
            <ShieldAlert size={40} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>אין לך הרשאה לגשת לדף זה</Text>
            <Text style={[styles.errorSubtext, { color: colors.tabIconDefault }]}>רק מנהלי מערכת יכולים לגשת לניהול</Text>
          </View>
        </View>
      </View>
    );
  }

  const handleApproveClown = async (clown: User) => {
    try {
      await firebaseService.approveClown(clown);
      Alert.alert('הצלחה', `${clown.name} אושר בהצלחה`);
    } catch {
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
            } catch {
              Alert.alert('שגיאה', 'חלה שגיאה בעת דחיית הליצן');
            }
          }
        }
      ]
    );
  };

  const handleApproveActivity = async (activityId: string) => {
    try {
      await firebaseService.approveActivity(activityId, currentUser.id);
      Alert.alert('הצלחה', 'הפעילות אושרה בהצלחה');
    } catch {
      Alert.alert('שגיאה', 'חלה שגיאה בעת אישור הפעילות');
    }
  };

  const handleRejectActivity = async (activityId: string) => {
    Alert.alert(
      'דחיית פעילות',
      'האם אתה בטוח שברצונך לדחות את הפעילות?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'דחה',
          style: 'destructive',
          onPress: async () => {
            try {
              await firebaseService.rejectActivity(activityId, currentUser.id);
              Alert.alert('הצלחה', 'הפעילות נדחתה בהצלחה');
            } catch {
              Alert.alert('שגיאה', 'חלה שגיאה בעת דחיית הפעילות');
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
            activeTab === 'clowns' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }
          ]}
          onPress={() => setActiveTab('clowns')}
        >
          <Users size={20} color={activeTab === 'clowns' ? colors.primary : colors.tabIconDefault} />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'clowns' ? colors.primary : colors.tabIconDefault, fontWeight: activeTab === 'clowns' ? '700' : '600' }
            ]}
          >
            ליצנים ({approvedClowns.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'activities' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }
          ]}
          onPress={() => setActiveTab('activities')}
        >
          <ActivityIcon size={20} color={activeTab === 'activities' ? colors.primary : colors.tabIconDefault} />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'activities' ? colors.primary : colors.tabIconDefault, fontWeight: activeTab === 'activities' ? '700' : '600' }
            ]}
          >
            פעילויות ({sortedActivities.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'clowns' && (
          <ClownsTab
            pendingClowns={pendingClowns}
            approvedClowns={approvedClowns}
            colors={colors}
            onApprove={handleApproveClown}
            onReject={handleRejectClown}
          />
        )}
        {activeTab === 'activities' && (
          <ActivitiesTab
            activities={sortedActivities}
            pendingCount={pendingActivities.length}
            colors={colors}
            onApprove={handleApproveActivity}
            onReject={handleRejectActivity}
            onOpen={(activityId) => router.push(`/activity/${activityId}`)}
          />
        )}
      </ScrollView>
    </View>
  );
}

interface ClownsTabProps {
  pendingClowns: User[];
  approvedClowns: User[];
  colors: any;
  onApprove: (clown: User) => void;
  onReject: (clownId: string) => void;
}

const ClownsTab: React.FC<ClownsTabProps> = ({ pendingClowns, approvedClowns, colors, onApprove, onReject }) => {
  const allClowns = useMemo(() => {
    const deduped = new Map<string, User>();
    approvedClowns.forEach((clown) => deduped.set(clown.id, clown));
    pendingClowns.forEach((clown) => {
      if (!deduped.has(clown.id)) {
        deduped.set(clown.id, clown);
      }
    });
    return Array.from(deduped.values()).sort((a, b) => a.name.localeCompare(b.name, 'he'));
  }, [approvedClowns, pendingClowns]);

  const handleCall = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (phone?: string) => {
    if (!phone) return;
    const cleanPhone = formatPhoneNumber(phone).replace(/[^\d]/g, '');
    const url = `whatsapp://send?phone=${cleanPhone}`;
    Linking.canOpenURL(url).then((supported: boolean) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://wa.me/${cleanPhone}`);
      }
    }).catch(() => {
      Linking.openURL(`https://wa.me/${cleanPhone}`);
    });
  };

  const getApprovalLabel = (clown: User) => {
    if (clown.approvalStatus === 'pending') return 'ממתין לאישור';
    if (clown.approvalStatus === 'rejected') return 'נדחה';
    return 'מאושר';
  };

  return (
    <View style={styles.listContent}>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.statValue, { color: colors.primary }]}>{approvedClowns.length}</Text>
          <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>ליצנים רשומים</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.statValue, { color: colors.error }]}>{pendingClowns.length}</Text>
          <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>ממתינים לאישור</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>בקשות ממתינות</Text>
      {pendingClowns.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>אין ליצנים בהמתנה</Text>
        </View>
      ) : (
        <FlatList
          scrollEnabled={false}
          data={pendingClowns}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.cardSubtitle, { color: colors.tabIconDefault }]}>{item.phone || 'ללא טלפון'}</Text>
              <View style={styles.cardActions}>
                <TouchableOpacity style={[styles.approveButton, { backgroundColor: colors.success }]} onPress={() => onApprove(item)}>
                  <CheckCircle size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>אישור</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.rejectButton, { backgroundColor: colors.error }]} onPress={() => onReject(item.id)}>
                  <XCircle size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>דחייה</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 18 }]}>כל הליצנים במערכת ({allClowns.length})</Text>
      {allClowns.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>אין ליצנים רשומים</Text>
        </View>
      ) : (
        <FlatList
          scrollEnabled={false}
          data={allClowns}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: colors.text, flex: 1 }]}>{item.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: (item.approvalStatus === 'pending' ? '#f59e0b' : item.approvalStatus === 'rejected' ? colors.error : colors.success) + '20' }]}> 
                  <Text style={[styles.statusText, { color: item.approvalStatus === 'pending' ? '#f59e0b' : item.approvalStatus === 'rejected' ? colors.error : colors.success }]}>{getApprovalLabel(item)}</Text>
                </View>
              </View>
              <Text style={[styles.cardSubtitle, { color: colors.tabIconDefault }]}>טלפון: {item.phone || 'לא הוזן'}</Text>
              <Text style={[styles.cardSubtitle, { color: colors.tabIconDefault }]}>אזור: {item.preferredArea || 'לא הוגדר'}</Text>
              <Text style={[styles.cardSubtitle, { color: item.certificationUrl ? colors.success : colors.error }]}>
                תעודת ליצן: {item.certificationUrl ? 'הועלתה' : 'לא הועלתה'}
              </Text>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: colors.primary }]}
                  onPress={() => handleCall(item.phone)}
                  disabled={!item.phone}
                >
                  <Phone size={16} color={item.phone ? colors.primary : colors.tabIconDefault} />
                  <Text style={[styles.secondaryButtonText, { color: item.phone ? colors.primary : colors.tabIconDefault }]}>התקשר</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.whatsappButton, { opacity: item.phone ? 1 : 0.5 }]}
                  onPress={() => handleWhatsApp(item.phone)}
                  disabled={!item.phone}
                >
                  <MessageCircle size={16} color="#fff" />
                  <Text style={styles.whatsappButtonText}>וואטסאפ</Text>
                </TouchableOpacity>
                {item.certificationUrl && (
                  <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: colors.border }]}
                    onPress={() => Linking.openURL(item.certificationUrl!)}
                  >
                    <FileText size={16} color={colors.text} />
                    <Text style={[styles.secondaryButtonText, { color: colors.text }]}>צפייה בתעודה</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

interface ActivitiesTabProps {
  activities: Activity[];
  pendingCount: number;
  colors: any;
  onApprove: (activityId: string) => void;
  onReject: (activityId: string) => void;
  onOpen: (activityId: string) => void;
}

const ActivitiesTab: React.FC<ActivitiesTabProps> = ({ activities, pendingCount, colors, onApprove, onReject, onOpen }) => {
  const approvedCount = activities.filter(a => a.approvalStatus === 'approved').length;
  const rejectedCount = activities.filter(a => a.approvalStatus === 'rejected').length;

  return (
    <View style={styles.listContent}>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.statValue, { color: colors.primary }]}>{activities.length}</Text>
          <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>סה"כ פעילויות</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>{pendingCount}</Text>
          <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>ממתינות</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.statValue, { color: colors.success }]}>{approvedCount}</Text>
          <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>מאושרות</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.statValue, { color: colors.error }]}>{rejectedCount}</Text>
          <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>נדחו</Text>
        </View>
      </View>

      {activities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>אין פעילויות להצגה</Text>
        </View>
      ) : (
        <FlatList
          scrollEnabled={false}
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const status = item.approvalStatus || 'pending';
            const statusColor = status === 'approved' ? colors.success : status === 'rejected' ? colors.error : '#f59e0b';
            const statusLabel = status === 'approved' ? 'מאושרת' : status === 'rejected' ? 'נדחתה' : 'ממתינה';

            return (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardTitle, { color: colors.text, flex: 1 }]}>{item.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}> 
                    <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                </View>

                <Text style={[styles.cardSubtitle, { color: colors.tabIconDefault }]}>{item.institution}</Text>
                <Text style={[styles.cardSubtitle, { color: colors.tabIconDefault }]}>תאריך: {new Date(item.startTime).toLocaleDateString('he-IL')}</Text>

                <View style={styles.cardActions}>
                  <TouchableOpacity style={[styles.secondaryButton, { borderColor: colors.border }]} onPress={() => onOpen(item.id)}>
                    <Eye size={16} color={colors.text} />
                    <Text style={[styles.secondaryButtonText, { color: colors.text }]}>צפייה/עריכה</Text>
                  </TouchableOpacity>

                  {status === 'pending' && (
                    <>
                      <TouchableOpacity style={[styles.approveButton, { backgroundColor: colors.success }]} onPress={() => onApprove(item.id)}>
                        <CheckCircle size={18} color="#fff" />
                        <Text style={styles.actionButtonText}>אישור</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.rejectButton, { backgroundColor: colors.error }]} onPress={() => onReject(item.id)}>
                        <XCircle size={18} color="#fff" />
                        <Text style={styles.actionButtonText}>דחייה</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
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
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
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
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  statsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
    marginVertical: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'right',
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  approveButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rejectButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    fontWeight: '700',
  },
  whatsappButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#25D366',
  },
  whatsappButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
