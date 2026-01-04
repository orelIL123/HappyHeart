/**
 * Script to link existing Firestore users with Firebase Authentication users
 * This updates Firestore users with email and authUid from Firebase Auth
 * Run with: node scripts/linkUsersToAuth.js
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

// Mapping of phone numbers to emails (based on createUsersAuth.js)
const phoneToEmail = {
    '0501234567': 'jacko@happyhart.app',
    '0502345678': 'fofo@happyhart.app',
    '0503456789': 'simcha@happyhart.app',
    '0529250237': 'amos@happyhart.app'
};

async function linkUsersToAuth() {
    console.log('Linking Firestore users to Firebase Auth...\n');
    
    try {
        // Get all users from Firestore
        const usersSnapshot = await db.collection('users').get();
        
        if (usersSnapshot.empty) {
            console.log('No users found in Firestore');
            return;
        }
        
        console.log(`Found ${usersSnapshot.size} users in Firestore\n`);
        
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const phone = userData.phone;
            const email = phoneToEmail[phone] || userData.email;
            
            if (!email) {
                console.log(`⚠️  Skipping ${userData.name} - no email found for phone ${phone}`);
                continue;
            }
            
            try {
                // Find user in Firebase Auth by email
                const authUser = await admin.auth().getUserByEmail(email);
                
                // Update Firestore user with email and authUid
                await userDoc.ref.update({
                    email: email,
                    authUid: authUser.uid
                });
                
                console.log(`✅ Linked: ${userData.name} (${email}) -> Auth UID: ${authUser.uid}`);
            } catch (error) {
                if (error.code === 'auth/user-not-found') {
                    console.log(`⚠️  User ${userData.name} (${email}) not found in Firebase Auth`);
                } else {
                    console.error(`❌ Error linking ${userData.name}:`, error.message);
                }
            }
        }
        
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

linkUsersToAuth()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });

