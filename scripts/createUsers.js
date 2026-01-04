/**
 * Script to create initial users in Firestore
 * Run with: node scripts/createUsers.js
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
    console.log('Creating users in Firestore...');
    
    const batch = db.batch();
    
    for (const user of users) {
        const userRef = db.collection('users').doc(user.id);
        batch.set(userRef, {
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            preferredArea: user.preferredArea,
            phone: user.phone,
            password: user.password,
            approvalStatus: user.approvalStatus,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Prepared user: ${user.name} (${user.role})`);
    }
    
    try {
        await batch.commit();
        console.log('\n✅ Successfully created all users!');
        console.log('\nUsers created:');
        users.forEach(user => {
            console.log(`  - ${user.name} (${user.role}) - Phone: ${user.phone}, Password: ${user.password}`);
        });
    } catch (error) {
        console.error('❌ Error creating users:', error);
        process.exit(1);
    }
}

createUsers()
    .then(() => {
        console.log('\n✅ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });

