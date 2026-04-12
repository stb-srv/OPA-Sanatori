#!/usr/bin/env node
/**
 * OPA-CMS – Auto-Image Script
 * Sucht f\u00fcr alle Gerichte ohne Bild automatisch ein passendes Foto via Unsplash.
 *
 * Aufruf:
 *   node scripts/auto-images.js              # alle Gerichte ohne Bild
 *   node scripts/auto-images.js --dry-run    # nur anzeigen, nichts speichern
 *   node scripts/auto-images.js --limit 20   # max. 20 Gerichte verarbeiten
 *   node scripts/auto-images.js --overwrite  # auch Gerichte MIT Bild neu bebildern
 *
 * Voraussetzung: UNSPLASH_ACCESS_KEY in .env setzen
 *   https://unsplash.com/developers -> "New Application" -> Access Key kopieren
 *   Kostenlos: 50 Requests/Stunde
 */

require('dotenv').config();
const path   = require('path');
const fs     = require('fs');
const https  = require('https');
const http   = require('http');

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY || '';
const UPLOADS_DIR  = path.join(__dirname, '..', 'uploads');
const DELAY_MS     = 1300; // ~46 req/min – sicher unter 50/h-Limit

const args      = process.argv.slice(2);
const DRY_RUN   = args.includes('--dry-run');
const OVERWRITE = args.includes('--overwrite');
const limitIdx  = args.indexOf('--limit');
const LIMIT     = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) || 999 : 999;

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const proto = url.startsWith('https') ? https : http;
        const file  = fs.createWriteStream(dest);
        proto.get(url, (res) => {
            if (res.statusCode !== 200) { file.close(); fs.unlinkSync(dest); return reject(new Error(`HTTP ${res.statusCode}`)); }
            res.pipe(file);
            file.on('finish', () => file.close(resolve));
        }).on('error', (e) => { fs.unlinkSync(dest); reject(e); });
    });
}

async function fetchUnsplash(query) {
    return new Promise((resolve, reject) => {
        const q   = encodeURIComponent(query);
        const url = `https://api.unsplash.com/search/photos?query=${q}&per_page=1&orientation=landscape&client_id=${UNSPLASH_KEY}`;
        https.get(url, { headers: { 'Accept-Version': 'v1' } }, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    if (data.errors) return reject(new Error(data.errors[0]));
                    const result = data.results?.[0];
                    resolve(result ? { url: result.urls.regular, thumb: result.urls.thumb, author: result.user.name, link: result.links.html } : null);
                } catch(e) { reject(e); }
            });
        }).on('error', reject);
    });
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n\ud83c\udf04 OPA-CMS Auto-Image Script');
    console.log('='.repeat(45));

    if (!UNSPLASH_KEY) {
        console.error('\u274c UNSPLASH_ACCESS_KEY fehlt in .env!');
        console.error('   -> https://unsplash.com/developers -> Free Account -> Access Key');
        process.exit(1);
    }

    if (DRY_RUN)   console.log('\u26a0\ufe0f  DRY-RUN: Keine \u00c4nderungen werden gespeichert.');
    if (OVERWRITE) console.log('\u26a0\ufe0f  OVERWRITE: Auch Gerichte mit vorhandenem Bild werden neu bebildert.');

    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

    const DB   = require(path.join(__dirname, '..', 'server', 'database.js'));
    if (typeof DB.init === 'function') await DB.init();

    const menu = await DB.getMenu();
    const todo = menu.filter(d => OVERWRITE ? true : !d.image || d.image.trim() === '').slice(0, LIMIT);

    console.log(`\n\ud83d\udcca Gerichte gesamt: ${menu.length}`);
    console.log(`\ud83d\udd0d Zu bebildern:    ${todo.length}`);
    if (todo.length === 0) { console.log('\u2705 Alle Gerichte haben bereits ein Bild.'); process.exit(0); }
    console.log('');

    let ok = 0, skip = 0, fail = 0;

    for (const dish of todo) {
        const query = [dish.name, dish.desc].filter(Boolean).join(' ').substring(0, 80);
        process.stdout.write(`[${ok + skip + fail + 1}/${todo.length}] "${dish.name}" ... `);

        try {
            const result = await fetchUnsplash(query);

            if (!result) {
                console.log('\u26a0\ufe0f  Kein Bild gefunden – \u00fcbersprungen.');
                skip++;
                await sleep(DELAY_MS);
                continue;
            }

            if (DRY_RUN) {
                console.log(`\u2705 [DRY] ${result.thumb} (by ${result.author})`);
                ok++;
                await sleep(DELAY_MS);
                continue;
            }

            // Bild herunterladen
            const ext      = 'jpg';
            const filename = `auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const destPath = path.join(UPLOADS_DIR, filename);

            await download(result.url, destPath);

            // DB aktualisieren
            await DB.updateMenu(dish.id, { ...dish, image: `/uploads/${filename}` });

            console.log(`\u2705 ${result.author} -> /uploads/${filename}`);
            ok++;

        } catch(e) {
            console.log(`\u274c Fehler: ${e.message}`);
            fail++;
        }

        await sleep(DELAY_MS);
    }

    console.log('\n' + '='.repeat(45));
    console.log(`\u2705 Erfolgreich: ${ok}`);
    console.log(`\u26a0\ufe0f  Kein Bild:   ${skip}`);
    console.log(`\u274c Fehler:      ${fail}`);
    console.log('');
    if (!DRY_RUN && ok > 0) console.log('\ud83d\ude80 pm2 restart opa-cms  (falls n\u00f6tig)\n');

    process.exit(0);
}

main();
