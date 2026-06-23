document.addEventListener('DOMContentLoaded', async () => {
    let currentMatchId  = null;
    let currentUserId   = null;
    let currentMatch    = null;
    let realtimeChannel = null;
    let renderedIds     = new Set();   // IDs de mensajes ya renderizados (evita duplicados)

    const requestedMatchId = new URLSearchParams(window.location.search).get('match');
    const sidebar       = document.getElementById('sidebar');
    const sidebarTrigger = document.getElementById('sidebar-trigger');
    const toggle        = document.getElementById('theme-toggle');
    const togglemo      = document.getElementById('theme-togglemo');

    // ── Tema ──────────────────────────────────────────────────
    function syncThemeToggles(src, dst) {
        if (dst) dst.checked = src.checked;
        document.body.classList.toggle('dark-mode', src.checked);
    }
    toggle?.addEventListener('change',   () => syncThemeToggles(toggle, togglemo));
    togglemo?.addEventListener('change', () => syncThemeToggles(togglemo, toggle));

    // ── Sidebar ───────────────────────────────────────────────
    sidebarTrigger?.addEventListener('mouseenter', () => sidebar?.classList.add('active'));
    sidebar?.addEventListener('mouseleave', () => sidebar?.classList.remove('active'));

    // ── Panel de configuración ────────────────────────────────
    const settingsPanel = document.createElement('div');
    settingsPanel.id = 'settings-panel';
    settingsPanel.style.cssText = `
        display:none; position:fixed; inset:0;
        background:rgba(0,0,0,0.55);
        backdrop-filter:blur(4px);
        z-index:9999;
        align-items:center;
        justify-content:center;
    `;
    settingsPanel.innerHTML = `
        <div style="
            background: linear-gradient(155deg, rgba(58,20,80,0.98), rgba(35,5,58,0.98));
            border: 1px solid rgba(194,123,255,0.22);
            border-radius: 22px;
            padding: 28px 28px 22px;
            min-width: 260px; max-width: 320px; width: 90%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            text-align: center; color: #f3e8ff;">
            <h3 style="margin-bottom:22px;font-size:1.1rem;font-weight:700;letter-spacing:0.02em;">Configuración</h3>
            <button id="settings-logout-btn" style="
                width:100%; padding:12px; margin-bottom:12px;
                background:rgba(200,60,70,0.18); color:#ffb3ba;
                border:1px solid rgba(220,80,90,0.4);
                border-radius:12px; cursor:pointer; font-size:0.95rem;
                font-weight:600; font-family:inherit;">Cerrar sesión</button>
            <p style="font-size:0.78rem;color:rgba(244,232,255,0.42);margin-bottom:14px;">Más opciones — próximamente</p>
            <button id="settings-close-btn" style="
                background:rgba(255,255,255,0.07);
                border:1px solid rgba(255,255,255,0.14);
                color:rgba(244,232,255,0.7); border-radius:10px;
                padding:8px 20px; cursor:pointer; font-size:0.85rem;
                width:100%; font-family:inherit;">Cancelar</button>
        </div>
    `;
    document.body.appendChild(settingsPanel);
    settingsPanel.addEventListener('click', (e) => {
        if (e.target === settingsPanel) settingsPanel.style.display = 'none';
    });
    document.querySelectorAll('.menu-icon.gear').forEach(btn => {
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', () => { settingsPanel.style.display = 'flex'; });
    });
    document.getElementById('settings-close-btn')?.addEventListener('click', () => {
        settingsPanel.style.display = 'none';
    });
    document.getElementById('settings-logout-btn')?.addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/';
    });

    // ── Supabase Realtime ─────────────────────────────────────
    let supabase = null;
    try {
        const configRes = await fetch('/api/config');
        if (configRes.ok) {
            const config = await configRes.json();
            currentUserId = config.currentUserId;
            if (window.supabase?.createClient) {
                supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);
            }
        }
    } catch (e) {
        console.warn('No se pudo inicializar Supabase Realtime:', e);
    }

    // ── Init: cargar matches ──────────────────────────────────
    async function init() {
        try {
            // Si ya tenemos currentUserId de /api/config, evitamos un fetch extra
            const matchesRes = await fetch('/api/matches');
            const matches = await matchesRes.json();

            if (!currentUserId) {
                // fallback si /api/config falló
                const profileRes = await fetch('/api/user/profile');
                const profile = await profileRes.json();
                currentUserId = profile.id;
            }

            renderMatches(matches);
        } catch (e) {
            console.error('Error iniciando chat:', e);
            document.getElementById('matches-container').innerHTML =
                '<div class="no-matches">Error cargando matches.</div>';
        }
    }

    function renderMatches(matches) {
        const container = document.getElementById('matches-container');
        if (!Array.isArray(matches) || matches.length === 0) {
            container.innerHTML = '<div class="no-matches">Todavía no tenés matches.<br>¡Seguí swipeando!</div>';
            return;
        }

        container.innerHTML = '';
        let targetMatch = null;
        let targetItem  = null;

        matches.forEach((match, index) => {
            const item = document.createElement('div');
            item.className = 'match-item';
            item.dataset.matchId = match.match_id;

            const initials = `${match.other_user.firstName[0]}${match.other_user.lastName[0]}`.toUpperCase();
            item.innerHTML = `
                <div class="match-avatar">${escapeHtml(initials)}</div>
                <div class="match-info">
                    <div class="match-name">${escapeHtml(match.other_user.firstName)} ${escapeHtml(match.other_user.lastName)}</div>
                    <div class="match-project">${escapeHtml(match.project.title)}</div>
                </div>
            `;

            item.addEventListener('click', () => {
                document.querySelectorAll('.match-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                openChat(match);
            });

            container.appendChild(item);

            if (index === 0 && !targetMatch) {
                targetMatch = match;
                targetItem  = item;
            }
            if (requestedMatchId && String(match.match_id) === String(requestedMatchId)) {
                targetMatch = match;
                targetItem  = item;
            }
        });

        if (targetMatch && targetItem) {
            targetItem.classList.add('active');
            openChat(targetMatch);
        }
    }

    // ── Abrir chat ────────────────────────────────────────────
    function openChat(match) {
        // Desuscribir canal anterior
        if (realtimeChannel && supabase) {
            supabase.removeChannel(realtimeChannel);
            realtimeChannel = null;
        }

        currentMatchId = match.match_id;
        currentMatch   = match;
        renderedIds    = new Set();

        const chatArea = document.getElementById('chat-area');
        chatArea.innerHTML = `
            <div class="chat-header">
                <h3>${escapeHtml(match.other_user.firstName)} ${escapeHtml(match.other_user.lastName)}</h3>
                <p>${escapeHtml(match.project.title)}</p>
            </div>
            <div class="messages-container" id="messages-container"></div>
            <div class="chat-input-area">
                <input type="text" class="chat-input" id="chat-input"
                    placeholder="Escribí un mensaje..." maxlength="500">
                <button class="send-btn" id="send-btn">Enviar</button>
            </div>
        `;

        document.getElementById('send-btn').addEventListener('click', sendMessage);
        document.getElementById('chat-input').addEventListener('keydown', e => {
            if (e.key === 'Enter') sendMessage();
        });

        // Cargar historial y luego activar Realtime
        fetchMessages().then(() => {
            if (supabase) startRealtime(match.match_id);
        });
    }

    // ── Carga inicial de mensajes ─────────────────────────────
    async function fetchMessages() {
        if (!currentMatchId) return;
        try {
            const r = await fetch(`/api/chat/${currentMatchId}`);
            const messages = await r.json();
            if (!Array.isArray(messages)) return;

            const container = document.getElementById('messages-container');
            if (!container) return;

            messages.forEach(msg => {
                const senderName = msg.sender_name || 'Usuario';
                appendMessage(msg, senderName);
            });

            container.scrollTop = container.scrollHeight;
        } catch (e) {
            console.error('Error cargando mensajes:', e);
        }
    }

    // ── Indicador "Visto" en el último mensaje enviado ────────
    function markLastMessageSeen() {
        const container = document.getElementById('messages-container');
        if (!container) return;

        // Limpiar "visto" previos
        container.querySelectorAll('.msg-seen').forEach(el => el.remove());

        // Buscar el último mensaje enviado por el usuario
        const sentMessages = container.querySelectorAll('.message.sent');
        if (sentMessages.length === 0) return;

        const lastSent = sentMessages[sentMessages.length - 1];
        const seenEl = document.createElement('div');
        seenEl.className = 'msg-seen';
        seenEl.style.cssText = `
            font-size:0.72rem; color:#C27BFF; text-align:right;
            margin:-4px 0 6px; padding-right:4px; opacity:0.85;
        `;
        seenEl.textContent = '✓✓ Visto';
        lastSent.insertAdjacentElement('afterend', seenEl);
    }

    // ── Agregar un mensaje al DOM ─────────────────────────────
    function appendMessage(msg, senderName = 'Usuario') {
        if (!msg?.id) return;
        if (renderedIds.has(msg.id)) return;   // ya renderizado
        renderedIds.add(msg.id);

        const container = document.getElementById('messages-container');
        if (!container) return;

        const isSent = msg.sender_id === currentUserId;
        const wasAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 60;

        const time = msg.created_at
            ? new Date(msg.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
            : '';

        const div = document.createElement('div');
        div.className = `message ${isSent ? 'sent' : 'received'}`;
        div.dataset.msgId = msg.id;
        div.innerHTML = `
            ${!isSent ? `<div class="msg-sender">${escapeHtml(senderName)}</div>` : ''}
            <div>${escapeHtml(msg.content)}</div>
            <div class="msg-time">${time}</div>
        `;
        container.appendChild(div);

        if (wasAtBottom) container.scrollTop = container.scrollHeight;
    }

    // ── Supabase Realtime: escucha mensajes nuevos ────────────
    function startRealtime(matchId) {
        realtimeChannel = supabase
            .channel(`chat-${matchId}-${Date.now()}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    const msg = payload.new;

                    // Ignorar mensajes de otros chats
                    if (msg.match_id !== matchId) return;

                    // Mensajes propios: ya los mostramos al enviar
                    if (msg.sender_id === currentUserId) return;

                    // Mensaje del otro usuario: marcar "visto" y mostrar
                    markLastMessageSeen();

                    const senderName = currentMatch
                        ? `${currentMatch.other_user.firstName} ${currentMatch.other_user.lastName}`
                        : 'Usuario';

                    appendMessage(msg, senderName);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Realtime activo para chat ${matchId}`);
                }
                if (status === 'CHANNEL_ERROR') {
                    console.warn('Error en canal Realtime, usando polling de respaldo...');
                    startPollingFallback();
                }
            });
    }

    // ── Polling de respaldo si Realtime falla ─────────────────
    let pollingInterval = null;
    function startPollingFallback() {
        if (pollingInterval) return;
        pollingInterval = setInterval(async () => {
            if (!currentMatchId) return;
            try {
                const r = await fetch(`/api/chat/${currentMatchId}`);
                const messages = await r.json();
                if (!Array.isArray(messages)) return;
                messages.forEach(msg => {
                    const senderName = msg.sender_name || 'Usuario';
                    appendMessage(msg, senderName);
                });
            } catch { /* silencioso */ }
        }, 5000);
    }

    // ── Enviar mensaje ────────────────────────────────────────
    async function sendMessage() {
        const input = document.getElementById('chat-input');
        if (!input) return;
        const content = input.value.trim();
        if (!content || !currentMatchId) return;

        input.value = '';
        input.disabled = true;

        try {
            const r = await fetch(`/api/chat/${currentMatchId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            if (r.ok) {
                const msg = await r.json();
                // Mostrar inmediatamente sin esperar el evento Realtime
                appendMessage(msg, 'Yo');
            }
        } catch (e) {
            console.error('Error enviando mensaje:', e);
        } finally {
            input.disabled = false;
            input.focus();
        }
    }

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    init();
});
