/**
 * OPA Santorini - License Plan Definitions & Helpers
 * Single source of truth for all plan limits and modules.
 */

const PLAN_DEFINITIONS = {
    FREE: {
        label: 'Free',
        menu_items: 10,
        max_tables: 5,
        modules: {
            menu_edit: true,
            orders_kitchen: false,
            reservations: false,
            custom_design: false,
            analytics: false,
            qr_pay: false
        },
        note: 'Kostenlos zum Testen'
    },
    STARTER: {
        label: 'Starter',
        menu_items: 40,
        max_tables: 10,
        modules: {
            menu_edit: true,
            orders_kitchen: true,
            reservations: true,
            custom_design: false,
            analytics: false,
            qr_pay: false
        },
        note: 'Für kleine Cafés & Imbisse'
    },
    PRO: {
        label: 'Pro',
        menu_items: 100,
        max_tables: 25,
        modules: {
            menu_edit: true,
            orders_kitchen: true,
            reservations: true,
            custom_design: true,
            analytics: false,
            qr_pay: false
        },
        note: 'Für Restaurants'
    },
    PRO_PLUS: {
        label: 'Pro+',
        menu_items: 200,
        max_tables: 50,
        modules: {
            menu_edit: true,
            orders_kitchen: true,
            reservations: true,
            custom_design: true,
            analytics: true,
            qr_pay: false
        },
        note: 'Für große Restaurants'
    },
    ENTERPRISE: {
        label: 'Enterprise',
        menu_items: 500,
        max_tables: 999,
        modules: {
            menu_edit: true,
            orders_kitchen: true,
            reservations: true,
            custom_design: true,
            analytics: true,
            qr_pay: true
        },
        note: 'Für Ketten & Hotels'
    }
};

/**
 * Returns the plan definition for a given type string.
 * Falls back to FREE if unknown.
 */
const getPlan = (type) => {
    return PLAN_DEFINITIONS[type] || PLAN_DEFINITIONS['FREE'];
};

/**
 * Returns the current active license from DB settings.
 * Falls back to FREE plan limits if no license is set.
 */
const getCurrentLicense = (DB) => {
    const settings = DB.getKV('settings', {});
    const lic = settings.license || {};
    const plan = getPlan(lic.type);
    return {
        key: lic.key || null,
        status: lic.status || 'free',
        customer: lic.customer || 'Testmodus',
        type: lic.type || 'FREE',
        label: plan.label,
        expiresAt: lic.expiresAt || null,
        modules: lic.modules || plan.modules,
        limits: lic.limits || { max_dishes: plan.menu_items, max_tables: plan.max_tables },
        plan
    };
};

module.exports = { PLAN_DEFINITIONS, getPlan, getCurrentLicense };
