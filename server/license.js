/**
 * OPA-CMS - License Plan Definitions & Helpers
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

const getPlan = (type) => PLAN_DEFINITIONS[type] || PLAN_DEFINITIONS['FREE'];

/**
 * Gibt die aktuelle Lizenz aus den DB-Settings zurück.
 * Enthält zusätzlich:
 *   isTrial      – true wenn Trial-Lizenz
 *   isExpired    – true wenn Ablaufdatum überschritten
 *   trialDaysLeft – verbleibende Trial-Tage (nur wenn isTrial)
 */
const getCurrentLicense = (DB) => {
    const settings = DB.getKV('settings', {});
    const lic = settings.license || {};
    const plan = getPlan(lic.type);

    const now = new Date();
    const expiresAt = lic.expiresAt ? new Date(lic.expiresAt) : null;
    const isExpired = expiresAt ? expiresAt < now : false;
    const isTrial = !!lic.isTrial;
    const trialDaysLeft = isTrial && expiresAt && !isExpired
        ? Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)))
        : 0;

    // Abgelaufene Trial-Lizenz → auf FREE-Limits zurückfallen
    const effectiveModules = isExpired && isTrial ? plan.modules : (lic.modules || plan.modules);
    const effectiveLimits  = isExpired && isTrial
        ? { max_dishes: plan.menu_items, max_tables: plan.max_tables }
        : (lic.limits || { max_dishes: plan.menu_items, max_tables: plan.max_tables });

    return {
        key:          lic.key    || null,
        status:       isExpired ? 'expired' : (lic.status || 'free'),
        customer:     lic.customer || 'Testmodus',
        type:         lic.type   || 'FREE',
        label:        plan.label,
        expiresAt:    lic.expiresAt || null,
        modules:      effectiveModules,
        limits:       effectiveLimits,
        isTrial,
        isExpired,
        trialDaysLeft,
        plan
    };
};

module.exports = { PLAN_DEFINITIONS, getPlan, getCurrentLicense };
