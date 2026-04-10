/**
 * OPA-CMS – License Checker (Stufe 3: Periodische Online-Validierung)
 *
 * Prüft alle 24h ob die Lizenz noch gültig ist, indem er den Lizenzserver
 * kontaktiert und ein frisch signiertes Token zurückbekommt.
 *
 * Graceful Degradation: Nach 3 aufeinanderfolgenden Fehlversuchen wird
 * die Lizenz auf FREE zurückgestuft bis der Server wieder erreichbar ist.
 *
 * Der Lizenzserver muss auf POST /api/v1/refresh antworten mit:
 * { status: 'active', token: '<RS256-signiertes JWT>' }
 */

const { verifyLicenseToken } = require('./license.js');

const CHECK_INTERVAL_MS  = 24 * 60 * 60 * 1000; // 24h
const STARTUP_DELAY_MS   =  5 * 60 * 1000;       // 5 Min nach Boot (erst starten lassen)
const MAX_FAILURES       = 3;

class LicenseChecker {
    constructor(DB, licenseServerUrl, host) {
        this.DB               = DB;
        this.licenseServerUrl = (licenseServerUrl || 'https://licens-prod.stb-srv.de').replace(/\/+$/, '');
        this.host             = host || 'localhost';
        this.failCount        = 0;
        this.timer            = null;
        this.startupTimer     = null;
        this.degraded         = false;
    }

    start() {
        // Erster Check nach 5 Minuten (Server soll erst komplett starten)
        this.startupTimer = setTimeout(() => {
            this._check();
            this.timer = setInterval(() => this._check(), CHECK_INTERVAL_MS);
        }, STARTUP_DELAY_MS);
        console.log(`🔒 LicenseChecker gestartet – erster Check in 5 Minuten, dann alle 24h.`);
    }

    stop() {
        if (this.timer)        clearInterval(this.timer);
        if (this.startupTimer) clearTimeout(this.startupTimer);
    }

    async _check() {
        const settings = this.DB.getKV('settings', {});
        const lic      = settings.license || {};

        // Trial-Lizenzen oder keine Lizenz: kein Online-Check nötig
        if (!lic.key || lic.isTrial) return;

        console.log(`🔄 [${new Date().toISOString()}] Lizenz-Online-Check läuft...`);

        try {
            const response = await fetch(`${this.licenseServerUrl}/api/v1/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    license_key: lic.key,
                    domain:      this.host
                }),
                signal: AbortSignal.timeout(15000) // 15s Timeout
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();

            if (data.status === 'active' && data.token) {
                // Signatur prüfen bevor wir den Token speichern
                const payload = verifyLicenseToken(data.token, this.host);
                if (!payload) {
                    throw new Error('Server returned token with invalid signature');
                }

                // Frischen Token in DB speichern
                settings.license.licenseToken = data.token;
                this.DB.setKV('settings', settings);

                this.failCount = 0;
                this.degraded  = false;
                console.log(`✅ [${new Date().toISOString()}] Lizenz-Token erfolgreich erneuert (Plan: ${payload.type}, Domain: ${payload.domain}).`);

            } else if (data.status === 'revoked' || data.status === 'cancelled') {
                console.warn(`⚠️  Lizenz wurde vom Server widerrufen (${data.status}). Degradiere auf FREE.`);
                this._degrade(settings, 'revoked');

            } else {
                throw new Error(`Unerwartete Serverantwort: ${JSON.stringify(data)}`);
            }

        } catch (e) {
            this.failCount++;
            console.warn(`⚠️  [${new Date().toISOString()}] Lizenz-Check Fehler (${this.failCount}/${MAX_FAILURES}): ${e.message}`);

            if (this.failCount >= MAX_FAILURES) {
                console.error(`❌ Lizenz-Check ${MAX_FAILURES}x fehlgeschlagen – Graceful Degradation auf FREE aktiv.`);
                this._degrade(settings, 'unreachable');
            }
        }
    }

    _degrade(settings, reason) {
        this.degraded = true;
        if (settings.license) {
            settings.license.degraded        = true;
            settings.license.degradedReason  = reason;
            settings.license.degradedAt      = new Date().toISOString();
            // licenseToken löschen – getCurrentLicense() fällt auf FREE zurück
            delete settings.license.licenseToken;
            this.DB.setKV('settings', settings);
        }
    }

    isDegraded() { return this.degraded; }
}

module.exports = LicenseChecker;
