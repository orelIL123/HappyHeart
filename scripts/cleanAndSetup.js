/**
 * Clean all users and create a fresh test user
 * This uses Firebase Admin SDK for full control
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = {
    projectId: "happyhart-7afef",
    // We'll use Application Default Credentials or connect directly
};

// Initialize with minimal config
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: serviceAccount.projectId
    });
}

const db = admin.firestore();
const auth = admin.auth();

async function cleanAndSetup() {
    console.log('🧹 Starting cleanup and setup...\n');

    try {
        // Step 1: Delete all users from Authentication
        console.log('Step 1: Cleaning Firebase Authentication...');
        try {
            const listUsersResult = await auth.listUsers(1000);
            const deletePromises = listUsersResult.users.map(user => {
                console.log(`  🗑️  Deleting auth user: ${user.email || user.uid}`);
                return auth.deleteUser(user.uid);
            });
            await Promise.all(deletePromises);
            console.log(`✅ Deleted ${deletePromises.length} auth users\n`);
        } catch (error) {
            console.log(`⚠️  Auth cleanup skipped: ${error.message}\n`);
        }

        // Step 2: Delete all documents from pending_clowns
        console.log('Step 2: Cleaning pending_clowns collection...');
        const pendingSnapshot = await db.collection('pending_clowns').get();
        const pendingDeletes = [];
        pendingSnapshot.forEach(doc => {
            console.log(`  🗑️  Deleting pending_clown: ${doc.id}`);
            pendingDeletes.push(doc.ref.delete());
        });
        await Promise.all(pendingDeletes);
        console.log(`✅ Deleted ${pendingDeletes.length} pending_clowns\n`);

        // Step 3: Delete all documents from users
        console.log('Step 3: Cleaning users collection...');
        const usersSnapshot = await db.collection('users').get();
        const userDeletes = [];
        usersSnapshot.forEach(doc => {
            console.log(`  🗑️  Deleting user: ${doc.id}`);
            userDeletes.push(doc.ref.delete());
        });
        await Promise.all(userDeletes);
        console.log(`✅ Deleted ${userDeletes.length} users\n`);

        // Step 4: Create a test user
        console.log('Step 4: Creating test user...');

        const testEmail = '0523985505@happyhart.app';
        const testPassword = '112233';

        // Create user in Authentication
        let authUser;
        try {
            authUser = await auth.createUser({
                email: testEmail,
                password: testPassword,
                displayName: 'אוראל אהרון (טסט)',
            });
            console.log(`  ✅ Created auth user: ${authUser.uid}`);
        } catch (error) {
            console.log(`  ⚠️  Auth user creation failed: ${error.message}`);
            console.log('  Trying to get existing user...');
            authUser = await auth.getUserByEmail(testEmail);
        }

        // Create user in Firestore
        const userData = {
            name: 'אוראל אהרון',
            phone: '0523985505',
            email: testEmail,
            preferredArea: 'תל אביב',
            role: 'admin', // Making this user an admin for full access
            avatar: 'https://i.pravatar.cc/150?u=oral',
            approvalStatus: 'approved',
            authUid: authUser.uid,
            createdAt: new Date().toISOString()
        };

        await db.collection('users').doc(authUser.uid).set(userData);
        console.log(`  ✅ Created user in Firestore with admin role\n`);

        console.log('🎉 Setup completed successfully!\n');
        console.log('📝 Test user credentials:');
        console.log(`   Email/Phone: 0523985505`);
        console.log(`   Password: 112233`);
        console.log(`   Role: admin`);
        console.log('\nYou can now login with these credentials!\n');

    } catch (error) {
        console.error('❌ Error during setup:', error);
        throw error;
    }
}

// Run the script
cleanAndSetup()
    .then(() => {
        console.log('✅ Script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
