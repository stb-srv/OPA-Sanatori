#!/bin/bash
echo "=============================================================="
echo " OPA! Santorini - Restaurant CMS"
echo " Automatisches Setup-Skript (Mac/Linux)"
echo "=============================================================="
echo ""

echo "[1/3] Installiere grundlegende Abhaengigkeiten (Node.js Modules)..."
npm install --silent
if [ $? -ne 0 ]; then
    echo "Fehler bei npm install. Bitte Node.js prfen!"
    exit 1
fi

echo "[2/3] Installiere Abhaengigkeiten fuer den integrierten Lizenzserver..."
cd license-server
npm install --silent
if [ $? -ne 0 ]; then
    echo "Fehler bei npm install im license-server."
    exit 1
fi
cd ..

echo "[3/3] Installation erfolgreich! Starte nun alle Server..."
echo ""
echo "=============================================================="
echo " Das CMS ist gleich lokal auf folgendem Port erreichbar:"
echo " - Frontend/Admin: http://localhost:5000/"
echo " Lade den Setup-Wizard im Browser, sobald der Server laeuft."
echo "=============================================================="
echo ""

npm run dev
