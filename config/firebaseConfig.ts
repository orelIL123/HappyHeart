import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyBPZnenblzrBWYvXsyPyg5A72MwyV_PuxY",
    authDomain: "happyapp-b8d4d.firebaseapp.com",
    projectId: "happyapp-b8d4d",
    storageBucket: "happyapp-b8d4d.firebasestorage.app",
    messagingSenderId: "172980019258",
    appId: "1:172980019258:android:bb3f0029102d2623251503"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const storage = getStorage(app);
