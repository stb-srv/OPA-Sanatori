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

# --- 1. Node.js 22 ---
echo -e "\n${YELLOW}[1/8] Node.js 22 prüfen / installieren...${NC}"
apt-get update -qq
apt-get install -y -qq curl git
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 20 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y -qq nodejs
fi
echo -e "${GREEN}  Node.js $(node -v) bereit${NC}"

# --- 2. App-User ---
echo -e "\n${YELLOW}[2/8] App-User '${APP_USER}' erstellen...${NC}"
if ! id "$APP_USER" &>/dev/null; then
    useradd --system --shell /bin/bash --create-home "$APP_USER"
    echo -e "${GREEN}  User erstellt${NC}"
else
    echo -e "${GREEN}  User existiert bereits${NC}"
fi

# --- 3. Repo klonen / updaten ---
echo -e "\n${YELLOW}[3/8] Repository klonen / updaten...${NC}"
git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true
if [ -d "$APP_DIR/.git" ]; then
    chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
    cd "$APP_DIR" && sudo -u "$APP_USER" git pull origin main
else
    git clone "$REPO" "$APP_DIR"
    chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
fi
echo -e "${GREEN}  Repository aktuell${NC}"

# --- 4. .env erstellen ---
echo -e "\n${YELLOW}[4/8] .env konfigurieren...${NC}"
if [ ! -f "$APP_DIR/.env" ]; then
    SECRET=$(openssl rand -hex 48)
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

# --- 5. npm install ---
echo -e "\n${YELLOW}[5/8] Dependencies installieren...${NC}"
cd "$APP_DIR" && sudo -u "$APP_USER" npm install --omit=dev
echo -e "${GREEN}  Dependencies installiert${NC}"

# --- 6. Systemd Service ---
echo -e "\n${YELLOW}[6/8] Systemd Service einrichten...${NC}"
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
sleep 2
echo -e "${GREEN}  Service gestartet & Autostart aktiviert${NC}"

# --- 7. Admin-User erstellen ---
echo -e "\n${YELLOW}[7/8] Admin-User erstellen...${NC}"
read -p "  Admin-Benutzername (Standard: admin): " ADMIN_USER
ADMIN_USER=${ADMIN_USER:-admin}
read -s -p "  Admin-Passwort (Standard: admin123 - BITTE ÄNDERN!): " ADMIN_PASS
echo ""
ADMIN_PASS=${ADMIN_PASS:-admin123}
cd "$APP_DIR" && sudo -u "$APP_USER" node scripts/create-admin.js "$ADMIN_USER" "$ADMIN_PASS"

# --- 8. Fertig ---
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Deploy erfolgreich!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "  → CMS Login:  ${YELLOW}https://prodbeta.stb-srv.de/admin${NC}"
echo -e "  → Gästeseite: ${YELLOW}https://prodbeta.stb-srv.de${NC}"
echo -e ""
echo -e "  Logs:    ${YELLOW}journalctl -fu ${SERVICE_NAME}${NC}"
echo -e "  Status:  ${YELLOW}systemctl status ${SERVICE_NAME}${NC}"
echo -e "  Restart: ${YELLOW}systemctl restart ${SERVICE_NAME}${NC}"
echo -e "  Update:  ${YELLOW}cd ${APP_DIR} && git pull && systemctl restart ${SERVICE_NAME}${NC}"
echo -e ""
echo -e "${RED}  WICHTIG: Passwort nach erstem Login ändern!${NC}\n"
