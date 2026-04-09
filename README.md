# 🏛️ OPA! Santorini CMS

> Modulares Restaurant-Management-System – Speisekarte, Reservierungen, Website-Editor & mehr.

---

## 🚀 Schnellstart

### Voraussetzungen
- Node.js ≥ 18
- npm

### 1-Klick Installation (Empfohlen)

Das System bringt vollautomatische Installations- und Start-Skripte mit. Lade oder klone das Repository und starte einfach per Doppelklick:

**Für Windows:**
Führe `start-windows.bat` aus.

**Für Mac/Linux:**
```bash
chmod +x start-mac-linux.sh
./start-mac-linux.sh
```

### Manuelle Installation (Für Server-Admins)
```bash
git clone https://github.com/stb-srv/OPA-Santorini.git /opt/opa-santorini
cd /opt/opa-santorini
npm run install-all
npm run dev
```

Das CMS ist dann erreichbar unter: `http://localhost:5000/admin`
Beim ersten Aufruf startet sofort der **Setup-Wizard**.

---

## 🔄 System aktualisieren

Dank der neuen Update-Skripte ist das System mit einem Klick sofort auf dem neuesten Stand.

### Windows
```cmd
update-windows.bat
```

### Mac / Linux
```bash
./update-mac-linux.sh
```

Alternativ manuell:
```bash
cd /opt/opa-santorini
npm run update
pm2 restart all # (Falls pm2 verwendet wird)
```

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
/opt/opa-santorini/
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
