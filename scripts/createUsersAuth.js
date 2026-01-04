/**
 * Script to create users in Firebase Authentication
 * Note: This is optional - the app works with Firestore only
 * Run with: node scripts/createUsersAuth.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../happyapp-b8d4d-firebase-adminsdk-fbsvc-9302c0c70e.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const users = [
    {
        email: 'jacko@happyhart.app',
        phone: '0501234567',
        password: '123456',
        displayName: "ז'קו הליצן"
    },
    {
        email: 'fofo@happyhart.app',
        phone: '0502345678',
        password: '123456',
        displayName: 'פופו המארגן'
    },
    {
        email: 'simcha@happyhart.app',
        phone: '0503456789',
        password: '123456',
        displayName: 'שמחה האדמינית'
    },
    {
        email: 'amos@happyhart.app',
        phone: '0529250237',
        password: '112233',
        displayName: 'עמוס סגרון'
    }
];

async function createUsersInAuth() {
    console.log('Creating users in Firebase Authentication...\n');
    
    for (const user of users) {
        try {
            // Create user with email and password
            const userRecord = await admin.auth().createUser({
                email: user.email,
                password: user.password,
                displayName: user.displayName,
                phoneNumber: `+972${user.phone.substring(1)}`, // Convert to international format
                disabled: false
            });
            
            console.log(`✅ Created in Auth: ${user.displayName} (${user.email})`);
            console.log(`   UID: ${userRecord.uid}`);
        } catch (error) {
            if (error.code === 'auth/email-already-exists') {
                console.log(`⚠️  User already exists: ${user.email}`);
            } else {
                console.error(`❌ Error creating ${user.displayName}:`, error.message);
            }
        }
    }
    
    console.log('\n✅ Done!');
    console.log('\nNote: The app uses Firestore for authentication, not Firebase Auth.');
    console.log('These users in Auth are for reference only.');
}

createUsersInAuth()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });

