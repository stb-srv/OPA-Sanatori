#!/usr/bin/env node
/**
 * OPA Santorini - Admin User erstellen
 * Usage: node scripts/create-admin.js [username] [password]
 * Default: admin / admin123
 */

const bcrypt = require('bcryptjs');
const DB = require('../server/database.js');

const username = process.argv[2] || 'admin';
const password = process.argv[3] || 'admin123';

(async () => {
    const existing = DB.getUsers();
    const alreadyExists = existing.find(u => u.user === username);

    if (alreadyExists) {
        console.log(`⚠️  User '${username}' existiert bereits - Passwort wird aktualisiert.`);
    }

    const hash = bcrypt.hashSync(password, 10);

    const allUsers = existing.filter(u => u.user !== username);
    allUsers.push({ user: username, pass: hash, role: 'admin' });
    DB.saveUsers(allUsers);

    console.log(`✅ Admin-User erstellt!`);
    console.log(`   Benutzername: ${username}`);
    console.log(`   Passwort:     ${password}`);
    console.log(`   Rolle:        admin`);
    console.log(`⚠️  Bitte Passwort nach dem ersten Login ändern!`);
    process.exit(0);
})();
