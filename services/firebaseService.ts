import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    User as FirebaseAuthUser 
} from 'firebase/auth';
import { db, storage, auth } from '../config/firebaseConfig';
import { Activity, User } from '../constants/MockData';

export const firebaseService = {
    // Activities
    subscribeToActivities: (callback: (activities: Activity[]) => void) => {
        const q = query(collection(db, 'activities'), orderBy('startTime', 'asc'));
        return onSnapshot(q,
            (snapshot) => {
                const activities = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Activity[];
                callback(activities);
            },
            (error) => {
                console.error('Firestore Subscription Error:', error.message);
                if (error.code === 'permission-denied') {
                    console.warn('נראה שחסרות הרשאות לקריאת פעילויות. בדוק את ה-Firestore Rules.');
                }
            }
        );
    },

    createActivity: async (activity: Omit<Activity, 'id' | 'participants'>) => {
        return await addDoc(collection(db, 'activities'), {
            ...activity,
            participants: []
        });
    },

    joinActivity: async (activityId: string, userId: string) => {
        const activityRef = doc(db, 'activities', activityId);
        return await updateDoc(activityRef, {
            participants: arrayUnion(userId)
        });
    },

    leaveActivity: async (activityId: string, userId: string) => {
        const activityRef = doc(db, 'activities', activityId);
        return await updateDoc(activityRef, {
            participants: arrayRemove(userId)
        });
    },

    deleteExpiredActivities: async () => {
        try {
            const now = new Date().toISOString();
            const q = query(
                collection(db, 'activities'),
                where('expirationDate', '<', now)
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) return;

            const batch = writeBatch(db);
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            console.log(`Cleanup: Deleted ${snapshot.size} expired activities.`);
        } catch (error) {
            console.error('Error deleting expired activities:', error);
        }
    },

    // Users
    getUser: async (userId: string) => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        return userSnap.exists() ? (userSnap.data() as User) : null;
    },

    getUserByPhoneAndPassword: async (phone: string, password: string): Promise<User | null> => {
        try {
            // First, find user in Firestore by phone
            const q = query(
                collection(db, 'users'),
                where('phone', '==', phone),
                where('approvalStatus', '==', 'approved')
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const userDoc = snapshot.docs[0];
                const userData = userDoc.data();
                
                // Get email from user data (should be stored when user is created or linked)
                const email = userData.email;
                if (!email) {
                    console.warn('User found but no email stored. User may need to be linked to Auth.');
                    // Try to generate email from phone (for backward compatibility)
                    const generatedEmail = `${phone.replace(/\D/g, '')}@happyhart.app`;
                    try {
                        await signInWithEmailAndPassword(auth, generatedEmail, password);
                        // Update user with email for next time
                        const userRef = doc(db, 'users', userDoc.id);
                        await updateDoc(userRef, { email: generatedEmail });
                        return { id: userDoc.id, ...userData, email: generatedEmail } as User;
                    } catch (authError: any) {
                        console.error('Firebase Auth sign in error with generated email:', authError);
                        return null;
                    }
                }
                
                // Try to sign in with Firebase Auth
                try {
                    await signInWithEmailAndPassword(auth, email, password);
                    return { id: userDoc.id, ...userData } as User;
                } catch (authError: any) {
                    console.error('Firebase Auth sign in error:', authError);
                    // If auth fails, return null
                    return null;
                }
            }
            return null;
        } catch (error) {
            console.error('Error getting user by phone and password:', error);
            return null;
        }
    },

    // New: Login with email and password using Firebase Auth
    loginWithEmailAndPassword: async (email: string, password: string): Promise<{ authUser: FirebaseAuthUser; firestoreUser: User } | null> => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const authUser = userCredential.user;
            
            // Find user in Firestore by auth UID or email
            let userDoc;
            const userRef = doc(db, 'users', authUser.uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                userDoc = userSnap;
            } else {
                // Try to find by email
                const q = query(
                    collection(db, 'users'),
                    where('email', '==', email),
                    where('approvalStatus', '==', 'approved')
                );
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    userDoc = snapshot.docs[0];
                }
            }
            
            if (userDoc && userDoc.exists()) {
                const userData = userDoc.data();
                return {
                    authUser,
                    firestoreUser: { id: userDoc.id, ...userData } as User
                };
            }
            
            return null;
        } catch (error: any) {
            console.error('Error logging in with email and password:', error);
            throw error;
        }
    },

    // New: Register user in Firebase Auth
    registerWithEmailAndPassword: async (email: string, password: string, userData: Omit<User, 'id'>): Promise<FirebaseAuthUser> => {
        try {
            // Validate email format
            if (!email || !email.includes('@')) {
                throw new Error('כתובת אימייל לא תקינה');
            }
            
            // Validate password length
            if (!password || password.length < 6) {
                throw new Error('הסיסמה חייבת להכיל לפחות 6 תווים');
            }
            
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const authUser = userCredential.user;
            
            // Store user data in Firestore with auth UID
            const userRef = doc(db, 'pending_clowns', authUser.uid);
            await setDoc(userRef, {
                ...userData,
                email,
                authUid: authUser.uid,
                approvalStatus: 'pending',
                createdAt: new Date().toISOString()
            });
            
            return authUser;
        } catch (error: any) {
            console.error('Error registering with email and password:', error);
            
            // Handle specific Firebase Auth errors
            if (error.code === 'auth/email-already-in-use') {
                throw new Error('כתובת האימייל כבר בשימוש. אם אתה כבר רשום, נסה להתחבר במקום');
            } else if (error.code === 'auth/invalid-email') {
                throw new Error('כתובת אימייל לא תקינה');
            } else if (error.code === 'auth/weak-password') {
                throw new Error('הסיסמה חלשה מדי. אנא בחר סיסמה חזקה יותר (לפחות 6 תווים)');
            } else if (error.code === 'auth/operation-not-allowed') {
                throw new Error('פעולת ההרשמה לא מאופשרת. אנא פנה למנהל המערכת');
            } else if (error.code === 'auth/network-request-failed') {
                throw new Error('בעיית רשת. אנא בדוק את החיבור לאינטרנט ונסה שוב');
            }
            
            // Re-throw with original message if it's already a string
            if (typeof error === 'string' || error.message) {
                throw error;
            }
            
            throw new Error('ההרשמה נכשלה. נסה שוב מאוחר יותר');
        }
    },

    // New: Logout from Firebase Auth
    logout: async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error logging out:', error);
            throw error;
        }
    },

    // New: Get user by Firebase Auth UID
    getUserByAuthUid: async (uid: string): Promise<User | null> => {
        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                return { id: userSnap.id, ...userSnap.data() } as User;
            }
            return null;
        } catch (error) {
            console.error('Error getting user by auth UID:', error);
            return null;
        }
    },

    getUsersByIds: async (userIds: string[]): Promise<User[]> => {
        if (userIds.length === 0) return [];
        try {
            const users: User[] = [];
            // Firestore has a limit of 10 items in 'in' queries, so we batch
            const batchSize = 10;
            for (let i = 0; i < userIds.length; i += batchSize) {
                const batch = userIds.slice(i, i + batchSize);
                const q = query(
                    collection(db, 'users'),
                    where('__name__', 'in', batch)
                );
                const snapshot = await getDocs(q);
                snapshot.docs.forEach(doc => {
                    users.push({ id: doc.id, ...doc.data() } as User);
                });
            }
            return users;
        } catch (error) {
            console.error('Error getting users by IDs:', error);
            // Fallback: get users one by one
            const users: User[] = [];
            for (const userId of userIds) {
                try {
                    const user = await firebaseService.getUser(userId);
                    if (user) {
                        users.push({ ...user, id: userId });
                    }
                } catch (err) {
                    console.warn(`Error getting user ${userId}:`, err);
                }
            }
            return users;
        }
    },

    getAllUsers: async (): Promise<User[]> => {
        try {
            const q = query(collection(db, 'users'), where('approvalStatus', '==', 'approved'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as User[];
        } catch (error) {
            console.error('Error getting all users:', error);
            return [];
        }
    },

    updateUser: async (userId: string, data: Partial<User>) => {
        const userRef = doc(db, 'users', userId);
        return await setDoc(userRef, data, { merge: true });
    },

    // Availability
    updateAvailability: async (userId: string, isAvailable: boolean, location: string, duration: string) => {
        const availabilityRef = doc(db, 'availabilities', userId);
        return await setDoc(availabilityRef, {
            userId,
            isAvailable,
            location,
            duration,
            updatedAt: new Date().toISOString()
        });
    },

    // Pending Approvals
    subscribeToPendingClowns: (callback: (clowns: User[]) => void) => {
        const q = query(collection(db, 'pending_clowns'), orderBy('name', 'asc'));
        return onSnapshot(q, (snapshot) => {
            const clowns = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as User[];
            callback(clowns);
        });
    },

    createPendingClown: async (userData: Omit<User, 'id'>) => {
        return await addDoc(collection(db, 'pending_clowns'), {
            ...userData,
            approvalStatus: 'pending',
            createdAt: new Date().toISOString()
        });
    },

    approveClown: async (clown: User) => {
        // Get email and authUid from pending clown data
        const pendingRef = doc(db, 'pending_clowns', clown.id);
        const pendingSnap = await getDoc(pendingRef);
        const pendingData = pendingSnap.exists() ? pendingSnap.data() : null;
        
        const email = pendingData?.email || clown.email;
        const authUid = pendingData?.authUid || clown.id;
        
        // User should already exist in Firebase Auth (created during registration)
        // Use the authUid from pending data, or fallback to clown.id
        const finalAuthUid = authUid;
        
        if (!authUid) {
            console.warn('approveClown: No authUid found for clown:', clown.name);
            console.warn('This should not happen if registration worked correctly');
        }
        
        // 1. Create the user in the main users collection with auth UID
        const userRef = doc(db, 'users', finalAuthUid);
        await setDoc(userRef, {
            ...clown,
            email,
            authUid: finalAuthUid,
            role: 'clown',
            approvalStatus: 'approved'
        }, { merge: true });

        // 2. Remove from pending
        await deleteDoc(pendingRef);
    },

    rejectClown: async (clownId: string) => {
        const pendingRef = doc(db, 'pending_clowns', clownId);
        await deleteDoc(pendingRef);
    },

    updateUserPushToken: async (userId: string, token: string) => {
        const userRef = doc(db, 'users', userId);
        return await updateDoc(userRef, {
            pushToken: token
        });
    },

    // Tutorials
    subscribeToTutorials: (callback: (tutorials: any[]) => void) => {
        const q = query(collection(db, 'tutorials'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const tutorials = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(tutorials);
        });
    },

    createTutorial: async (tutorial: { title: string, url: string, category: string, description: string, thumbnail: string }) => {
        return await addDoc(collection(db, 'tutorials'), {
            ...tutorial,
            createdAt: new Date().toISOString()
        });
    },

    uploadProfileImage: async (userId: string, uri: string) => {
        const response = await fetch(uri);
        const blob = await response.blob();
        const storageRef = ref(storage, `profile_images/${userId}`);
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);

        // Update user profile with new avatar URL
        await firebaseService.updateUser(userId, { avatar: downloadURL });
        return downloadURL;
    }
};
