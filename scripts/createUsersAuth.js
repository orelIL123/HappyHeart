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
        email: '0501234567@happyhart.app', // Format matches register.tsx
        phone: '0501234567',
        password: '123456',
        displayName: "ז'קו הליצן"
    },
    {
        email: '0502345678@happyhart.app',
        phone: '0502345678',
        password: '123456',
        displayName: 'פופו המארגן'
    },
    {
        email: '0503456789@happyhart.app',
        phone: '0503456789',
        password: '123456',
        displayName: 'שמחה האדמינית'
    },
    {
        email: '0529250237@happyhart.app',
        phone: '0529250237',
        password: '112233',
        displayName: 'עמוס סגרון'
    }
];

async function createUsersInAuth() {
    console.log('Creating/Updating users in Firebase Authentication...\n');
    
    for (const user of users) {
        try {
            // Try to find existing user by phone number
            let authUser = null;
            try {
                const phoneNumber = `+972${user.phone.substring(1)}`;
                authUser = await admin.auth().getUserByPhoneNumber(phoneNumber);
                console.log(`📱 Found existing user by phone: ${user.displayName}`);
            } catch (e) {
                // User not found by phone, continue
            }
            
            if (authUser) {
                // Update existing user with correct email
                try {
                    await admin.auth().updateUser(authUser.uid, {
                        email: user.email,
                        emailVerified: false,
                        password: user.password,
                        displayName: user.displayName
                    });
                    console.log(`✅ Updated: ${user.displayName} (${user.email})`);
                    console.log(`   UID: ${authUser.uid}`);
                } catch (updateError) {
                    if (updateError.code === 'auth/email-already-exists') {
                        console.log(`⚠️  Email ${user.email} already exists for another user`);
                        // Try to get user by email and update password
                        try {
                            const emailUser = await admin.auth().getUserByEmail(user.email);
                            await admin.auth().updateUser(emailUser.uid, {
                                password: user.password,
                                displayName: user.displayName
                            });
                            console.log(`✅ Updated password for: ${user.displayName} (${user.email})`);
                        } catch (e) {
                            console.error(`❌ Error updating ${user.displayName}:`, e.message);
                        }
                    } else {
                        console.error(`❌ Error updating ${user.displayName}:`, updateError.message);
                    }
                }
            } else {
                // Create new user
                try {
                    const userRecord = await admin.auth().createUser({
                        email: user.email,
                        password: user.password,
                        displayName: user.displayName,
                        phoneNumber: `+972${user.phone.substring(1)}`,
                        disabled: false
                    });
                    console.log(`✅ Created in Auth: ${user.displayName} (${user.email})`);
                    console.log(`   UID: ${userRecord.uid}`);
                } catch (createError) {
                    if (createError.code === 'auth/email-already-exists') {
                        console.log(`⚠️  Email already exists: ${user.email}`);
                        // Try to update password
                        try {
                            const emailUser = await admin.auth().getUserByEmail(user.email);
                            await admin.auth().updateUser(emailUser.uid, {
                                password: user.password,
                                displayName: user.displayName
                            });
                            console.log(`✅ Updated password for: ${user.displayName} (${user.email})`);
                        } catch (e) {
                            console.error(`❌ Error:`, e.message);
                        }
                    } else if (createError.code === 'auth/phone-number-already-exists') {
                        console.log(`⚠️  Phone already exists: ${user.phone}`);
                    } else {
                        console.error(`❌ Error creating ${user.displayName}:`, createError.message);
                    }
                }
            }
        } catch (error) {
            console.error(`❌ Error processing ${user.displayName}:`, error.message);
        }
    }
    
    console.log('\n✅ Done!');
    console.log('\nLogin credentials:');
    users.forEach(user => {
        console.log(`  ${user.displayName}:`);
        console.log(`    Email: ${user.email}`);
        console.log(`    Phone: ${user.phone}`);
        console.log(`    Password: ${user.password}\n`);
    });
}

createUsersInAuth()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });

