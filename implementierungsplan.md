🛠️ Bug-Fix Implementierungsplan – OPA-Santorini CMS
Regeln für den Agenten
Vor jedem Push: Aktuellen SHA der Datei mit get_file_contents holen

Immer vollständigen Dateiinhalt pushen – kein Partial-Update

Reihenfolge einhalten – die Fixes bauen aufeinander auf

4 Dateien werden geändert, nichts anderes anfassen

Fix-Paket 1 – Datenbank-Schema (server/database.js)
SHA aktuell: de5539fbdd03e67a8d0f75e52a211bebb53e3c1e

Änderung 1.1 – CREATE TABLE menu um 2 Spalten erweitern
Im db.exec(...) Block die menu-Tabelle anpassen:

sql
-- VORHER:
image TEXT,
active INTEGER DEFAULT 1

-- NACHHER:
image TEXT,
active INTEGER DEFAULT 1,
available INTEGER DEFAULT 1,
updated_at TEXT
Änderung 1.2 – Migrations-Array ergänzen
Nach den bestehenden Migrations-Einträgen zwei neue hinzufügen:

js
"ALTER TABLE menu ADD COLUMN available INTEGER DEFAULT 1",
"ALTER TABLE menu ADD COLUMN updated_at TEXT",
"ALTER TABLE menu ADD COLUMN sort_order INTEGER DEFAULT 0",
Änderung 1.3 – getMenu() Mapping fixen
js
// VORHER:
return rows.map(r => ({ ...r, active: Number(r.active) !== 0, allergens: ..., additives: ... }));

