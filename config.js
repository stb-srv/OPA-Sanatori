/**
 * OPA-CMS GLOBAL CONFIGURATION
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
        from: process.env.SMTP_FROM || '"OPA! Santorini" <noreply@restaurant.de>'
    },
    SETUP_COMPLETE: false
};

let CONFIG = { ...DEFAULT_CONFIG };

if (fs.existsSync(CONFIG_PATH)) {
    try {
        const fileContent = fs.readFileSync(CONFIG_PATH, 'utf8');
        const loadedConfig = JSON.parse(fileContent);
        CONFIG = { ...DEFAULT_CONFIG, ...loadedConfig, SETUP_COMPLETE: true };
        // LICENSE_SERVER_URL immer auf prod setzen falls nicht explizit in config.json
        if (!loadedConfig.LICENSE_SERVER_URL) {
            CONFIG.LICENSE_SERVER_URL = 'https://licens-prod.stb-srv.de';
        }
    } catch (e) {
        console.error('❌ Error loading config.json, using defaults:', e);
    }
}

if (!CONFIG.ADMIN_SECRET || CONFIG.ADMIN_SECRET === 'change-me-before-production') {
    let wasLoadedFromConfig = false;
    if (fs.existsSync(CONFIG_PATH)) {
        try {
            const fileContent = fs.readFileSync(CONFIG_PATH, 'utf8');
            const parsed = JSON.parse(fileContent);
            if (parsed.ADMIN_SECRET) wasLoadedFromConfig = true;
        } catch(e) {}
    }
    
    if (!wasLoadedFromConfig) {
        console.warn('⚠️  WARNING: ADMIN_SECRET is not set in .env or config.json! Using insecure default.');
    }
}

module.exports = CONFIG;
