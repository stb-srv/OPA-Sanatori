const DB = require('./server/database.js');
const bcrypt = require('bcryptjs');

async function resetPassword() {
    console.log('\n--- GRIECHE-CMS ADMIN RECOVERY ---\n');

    const defaultUser = 'admin';
    const defaultPass = 'admin';

    // Establish DB connection using the existing database module
    try {
        const users = DB.getUsers();
        const adminUser = users.find(u => u.user === defaultUser);
        
        const hashed = await bcrypt.hash(defaultPass, 10);
        
        if (adminUser) {
            console.log(`[INFO] Administrator account "${defaultUser}" found.`);
            console.log(`[PROCESS] Resetting password...`);
            DB.setUserPass(defaultUser, hashed);
            
            console.log('\n✅ SUCCESS: Admin password has been reset!');
            console.log('--------------------------------------------------');
            console.log('Username: admin');
            console.log('Password: admin');
            console.log('--------------------------------------------------');
            console.log('⚠️ PLEASE CHANGE YOUR PASSWORD IMMEDIATELY AFTER LOGGING IN.');
        } else {
            console.log(`[INFO] Administrator account "${defaultUser}" NOT found.`);
            console.log(`[PROCESS] Creating new default admin account...`);
            DB.addUser({
                user: defaultUser,
                pass: hashed,
                name: 'System',
                last_name: 'Administrator',
                email: 'admin@localhost',
                role: 'admin',
                require_password_change: 1
            });
            console.log('\n✅ SUCCESS: Emergency admin account created!');
            console.log('--------------------------------------------------');
            console.log('Username: admin');
            console.log('Password: admin');
            console.log('--------------------------------------------------');
            console.log('⚠️ YOU WILL BE PROMPTED TO CHANGE THIS PASSWORD UPON LOGIN.');
        }
    } catch (e) {
        console.error('\n❌ ERROR CRITICAL: Could not interact with the database.');
        console.error(e);
    }
    
    console.log('');
    process.exit(0);
}

resetPassword();
