/**
 * OPA-CMS – Online-Bestellungen Einstellungen
 */

const escHtml = (s) => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function initOrderSettings(container, api, license) {
    const hasModule = license && license.modules && license.modules.online_orders;

    if (!hasModule) {
        container.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center;
                    padding:80px 40px; text-align:center;">
            <div style="font-size:3.5rem; margin-bottom:20px;">🔒</div>
            <h2 style="font-size:1.4rem; font-weight:800; margin-bottom:12px; color:var(--primary);">Online-Bestellungen</h2>
            <p style="max-width:400px; color:var(--text-muted); line-height:1.7; margin-bottom:8px;">
                Die Übermittlung von Bestellungen ist ab dem <strong>Pro+</strong>-Plan verfügbar.
            </p>
            <p style="max-width:400px; color:var(--text-muted); font-size:.85rem; line-height:1.6;
                      background:rgba(200,169,110,.08); border:1px solid rgba(200,169,110,.2);
                      border-radius:12px; padding:14px 20px; margin-bottom:28px;">
                <strong>Warenkorb (Planungsansicht)</strong> ist bei allen Plänen aktiv –
                Gäste können ihren Besuch bereits vorab planen.
            </p>
            <button class="btn-premium" onclick="window.dispatchEvent(new CustomEvent('open-license'))">
                <i class="fas fa-arrow-up"></i> Plan upgraden
            </button>
        </div>`;
        return;
    }

    let settings = {};
    try {
        settings = await api.get('settings') || {};
    } catch (e) {
        console.warn('settings konnte nicht geladen werden', e.message);
    }
    const orderConfig = settings.orderConfig || {};

    const checked = (key, def = false) =>
        orderConfig[key] === true ? 'checked' : (orderConfig[key] === false ? '' : (def ? 'checked' : ''));
    const intVal  = (key, def) =>
        (orderConfig[key] !== undefined && !isNaN(parseInt(orderConfig[key], 10)))
            ? parseInt(orderConfig[key], 10) : def;

    container.innerHTML = `
    <div style="max-width:720px;">

        <div style="margin-bottom:28px;">
            <h2 style="font-size:1.3rem; font-weight:800; color:var(--primary); margin-bottom:6px;">
                <i class="fas fa-shopping-bag" style="margin-right:10px; color:var(--accent);"></i>
                Online-Bestellungen
            </h2>
            <p style="font-size:.85rem; color:var(--text-muted); line-height:1.6;">
                Steuere ob Gäste Bestellungen digital übermitteln können.
            </p>
        </div>

        <!-- Globaler Schalter -->
        <div class="glass-panel" style="padding:24px 28px; margin-bottom:16px;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:20px;">
                <div style="display:flex; align-items:center; gap:16px;">
                    <div style="width:44px; height:44px; border-radius:12px;
                                background:rgba(200,169,110,.12); display:flex;
                                align-items:center; justify-content:center; font-size:1.4rem;">🛒</div>
                    <div>
                        <div style="font-weight:700; font-size:.95rem;">Bestellsystem aktiv</div>
                        <div style="font-size:.78rem; color:var(--text-muted); margin-top:2px;">
                            Globaler Schalter – deaktiviert alle Bestellmodi gleichzeitig
                        </div>
                    </div>
                </div>
                <label class="switch">
                    <input type="checkbox" id="os-ordersEnabled" ${checked('ordersEnabled')}>
                    <span class="slider"></span>
                </label>
            </div>
        </div>

        <!-- Bestellmodi -->
        <div class="glass-panel" style="padding:24px 28px; margin-bottom:16px;" id="os-modes">
            <div style="font-size:.7rem; font-weight:700; text-transform:uppercase;
                        letter-spacing:1.5px; color:var(--text-muted); margin-bottom:16px;">Aktive Bestellmodi</div>

            <div style="display:flex; align-items:center; justify-content:space-between;
                        padding:16px 0; border-bottom:1px solid rgba(0,0,0,.05);">
                <div style="display:flex; align-items:center; gap:14px;">
                    <div style="width:38px; height:38px; border-radius:10px; background:rgba(27,58,92,.07);
                                display:flex; align-items:center; justify-content:center; font-size:1.1rem;">🍽️</div>
                    <div>
                        <div style="font-weight:700; font-size:.88rem;">Am Tisch</div>
                        <div style="font-size:.75rem; color:var(--text-muted); margin-top:1px;">Gast bestellt während des Besuchs per Tischnummer</div>
                    </div>
                </div>
                <label class="switch"><input type="checkbox" id="os-dineInEnabled" ${checked('dineInEnabled', true)}><span class="slider"></span></label>
            </div>

            <div style="display:flex; align-items:center; justify-content:space-between;
                        padding:16px 0; border-bottom:1px solid rgba(0,0,0,.05);">
                <div style="display:flex; align-items:center; gap:14px;">
                    <div style="width:38px; height:38px; border-radius:10px; background:rgba(27,58,92,.07);
                                display:flex; align-items:center; justify-content:center; font-size:1.1rem;">🚗</div>
                    <div>
                        <div style="font-weight:700; font-size:.88rem;">Abholung</div>
                        <div style="font-size:.75rem; color:var(--text-muted); margin-top:1px;">Gast bestellt vorab und holt selbst ab</div>
                    </div>
                </div>
                <label class="switch"><input type="checkbox" id="os-pickupEnabled" ${checked('pickupEnabled', true)}><span class="slider"></span></label>
            </div>

            <div style="display:flex; align-items:center; justify-content:space-between; padding:16px 0;">
                <div style="display:flex; align-items:center; gap:14px;">
                    <div style="width:38px; height:38px; border-radius:10px; background:rgba(27,58,92,.07);
                                display:flex; align-items:center; justify-content:center; font-size:1.1rem;">🚚</div>
                    <div>
                        <div style="font-weight:700; font-size:.88rem;">Lieferung</div>
                        <div style="font-size:.75rem; color:var(--text-muted); margin-top:1px;">Gast erhält die Bestellung an die angegebene Adresse</div>
                    </div>
                </div>
                <label class="switch"><input type="checkbox" id="os-deliveryEnabled" ${checked('deliveryEnabled')}><span class="slider"></span></label>
            </div>
        </div>

        <!-- Zeitfenster -->
        <div class="glass-panel" style="padding:24px 28px; margin-bottom:16px;">
            <div style="font-size:.7rem; font-weight:700; text-transform:uppercase;
                        letter-spacing:1.5px; color:var(--text-muted); margin-bottom:16px;">
                <i class="fas fa-clock" style="margin-right:6px;"></i> Zeitfenster
            </div>

            <!-- Bestellstopp -->
            <div style="display:flex; align-items:center; justify-content:space-between;
                        gap:20px; padding:12px 0; border-bottom:1px solid rgba(0,0,0,.05);">
                <div>
                    <div style="font-weight:700; font-size:.88rem;">⏱️ Bestellstopp vor Ladenschluss</div>
                    <div style="font-size:.75rem; color:var(--text-muted); margin-top:2px;">
                        Keine neuen Bestellungen mehr X Minuten vor Schließzeit.
                        Gilt auch als maximale Abholzeit bei Abholungen.
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
                    <input type="number" id="os-cutoffMinutes"
                           value="${intVal('orderCutoffMinutes', 30)}"
                           min="0" max="120" step="5"
                           style="width:70px; padding:8px 10px; border-radius:8px;
                                  border:1px solid rgba(0,0,0,.15); background:var(--bg,#fff);
                                  font-size:.9rem; font-weight:700; text-align:center; color:var(--text,#1b3a5c);">
                    <span style="font-size:.82rem; color:var(--text-muted);">Min.</span>
                </div>
            </div>

            <!-- Mindest-Vorlaufzeit -->
            <div style="display:flex; align-items:center; justify-content:space-between;
                        gap:20px; padding:12px 0; border-bottom:1px solid rgba(0,0,0,.05);">
                <div>
                    <div style="font-weight:700; font-size:.88rem;">🚗 Mindest-Vorlaufzeit Abholung</div>
                    <div style="font-size:.75rem; color:var(--text-muted); margin-top:2px;">
                        Abholzeit muss mindestens X Minuten in der Zukunft liegen.
                        Bei 0 ist sofortige Abholung möglich.
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
                    <input type="number" id="os-leadMinutes"
                           value="${intVal('pickupLeadMinutes', 5)}"
                           min="0" max="60" step="5"
                           style="width:70px; padding:8px 10px; border-radius:8px;
                                  border:1px solid rgba(0,0,0,.15); background:var(--bg,#fff);
                                  font-size:.9rem; font-weight:700; text-align:center; color:var(--text,#1b3a5c);">
                    <span style="font-size:.82rem; color:var(--text-muted);">Min.</span>
                </div>
            </div>

            <!-- NEU: Slot-System Einstellungen -->
            <div style="padding:16px 0; border-bottom:1px solid rgba(0,0,0,.05);">
                <div style="font-weight:700; font-size:.88rem; margin-bottom:12px;">📅 Zeitauswahl-Modus</div>
                <select id="os-timeSlotMode" class="form-input" style="margin-bottom:12px;">
                    <option value="slots" ${orderConfig.timeSlotMode === 'slots' ? 'selected' : ''}>Zeitslots (empfohlen)</option>
                    <option value="free" ${orderConfig.timeSlotMode === 'free' ? 'selected' : ''}>Freie Eingabe (alt)</option>
                </select>
            </div>

            <div id="os-slot-settings" style="${orderConfig.timeSlotMode === 'free' ? 'display:none;' : ''}">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:20px; padding:12px 0; border-bottom:1px solid rgba(0,0,0,.05);">
                    <div>
                        <div style="font-weight:700; font-size:.88rem;">⏱️ Vorlaufzeit (Slots)</div>
                        <div style="font-size:.75rem; color:var(--text-muted); margin-top:2px;">Erster verfügbarer Slot ab "jetzt + X Min"</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
                        <input type="number" id="os-timeSlotLead" value="${intVal('timeSlotLead', 20)}" style="width:70px;" class="form-input">
                        <span style="font-size:.82rem; color:var(--text-muted);">Min.</span>
                    </div>
                </div>

                <div style="display:flex; align-items:center; justify-content:space-between; gap:20px; padding:12px 0; border-bottom:1px solid rgba(0,0,0,.05);">
                    <div>
                        <div style="font-weight:700; font-size:.88rem;">📏 Slot-Abstand</div>
                        <div style="font-size:.75rem; color:var(--text-muted); margin-top:2px;">Intervall zwischen den Uhrzeiten</div>
                    </div>
                    <select id="os-timeSlotStep" class="form-input" style="width:100px;">
                        <option value="10" ${intVal('timeSlotStep', 15) === 10 ? 'selected' : ''}>10 Min</option>
                        <option value="15" ${intVal('timeSlotStep', 15) === 15 ? 'selected' : ''}>15 Min</option>
                        <option value="20" ${intVal('timeSlotStep', 15) === 20 ? 'selected' : ''}>20 Min</option>
                        <option value="30" ${intVal('timeSlotStep', 15) === 30 ? 'selected' : ''}>30 Min</option>
                    </select>
                </div>

                <div style="display:flex; align-items:center; justify-content:space-between; gap:20px; padding:12px 0; border-bottom:1px solid rgba(0,0,0,.05);">
                    <div>
                        <div style="font-weight:700; font-size:.88rem;">🌅 Öffnet um / 🌌 Letzte Bestellung</div>
                        <div style="font-size:.75rem; color:var(--text-muted); margin-top:2px;">Zeitbereich für die Slot-Generierung</div>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <input type="time" id="os-openTime" value="${orderConfig.openTime || '11:00'}" class="form-input" style="width:100px;">
                        <input type="time" id="os-closeTime" value="${orderConfig.closeTime || '22:00'}" class="form-input" style="width:100px;">
                    </div>
                </div>

                <div style="display:flex; align-items:center; justify-content:space-between; gap:20px; padding:12px 0; border-bottom:1px solid rgba(0,0,0,.05);">
                    <div>
                        <div style="font-weight:700; font-size:.88rem;">⚡ "Sofort"-Option aktiv</div>
                        <div style="font-size:.75rem; color:var(--text-muted); margin-top:2px;">Ermöglicht Bestellung ohne fixen Zeitslot</div>
                    </div>
                    <label class="switch"><input type="checkbox" id="os-sofortEnabled" ${checked('sofortEnabled', true)}><span class="slider"></span></label>
                </div>

                <div style="padding:12px 0;">
                    <div style="font-weight:700; font-size:.88rem; margin-bottom:8px;">📝 Sofort-Label Text</div>
                    <input type="text" id="os-sofortLabel" value="${escHtml(orderConfig.sofortLabel || 'So schnell wie möglich (ca. {min} Min.)')}" class="form-input" placeholder="Platzhalter {min} möglich">
                </div>
            </div>
        </div>

        <!-- Info -->
        <div style="display:flex; align-items:flex-start; gap:12px;
                    background:rgba(200,169,110,.08); border:1px solid rgba(200,169,110,.2);
                    border-radius:12px; padding:14px 18px; margin-bottom:24px;
                    font-size:.82rem; color:var(--text-muted); line-height:1.6;">
            <i class="fas fa-info-circle" style="color:var(--accent); margin-top:2px; flex-shrink:0;"></i>
            <span>
                An Ruhetagen sowie außerhalb der Öffnungszeiten sind <strong>alle</strong> Bestellmodi
                automatisch gesperrt. Der Bestellstopp gilt zusätzlich:
                z.B. Schließzeit 22:00 + 30 Min. Stopp → keine Bestellungen mehr ab 21:30.
            </span>
        </div>

        <!-- E-Mail Templates für Bestellungen -->
        <div class="glass-panel" style="padding:28px; margin-top:24px; margin-bottom:24px;">
            <h3 style="margin-bottom:4px;">✉️ Bestellungs E-Mail Templates</h3>
            <p style="color:var(--text-muted); font-size:.82rem; margin-bottom:20px;">
                Verfügbare Platzhalter: <code>{{customerName}}</code> <code>{{restaurantName}}</code>
                <code>{{estimatedTime}}</code> <code>{{total}}</code> <code>{{statusUrl}}</code>
            </p>

            ${['tpl_order_confirmed', 'tpl_order_cancelled', 'tpl_order_ready'].map(key => {
                const labels = {
                    tpl_order_confirmed: { icon: '✅', title: 'Bestätigung' },
                    tpl_order_cancelled: { icon: '❌', title: 'Ablehnung' },
                    tpl_order_ready:     { icon: '🎉', title: 'Abholbereit' },
                };
                const l = labels[key];
                const val = (settings.emailTemplates || {})[key] || {};
                return `
                <div style="margin-bottom:24px; padding-bottom:24px; border-bottom:1px solid rgba(0,0,0,.07);">
                    <h4 style="margin-bottom:12px;">${l.icon} ${l.title}</h4>
                    <label class="form-label">Betreff
                        <input class="form-input" type="text" id="et-${key}-subject"
                            value="${escHtml(val.subject || '')}"
                            placeholder="Standard-Betreff wird verwendet wenn leer">
                    </label>
                    <label class="form-label" style="margin-top:10px;">E-Mail Text (HTML erlaubt)
                        <textarea class="form-input" id="et-${key}-body" rows="5"
                            placeholder="Standard-Template wird verwendet wenn leer"
                            style="font-family:monospace; font-size:.82rem;">${escHtml(val.body || '')}</textarea>
                    </label>
                    <button class="btn-small btn-secondary" onclick="previewOrderEmail('${key}')" style="margin-top:8px; margin-right:8px;">
                        👁 Vorschau
                    </button>
                </div>`;
            }).join('')}

            <button class="btn-primary" id="save-order-email-tpl">💾 Templates speichern</button>
        </div>

        <div style="display:flex; align-items:center; gap:16px;">
            <button class="btn-primary" id="os-save"><i class="fas fa-save"></i> Einstellungen speichern</button>
            <span id="os-feedback" style="font-size:.82rem; font-weight:600;"></span>
        </div>

    </div>`;

    const globalToggle = container.querySelector('#os-ordersEnabled');
    const modesSection = container.querySelector('#os-modes');
    const updateModesState = () => {
        modesSection.style.opacity       = globalToggle.checked ? '1'   : '0.45';
        modesSection.style.pointerEvents = globalToggle.checked ? ''    : 'none';
    };
    globalToggle.addEventListener('change', updateModesState);
    updateModesState();

    const timeSlotModeSelect = container.querySelector('#os-timeSlotMode');
    const slotSettingsBox = container.querySelector('#os-slot-settings');
    timeSlotModeSelect.addEventListener('change', () => {
        slotSettingsBox.style.display = timeSlotModeSelect.value === 'slots' ? 'block' : 'none';
    });

    container.querySelector('#os-save').addEventListener('click', async () => {
        const feedback   = container.querySelector('#os-feedback');
        const cutoffRaw  = parseInt(container.querySelector('#os-cutoffMinutes').value, 10);
        const leadRaw    = parseInt(container.querySelector('#os-leadMinutes').value, 10);
        const newConfig  = {
            ordersEnabled:       container.querySelector('#os-ordersEnabled').checked,
            dineInEnabled:       container.querySelector('#os-dineInEnabled').checked,
            pickupEnabled:       container.querySelector('#os-pickupEnabled').checked,
            deliveryEnabled:     container.querySelector('#os-deliveryEnabled').checked,
            orderCutoffMinutes:  isNaN(cutoffRaw) ? 30 : Math.max(0, Math.min(120, cutoffRaw)),
            pickupLeadMinutes:   isNaN(leadRaw)   ?  5 : Math.max(0, Math.min(60,  leadRaw)),

            // New Slot Fields
            timeSlotMode:    container.querySelector('#os-timeSlotMode').value,
            timeSlotLead:    parseInt(container.querySelector('#os-timeSlotLead').value, 10) || 0,
            timeSlotStep:    parseInt(container.querySelector('#os-timeSlotStep').value, 10) || 15,
            openTime:       container.querySelector('#os-openTime').value,
            closeTime:      container.querySelector('#os-closeTime').value,
            sofortEnabled:   container.querySelector('#os-sofortEnabled').checked,
            sofortLabel:    container.querySelector('#os-sofortLabel').value
        };
        try {
            await api.post('settings', { orderConfig: newConfig });
            feedback.textContent = '✅ Gespeichert';
            feedback.style.color = '#22c55e';
        } catch (e) {
            feedback.textContent = '❌ ' + (e.message || 'Fehler beim Speichern');
            feedback.style.color = '#ef4444';
        }
        setTimeout(() => { feedback.textContent = ''; }, 3000);
    });

    // Email Template Logic
    container.querySelector('#save-order-email-tpl').addEventListener('click', async () => {
        const templates = settings.emailTemplates || {};
        for (const key of ['tpl_order_confirmed', 'tpl_order_cancelled', 'tpl_order_ready']) {
            templates[key] = {
                subject: container.querySelector(`#et-${key}-subject`)?.value.trim() || '',
                body:    container.querySelector(`#et-${key}-body`)?.value.trim() || '',
            };
        }
        settings.emailTemplates = templates;
        try {
            await api.post('settings', { emailTemplates: templates });
            if (window.showToast) showToast('✅ E-Mail Templates gespeichert.');
            else alert('✅ E-Mail Templates gespeichert.');
        } catch (e) {
            alert('❌ Fehler: ' + e.message);
        }
    });

    window.previewOrderEmail = (key) => {
        const body = container.querySelector(`#et-${key}-body`)?.value || '(Standard-Template)';
        const win = window.open('', '_blank');
        win.document.write(`<html><body style="font-family:sans-serif;padding:20px;">${body}</body></html>`);
        win.document.close();
    };
}
