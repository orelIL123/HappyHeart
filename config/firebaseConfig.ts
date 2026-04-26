import { Platform } from 'react-native';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const platformFirebaseAppId =
    Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_FIREBASE_APP_ID_IOS ?? process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? ''
        : Platform.OS === 'android'
            ? process.env.EXPO_PUBLIC_FIREBASE_APP_ID_ANDROID ?? process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? ''
            : process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '';

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: platformFirebaseAppId
};

// Validate required Firebase config to prevent crashes on launch (e.g. missing EAS env)
const required = ['apiKey', 'projectId', 'appId'] as const;
const missing = required.filter((k) => !firebaseConfig[k]);
if (missing.length > 0) {
    console.error('Firebase config missing:', missing.join(', '), '- check EXPO_PUBLIC_* env vars in EAS secrets');
}

let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

export const db = getFirestore(app);

// Use default Firebase Auth initialization to avoid native startup crashes on iOS.
// React Native persistence wiring changed across Firebase SDK versions and was
// causing bootstrap failures with the current dependency set.
if (Platform.OS !== 'web') {
    void ReactNativeAsyncStorage;
}
export const auth: Auth = getAuth(app);
export const storage = getStorage(app);
