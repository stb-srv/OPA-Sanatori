@echo off
echo ==============================================================
echo OPA! Santorini - Restaurant CMS
echo Automatisches Setup-Skript
echo ==============================================================
echo.

echo [1/3] Installiere grundlegende Abhaengigkeiten (Node.js Modules)...
call npm install --silent
if %errorlevel% neq 0 (
    echo Fehler bei npm install. Bitte Node.js prüfen!
    pause
    exit /b %errorlevel%
)

echo [2/3] Installiere Abhaengigkeiten fuer den integrierten Lizenzserver...
cd license-server
call npm install --silent
cd ..
if %errorlevel% neq 0 (
    echo Fehler bei npm install im license-server.
    pause
    exit /b %errorlevel%
)

echo [3/3] Installation erfolgreich! Starte nun alle Server...
echo.
echo ==============================================================
echo Das CMS ist gleich lokal auf folgendem Port erreichbar:
echo - Frontend/Admin: http://localhost:5000/
echo Lade den Setup-Wizard im Browser, sobald der Server laeuft.
echo ==============================================================
echo.

call npm run dev
pause
