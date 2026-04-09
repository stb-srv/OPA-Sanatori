@echo off
echo ==============================================================
echo OPA! Santorini - Restaurant CMS
echo Automatisches Update-Skript
echo ==============================================================
echo.

echo Ziehe aktuelle Aenderungen von GitHub...
call git pull
if %errorlevel% neq 0 (
    echo Fehler beim Aktualisieren von GitHub. (Bist du im richtigen Branch oder hast du lokale Aenderungen?)
    pause
    exit /b %errorlevel%
)

echo.
echo Installiere moeglicherweise neue Abhaengigkeiten...
call npm run install-all

echo.
echo ==============================================================
echo Update erfolgreich abgeschlossen!
echo Das CMS ist auf dem neuesten Stand.
echo Mache einen Doppelklick auf "start-windows.bat" um das CMS neu zu starten.
echo ==============================================================
pause
