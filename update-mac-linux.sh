#!/bin/bash
echo "=============================================================="
echo " OPA! Santorini - Restaurant CMS"
echo " Automatisches Update-Skript (Mac/Linux)"
echo "=============================================================="
echo ""

echo "Ziehe aktuelle Aenderungen von GitHub..."
git pull
if [ $? -ne 0 ]; then
    echo "Fehler beim Aktualisieren von GitHub. (Bist du im richtigen Branch oder hast du lokale Aenderungen?)"
    exit 1
fi

echo ""
echo "Installiere moeglicherweise neue Abhaengigkeiten..."
npm run install-all

echo ""
echo "=============================================================="
echo " Update erfolgreich abgeschlossen!"
echo " Das CMS ist auf dem neuesten Stand."
echo " Führe ./start-mac-linux.sh aus um das CMS neu zu starten."
echo "=============================================================="
