/**
 * @deprecated
 * Dieses Skript wird nicht mehr benötigt.
 *
 * Der Admin-Account wird beim ersten Start des CMS automatisch
 * über den Setup-Wizard im Browser angelegt:
 *
 *   http://<deine-domain>/admin  →  Setup-Wizard startet automatisch
 *
 * Falls du den Admin-Account zurücksetzen musst:
 *   node reset-admin.js
 *   (oder: npm run reset-admin)
 *
 * Dieses Skript wird in einer zukünftigen Version entfernt.
 */

console.log('\n⚠️  Dieser Befehl wird nicht mehr benötigt.');
console.log('   Admin-Accounts werden über den Setup-Wizard im Browser angelegt.');
console.log('   Öffne: http://localhost:5000/admin\n');
console.log('   Zum Zurücksetzen: node reset-admin.js\n');
process.exit(0);
