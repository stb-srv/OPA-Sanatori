#!/bin/bash
set -e

# ============================================================
#  OPA Santorini CMS - Deploy Script
#  Ubuntu 25.04 | Run as root or with sudo
#  Usage: bash deploy.sh
# ============================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

APP_DIR="/opt/opa-santorini"
APP_USER="opa-cms"
REPO="https://github.com/stb-srv/OPA-Santorini.git"
SERVICE_NAME="opa-santorini"
PORT=5000

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  OPA Santorini CMS - Auto Deploy${NC}"
echo -e "${GREEN}========================================${NC}"

# ── 1. Node.js 22 installieren ─────────────────────────────────
echo -e "\n${YELLOW}[1/7] Node.js 22 prüfen / installieren...${NC}"
apt-get update -qq
apt-get install -y -qq curl git
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 20 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y -qq nodejs
fi
echo -e "${GREEN}  Node.js $(node -v) bereit${NC}"

# ── 2. App-User ────────────────────────────────────────────
echo -e "\n${YELLOW}[2/7] App-User '${APP_USER}' erstellen...${NC}"
if ! id "$APP_USER" &>/dev/null; then
    useradd --system --shell /bin/bash --create-home "$APP_USER"
    echo -e "${GREEN}  User erstellt${NC}"
else
    echo -e "${GREEN}  User existiert bereits${NC}"
fi

# ── 3. Repo klonen / updaten ────────────────────────────────
echo -e "\n${YELLOW}[3/7] Repository klonen / updaten...${NC}"
git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true
if [ -d "$APP_DIR/.git" ]; then
    chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
    sudo -u "$APP_USER" git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true
    cd "$APP_DIR" && sudo -u "$APP_USER" git pull origin main
else
    git clone "$REPO" "$APP_DIR"
    chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
fi
echo -e "${GREEN}  Repository aktuell${NC}"

# ── 4. .env erstellen ────────────────────────────────────────
echo -e "\n${YELLOW}[4/7] .env konfigurieren...${NC}"
if [ ! -f "$APP_DIR/.env" ]; then
    SECRET=$(openssl rand -hex 48)
    # Frage nach der Domain
    read -p "  Deine Domain (z.B. prodbeta.stb-srv.de): " APP_DOMAIN
    APP_DOMAIN=${APP_DOMAIN:-prodbeta.stb-srv.de}
    cat > "$APP_DIR/.env" <<EOF
PORT=${PORT}
ADMIN_SECRET=${SECRET}
LICENSE_SERVER_URL=https://licens-prod.stb-srv.de
CORS_ORIGINS=https://${APP_DOMAIN}
DEV_MODE=false
EOF
    chown "$APP_USER":"$APP_USER" "$APP_DIR/.env"
    chmod 600 "$APP_DIR/.env"
    echo -e "${GREEN}  .env erstellt für Domain: ${APP_DOMAIN}${NC}"
else
    echo -e "${GREEN}  .env existiert bereits - wird nicht überschrieben${NC}"
fi

# ── 5. npm install ────────────────────────────────────────────
echo -e "\n${YELLOW}[5/7] Dependencies installieren...${NC}"
cd "$APP_DIR" && sudo -u "$APP_USER" npm install --omit=dev
echo -e "${GREEN}  Dependencies installiert${NC}"

# ── 6. Systemd Service ──────────────────────────────────────
echo -e "\n${YELLOW}[6/7] Systemd Service einrichten...${NC}"
cat > /etc/systemd/system/${SERVICE_NAME}.service <<EOF
[Unit]
Description=OPA Santorini Restaurant CMS
After=network.target

[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${APP_DIR}
EnvironmentFile=${APP_DIR}/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${SERVICE_NAME}

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"
echo -e "${GREEN}  Service gestartet & Autostart aktiviert${NC}"

# ── 7. Fertig ───────────────────────────────────────────────
echo -e "\n${YELLOW}[7/7] Setup-Wizard aufrufen...${NC}"
echo -e "${GREEN}\n========================================${NC}"
echo -e "${GREEN}  Deploy erfolgreich!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "  → Setup-Wizard: ${YELLOW}http://localhost:${PORT}/setup${NC}"
echo -e "  → öffentlich:    ${YELLOW}https://prodbeta.stb-srv.de/setup${NC}"
echo -e ""
echo -e "  Logs:    ${YELLOW}journalctl -fu ${SERVICE_NAME}${NC}"
echo -e "  Status:  ${YELLOW}systemctl status ${SERVICE_NAME}${NC}"
echo -e "  Restart: ${YELLOW}systemctl restart ${SERVICE_NAME}${NC}"
echo -e ""
echo -e "${YELLOW}  HINWEIS: Port ${PORT} in Firewall freigeben:${NC}"
echo -e "  ${YELLOW}ufw allow ${PORT}${NC}\n"
