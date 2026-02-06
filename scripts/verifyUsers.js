/**
 * Script to verify users are set up correctly
 * Run with: node scripts/verifyUsers.js
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

const testUsers = [
    { email: '0503456789@happyhart.app', phone: '0503456789', password: '123456', name: 'שמחה האדמינית' },
    { email: '0501234567@happyhart.app', phone: '0501234567', password: '123456', name: "ז'קו הליצן" },
];

async function verifyUsers() {
    console.log('Verifying users setup...\n');
    
    for (const testUser of testUsers) {
        try {
            // Check Firebase Auth
            const authUser = await admin.auth().getUserByEmail(testUser.email);
            console.log(`✅ Firebase Auth: ${testUser.name}`);
            console.log(`   Email: ${authUser.email}`);
            console.log(`   UID: ${authUser.uid}`);
            
            // Check Firestore - by auth UID
            const firestoreUserRef = db.collection('users').doc(authUser.uid);
            const firestoreUserSnap = await firestoreUserRef.get();
            
            if (firestoreUserSnap.exists) {
                const userData = firestoreUserSnap.data();
                console.log(`✅ Firestore: ${userData.name}`);
                console.log(`   ID: ${firestoreUserSnap.id}`);
                console.log(`   Email: ${userData.email || 'MISSING'}`);
                console.log(`   Auth UID: ${userData.authUid || 'MISSING'}`);
                console.log(`   Approval Status: ${userData.approvalStatus || 'MISSING'}`);
                console.log(`   Role: ${userData.role || 'MISSING'}`);
                
                if (userData.approvalStatus !== 'approved') {
                    console.log(`   ⚠️  WARNING: User not approved!`);
                }
                if (!userData.email) {
                    console.log(`   ⚠️  WARNING: Email missing in Firestore!`);
                }
                if (firestoreUserSnap.id !== authUser.uid) {
                    console.log(`   ⚠️  WARNING: Document ID doesn't match Auth UID!`);
                }
            } else {
                console.log(`❌ Firestore: User NOT FOUND with UID ${authUser.uid}`);
                
                // Try to find by email
                const emailQuery = await db.collection('users')
                    .where('email', '==', testUser.email)
                    .get();
                
                if (!emailQuery.empty) {
                    const foundUser = emailQuery.docs[0];
                    console.log(`   Found user with different ID: ${foundUser.id}`);
                }
            }
            
            console.log('');
        } catch (error) {
            console.error(`❌ Error checking ${testUser.name}:`, error.message);
            console.log('');
        }
    }
    
    console.log('✅ Verification complete!');
}

verifyUsers()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
