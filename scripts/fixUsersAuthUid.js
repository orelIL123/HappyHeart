/**
 * Script to fix users in Firestore - move them to use auth UID as document ID
 * Run with: node scripts/fixUsersAuthUid.js
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

// Mapping of phone numbers to emails
const phoneToEmail = {
    '0501234567': '0501234567@happyhart.app',
    '0502345678': '0502345678@happyhart.app',
    '0503456789': '0503456789@happyhart.app',
    '0529250237': '0529250237@happyhart.app'
};

async function fixUsersAuthUid() {
    console.log('Fixing users in Firestore to use auth UID as document ID...\n');
    
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
                const authUid = authUser.uid;
                const currentDocId = userDoc.id;
                
                // If the document ID is already the auth UID, skip
                if (currentDocId === authUid) {
                    console.log(`✅ Already correct: ${userData.name} (${currentDocId})`);
                    // Make sure email and authUid are set
                    await userDoc.ref.update({
                        email: email,
                        authUid: authUid,
                        approvalStatus: 'approved'
                    });
                    continue;
                }
                
                // Check if user with auth UID already exists
                const authUidRef = db.collection('users').doc(authUid);
                const authUidSnap = await authUidRef.get();
                
                if (authUidSnap.exists) {
                    console.log(`⚠️  User with auth UID ${authUid} already exists, updating it...`);
                    // Update existing user with auth UID
                    await authUidRef.update({
                        ...userData,
                        email: email,
                        authUid: authUid,
                        approvalStatus: 'approved'
                    });
                    // Delete old document
                    await userDoc.ref.delete();
                    console.log(`✅ Moved: ${userData.name} from ${currentDocId} to ${authUid}`);
                } else {
                    // Create new document with auth UID
                    await authUidRef.set({
                        ...userData,
                        email: email,
                        authUid: authUid,
                        approvalStatus: 'approved'
                    });
                    // Delete old document
                    await userDoc.ref.delete();
                    console.log(`✅ Moved: ${userData.name} from ${currentDocId} to ${authUid}`);
                }
            } catch (error) {
                if (error.code === 'auth/user-not-found') {
                    console.log(`⚠️  User ${userData.name} (${email}) not found in Firebase Auth`);
                } else {
                    console.error(`❌ Error fixing ${userData.name}:`, error.message);
                }
            }
        }
        
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

fixUsersAuthUid()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
