# 🏛️ OPA! Santorini CMS

> Modulares Restaurant-Management-System – Speisekarte, Reservierungen, Website-Editor & mehr.

---

## 🚀 Schnellstart

### Voraussetzungen
- Node.js ≥ 18
- npm

### Installation
```bash
git clone https://github.com/stb-srv/OPA-Santorini.git
cd OPA-Santorini
npm install
node server.js
```

Das CMS ist dann erreichbar unter: `http://localhost:5000/admin`

Beim ersten Start wird der **Setup-Wizard** automatisch geöffnet (`/setup`).

---

## 🔄 Server aktualisieren

Einfach im Projektverzeichnis ausführen:

```bash
git pull && npm install && pm2 restart all
```

> Falls kein pm2 verwendet wird:
> ```bash
> git pull && npm install
> # Danach den Node-Prozess neu starten
> ```

---

## 🗂️ CMS-Navigation

```
📊 Dashboard
🌐 Website
   ├─ Startseite & Bilder
   ├─ Seiten verwalten
   ├─ Impressum & Datenschutz
   ├─ Cookie Banner
   ├─ Standort & Karte
   ├─ Urlaub
   └─ Feiertage
🍽 Restaurant
   ├─ Reservierungen
   ├─ Tische
   └─ Öffnungszeiten
📋 Speisekarte
   ├─ Gerichte
   ├─ Kategorien
   ├─ Allergene
   └─ Zusatzstoffe
⚙️ System
   ├─ Einstellungen
   └─ Erweiterungen
```

---

## ✨ Features

### 🍽️ Speisekarten-Verwaltung
- Gerichte mit Bild, Preis, Nummer & Beschreibung
- Kategorien, Allergene & Zusatzstoffe
- PDF-Export der Speisekarte
- JSON-Backup & Restore (Import/Export)
- Plan-Limit-Prüfung beim Speichern

### 📅 Reservierungen
- Online-Buchung mit Echtzeit-Verfügbarkeitsprüfung
- Tisch-Zuweisung & Kombinationstisch-Logik
- Bestätigungs-/Storno-Links per E-Mail
- Warteliste / Anfrage-Modus wenn voll
- Konfigurierbarer Puffer & Aufenthaltsdauer

### 🌐 Website-Editor
- Startseite, Hero, Galerie & Öffnungszeiten
- Impressum, Datenschutz & Cookie-Banner
- Standort-Karte einbetten
- Urlaubs- & Feiertagsverwaltung

### 🔑 Lizenz-System
- FREE / STARTER / PRO / ENTERPRISE Pläne
- Trial-Lizenz beim Setup (30 Tage)
- Plan-Module einzeln manuell überschreibbar (Admin)
- Validierung gegen externen Lizenzserver

### 🔌 Erweiterungen (Plugins)
- Plugin-System mit eigenem `server.js` & Frontend
- Aktivierung/Deaktivierung per Toggle

---

## 🗺️ Roadmap

- [ ] Gutschein-System (digitale Geschenkkarten)
- [ ] Google Reviews Integration
- [ ] Sammelpass-Digital (jede 10. Bestellung = Rabatt)
- [ ] QR-Pay (Bezahlung am Tisch per QR-Code)
- [ ] SMS-Benachrichtigungen
- [ ] Mehrsprachigkeit (DE / EN / GR)

---

## 🛠️ Tech Stack

| Bereich | Technologie |
|---|---|
| Backend | Node.js, Express |
| Datenbank | JSON-Flat-File via `database.js` |
| Auth | JWT + bcrypt |
| Realtime | Socket.io |
| Frontend | Vanilla JS (ES Modules) |
| Styling | CSS Custom Properties, Glassmorphism |
| E-Mail | Nodemailer (SMTP) |

---

## 📁 Projektstruktur

```
OPA-Santorini/
├── server.js          # Express-Server & alle API-Routen
├── config.js          # Konfiguration (Port, Secrets, SMTP)
├── server/
│   ├── database.js    # Datenbankschicht (JSON-Files)
│   ├── license.js     # Lizenz-Logik & Plan-Definitionen
│   └── mailer.js      # E-Mail-Versand
├── cms/               # Admin-Interface
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   └── modules/       # Einzelne CMS-Module (menu, reservations, ...)
├── menu-app/          # Gäste-Frontend (Speisekarte)
├── plugins/           # Erweiterungen
└── uploads/           # Hochgeladene Bilder
```
