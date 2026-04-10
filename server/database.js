const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// --- Schema initialisieren ---
db.exec(`
    CREATE TABLE IF NOT EXISTS kv_store (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
        user                    TEXT PRIMARY KEY,
        pass                    TEXT NOT NULL,
        name                    TEXT,
        last_name               TEXT,
        email                   TEXT,
        role                    TEXT DEFAULT 'admin',
        require_password_change INTEGER DEFAULT 0,
        recovery_codes          TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS menu (
        id        TEXT PRIMARY KEY,
        number    TEXT,
        name      TEXT NOT NULL,
        price     REAL,
        cat       TEXT,
        desc      TEXT,
        allergens TEXT DEFAULT '[]',
        additives TEXT DEFAULT '[]',
        image     TEXT,
        active    INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS categories (
        id     TEXT PRIMARY KEY,
        label  TEXT NOT NULL,
        icon   TEXT,
        active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS reservations (
        id              INTEGER PRIMARY KEY,
        token           TEXT UNIQUE,
        name            TEXT,
        email           TEXT,
        phone           TEXT,
        date            TEXT,
        time            TEXT,
        start_time      TEXT,
        end_time        TEXT,
        guests          INTEGER DEFAULT 1,
        note            TEXT,
        status          TEXT DEFAULT 'Pending',
        assigned_tables TEXT DEFAULT '[]',
        submittedAt     TEXT,
        ip              TEXT
    );

    CREATE TABLE IF NOT EXISTS tables (
        id         TEXT PRIMARY KEY,
        name       TEXT NOT NULL,
        capacity   INTEGER DEFAULT 2,
        combinable INTEGER DEFAULT 1,
        active     INTEGER DEFAULT 1,
        area_id    TEXT DEFAULT 'main'
    );

    CREATE TABLE IF NOT EXISTS orders (
        id          TEXT PRIMARY KEY,
        table_id    TEXT,
        table_name  TEXT,
        status      TEXT DEFAULT 'pending',
        timestamp   TEXT,
        total       REAL DEFAULT 0,
        note        TEXT,
        items       TEXT DEFAULT '[]'
    );
`);

// --- Migrations (idempotent – laufen bei jedem Start) ---
const migrations = [
    "ALTER TABLE users ADD COLUMN email TEXT",
    "ALTER TABLE users ADD COLUMN last_name TEXT",
    "ALTER TABLE users ADD COLUMN require_password_change INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN recovery_codes TEXT DEFAULT '[]'",
    "ALTER TABLE menu ADD COLUMN number TEXT",
    "ALTER TABLE menu ADD COLUMN active INTEGER DEFAULT 1",
    // orders Tabelle: alte JSON-Blob Spalte ggf. vorhanden – neue Felder ergänzen
    "ALTER TABLE orders ADD COLUMN table_id TEXT",
    "ALTER TABLE orders ADD COLUMN table_name TEXT",
    "ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'pending'",
    "ALTER TABLE orders ADD COLUMN total REAL DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN note TEXT",
    "ALTER TABLE orders ADD COLUMN items TEXT DEFAULT '[]'",
];
migrations.forEach(sql => { try { db.exec(sql + ';'); } catch (e) { /* Spalte existiert bereits */ } });

// --- Performance-Indizes ---
[
    "CREATE INDEX IF NOT EXISTS idx_reservations_date   ON reservations(date)",
    "CREATE INDEX IF NOT EXISTS idx_reservations_token  ON reservations(token)",
    "CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status)",
    "CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders(status)",
    "CREATE INDEX IF NOT EXISTS idx_orders_timestamp    ON orders(timestamp)",
    "CREATE INDEX IF NOT EXISTS idx_menu_cat            ON menu(cat)",
].forEach(sql => { try { db.exec(sql + ';'); } catch (e) {} });

const safeJsonParse = (str, fallback = null) => {
    try { return str ? JSON.parse(str) : fallback; }
    catch (e) { return fallback; }
};

