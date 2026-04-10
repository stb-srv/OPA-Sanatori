@echo off
echo ==============================================================
echo OPA-CMS - Restaurant Management System
echo Lokaler Start (Windows)
echo ==============================================================
echo.

REM --- .env automatisch anlegen wenn nicht vorhanden ---
if not exist ".env" (
    echo [SETUP] Keine .env gefunden - wird automatisch aus .env.example erstellt...
    copy .env.example .env >nul
    echo [OK] .env erstellt.
) else (
    echo [OK] .env gefunden.
)

echo [1/2] Installiere Abhaengigkeiten (Node.js Modules)...
call npm install --silent
if %errorlevel% neq 0 (
    echo Fehler bei npm install. Bitte Node.js ^>= 18 pruefen!
    pause
    exit /b %errorlevel%
)

echo [2/2] Starte Server...
echo.
echo ==============================================================
echo CMS erreichbar unter:
echo   Admin-Panel:  http://localhost:5000/admin
echo   Gaeste-Seite: http://localhost:5000/
echo.
echo Beim ersten Aufruf startet der Setup-Wizard automatisch.
echo Dort Admin-Zugangsdaten, SMTP ^& Lizenz einrichten -
echo alles im Browser, keine weiteren Konsolenbefehle noetig.
echo ==============================================================
echo.

call npm run dev
pause
