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
import { db, storage } from '../config/firebaseConfig';
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
        // 1. Create the user in the main users collection
        const userRef = doc(db, 'users', clown.id);
        await setDoc(userRef, {
            ...clown,
            role: 'clown',
            approvalStatus: 'approved'
        });

        // 2. Remove from pending
        const pendingRef = doc(db, 'pending_clowns', clown.id);
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
