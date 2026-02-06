/**
 * Script to ensure all users have correct data in Firestore
 * Run with: node scripts/ensureUsersComplete.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../happyapp-b8d4d-firebase-adminsdk-fbsvc-9302c0c70e.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

const users = [
    {
        phone: '0501234567',
        email: '0501234567@happyhart.app',
        name: "ז'קו הליצן",
        role: 'clown',
        password: '123456'
    },
    {
        phone: '0502345678',
        email: '0502345678@happyhart.app',
        name: 'פופו המארגן',
        role: 'organizer',
        password: '123456'
    },
    {
        phone: '0503456789',
        email: '0503456789@happyhart.app',
        name: 'שמחה האדמינית',
        role: 'admin',
        password: '123456'
    },
    {
        phone: '0529250237',
        email: '0529250237@happyhart.app',
        name: 'עמוס סגרון',
        role: 'admin',
        password: '112233'
    }
];

async function ensureUsersComplete() {
    console.log('Ensuring all users are complete in Firestore...\n');
    
    for (const userData of users) {
        try {
            // Get user from Firebase Auth
            const authUser = await admin.auth().getUserByEmail(userData.email);
            const authUid = authUser.uid;
            
            // Get or create user in Firestore with auth UID as document ID
            const userRef = db.collection('users').doc(authUid);
            const userSnap = await userRef.get();
            
            const userDocData = {
                name: userData.name,
                phone: userData.phone,
                email: userData.email,
                authUid: authUid,
                role: userData.role,
                approvalStatus: 'approved',
                avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(userData.name)}`,
                preferredArea: userData.role === 'admin' ? 'מרכז' : 'מרכז',
                createdAt: userSnap.exists ? userSnap.data().createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            await userRef.set(userDocData, { merge: true });
            
            console.log(`✅ ${userData.name}:`);
            console.log(`   Email: ${userData.email}`);
            console.log(`   Phone: ${userData.phone}`);
            console.log(`   Auth UID: ${authUid}`);
            console.log(`   Document ID: ${authUid}`);
            console.log(`   Role: ${userData.role}`);
            console.log(`   Approval: approved\n`);
            
        } catch (error) {
            console.error(`❌ Error processing ${userData.name}:`, error.message);
            console.log('');
        }
    }
    
    console.log('✅ All users verified and updated!');
    console.log('\n📋 Login credentials:');
    users.forEach(user => {
        console.log(`\n${user.name}:`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Phone: ${user.phone}`);
        console.log(`  Password: ${user.password}`);
    });
}

ensureUsersComplete()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
