import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { auth, db } from '../config/firebaseConfig';
import { Activity, AvailabilitySlot, User, UserRole } from '../constants/MockData';
import { DEFAULT_NOTIFICATION_PREFERENCES, NotificationPreferences } from '../constants/NotificationTypes';
import { getRegionForLocation, RegionId, REGIONS } from '../constants/Regions';
import { firebaseService, UserAvailability } from '../services/firebaseService';
import { notificationService } from '../services/notificationService';
import { pushNotificationService } from '../services/pushNotificationService';

// Storage keys
const AUTH_USER_ID_KEY = '@auth_user_id';
const AUTH_IS_GUEST_KEY = '@auth_is_guest';

// Helper function to format notification time
const formatNotificationTime = (timestamp: string): string => {
    try {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'עכשיו';
        if (diffMins < 60) return `לפני ${diffMins} דק${diffMins === 1 ? 'ה' : 'ות'}`;
        if (diffHours < 24) return `לפני ${diffHours} שע${diffHours === 1 ? 'ה' : 'ות'}`;
        if (diffDays < 7) return `לפני ${diffDays} ימ${diffDays === 1 ? 'ים' : 'ים'}`;
        return date.toLocaleDateString('he-IL');
    } catch {
        return 'עכשיו';
    }
};

interface AppContextType {
    currentUser: User | null;
    activities: Activity[];
    setUserRole: (role: UserRole) => void;
    joinActivity: (activityId: string) => void;
    leaveActivity: (activityId: string) => void;
    createActivity: (activity: Omit<Activity, 'id' | 'participants'>) => Promise<string>;
    isAvailable: boolean;
    toggleAvailability: (duration: string, regions: RegionId[], futureSlots?: AvailabilitySlot[]) => void;
    saveFutureAvailabilitySlots: (slots: AvailabilitySlot[], regions: RegionId[], duration: string) => Promise<void>;
    availabilityDuration: string;
    availabilityRegions: RegionId[];
    activeClownsCount: number;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    notificationsOpen: boolean;
    setNotificationsOpen: (open: boolean) => void;
    notifications: Array<{
        id: string;
        title: string;
        body?: string;
        time: string;
        read: boolean;
        activityId?: string;
        type?: 'new_activity' | 'activity_update' | 'reminder' | 'urgent' | 'clown_attendance' | 'comment_added' | 'participant_joined';
    }>;
    isAuthenticated: boolean;
    login: (phone: string, password: string) => void;
    register: (data: any) => void;
    logout: () => void;
    approveClown: (clown: User) => Promise<void>;
    rejectClown: (clownId: string) => Promise<void>;
    updateUserProfile: (data: Partial<User>) => Promise<void>;
    notificationPreferences: NotificationPreferences;
    updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;
    registerForNotifications: () => Promise<void>;
    isLoadingSession: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingSession, setIsLoadingSession] = useState(true);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isAvailable, setIsAvailable] = useState(false);
    const [availabilityDuration, setAvailabilityDuration] = useState('');
    const [availabilityRegions, setAvailabilityRegions] = useState<RegionId[]>([]);
    const [activeClownsCount, setActiveClownsCount] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Array<{
        id: string;
        title: string;
        body?: string;
        time: string;
        read: boolean;
        activityId?: string;
        type?: 'new_activity' | 'activity_update' | 'reminder' | 'urgent' | 'clown_attendance' | 'comment_added' | 'participant_joined';
    }>>([]);
    const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
    const lastSyncedReminderUserId = useRef<string | null>(null);

    const resolveAvailableUntil = (duration: string, from = new Date()): string | null => {
        const base = new Date(from);
        if (duration === '1h') base.setHours(base.getHours() + 1);
        else if (duration === '2h') base.setHours(base.getHours() + 2);
        else if (duration === '4h') base.setHours(base.getHours() + 4);
        else if (duration === 'today') base.setHours(23, 59, 59, 999);
        else return null;
        return base.toISOString();
    };

    const getRegionsFromAvailability = (availability?: UserAvailability, fallbackArea?: string): RegionId[] => {
        if (availability?.regions && availability.regions.length > 0) {
            return availability.regions.filter((r): r is RegionId => REGIONS.some(opt => opt.id === r));
        }
        const fromLocation = (availability?.location || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
            .map((value) => (REGIONS.some(opt => opt.id === value as RegionId) ? (value as RegionId) : getRegionForLocation(value)));
        if (fromLocation.length > 0) return Array.from(new Set(fromLocation));
        return [getRegionForLocation(fallbackArea || 'מרכז')];
    };

    const isAvailabilityActive = (availability?: UserAvailability): boolean => {
        if (!availability?.isAvailable) return false;

        const now = Date.now();
        const explicitUntil = availability.availableUntil ? new Date(availability.availableUntil).getTime() : NaN;
        if (!Number.isNaN(explicitUntil)) return explicitUntil > now;

        if (!availability.updatedAt || !availability.duration) return false;
        const updatedAt = new Date(availability.updatedAt);
        if (Number.isNaN(updatedAt.getTime())) return false;
        const fallbackUntil = resolveAvailableUntil(availability.duration, updatedAt);
        if (!fallbackUntil) return false;
        return new Date(fallbackUntil).getTime() > now;
    };

    // Firebase Auth state listener
    useEffect(() => {
        console.log('AppContext: Setting up Firebase Auth state listener...');

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log('AppContext: Auth state changed, user:', firebaseUser?.uid);

            if (firebaseUser) {
                // User is signed in
                try {
                    // Try to get user from Firestore by auth UID (approved users)
                    let user = await firebaseService.getUserByAuthUid(firebaseUser.uid);

                    // If not found by UID in users, check pending_clowns
                    if (!user) {
                        const pendingRef = doc(db, 'pending_clowns', firebaseUser.uid);
                        const pendingSnap = await getDoc(pendingRef);
                        if (pendingSnap.exists()) {
                            const pendingData = pendingSnap.data();
                            user = { id: pendingSnap.id, ...pendingData } as User;
                            console.log('AppContext: User found in pending_clowns (waiting for approval):', user.name);
                            // Don't set as authenticated if user is pending
                            setIsAuthenticated(false);
                            setCurrentUser(null);
                            await AsyncStorage.removeItem(AUTH_USER_ID_KEY);
                            return; // Exit early - user is pending approval
                        }
                    }

                    // If not found by UID, try by email in users collection
                    if (!user && firebaseUser.email) {
                        const q = query(
                            collection(db, 'users'),
                            where('email', '==', firebaseUser.email),
                            where('approvalStatus', '==', 'approved')
                        );
                        const snapshot = await getDocs(q);
                        if (!snapshot.empty) {
                            const userDoc = snapshot.docs[0];
                            user = { id: userDoc.id, ...userDoc.data() } as User;
                        }
                    }

                    if (user && user.approvalStatus === 'approved') {
                        console.log('AppContext: User authenticated:', user.name);
                        setCurrentUser(user);
                        setIsAuthenticated(true);
                        await AsyncStorage.setItem(AUTH_USER_ID_KEY, user.id);
                    } else {
                        console.warn('AppContext: Auth user found but not approved or not found in Firestore');
                        setIsAuthenticated(false);
                        setCurrentUser(null);
                    }
                } catch (error) {
                    console.error('AppContext: Error loading user from Firestore:', error);
                    setIsAuthenticated(false);
                    setCurrentUser(null);
                }
            } else {
                // User is signed out
                console.log('AppContext: No authenticated user');
                setIsAuthenticated(false);
                setCurrentUser(null);
                await AsyncStorage.removeItem(AUTH_USER_ID_KEY);
            }

            setIsLoadingSession(false);
        });

        return () => {
            console.log('AppContext: Cleaning up Auth state listener');
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        // Subscribe to activities only when user is authenticated and approved
        if (!isAuthenticated || !currentUser?.id) {
            setActivities([]);
            return;
        }
        const unsubscribe = firebaseService.subscribeToActivities((data) => {
            // Filter based on user role and approval status
            const filtered = data.filter(activity => {
                // Admins see all activities
                if (currentUser.role === 'admin') return true;

                // Organizers see all activities
                if (currentUser.role === 'organizer') return true;

                // Clowns see only approved activities
                if (currentUser.role === 'clown') {
                    return activity.approvalStatus !== 'pending' && activity.approvalStatus !== 'rejected';
                }

                return false;
            });

            setActivities(filtered);
        });
        return () => unsubscribe();
    }, [isAuthenticated, currentUser?.id, currentUser?.role]);

    // Subscribe to user notifications from Firestore
    useEffect(() => {
        if (!currentUser?.id) {
            // Clear notifications if user is not logged in
            setNotifications([]);
            return;
        }

        const unsubscribe = firebaseService.subscribeToUserNotifications(
            currentUser.id,
            (firestoreNotifications) => {
                // Convert Firestore notifications to app format
                const formattedNotifications = firestoreNotifications.map((notif: any) => ({
                    id: notif.id,
                    title: notif.title,
                    body: notif.body || notif.title,
                    time: notif.createdAt ? formatNotificationTime(notif.createdAt) : 'עכשיו',
                    read: notif.read || false,
                    activityId: notif.activityId,
                    type: notif.type || 'activity_update',
                }));
                setNotifications(formattedNotifications);
            }
        );

        return () => unsubscribe();
    }, [currentUser?.id]);

    useEffect(() => {
        const loadCurrentUserAvailability = async () => {
            if (!currentUser?.id) {
                setIsAvailable(false);
                setAvailabilityDuration('');
                setAvailabilityRegions([]);
                return;
            }
            try {
                const availabilityMap = await firebaseService.getAvailabilitiesByUserIds([currentUser.id]);
                const availability = availabilityMap[currentUser.id];
                if (!availability) {
                    setIsAvailable(false);
                    setAvailabilityDuration('');
                    setAvailabilityRegions([]);
                    return;
                }
                const active = isAvailabilityActive(availability);
                setIsAvailable(active);
                setAvailabilityDuration(active ? availability.duration : '');
                setAvailabilityRegions(active ? getRegionsFromAvailability(availability, currentUser.preferredArea) : []);
            } catch (error) {
                console.error('Failed loading current user availability:', error);
            }
        };

        loadCurrentUserAvailability();
    }, [currentUser?.id]);

    useEffect(() => {
        if (!isAuthenticated || !currentUser?.id) {
            setActiveClownsCount(0);
            return;
        }

        const unsubscribe = firebaseService.subscribeToAvailabilities((availabilities) => {
            const activeCount = availabilities.filter((availability) => isAvailabilityActive(availability)).length;
            setActiveClownsCount(activeCount);
        });

        return () => unsubscribe();
    }, [isAuthenticated, currentUser?.id]);

    // Auto-cleanup for admin/organizers
    useEffect(() => {
        const runCleanup = async () => {
            if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'organizer')) {
                await firebaseService.deleteExpiredActivities();
            }
        };
        runCleanup();
    }, [currentUser]);

    useEffect(() => {
        if (notificationPreferences.enabled && isAuthenticated) {
            registerForNotifications();
        }
    }, [notificationPreferences.enabled, isAuthenticated]);

    useEffect(() => {
        if (lastSyncedReminderUserId.current && lastSyncedReminderUserId.current !== currentUser?.id) {
            notificationService
                .syncAvailabilitySlotReminders(lastSyncedReminderUserId.current, [], false)
                .catch((error) => {
                    console.error('Failed clearing reminders for previous user:', error);
                });
        }

        if (!currentUser?.id) {
            lastSyncedReminderUserId.current = null;
            return;
        }
        lastSyncedReminderUserId.current = currentUser.id;

        const remindersEnabled = notificationPreferences.enabled && notificationPreferences.types.reminder;
        const slots = currentUser.futureAvailabilitySlots || [];

        notificationService
            .syncAvailabilitySlotReminders(currentUser.id, slots, remindersEnabled)
            .catch((error) => {
                console.error('Failed syncing availability slot reminders:', error);
            });
    }, [
        currentUser?.id,
        currentUser?.futureAvailabilitySlots,
        notificationPreferences.enabled,
        notificationPreferences.types.reminder,
    ]);

    const setUserRole = async (role: UserRole) => {
        if (!currentUser) return;
        // Update the current user's role in Firestore
        await firebaseService.updateUser(currentUser.id, { role });
        setCurrentUser({ ...currentUser, role });
    };

    const joinActivity = async (activityId: string) => {
        if (!currentUser) return;
        try {
            await firebaseService.joinActivity(activityId, currentUser.id);

            // Add notification for current user
            const activity = activities.find(a => a.id === activityId);
            if (activity) {
                const newNotification = {
                    id: Date.now().toString(),
                    title: `נרשמת בהצלחה לפעילות "${activity.title}"`,
                    time: 'עכשיו',
                    read: false,
                    activityId: activityId,
                    type: 'clown_attendance' as const
                };
                setNotifications(prev => [newNotification, ...prev]);
                
                if (notificationPreferences.enabled && notificationPreferences.types.clownAttendance) {
                    notificationService.sendLocalNotification(
                        'הצטרפות ליצן! 🎉',
                        `${currentUser.name} מצטרף ל${activity.title} ב${activity.institution}`,
                        { activityId }
                    );
                }

                // Send notification to activity organizer
                const organizerId = activity.organizerId;
                if (organizerId && organizerId !== currentUser.id) {
                    try {
                        // Get organizer's push token
                        const organizerTokens = await firebaseService.getUserPushTokens([organizerId]);
                        const organizerToken = organizerTokens.find(ut => ut.pushToken)?.pushToken;

                        if (organizerToken) {
                            await pushNotificationService.sendPushNotification(
                                organizerToken,
                                `ליצן חדש הצטרף לפעילות "${activity.title}"`,
                                `${currentUser.name} הצטרף לפעילות ב${activity.institution}`,
                                { activityId, type: 'participant_joined', participantId: currentUser.id }
                            );
                        }

                        // Create notification in Firestore for organizer
                        await firebaseService.createNotification(organizerId, {
                            type: 'participant_joined',
                            title: `ליצן חדש הצטרף לפעילות "${activity.title}"`,
                            body: `${currentUser.name} הצטרף לפעילות ב${activity.institution}`,
                            activityId: activityId,
                            data: { participantId: currentUser.id, participantName: currentUser.name }
                        });
                    } catch (notificationError) {
                        console.error('Error sending notification to organizer:', notificationError);
                        // Don't fail the join if notifications fail
                    }
                }
            }
        } catch (error) {
            console.error('Error joining activity:', error);
        }
    };

    const leaveActivity = async (activityId: string) => {
        if (!currentUser) return;
        try {
            await firebaseService.leaveActivity(activityId, currentUser.id);

            // Add notification
            const activity = activities.find(a => a.id === activityId);
            if (activity) {
                const newNotification = {
                    id: Date.now().toString(),
                    title: `ביטלת את ההרשמה לפעילות "${activity.title}"`,
                    time: 'עכשיו',
                    read: false,
                    activityId: activityId,
                    type: 'clown_attendance' as const
                };
                setNotifications(prev => [newNotification, ...prev]);
                
                if (notificationPreferences.enabled && notificationPreferences.types.clownAttendance) {
                    notificationService.sendLocalNotification(
                        'ביטול הגעת ליצן 😔',
                        `${currentUser.name} ביטל את השתתפותו ב${activity.title}`,
                        { activityId }
                    );
                }
            }
        } catch (error) {
            console.error('Error leaving activity:', error);
        }
    };

    const createActivity = async (activityData: Omit<Activity, 'id' | 'participants'>): Promise<string> => {
        const docRef = await firebaseService.createActivity(activityData);
        if (!docRef) throw new Error('Failed to create activity - no document reference returned');
        try {
            const newNotification = {
                id: Date.now().toString(),
                title: `פעילות חדשה נוצרה: ${activityData.title}`,
                time: 'עכשיו',
                read: false,
                activityId: docRef.id,
                type: 'new_activity' as const
            };
            setNotifications(prev => [newNotification, ...prev]);
            await notifyNearbyClowns(activityData);
        } catch (err) {
            console.error('Error after creating activity (notifications):', err);
        }
        return docRef.id;
    };

    const notifyNearbyClowns = async (activity: Omit<Activity, 'id' | 'participants'>) => {
        const activityRegion = getRegionForLocation(activity.location);
        console.log('AppContext: Checking available clowns for activity region', activityRegion);

        try {
            const allUsers = await firebaseService.getAllUsers();
            const clowns = allUsers.filter(user => user.role === 'clown');
            const clownIds = clowns.map(c => c.id);
            const availabilityMap = await firebaseService.getAvailabilitiesByUserIds(clownIds);
            const tokenList = await firebaseService.getUserPushTokens(clownIds);
            const tokenByUserId = new Map(tokenList.map(item => [item.userId, item.pushToken]));

            for (const clown of clowns) {
                const ownAvailability = availabilityMap[clown.id];

                if (!isAvailabilityActive(ownAvailability)) continue;

                const clownRegions = getRegionsFromAvailability(ownAvailability, clown.preferredArea);
                if (!clownRegions.includes(activityRegion)) continue;

                const isActivityUrgent = (activity as Activity).isUrgent;
                const title = isActivityUrgent ? 'הקפצה דחופה! 🚨' : 'פעילות מעניינת עבורך! 🎈';
                const body = isActivityUrgent
                    ? `צורך מיידי ב${activity.title} ב${activity.institution}. בואו לעזור!`
                    : `${activity.title} ב${activity.institution}, ${activity.location}`;

                if (currentUser && clown.id === currentUser.id && notificationPreferences.enabled) {
                    await notificationService.sendLocalNotification(title, body);
                }

                await firebaseService.createNotification(clown.id, {
                    type: 'new_activity',
                    title,
                    body,
                    data: { activityTitle: activity.title, location: activity.location, region: activityRegion }
                });

                const pushToken = tokenByUserId.get(clown.id);
                if (pushToken) {
                    await pushNotificationService.sendPushNotification(pushToken, title, body, {
                        type: 'new_activity',
                        location: activity.location,
                        region: activityRegion,
                    });
                }
            }
        } catch (error) {
            console.error('Error notifying nearby clowns:', error);
        }
    };

    const toggleAvailability = async (duration: string, regions: RegionId[], futureSlots: AvailabilitySlot[] = []) => {
        if (!currentUser) return;
        const nextState = !isAvailable;
        setIsAvailable(nextState);
        setAvailabilityDuration(nextState ? duration : '');
        setAvailabilityRegions(nextState ? regions : []);
        const locationLabel = (nextState ? regions : []).join(', ');
        const availableUntil = nextState ? resolveAvailableUntil(duration) : null;

        try {
            await firebaseService.updateAvailability(
                currentUser.id,
                nextState,
                locationLabel,
                duration,
                futureSlots,
                nextState ? regions : [],
                availableUntil || undefined
            );
            await firebaseService.updateUser(currentUser.id, { futureAvailabilitySlots: futureSlots });
            setCurrentUser(prev => (prev ? { ...prev, futureAvailabilitySlots: futureSlots } : prev));
        } catch (error) {
            console.error('Error updating availability:', error);
        }
    };

    const saveFutureAvailabilitySlots = async (slots: AvailabilitySlot[], regions: RegionId[], duration: string) => {
        if (!currentUser) return;
        try {
            await firebaseService.updateAvailability(
                currentUser.id,
                isAvailable,
                regions.join(', '),
                duration,
                slots,
                regions,
                isAvailable ? resolveAvailableUntil(duration) || undefined : undefined
            );
            await firebaseService.updateUser(currentUser.id, { futureAvailabilitySlots: slots });
            setCurrentUser(prev => (prev ? { ...prev, futureAvailabilitySlots: slots } : prev));
        } catch (error) {
            console.error('Error saving future availability slots:', error);
            throw error;
        }
    };

    const login = async (phoneOrEmail: string, password: string) => {
        console.log('AppContext: Login attempt for', phoneOrEmail);

        try {
            // Check if input is email or phone
            const isEmail = phoneOrEmail.includes('@');

            if (isEmail) {
                // Direct email login with Firebase Auth
                const result = await firebaseService.loginWithEmailAndPassword(phoneOrEmail, password);
                if (result) {
                    console.log('AppContext: User logged in via email:', result.firestoreUser.name);
                    // Auth state listener will handle setting the user
                    return;
                } else {
                    throw new Error('LOGIN_FAILED');
                }
            } else {
                // Phone login: sign in with phone@happyhart.app (no Firestore query before login - rules block it)
                await firebaseService.getUserByPhoneAndPassword(phoneOrEmail, password);
                console.log('AppContext: Signed in via phone, auth state listener will set user');
                return;
            }
        } catch (error: any) {
            console.error('AppContext: Login error:', error);
            let errorMessage = 'שם משתמש או סיסמה שגויים';

            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage = 'שם משתמש או סיסמה שגויים';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'כתובת אימייל לא תקינה';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'יותר מדי ניסיונות. נסה שוב מאוחר יותר';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'בעיית רשת. בדוק את החיבור לאינטרנט';
            }

            throw new Error(errorMessage);
        }
    };

    const register = async (data: any) => {
        console.log('AppContext: Registering user:', data);
        // Registration is handled in register.tsx via firebaseService.createPendingClown
        // This function is kept for compatibility but doesn't auto-login
        // User will need to wait for admin approval before they can login
    };

    const logout = async () => {
        console.log('AppContext: Logging out');
        try {
            await firebaseService.logout();
            // Auth state listener will handle clearing the user state
        } catch (error) {
            console.error('AppContext: Error logging out:', error);
            // Fallback: clear state manually
            setCurrentUser(null);
            setIsAuthenticated(false);
            await AsyncStorage.removeItem(AUTH_USER_ID_KEY);
        }
    };

    const approveClown = async (clown: User) => {
        try {
            await firebaseService.approveClown(clown);
        } catch (error) {
            console.error('Error approving clown:', error);
            throw error;
        }
    };

    const rejectClown = async (clownId: string) => {
        try {
            await firebaseService.rejectClown(clownId);
        } catch (error) {
            console.error('Error rejecting clown:', error);
            throw error;
        }
    };

    const updateUserProfile = async (data: Partial<User>) => {
        if (!currentUser) return;
        try {
            await firebaseService.updateUser(currentUser.id, data);
            setCurrentUser(prev => prev ? { ...prev, ...data } : null);
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    };

    const updateNotificationPreferences = (prefs: Partial<NotificationPreferences>) => {
        setNotificationPreferences(prev => ({
            ...prev,
            ...prefs,
            types: {
                ...prev.types,
                ...(prefs.types || {}),
            },
            preferredRegions: prefs.preferredRegions || prev.preferredRegions,
            quietHours: {
                ...prev.quietHours,
                ...(prefs.quietHours || {}),
            },
        }));
    };

    const registerForNotifications = async () => {
        if (!currentUser) return;
        console.log('AppContext: Registering for notifications');
        try {
            const token = await notificationService.registerForPushNotificationsAsync();
            if (token) {
                console.log('AppContext: Received push token:', token);
                await firebaseService.updateUserPushToken(currentUser.id, token);
            }
        } catch (error) {
            console.error('AppContext: Error registering for notifications:', error);
        }
    };


    return (
        <AppContext.Provider value={{
            currentUser,
            activities,
            setUserRole,
            joinActivity,
            leaveActivity,
            createActivity,
            isAvailable,
            toggleAvailability,
            saveFutureAvailabilitySlots,
            availabilityDuration,
            availabilityRegions,
            activeClownsCount,
            sidebarOpen,
            setSidebarOpen,
            notificationsOpen,
            setNotificationsOpen,
            notifications,
            isAuthenticated,
            login,
            register,
            logout,
            notificationPreferences,
            updateNotificationPreferences,
            registerForNotifications,
            approveClown,
            rejectClown,
            updateUserProfile,
            isLoadingSession
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
