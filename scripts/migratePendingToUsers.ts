/**
 * Script to migrate existing users from pending_clowns to users collection
 * Run this once to fix the issue with existing pending users
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

// Your Firebase config (from firebaseConfig.ts)
const firebaseConfig = {
    apiKey: "AIzaSyBSVZTEWX4gdZ9FYvbAD-MrrvHEKEEjGAo",
    authDomain: "happyhart-7afef.firebaseapp.com",
    projectId: "happyhart-7afef",
    storageBucket: "happyhart-7afef.firebasestorage.app",
    messagingSenderId: "96746706811",
    appId: "1:96746706811:web:5c2a11df90b8f89f55b6fa",
    measurementId: "G-SGKZ8MSWCZ"
};

async function migratePendingToUsers() {
    console.log('🚀 Starting migration from pending_clowns to users...');

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    try {
        // Get all pending clowns
        const pendingSnapshot = await getDocs(collection(db, 'pending_clowns'));

        if (pendingSnapshot.empty) {
            console.log('✅ No pending clowns to migrate');
            return;
        }

        console.log(`📋 Found ${pendingSnapshot.size} pending clowns to migrate`);

        for (const docSnapshot of pendingSnapshot.docs) {
            const userData = docSnapshot.data();
            const userId = docSnapshot.id;

            console.log(`\n📝 Migrating user: ${userData.name} (${userId})`);

            // Create user in users collection with approved status
            const userRef = doc(db, 'users', userId);
            await setDoc(userRef, {
                ...userData,
                approvalStatus: 'approved',
                role: userData.role || 'clown',
                createdAt: userData.createdAt || new Date().toISOString()
            });

            console.log(`  ✅ Created in users collection`);

            // Delete from pending_clowns
            await deleteDoc(doc(db, 'pending_clowns', userId));
            console.log(`  🗑️  Removed from pending_clowns`);
        }

        console.log('\n🎉 Migration completed successfully!');
        console.log('All pending users have been approved and moved to the users collection.');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Run the migration
migratePendingToUsers()
    .then(() => {
        console.log('\n✅ Script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
