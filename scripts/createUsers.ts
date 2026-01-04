/**
 * Script to create initial users in Firestore
 * Run with: npx ts-node scripts/createUsers.ts
 * Or: node -r ts-node/register scripts/createUsers.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

// Use the same config as the app
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const users = [
    {
        id: '1',
        name: "ז'קו הליצן",
        role: 'clown',
        avatar: 'https://i.pravatar.cc/150?u=jacko',
        preferredArea: 'מרכז',
        phone: '0501234567',
        password: '123456',
        approvalStatus: 'approved'
    },
    {
        id: '2',
        name: 'פופו המארגן',
        role: 'organizer',
        avatar: 'https://i.pravatar.cc/150?u=fofo',
        preferredArea: 'צפון',
        phone: '0502345678',
        password: '123456',
        approvalStatus: 'approved'
    },
    {
        id: '3',
        name: 'שמחה האדמינית',
        role: 'admin',
        avatar: 'https://i.pravatar.cc/150?u=simcha',
        preferredArea: 'ירושלים',
        phone: '0503456789',
        password: '123456',
        approvalStatus: 'approved'
    },
    {
        id: '4',
        name: 'עמוס סגרון',
        role: 'admin',
        avatar: 'https://i.pravatar.cc/150?u=amos',
        preferredArea: 'מרכז',
        phone: '0529250237',
        password: '112233',
        approvalStatus: 'approved'
    }
];

async function createUsers() {
    console.log('Creating users in Firestore...\n');
    
    for (const user of users) {
        try {
            const userRef = doc(db, 'users', user.id);
            await setDoc(userRef, {
                name: user.name,
                role: user.role,
                avatar: user.avatar,
                preferredArea: user.preferredArea,
                phone: user.phone,
                password: user.password,
                approvalStatus: user.approvalStatus,
                createdAt: new Date().toISOString()
            });
            console.log(`✅ Created: ${user.name} (${user.role}) - Phone: ${user.phone}`);
        } catch (error: any) {
            console.error(`❌ Error creating ${user.name}:`, error.message);
        }
    }
    
    console.log('\n✅ Done! All users created.');
    console.log('\nLogin credentials:');
    users.forEach(user => {
        console.log(`  ${user.name}: ${user.phone} / ${user.password}`);
    });
}

createUsers()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });

