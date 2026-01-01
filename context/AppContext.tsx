import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { CITY_COORDINATES } from '../constants/Coordinates';
import { Activity, MOCK_USERS, User, UserRole } from '../constants/MockData';
import { DEFAULT_NOTIFICATION_PREFERENCES, NotificationPreferences } from '../constants/NotificationTypes';
import { firebaseService } from '../services/firebaseService';
import { notificationService } from '../services/notificationService';

// Storage keys
const AUTH_USER_ID_KEY = '@auth_user_id';
const AUTH_IS_GUEST_KEY = '@auth_is_guest';

interface AppContextType {
    currentUser: User | null;
    activities: Activity[];
    setUserRole: (role: UserRole) => void;
    joinActivity: (activityId: string) => void;
    leaveActivity: (activityId: string) => void;
    createActivity: (activity: Omit<Activity, 'id' | 'participants'>) => void;
    isAvailable: boolean;
    toggleAvailability: (duration: string, location: string) => void;
    availabilityDuration: string;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    notificationsOpen: boolean;
    setNotificationsOpen: (open: boolean) => void;
    notifications: { id: string; title: string; time: string; read: boolean }[];
    isAuthenticated: boolean;
    isGuest: boolean;
    login: (phone: string, password: string) => void;
    register: (data: any) => void;
    logout: () => void;
    skipAuth: () => void;
    approveClown: (clown: User) => Promise<void>;
    rejectClown: (clownId: string) => Promise<void>;
    updateUserProfile: (data: Partial<User>) => Promise<void>;
    notificationPreferences: NotificationPreferences;
    updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;
    registerForNotifications: () => Promise<void>;
    isLoadingSession: boolean;
    availabilityLocation: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isGuest, setIsGuest] = useState(false);
    const [isLoadingSession, setIsLoadingSession] = useState(true);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isAvailable, setIsAvailable] = useState(false);
    const [availabilityDuration, setAvailabilityDuration] = useState('');
    const [availabilityLocation, setAvailabilityLocation] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: '1', title: 'הקפצה חדשה! זקוקים לליצן במיון ילדים באיכילוב', time: 'לפני 5 דק׳', read: false },
        { id: '2', title: 'נרשמת בהצלחה לפעילות "יום הולדת במחלקת לב"', time: 'לפני שעה', read: true },
        { id: '3', title: 'הפעילות בבלינסון מתחילה בעוד שעתיים', time: 'לפני שעתיים', read: true },
    ]);
    const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);

    // Initial session load
    useEffect(() => {
        const loadSession = async () => {
            console.log('AppContext: Starting loadSession...');
            try {
                const storedUserId = await AsyncStorage.getItem(AUTH_USER_ID_KEY);
                const storedIsGuest = await AsyncStorage.getItem(AUTH_IS_GUEST_KEY);

                console.log('AppContext: Stored Session - userId:', storedUserId, 'isGuest:', storedIsGuest);

                if (storedUserId) {
                    const user = await firebaseService.getUser(storedUserId);
                    if (user) {
                        console.log('AppContext: Restoring session for:', user.name);
                        setCurrentUser({ ...user, id: storedUserId });
                        setIsAuthenticated(true);
                        setIsGuest(false);
                    } else {
                        console.warn('AppContext: Stored user ID not found in Firestore:', storedUserId);
                        // Fallback to mock if not found in Firestore yet (optional)
                        const mockUser = MOCK_USERS.find(u => u.id === storedUserId);
                        if (mockUser) {
                            setCurrentUser(mockUser);
                            setIsAuthenticated(true);
                        }
                    }
                } else if (storedIsGuest === 'true') {
                    console.log('AppContext: Restoring guest session');
                    setIsGuest(true);
                    setIsAuthenticated(false);
                    // For guest, we can just use a dummy user or the first mock user
                    setCurrentUser(MOCK_USERS[0]);
                } else {
                    console.log('AppContext: No stored session found');
                }
            } catch (error) {
                console.error('AppContext: Error loading session:', error);
            } finally {
                console.log('AppContext: loadSession finished, setting isLoadingSession to false');
                setIsLoadingSession(false);
            }
        };

        loadSession();
    }, []);

    useEffect(() => {
        // Real-time subscription to activities
        const unsubscribe = firebaseService.subscribeToActivities((data) => {
            setActivities(data);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (notificationPreferences.enabled && isAuthenticated) {
            registerForNotifications();
        }
    }, [notificationPreferences.enabled, isAuthenticated]);

    const setUserRole = async (role: UserRole) => {
        const user = MOCK_USERS.find(u => u.role === role) || MOCK_USERS[0];
        setCurrentUser(user);
        // Ideally, we'd sync this with Firebase Auth/Firestore here
        await firebaseService.updateUser(user.id, user);
    };

    const joinActivity = async (activityId: string) => {
        if (!currentUser) return;
        try {
            await firebaseService.joinActivity(activityId, currentUser.id);

            // Send notification
            const activity = activities.find(a => a.id === activityId);
            if (activity && notificationPreferences.enabled && notificationPreferences.types.clownAttendance) {
                notificationService.sendLocalNotification(
                    'הצטרפות ליצן! 🎉',
                    `${currentUser.name} מצטרף ל${activity.title} ב${activity.institution}`
                );
            }
        } catch (error) {
            console.error('Error joining activity:', error);
        }
    };

    const leaveActivity = async (activityId: string) => {
        if (!currentUser) return;
        try {
            await firebaseService.leaveActivity(activityId, currentUser.id);

            // Send notification
            const activity = activities.find(a => a.id === activityId);
            if (activity && notificationPreferences.enabled && notificationPreferences.types.clownAttendance) {
                notificationService.sendLocalNotification(
                    'ביטול הגעת ליצן 😔',
                    `${currentUser.name} ביטל את השתתפותו ב${activity.title}`
                );
            }
        } catch (error) {
            console.error('Error leaving activity:', error);
        }
    };

    const createActivity = async (activityData: Omit<Activity, 'id' | 'participants'>) => {
        try {
            const docRef = await firebaseService.createActivity(activityData);
            if (docRef) {
                // Trigger notifications for nearby clowns
                await notifyNearbyClowns(activityData);
            }
        } catch (error) {
            console.error('Error creating activity:', error);
        }
    };

    const notifyNearbyClowns = async (activity: Omit<Activity, 'id' | 'participants'>) => {
        const activityCoords = CITY_COORDINATES[activity.location];
        if (!activityCoords) return;

        console.log('AppContext: Checking for nearby clowns for activity in', activity.location);

        // In a real app, we would query Firestore for users with matching preferences
        // For this demo, we'll simulate sending notifications to clowns in the MOCK_USERS
        MOCK_USERS.forEach(user => {
            if (user.role === 'clown') {
                // If it's the current user, use their actual availability location if active
                let userLocation = user.preferredArea || 'תל אביב';
                if (currentUser && user.id === currentUser.id && isAvailable && availabilityLocation) {
                    userLocation = availabilityLocation;
                }

                const userCoords = CITY_COORDINATES[userLocation] || CITY_COORDINATES['תל אביב'];
                const distance = notificationService.calculateDistance(
                    activityCoords.latitude,
                    activityCoords.longitude,
                    userCoords.latitude,
                    userCoords.longitude
                );

                console.log(`AppContext: Distance to ${user.name}: ${distance.toFixed(1)}km`);

                // Check if user is within radius OR in preferred region
                const radius = notificationPreferences.proximityRadius;
                const isWithinRadius = radius === 0 || distance <= radius;

                // Simple region check (mock logic: if activity city is in a region, check if user prefers that region)
                // In real app, cities would be mapped to North/South/Center
                const activityRegion = 'מרכז'; // Mocking all activity locations as Center for this demo
                const isPreferredRegion = notificationPreferences.types.regionalActivity &&
                    notificationPreferences.preferredRegions.includes(activityRegion);

                if (isWithinRadius || isPreferredRegion) {
                    console.log(`AppContext: Notifying ${user.name} - match found!`);

                    // If it's the current user, send a local notification for immediate feedback
                    if (currentUser && user.id === currentUser.id && notificationPreferences.enabled) {
                        const isActivityUrgent = (activity as Activity).isUrgent;

                        notificationService.sendLocalNotification(
                            isActivityUrgent ? 'הקפצה דחופה! 🚨' : 'פעילות מעניינת עבורך! 🎈',
                            isActivityUrgent
                                ? `צורך מיידי ב${activity.title} ב${activity.institution}. בואו לעזור!`
                                : `${activity.title} ב${activity.institution}, ${activity.location}`
                        );
                    }
                }
            }
        });
    };

    const toggleAvailability = async (duration: string, location: string) => {
        if (!currentUser) return;
        const nextState = !isAvailable;
        setIsAvailable(nextState);
        setAvailabilityDuration(nextState ? duration : '');
        setAvailabilityLocation(nextState ? location : '');

        try {
            await firebaseService.updateAvailability(currentUser.id, nextState, location, duration);
        } catch (error) {
            console.error('Error updating availability:', error);
        }
    };

    const login = async (phone: string, password: string) => {
        console.log('AppContext: Login attempt for', phone);
        // Find user in MOCK_USERS
        let user = MOCK_USERS.find(u => u.phone === phone && u.password === password);

        // Fallback for demo: if no match but specific admin credits, still log in
        if (!user && phone === '0529250237' && password === '112233') {
            user = MOCK_USERS.find(u => u.id === '4');
        }

        if (user) {
            console.log('AppContext: User logged in:', user.name);
            setCurrentUser(user);
            setIsAuthenticated(true);
            setIsGuest(false);
            await AsyncStorage.setItem(AUTH_USER_ID_KEY, user.id);
            await AsyncStorage.removeItem(AUTH_IS_GUEST_KEY);
        } else {
            console.warn('AppContext: User not found with credits:', phone, password);
            alert('פרטי התחברות שגויים');
        }
    };

    const register = async (data: any) => {
        console.log('AppContext: Registering user:', data);
        // Basic register logic - will set state but logically it should be pending
        const user = MOCK_USERS[0];
        setCurrentUser(user);
        setIsAuthenticated(true);
        setIsGuest(false);
        await AsyncStorage.setItem(AUTH_USER_ID_KEY, user.id);
        await AsyncStorage.removeItem(AUTH_IS_GUEST_KEY);
    };

    const logout = async () => {
        console.log('AppContext: Logging out');
        setCurrentUser(null);
        setIsAuthenticated(false);
        setIsGuest(false);
        await AsyncStorage.removeItem(AUTH_USER_ID_KEY);
        await AsyncStorage.removeItem(AUTH_IS_GUEST_KEY);
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

    const skipAuth = async () => {
        console.log('AppContext: Skipping auth');
        setIsGuest(true);
        setIsAuthenticated(false);
        setCurrentUser(MOCK_USERS[0]); // Set a default demo user for guest mode
        await AsyncStorage.setItem(AUTH_IS_GUEST_KEY, 'true');
        await AsyncStorage.removeItem(AUTH_USER_ID_KEY);
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
            availabilityDuration,
            sidebarOpen,
            setSidebarOpen,
            notificationsOpen,
            setNotificationsOpen,
            notifications,
            isAuthenticated,
            isGuest,
            login,
            register,
            logout,
            skipAuth,
            notificationPreferences,
            updateNotificationPreferences,
            registerForNotifications,
            approveClown,
            rejectClown,
            updateUserProfile,
            isLoadingSession,
            availabilityLocation
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