const DB = {
    // --- KV Store ---
    getKV: (key, defaultValue = null) => {
        const row = db.prepare('SELECT value FROM kv_store WHERE key = ?').get(key);
        return row ? safeJsonParse(row.value, defaultValue) : defaultValue;
    },
    setKV: (key, value) => {
        db.prepare('INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
    },

    // --- Users ---
    getUsers: () => db.prepare(
        'SELECT user, pass, name, last_name, email, role, require_password_change, recovery_codes FROM users'
    ).all(),

    setUserPass: (user, hashedPass, requireChange = false) => {
        db.prepare('UPDATE users SET pass = ?, require_password_change = ? WHERE user = ?')
            .run(hashedPass, requireChange ? 1 : 0, user);
    },

    setRequirePasswordChange: (user, value) => {
        db.prepare('UPDATE users SET require_password_change = ? WHERE user = ?')
            .run(value ? 1 : 0, user);
    },

    setRecoveryCodes: (user, codes) => {
        db.prepare('UPDATE users SET recovery_codes = ? WHERE user = ?')
            .run(JSON.stringify(codes), user);
    },

    addUser: (u) => {
        db.prepare(
            'INSERT INTO users (user, pass, name, last_name, email, role, require_password_change, recovery_codes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(u.user, u.pass, u.name || '', u.last_name || '', u.email || '', u.role || 'admin',
              u.require_password_change || 0, JSON.stringify(u.recovery_codes || []));
    },

    updateUser: (user, u) => {
        db.prepare('UPDATE users SET name = ?, last_name = ?, email = ?, role = ? WHERE user = ?')
            .run(u.name || '', u.last_name || '', u.email || '', u.role || 'admin', user);
    },

    deleteUser: (user) => {
        db.prepare('DELETE FROM users WHERE user = ?').run(user);
    },

    // --- Menu ---
    getMenu: () => {
        const rows = db.prepare('SELECT * FROM menu ORDER BY cat, name').all();
        return rows.map(r => ({
            ...r,
            active: r.active !== 0, // SQLite integer → boolean
            allergens: safeJsonParse(r.allergens, []),
            additives: safeJsonParse(r.additives, [])
        }));
    },

    addMenu: (m) => {
        db.prepare(
            'INSERT INTO menu (id, number, name, price, cat, desc, allergens, additives, image, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(m.id, m.number || null, m.name, m.price, m.cat, m.desc,
              JSON.stringify(m.allergens || []), JSON.stringify(m.additives || []),
              m.image || null, m.active !== false ? 1 : 0);
    },

    updateMenu: (id, update) => {
        const existing = db.prepare('SELECT * FROM menu WHERE id = ?').get(id);
        if (!existing) return null;
        const merged = {
            ...existing,
            ...update,
            allergens: safeJsonParse(
                typeof update.allergens !== 'undefined' ? JSON.stringify(update.allergens) : existing.allergens, []
            ),
            additives: safeJsonParse(
                typeof update.additives !== 'undefined' ? JSON.stringify(update.additives) : existing.additives, []
            )
        };
        db.prepare(
            'UPDATE menu SET number = ?, name = ?, price = ?, cat = ?, desc = ?, allergens = ?, additives = ?, image = ?, active = ? WHERE id = ?'
        ).run(merged.number || null, merged.name, merged.price, merged.cat, merged.desc,
              JSON.stringify(merged.allergens), JSON.stringify(merged.additives),
              merged.image || null, merged.active !== false ? 1 : 0, id);
        return { ...merged, active: merged.active !== false };
    },

    deleteMenu: (id) => db.prepare('DELETE FROM menu WHERE id = ?').run(id),

    saveMenu: (items) => {
        const upsert = db.prepare(
            'INSERT OR REPLACE INTO menu (id, number, name, price, cat, desc, allergens, additives, image, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        db.transaction((list) => {
            db.prepare('DELETE FROM menu').run();
            list.forEach(m => upsert.run(
                m.id || Date.now().toString(), m.number || null,
                m.name, m.price, m.cat, m.desc,
                JSON.stringify(m.allergens || []), JSON.stringify(m.additives || []),
                m.image || null, m.active !== false ? 1 : 0
            ));
        })(items);
    },

    // --- Categories ---
    getCategories: () => db.prepare('SELECT * FROM categories ORDER BY label').all(),

    addCategory: (c) => {
        db.prepare('INSERT INTO categories (id, label, icon, active) VALUES (?, ?, ?, ?)')
            .run(c.id, c.label, c.icon || '', c.active !== false ? 1 : 0);
    },

    updateCategory: (id, update) => {
        const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
        if (!existing) return null;
        const merged = { ...existing, ...update };
        db.prepare('UPDATE categories SET label = ?, icon = ?, active = ? WHERE id = ?')
            .run(merged.label, merged.icon || '', merged.active !== false ? 1 : 0, id);
        return merged;
    },

    deleteCategory: (id) => db.prepare('DELETE FROM categories WHERE id = ?').run(id),

    saveCategories: (items) => {
        const upsert = db.prepare('INSERT OR REPLACE INTO categories (id, label, icon, active) VALUES (?, ?, ?, ?)');
        db.transaction((list) => {
            db.prepare('DELETE FROM categories').run();
            list.forEach(c => upsert.run(c.id, c.label, c.icon || '', c.active !== false ? 1 : 0));
        })(items);
    },

    // --- Reservations ---
    getReservations: () => {
        const rows = db.prepare('SELECT * FROM reservations ORDER BY submittedAt DESC').all();
        return rows.map(r => ({ ...r, assigned_tables: safeJsonParse(r.assigned_tables, []) }));
    },

    addReservation: (r) => {
        db.prepare(`
            INSERT INTO reservations
            (id, token, name, email, phone, date, time, start_time, end_time, guests, note, status, assigned_tables, submittedAt, ip)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(r.id, r.token, r.name, r.email, r.phone, r.date, r.time,
               r.start_time, r.end_time, r.guests, r.note || '', r.status,
               JSON.stringify(r.assigned_tables || []), r.submittedAt, r.ip || null);
    },

    updateReservation: (id, update) => {
        const existing = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id);
        if (!existing) return null;
        const merged = { ...existing, ...update };
        merged.assigned_tables = safeJsonParse(
            typeof update.assigned_tables !== 'undefined'
                ? JSON.stringify(update.assigned_tables)
                : existing.assigned_tables,
            []
        );
        db.prepare(`
            UPDATE reservations SET
                name = ?, email = ?, phone = ?, date = ?, time = ?,
                start_time = ?, end_time = ?, guests = ?, note = ?,
                status = ?, assigned_tables = ?
            WHERE id = ?
        `).run(merged.name, merged.email, merged.phone, merged.date, merged.time,
               merged.start_time, merged.end_time, merged.guests, merged.note || '',
               merged.status, JSON.stringify(merged.assigned_tables), id);
        return merged;
    },

    deleteReservation: (id) => db.prepare('DELETE FROM reservations WHERE id = ?').run(id),

    saveReservations: (list) => {
        const insert = db.prepare(`
            INSERT OR REPLACE INTO reservations
            (id, token, name, email, phone, date, time, start_time, end_time, guests, note, status, assigned_tables, submittedAt, ip)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        db.transaction((items) => {
            db.prepare('DELETE FROM reservations').run();
            items.forEach(r => insert.run(
                r.id, r.token, r.name, r.email, r.phone,
                r.date, r.time, r.start_time, r.end_time, r.guests,
                r.note || '', r.status, JSON.stringify(r.assigned_tables || []),
                r.submittedAt, r.ip || null
            ));
        })(list);
    },

    // --- Tables ---
    getTables: () => db.prepare('SELECT * FROM tables').all(),

    saveTables: (tables) => {
        const upsert = db.prepare(
            'INSERT OR REPLACE INTO tables (id, name, capacity, combinable, active, area_id) VALUES (?, ?, ?, ?, ?, ?)'
        );
        db.transaction((list) => {
            list.forEach(t => upsert.run(
                t.id, t.name, t.capacity || 2,
                t.combinable !== false ? 1 : 0,
                t.active !== false ? 1 : 0,
                t.area_id || 'main'
            ));
            // Tische deaktivieren die nicht mehr in der Liste sind
            if (list.length > 0) {
                db.prepare('UPDATE tables SET active = 0 WHERE id NOT IN (SELECT value FROM json_each(?))')
                    .run(JSON.stringify(list.map(t => t.id)));
            }
        })(tables);
    },

    // --- Orders ---
    getOrders: () => {
        const rows = db.prepare('SELECT * FROM orders ORDER BY timestamp DESC').all();
        return rows.map(r => ({
            ...r,
            items: safeJsonParse(r.items, [])
        }));
    },

    getOrderById: (id) => {
        const r = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
        if (!r) return null;
        return { ...r, items: safeJsonParse(r.items, []) };
    },

    addOrder: (order) => {
        db.prepare(`
            INSERT OR REPLACE INTO orders (id, table_id, table_name, status, timestamp, total, note, items)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            order.id || Date.now().toString(),
            order.table_id || order.tableId || null,
            order.table_name || order.tableName || null,
            order.status || 'pending',
            order.timestamp || new Date().toISOString(),
            order.total || 0,
            order.note || null,
            JSON.stringify(order.items || [])
        );
    },

    updateOrderStatus: (id, status) => {
        db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    },

    deleteOrder: (id) => {
        db.prepare('DELETE FROM orders WHERE id = ?').run(id);
    }
};

module.exports = DB;
