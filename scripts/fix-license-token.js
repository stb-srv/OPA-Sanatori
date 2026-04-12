#!/usr/bin/env node
/**
 * OPA-CMS – Einmaliges Fix-Script: Lizenz-Token erneuern
 *
 * Liest den gespeicherten License-Key aus der DB und holt ein frisches
 * RS256-signiertes JWT vom Lizenzserver. Behebt den FREE-Fallback nach
 * dem Upgrade auf die neuen middleware.js / license-checker.js Fixes.
 *
 * Aufruf: node scripts/fix-license-token.js
 * (im Wurzelverzeichnis des OPA-CMS Projekts)
 */

require('dotenv').config();
const path = require('path');

async function main() {
    const CONFIG = require(path.join(__dirname, '..', 'config.js'));
    const DB     = require(path.join(__dirname, '..', 'server', 'database.js'));
    const { verifyLicenseToken } = require(path.join(__dirname, '..', 'server', 'license.js'));

    const LICENSE_SERVER = (CONFIG.LICENSE_SERVER_URL || 'https://licens-prod.stb-srv.de').replace(/\/+$/, '');

    console.log('\n🔒 OPA-CMS License Token Fix-Script');
    console.log('='.repeat(45));

    // DB init
    if (typeof DB.init === 'function') await DB.init();

    const settings = await DB.getKV('settings', {});
    const lic      = settings.license || {};

    if (!lic.key) {
        console.error('\u274c Kein License-Key in der DB gefunden.');
        console.log('   → Bitte zuerst eine Lizenz im CMS unter Einstellungen → Lizenz aktivieren.');
        process.exit(1);
    }

    if (lic.isTrial) {
        console.log('ℹ️  Trial-Lizenz erkannt – kein Token-Refresh nötig.');
        process.exit(0);
    }

    console.log(`🔑 License-Key: ${lic.key}`);
    console.log(`🌐 License-Server: ${LICENSE_SERVER}`);
    console.log(`🔄 Hole frisches Token...\n`);

    try {
        const response = await fetch(`${LICENSE_SERVER}/api/v1/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                license_key: lic.key,
                domain: lic.domain || process.env.DOMAIN || 'localhost'
            }),
            signal: AbortSignal.timeout(15000)
        });

        const data = await response.json();
        console.log('📥 Server-Antwort:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error(`\u274c Lizenzserver Fehler (HTTP ${response.status}): ${data.message || data.status}`);
            process.exit(1);
        }

        const rawToken = data.license_token || data.token || null;

        if (data.status !== 'active' || !rawToken) {
            console.error('\u274c Kein gültiges Token erhalten. Status:', data.status);
            process.exit(1);
        }

        // Token-Signatur prüfen
        const payload = verifyLicenseToken(rawToken, null); // null = kein Domain-Check beim Fix
        if (!payload) {
            console.error('\u274c Token-Signatur ungültig! RSA Public Key stimmt nicht überein.');
            process.exit(1);
        }

        // Token in DB speichern
        settings.license.licenseToken = rawToken;
        delete settings.license.degraded;
        delete settings.license.degradedReason;
        delete settings.license.degradedAt;
        await DB.setKV('settings', settings);

        const exp = payload.exp ? new Date(payload.exp * 1000).toLocaleString('de-DE') : 'unbekannt';
        console.log('\n\u2705 Token erfolgreich erneuert!');
        console.log(`   Plan:     ${payload.type}`);
        console.log(`   Domain:   ${payload.domain || '(keine)'}`);
        console.log(`   Gültig bis: ${exp}`);
        console.log(`   Max Speisen: ${payload.limits?.max_dishes ?? '?'}`);
        console.log('\n🚀 CMS kann jetzt neu gestartet werden: pm2 restart opa-cms\n');

    } catch (e) {
        console.error('\u274c Fehler beim Token-Refresh:', e.message);
        process.exit(1);
    }

    process.exit(0);
}

main();
