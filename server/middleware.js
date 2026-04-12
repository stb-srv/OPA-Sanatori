/**
 * Express Middleware – auth, license, rate limiters
 */
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { getCurrentLicense, verifyLicenseToken } = require('./license.js');
const DB = require('./database.js');

const requireAuth = (ADMIN_SECRET) => (req, res, next) => {
    const token = req.headers['x-admin-token'];
    if (!token) return res.status(401).json({ success: false, reason: 'No token' });
    try { req.admin = jwt.verify(token, ADMIN_SECRET); next(); }
    catch (e) { res.status(401).json({ success: false, reason: 'Invalid session' }); }
};

/**
 * requireLicense – prüft RS256-signiertes JWT oder Trial-Plan.
 * ASYNC: DB.getKV ist bei MySQL ein Promise.
 */
const requireLicense = (module) => async (req, res, next) => {
    try {
        const settings = await DB.getKV('settings', {});
        const lic = settings.license || {};

        // Trial-Lizenzen: Modul-Check direkt am Plan
        if (lic.isTrial) {
            if (!lic.modules || !lic.modules[module]) {
                return res.status(403).json({ success: false, reason: `Feature '${module}' gesperrt.` });
            }
            return next();
        }

        // Vollizenz: JWT MUSS gültig und signiert sein
        const token   = lic.licenseToken || null;
        const host    = req.hostname || null;
        const payload = verifyLicenseToken(token, host);

        if (!payload) {
            return res.status(403).json({
                success: false,
                reason: `Feature '${module}' gesperrt – kein gültiges Lizenz-Token.`
            });
        }

        const allowedModules = payload.allowed_modules || {};
        if (!allowedModules[module]) {
            return res.status(403).json({ success: false, reason: `Feature '${module}' ist in Ihrem Plan nicht enthalten.` });
        }

        next();
    } catch(e) {
        console.error('requireLicense error:', e.message);
        res.status(500).json({ success: false, reason: 'Lizenzprüfung fehlgeschlagen.' });
    }
};

/**
 * requireMenuLimit – prüft Speisenlimit des aktuellen Plans.
 * ASYNC: getCurrentLicense ist jetzt async.
 */
const requireMenuLimit = async (req, res, next) => {
    try {
        const lic = await getCurrentLicense(DB);
        const maxDishes = lic.limits?.max_dishes ?? 10;
        const incomingItems = Array.isArray(req.body) ? req.body : [];
        if (incomingItems.length > maxDishes) {
            return res.status(403).json({
                success: false,
                reason: `Ihr ${lic.label || lic.type}-Plan erlaubt maximal ${maxDishes} Speisen. Bitte upgraden Sie Ihren Plan.`,
                limit: maxDishes, current: incomingItems.length, plan: lic.type
            });
        }
        next();
    } catch(e) {
        console.error('requireMenuLimit error:', e.message);
        next(); // im Zweifel durchlassen
    }
};

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, max: 10,
    message: { success: false, reason: 'Zu viele Login-Versuche. Bitte 15 Minuten warten.' }
});

const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, max: 5,
    message: { success: false, reason: 'Zu viele Anfragen. Bitte 1 Stunde warten.' }
});

const reservationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, max: 20,
    message: { success: false, reason: 'Zu viele Anfragen. Bitte später erneut versuchen.' }
});

module.exports = { requireAuth, requireLicense, requireMenuLimit, loginLimiter, forgotPasswordLimiter, reservationLimiter };
