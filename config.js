/**
 * OPA-CMS GLOBAL CONFIGURATION
 * Priorität: config.json (Setup-Wizard) > .env > Defaults
 */

const fs = require('fs');
const path = require('path');

try { require('dotenv').config(); } catch(e) {}

let CONFIG_PATH = path.join(__dirname, 'server', 'config.json');
if (!fs.existsSync(CONFIG_PATH) && fs.existsSync(path.join(__dirname, 'config.json'))) {
    CONFIG_PATH = path.join(__dirname, 'config.json');
}

const DEFAULT_CONFIG = {
    LICENSE_SERVER_URL: process.env.LICENSE_SERVER_URL || 'https://licens-prod.stb-srv.de',
    PORT: parseInt(process.env.PORT) || 5000,
    ADMIN_SECRET: process.env.ADMIN_SECRET || 'change-me-before-production',
    DEV_MODE: process.env.DEV_MODE === 'true',
    SMTP: {
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE !== 'false',
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.SMTP_FROM || ''
    },
    SETUP_COMPLETE: false
};

let CONFIG = { ...DEFAULT_CONFIG };

if (fs.existsSync(CONFIG_PATH)) {
    try {
        const fileContent = fs.readFileSync(CONFIG_PATH, 'utf8');
        const loadedConfig = JSON.parse(fileContent);

        // SMTP aus config.json (Setup-Wizard) hat Vorrang vor .env
        // Nur gesetzte Felder überschreiben, leere .env-Werte bleiben als Fallback
        const mergedSmtp = { ...DEFAULT_CONFIG.SMTP };
        if (loadedConfig.SMTP) {
            Object.keys(loadedConfig.SMTP).forEach(key => {
                if (loadedConfig.SMTP[key] !== undefined && loadedConfig.SMTP[key] !== '') {
                    mergedSmtp[key] = loadedConfig.SMTP[key];
                }
            });
        }

        CONFIG = {
            ...DEFAULT_CONFIG,
            ...loadedConfig,
            SMTP: mergedSmtp,
            SETUP_COMPLETE: true
        };

        if (!loadedConfig.LICENSE_SERVER_URL) {
            CONFIG.LICENSE_SERVER_URL = process.env.LICENSE_SERVER_URL || 'https://licens-prod.stb-srv.de';
        }
        // PORT & ADMIN_SECRET aus .env haben Vorrang (Security: nie in config.json überschreiben)
        if (process.env.PORT) CONFIG.PORT = parseInt(process.env.PORT);
        if (process.env.ADMIN_SECRET && process.env.ADMIN_SECRET !== 'change-me-before-production') {
            CONFIG.ADMIN_SECRET = process.env.ADMIN_SECRET;
        }
    } catch (e) {
        console.error('❌ Error loading config.json, using defaults:', e);
    }
}

if (!CONFIG.ADMIN_SECRET || CONFIG.ADMIN_SECRET === 'change-me-before-production') {
    console.warn('⚠️  WARNING: ADMIN_SECRET ist nicht gesetzt! Bitte in .env setzen oder Setup-Wizard ausführen.');
}

module.exports = CONFIG;
