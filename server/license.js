/**
 * License Plan Definitions & Helper
 * Zentrale Wahrheitsquelle für alle Lizenzpläne.
 */

const PLANS = {
    FREE: {
        id: 'FREE',
        name: 'Free',
        description: 'Zum Testen – immer kostenlos',
        limits: {
            max_dishes: 10,
            max_tables: 5
        },
        allowed_modules: {
            menu_edit: true,
            orders_kitchen: false,
            reservations: false,
            custom_design: false,
            analytics: false
        }
    },
    STARTER: {
        id: 'STARTER',
        name: 'Starter',
        description: 'Für Imbiss & Café',
        limits: {
            max_dishes: 40,
            max_tables: 10
        },
        allowed_modules: {
            menu_edit: true,
            orders_kitchen: true,
            reservations: false,
            custom_design: false,
            analytics: false
        }
    },
    PRO: {
        id: 'PRO',
        name: 'Pro',
        description: 'Für Restaurants',
        limits: {
            max_dishes: 100,
            max_tables: 30
        },
        allowed_modules: {
            menu_edit: true,
            orders_kitchen: true,
            reservations: true,
            custom_design: false,
            analytics: false
        }
    },
    PRO_PLUS: {
        id: 'PRO_PLUS',
        name: 'Pro+',
        description: 'Für größere Restaurants',
        limits: {
            max_dishes: 200,
            max_tables: 60
        },
        allowed_modules: {
            menu_edit: true,
            orders_kitchen: true,
            reservations: true,
            custom_design: true,
            analytics: false
        }
    },
    ENTERPRISE: {
        id: 'ENTERPRISE',
        name: 'Enterprise',
        description: 'Für Ketten & Hotels',
        limits: {
            max_dishes: 500,
            max_tables: 200
        },
        allowed_modules: {
            menu_edit: true,
            orders_kitchen: true,
            reservations: true,
            custom_design: true,
            analytics: true
        }
    }
};

/**
 * Gibt die Limits des aktuellen Lizenzplans zurück.
 * Fällt auf FREE zurück wenn keine oder ungültige Lizenz gesetzt ist.
 */
const getPlanLimits = (license) => {
    if (!license || license.status !== 'active') {
        return PLANS.FREE.limits;
    }
    // Lizenz hat eigene Limits (vom Lizenzserver) → diese haben Vorrang
    if (license.limits && typeof license.limits.max_dishes === 'number') {
        return license.limits;
    }
    // Fallback auf Plan-Definition
    const plan = PLANS[license.type];
    return plan ? plan.limits : PLANS.FREE.limits;
};

/**
 * Gibt den vollständigen Plan zurück (für Info-Endpoints).
 */
const getPlanInfo = (license) => {
    if (!license || license.status !== 'active') return PLANS.FREE;
    return PLANS[license.type] || PLANS.FREE;
};

/**
 * Prüft ob ein bestimmtes Modul für die aktuelle Lizenz erlaubt ist.
 */
const isModuleAllowed = (license, module) => {
    if (!license || license.status !== 'active') {
        return PLANS.FREE.allowed_modules[module] || false;
    }
    if (license.modules && typeof license.modules[module] !== 'undefined') {
        return !!license.modules[module];
    }
    const plan = PLANS[license.type];
    return plan ? (plan.allowed_modules[module] || false) : false;
};

module.exports = { PLANS, getPlanLimits, getPlanInfo, isModuleAllowed };
