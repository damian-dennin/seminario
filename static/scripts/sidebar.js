// ============================================================
// sidebar.js — lógica compartida entre todas las páginas
// ============================================================

// ── Escape HTML (única definición canónica) ─────────────────
function escapeHtml(text) {
    return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', () => {
    // ── Sidebar toggle ───────────────────────────────────────
    const sidebar      = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    sidebarToggle?.addEventListener('click', () => {
        sidebar?.classList.toggle('sidebar-expanded');
        document.body.classList.toggle('sidebar-expanded');
    });

    // ── Panel de configuración (compartido) ──────────────────
    if (!document.getElementById('settings-panel')) {
        const settingsPanel = document.createElement('div');
        settingsPanel.id = 'settings-panel';
        settingsPanel.style.cssText = `
            display: none; position: fixed; inset: 0;
            background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
            z-index: 9999; align-items: center; justify-content: center;
        `;
        settingsPanel.innerHTML = `
            <div style="
                background: linear-gradient(155deg, rgba(58,20,80,0.98), rgba(35,5,58,0.98));
                border: 1px solid rgba(194,123,255,0.22); border-radius: 22px;
                padding: 28px 28px 22px; min-width: 260px; max-width: 320px; width: 90%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5); text-align: center; color: #f3e8ff;">
                <h3 style="margin-bottom:22px;font-size:1.1rem;font-weight:700;letter-spacing:0.02em;">Configuración</h3>
                <button id="settings-logout-btn" style="
                    width:100%; padding:12px; margin-bottom:12px;
                    background:rgba(200,60,70,0.18); color:#ffb3ba;
                    border:1px solid rgba(220,80,90,0.4);
                    border-radius:12px; cursor:pointer; font-size:0.95rem;
                    font-weight:600; font-family:inherit;">Cerrar sesión</button>
                <p style="font-size:0.78rem;color:rgba(244,232,255,0.42);margin-bottom:14px;">Más opciones — próximamente</p>
                <button id="settings-close-btn" style="
                    background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.14);
                    color:rgba(244,232,255,0.7); border-radius:10px;
                    padding:8px 20px; cursor:pointer; font-size:0.85rem;
                    width:100%; font-family:inherit;">Cancelar</button>
            </div>
        `;
        document.body.appendChild(settingsPanel);

        settingsPanel.addEventListener('click', (e) => {
            if (e.target === settingsPanel) settingsPanel.style.display = 'none';
        });
        document.getElementById('settings-close-btn')?.addEventListener('click', () => {
            settingsPanel.style.display = 'none';
        });
        document.getElementById('settings-logout-btn')?.addEventListener('click', async () => {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/';
        });
    }

    // ── Abrir panel al hacer click en ícono gear ─────────────
    document.querySelectorAll('.menu-icon.gear, .sidebar-link-ghost').forEach(btn => {
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', () => {
            const panel = document.getElementById('settings-panel');
            if (panel) panel.style.display = 'flex';
        });
    });
});