// NACHHER:
return rows.map(r => ({
...r,
active: Number(r.active) !== 0,
available: r.available !== undefined ? Number(r.available) !== 0 : Number(r.active) !== 0,
allergens: safeJsonParse(r.allergens, []),
additives: safeJsonParse(r.additives, [])
}));
Änderung 1.4 – addMenu() Statement erweitern
js
// VORHER:
stmts.addMenu = db.prepare('INSERT INTO menu (id, number, name, price, cat, desc, allergens, additives, image, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

// addMenu() Aufruf:
stmts.addMenu.run(m.id, m.number||null, m.name, m.price, m.cat, m.desc, ..., m.active!==false?1:0);

// NACHHER – Statement:
stmts.addMenu = db.prepare('INSERT INTO menu (id, number, name, price, cat, desc, allergens, additives, image, active, available, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

// addMenu() Aufruf:
stmts.addMenu.run(m.id, m.number||null, m.name, m.price, m.cat, m.desc,
JSON.stringify(m.allergens||[]), JSON.stringify(m.additives||[]),
m.image||null,
m.active !== false ? 1 : 0,
m.available !== false ? 1 : 0,
m.updated_at || null
);
Änderung 1.5 – updateMenuRow Statement + updateMenu() fixen
js
// VORHER Statement:
stmts.updateMenuRow = db.prepare('UPDATE menu SET number=?, name=?, price=?, cat=?, desc=?, allergens=?, additives=?, image=?, active=? WHERE id=?');

// NACHHER Statement:
stmts.updateMenuRow = db.prepare('UPDATE menu SET number=?, name=?, price=?, cat=?, desc=?, allergens=?, additives=?, image=?, active=?, available=?, updated_at=? WHERE id=?');

// updateMenu() activeVal Berechnung ersetzen:
// VORHER:
const activeVal = typeof update.active !== 'undefined' ? (update.active ? 1 : 0) : Number(existing.active);

// NACHHER:
const rawAvail = update.available !== undefined ? update.available : (update.active !== undefined ? update.active : null);
const activeVal = rawAvail !== null ? (rawAvail ? 1 : 0) : Number(existing.active);
const availVal = rawAvail !== null ? (rawAvail ? 1 : 0) : (existing.available !== undefined ? Number(existing.available) : Number(existing.active));
const updatedAt = update.updated_at || existing.updated_at || null;

// updateMenuRow.run() Aufruf erweitern:
stmts.updateMenuRow.run(
merged.number||null, merged.name, merged.price, merged.cat, merged.desc,
JSON.stringify(merged.allergens), JSON.stringify(merged.additives),
merged.image||null, activeVal, availVal, updatedAt, id
);

// Return-Wert:
return { ...merged, active: activeVal !== 0, available: availVal !== 0, updated_at: updatedAt };
Änderung 1.6 – upsertMenu Statement + saveMenu() fixen
js
// VORHER:
stmts.upsertMenu = db.prepare('INSERT OR REPLACE INTO menu (id, number, name, price, cat, desc, allergens, additives, image, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

// NACHHER:
stmts.upsertMenu = db.prepare('INSERT OR REPLACE INTO menu (id, number, name, price, cat, desc, allergens, additives, image, active, available, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

// saveMenu() forEach:
stmts.upsertMenu.run(
m.id||Date.now().toString(), m.number||null, m.name, m.price, m.cat, m.desc,
JSON.stringify(m.allergens||[]), JSON.stringify(m.additives||[]),
m.image||null,
m.active !== false ? 1 : 0,
m.available !== false ? 1 : 0,
m.updated_at || null
);
Änderung 1.7 – getMenu SQL Sortierung
sql
-- VORHER:
SELECT \* FROM menu ORDER BY cat, name

-- NACHHER:
SELECT \* FROM menu ORDER BY cat, COALESCE(sort_order, 0), name
Fix-Paket 2 – MySQL-Adapter (server/database-mysql.js)
SHA aktuell: b41347a475578cd67a66de8ebbd544341302337f

Exakt dieselben Änderungen wie Paket 1, aber MySQL-Syntax:

Änderung 2.1 – CREATE TABLE menu erweitern
sql
-- nach `active TINYINT(1) DEFAULT 1` einfügen:
available TINYINT(1) DEFAULT 1,
updated_at VARCHAR(50),
sort_order INT DEFAULT 0
Änderung 2.2 – getMenu() Mapping (identisch mit 1.3)
Änderung 2.3 – addMenu() Query + Parameter erweitern
js
// VORHER:
'INSERT INTO menu (id, number, name, price, cat, `desc`, allergens, additives, image, active) VALUES (?,?,?,?,?,?,?,?,?,?)'
// 10 Params

// NACHHER:
'INSERT INTO menu (id, number, name, price, cat, `desc`, allergens, additives, image, active, available, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
// + m.available !== false ? 1 : 0, m.updated_at || null
Änderung 2.4 – updateMenu() (identische Logik wie 1.5, MySQL-Query)
js
// VORHER:
'UPDATE menu SET number=?, name=?, price=?, cat=?, `desc`=?, allergens=?, additives=?, image=?, active=? WHERE id=?'

// NACHHER:
'UPDATE menu SET number=?, name=?, price=?, cat=?, `desc`=?, allergens=?, additives=?, image=?, active=?, available=?, updated_at=? WHERE id=?'
// + availVal, updatedAt in Params
Änderung 2.5 – saveMenu() INSERT erweitern (identisch mit 2.3)
Änderung 2.6 – getMenu SQL Sortierung
sql
-- VORHER:
SELECT _ FROM menu ORDER BY cat, name
-- NACHHER:
SELECT _ FROM menu ORDER BY cat, COALESCE(sort_order, 0), name
Fix-Paket 3 – Settings Route (server/routes/settings.js)
SHA aktuell: 494b16a6856dae9cf6b6fce962a5cefb97d0ba84

Änderung 3.1 – POST /license/modules ohne Lizenz erlauben
js
// VORHER:
if (!settings.license) return res.status(400).json({ success: false, reason: 'Keine Lizenz aktiv.' });
settings.license.modules = { ...settings.license.modules, ...modules };

// NACHHER:
if (!settings.license) settings.license = {};
settings.license.modules = { ...(settings.license.modules || {}), ...modules };
Fix-Paket 4 – CMS Settings Frontend (cms/modules/settings.js)
SHA aktuell: 259ace5e0615eef908d3a429a43c7208a9c615fa

Änderung 4.1 – Race Condition beim Speichern beheben
Im btnSaveModules.onclick Handler:

js
// VORHER:
apiPost('settings', {
...settings, // ← ganzes altes settings-Objekt → Race Condition
activeModules: { orders: ..., reservations: ... }
})

// NACHHER:
apiPost('settings', {
activeModules: { // ← nur activeModules senden, deepMerge im Backend erledigt den Rest
orders: container.querySelector('#v-orders')?.checked ?? true,
reservations: container.querySelector('#v-res')?.checked ?? true
}
})
Commit-Nachricht
text
fix: available/updated_at DB-Felder, license/modules ohne Lizenz, settings race condition

- database.js + database-mysql.js: Spalten available, updated_at, sort_order zur
  menu-Tabelle hinzugefügt (Migration idempotent); updateMenu/addMenu/saveMenu
  schreiben jetzt available und updated_at korrekt; getMenu() mapped available aus
  active als Fallback; ORDER BY berücksichtigt sort_order
- routes/settings.js: POST /license/modules schlägt nicht mehr fehl wenn
  settings.license noch nicht existiert (frischer Install / Trial)
- cms/modules/settings.js: beim Speichern der CMS-Sichtbarkeit wird nur
  activeModules gesendet statt des kompletten settings-Objekts (verhindert
  Race Condition mit deepMerge)

Fixes: BUG-1, BUG-2, BUG-3, BUG-6, BUG-7
✅ Checkliste für den Agenten
SHA von server/database.js holen → vollständig pushen

SHA von server/database-mysql.js holen → vollständig pushen

SHA von server/routes/settings.js holen → vollständig pushen

SHA von cms/modules/settings.js holen → vollständig pushen

Alle 4 Pushes in einem einzigen push_files-Call zusammenfassen

Commit-Nachricht wie oben verwenden

Keine anderen Dateien ändern
