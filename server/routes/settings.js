/**
 * Routes – Settings, Branding, Homepage, License, SMTP Test
 */
const router = require('express').Router();
const DB = require('../database.js');
const Mailer = require('../mailer.js');
const { getCurrentLicense, PLAN_DEFINITIONS } = require('../license.js');

module.exports = (requireAuth, requireLicense, LICENSE_SERVER) => {
    router.get('/homepage', async (req, res) => {
        try {
            const settings = await DB.getKV('settings', {});
            const homepage = await DB.getKV('homepage', {});
            res.json({ ...homepage, activeModules: settings.activeModules });
        } catch(e) { res.status(500).json({ success: false, reason: e.message }); }
    });
    router.post('/homepage', requireAuth, requireLicense('custom_design'), async (req, res) => {
        try { await DB.setKV('homepage', req.body); res.json({ success: true }); }
        catch(e) { res.status(500).json({ success: false, reason: e.message }); }
    });

    router.get('/branding', async (req, res) => {
        try { res.json(await DB.getKV('branding', {})); }
        catch(e) { res.status(500).json({ success: false, reason: e.message }); }
    });
    router.post('/branding', requireAuth, async (req, res) => {
        try { await DB.setKV('branding', req.body); res.json({ success: true }); }
        catch(e) { res.status(500).json({ success: false, reason: e.message }); }
    });

    router.get('/settings', requireAuth, async (req, res) => {
        try { res.json(await DB.getKV('settings', {})); }
        catch(e) { res.status(500).json({ success: false, reason: e.message }); }
    });
    router.post('/settings', requireAuth, async (req, res) => {
        try { await DB.setKV('settings', req.body); res.json({ success: true }); }
        catch(e) { res.status(500).json({ success: false, reason: e.message }); }
    });

    router.post('/settings/test-smtp', requireAuth, async (req, res) => {
        try {
            const users  = await DB.getUsers();
            const target = (users || []).find(u => u.user === req.admin.user);
            const toEmail = target?.email || req.body?.email;
            if (!toEmail) return res.status(400).json({ success: false, reason: 'Keine Ziel-E-Mail-Adresse gefunden. Bitte in den Benutzereinstellungen hinterlegen.' });
            await Mailer.sendTestMail(toEmail, DB);
            res.json({ success: true, sentTo: toEmail });
        } catch (e) {
            res.status(500).json({ success: false, reason: `SMTP Fehler: ${e.message}` });
        }
    });

    router.get('/license/info', requireAuth, async (req, res) => {
        try {
            const host = req.headers.host || 'localhost';
            const lic  = await getCurrentLicense(DB, host);
            const menu = await DB.getMenu();
            res.json({ ...lic, menu_items_used: (menu || []).length, trialDaysLeft: lic.trialDaysLeft, plans: PLAN_DEFINITIONS });
        } catch(e) { res.status(500).json({ success: false, reason: e.message }); }
    });

    router.post('/license/validate', async (req, res) => {
        try {
            const host = req.headers.host || 'localhost';
            const response = await fetch(`${LICENSE_SERVER}/api/v1/validate`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ license_key: req.body.key, domain: host })
            });
            const r = await response.json();
            if (r.status === 'active') {
                const licenseToken = r.license_token || r.token || null;
                if (!licenseToken) {
                    console.error('❌ License server returned status=active but no signed token!');
                    return res.status(500).json({
                        success: false,
                        reason: 'Lizenzserver hat kein signiertes Token zurückgegeben. Bitte sicherstellen dass RSA_PRIVATE_KEY auf dem Lizenzserver gesetzt ist.'
                    });
                }
                const settings = await DB.getKV('settings', {});
                settings.license = {
                    key:          req.body.key,
                    licenseToken: licenseToken,
                    status:       'active',
                    customer:     r.customer_name,
                    type:         r.type,
                    label:        r.plan_label,
                    expiresAt:    r.expires_at,
                    modules:      r.allowed_modules,
                    limits: {
                        max_dishes: r.limits?.max_dishes ?? r.limits?.maxDishes ?? 10,
                        max_tables: r.limits?.max_tables ?? r.limits?.maxTables ?? 5
                    }
                };
                await DB.setKV('settings', settings);
                return res.json({ success: true, license: settings.license });
            }
            res.status(403).json({ success: false, reason: r.message });
        } catch (e) { res.status(500).json({ success: false, reason: 'Lizenzserver nicht erreichbar.' }); }
    });

    router.post('/license/modules', requireAuth, async (req, res) => {
        try {
            const { modules } = req.body;
            if (!modules || typeof modules !== 'object') return res.status(400).json({ success: false, reason: 'Ungültige Module-Daten.' });
            const settings = await DB.getKV('settings', {});
            if (!settings.license) return res.status(400).json({ success: false, reason: 'Keine Lizenz aktiv.' });
            settings.license.modules = { ...settings.license.modules, ...modules };
            await DB.setKV('settings', settings);
            res.json({ success: true, modules: settings.license.modules });
        } catch(e) { res.status(500).json({ success: false, reason: e.message }); }
    });

    return router;
};
