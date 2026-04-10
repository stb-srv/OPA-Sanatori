#!/bin/bash
echo "=============================================================="
echo " OPA-CMS - Restaurant Management System"
echo " Lokaler Start (Mac / Linux)"
echo "=============================================================="
echo ""

# --- .env automatisch anlegen wenn nicht vorhanden ---
if [ ! -f ".env" ]; then
    echo "[SETUP] Keine .env gefunden – wird automatisch aus .env.example erstellt..."
    cp .env.example .env
    # Für lokale Entwicklung einen zufälligen Secret generieren
    if command -v openssl &>/dev/null; then
        SECRET=$(openssl rand -hex 32)
        sed -i.bak "s|^ADMIN_SECRET=.*|ADMIN_SECRET=${SECRET}|" .env && rm -f .env.bak
    fi
    echo "[OK] .env erstellt."
else
    echo "[OK] .env gefunden."
fi

echo "[1/2] Installiere Abhängigkeiten (Node.js Modules)..."
npm install --silent
if [ $? -ne 0 ]; then
    echo "Fehler bei npm install. Bitte Node.js >= 18 prüfen!"
    exit 1
fi

echo "[2/2] Starte Server..."
echo ""
echo "=============================================================="
echo " CMS erreichbar unter:"
echo " → Admin-Panel:  http://localhost:5000/admin"
echo " → Gäste-Seite:  http://localhost:5000/"
echo ""
echo " Beim ersten Aufruf startet der Setup-Wizard automatisch."
echo " Dort Admin-Zugangsdaten, SMTP & Lizenz einrichten –"
echo " alles im Browser, keine weiteren Konsolenbefehle nötig."
echo "=============================================================="
echo ""

npm run dev
