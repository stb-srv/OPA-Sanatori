# OPA-CMS – Lizenzserver Integration

Dieses Dokument beschreibt das JWT-Format und die API-Endpunkte, die der
Lizenzserver (`licens-prod.stb-srv.de`) implementieren muss, damit das
OPA-CMS die signierten Lizenzen korrekt validieren kann.

---

## Sicherheitsarchitektur

| Stufe | Maßnahme | Schutz gegen |
|-------|----------|-------------|
| 1 | RS256-signierte JWT-Tokens | DB-Manipulation, gefälschte Lizenzwerte |
| 2 | Domain-Binding im Token | Lizenz auf mehreren Servern nutzen |
| 3 | Periodischer Online-Check (24h) | Offline-Betrieb nach Kündigung |

---

## RSA-Schlüsselpaar

Der **Private Key** gehört ausschließlich auf den Lizenzserver und darf
nirmals im CMS-Repository landen.

Der **Public Key** ist hardcoded in `server/license.js` und kann
bedenkenlos im Open-Source-Code stehen (asymmetrische Kryptographie).

---

## JWT-Payload Format

Wenn der Lizenzserver ein Token ausstellt, muss das Payload folgende
Felder enthalten:

```json
{
  "key":      "OPA-XXXX-XXXX-XXXX",
  "type":     "PRO",
  "customer": "Muster Restaurant",
  "domain":   "meinrestaurant.de",
  "modules": {
    "menu_edit":       true,
    "orders_kitchen":  true,
    "reservations":    true,
    "custom_design":   true,
    "analytics":       false,
    "qr_pay":          false
  },
  "limits": {
    "max_dishes": 100,
    "max_tables": 25
  },
  "iat": 1712750000,
  "exp": 1744286000
}
```

**Token-Laufzeit:** Empfohlen 30-90 Tage. Das CMS erneuert den Token alle
24h automatisch.

**Signierung:**
```js
const jwt = require('jsonwebtoken');
const PRIVATE_KEY = fs.readFileSync('./keys/opa_private.pem');

const token = jwt.sign(payload, PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: '60d'
});
```

---

## API-Endpunkte

### POST `/api/v1/validate`

Wird beim erstmaligen Aktivieren einer Lizenz im CMS aufgerufen.

**Request:**
```json
{ "license_key": "OPA-XXXX", "domain": "meinrestaurant.de" }
```

**Response (Erfolg):**
```json
{
  "status":      "active",
  "token":       "<RS256-signiertes JWT>",
  "type":        "PRO",
  "plan_label":  "Pro",
  "customer_name": "Muster Restaurant",
  "expires_at":  "2026-12-31T00:00:00.000Z",
  "allowed_modules": { ... },
  "limits": { "max_dishes": 100, "max_tables": 25 }
}
```

### POST `/api/v1/refresh`

Wird alle 24h vom LicenseChecker aufgerufen, um den Token zu erneuern.

**Request:**
```json
{ "license_key": "OPA-XXXX", "domain": "meinrestaurant.de" }
```

**Response (aktive Lizenz):**
```json
{ "status": "active", "token": "<neues RS256-signiertes JWT>" }
```

**Response (widerrufen):**
```json
{ "status": "revoked", "message": "Lizenz wurde gekündigt." }
```

---

## Graceful Degradation

Das CMS degradiert auf FREE-Features wenn:
- Der Lizenzserver 3x hintereinander nicht erreichbar ist
- Der Server `status: 'revoked'` zurückgibt
- Das JWT-Token eine ungültige Signatur hat oder abgelaufen ist

Sobald der Lizenzserver wieder erreichbar ist und ein gültiges Token
liefert, werden die Features automatisch wieder freigeschaltet.

---

## Private Key – Aufbewahrung

Den Private Key sicher verwahren:
```bash
# Empfehlung: in .env oder als Datei mit restriktiven Rechten
chmod 600 /etc/opa-licens/private.pem
```

Niemals in einem öffentlichen Repository committen.
