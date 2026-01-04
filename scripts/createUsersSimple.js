/**
 * Simple script to create initial users in Firestore
 * Run with: node scripts/createUsersSimple.js
 * 
 * Make sure to set your Firebase config in the script or use environment variables
 */

// You can either:
// 1. Set these values directly (not recommended for production)
// 2. Use environment variables
// 3. Import from your config file

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

console.log('\n📝 Users to create:');
users.forEach(user => {
    console.log(`  - ${user.name} (${user.role})`);
    console.log(`    Phone: ${user.phone}, Password: ${user.password}`);
});

console.log('\n⚠️  To create these users, you have two options:');
console.log('\n1. Use Firebase Console:');
console.log('   - Go to https://console.firebase.google.com');
console.log('   - Select your project');
console.log('   - Go to Firestore Database');
console.log('   - Create a collection called "users"');
console.log('   - Add each user as a document with the ID and data shown above');
console.log('\n2. Use this JSON to import:');
console.log('\n' + JSON.stringify(users, null, 2));

console.log('\n✅ After creating users, you can login with:');
users.forEach(user => {
    console.log(`   ${user.name}: ${user.phone} / ${user.password}`);
});

