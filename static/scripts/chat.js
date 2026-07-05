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

    // Settings panel provistos por sidebar.js

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
        // Limpiar canal Realtime anterior
        if (realtimeChannel && supabase) {
            supabase.removeChannel(realtimeChannel);
            realtimeChannel = null;
        }
        // Limpiar polling de respaldo si estaba activo
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
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
                    placeholder="Escribí un mensaje..." maxlength="2000">
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

        // Limpiar DESPUÉS de capturar el contenido — si falla, lo restauramos
        input.disabled = true;

        try {
            const r = await fetch(`/api/chat/${currentMatchId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            if (r.ok) {
                input.value = '';
                const msg = await r.json();
                appendMessage(msg, 'Yo');
            } else {
                // Restaurar texto para que el usuario pueda reintentar
                input.value = content;
                const err = await r.json().catch(() => ({}));
                const errorMsg = err.error || `Error ${r.status} — intentá de nuevo`;
                appendSystemMessage(errorMsg);
            }
        } catch (e) {
            // Error de red — restaurar texto
            input.value = content;
            appendSystemMessage('Sin conexión — revisá tu red e intentá de nuevo');
            console.error('Error enviando mensaje:', e);
        } finally {
            input.disabled = false;
            input.focus();
        }
    }

    function appendSystemMessage(text) {
        const container = document.getElementById('messages-container');
        if (!container) return;
        const div = document.createElement('div');
        div.style.cssText = `
            text-align:center; font-size:0.78rem; color:rgba(255,180,180,0.75);
            padding:4px 0 8px; font-style:italic;
        `;
        div.textContent = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    init();
});
