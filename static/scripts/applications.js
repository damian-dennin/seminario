document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const sidebarTrigger = document.getElementById('sidebar-trigger');
    const toggle = document.getElementById('theme-toggle');
    const togglemo = document.getElementById('theme-togglemo');
    const applicationsGrid = document.getElementById('applications-grid');

    function syncThemeToggles(sourceToggle, targetToggle) {
        if (targetToggle) {
            targetToggle.checked = sourceToggle.checked;
        }
        document.body.classList.toggle('dark-mode', sourceToggle.checked);
    }

    toggle?.addEventListener('change', () => {
        syncThemeToggles(toggle, togglemo);
    });

    togglemo?.addEventListener('change', () => {
        syncThemeToggles(togglemo, toggle);
    });

    sidebarTrigger?.addEventListener('mouseenter', () => sidebar?.classList.add('active'));
    sidebar?.addEventListener('mouseleave', () => sidebar.classList.remove('active'));

    const settingsPanel = document.createElement('div');
    settingsPanel.id = 'settings-panel';
    settingsPanel.style.cssText = `
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.55);
        backdrop-filter: blur(4px);
        z-index: 9999;
        align-items: center;
        justify-content: center;
    `;
    settingsPanel.innerHTML = `
        <div style="
            background: linear-gradient(155deg, rgba(58,20,80,0.98), rgba(35,5,58,0.98));
            border: 1px solid rgba(194,123,255,0.22);
            border-radius: 22px;
            padding: 28px 28px 22px;
            min-width: 260px;
            max-width: 320px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            text-align: center;
            color: #f3e8ff;
        ">
            <h3 style="margin-bottom:22px;font-size:1.1rem;font-weight:700;letter-spacing:0.02em;">Configuración</h3>
            <button id="settings-logout-btn" style="
                width:100%; padding:12px; margin-bottom:12px;
                background: rgba(200,60,70,0.18);
                color: #ffb3ba;
                border: 1px solid rgba(220,80,90,0.4);
                border-radius:12px; cursor:pointer; font-size:0.95rem;
                font-weight:600; font-family:inherit;">
                Cerrar sesión
            </button>
            <p style="font-size:0.78rem;color:rgba(244,232,255,0.42);margin-bottom:14px;">Más opciones — próximamente</p>
            <button id="settings-close-btn" style="
                background: rgba(255,255,255,0.07);
                border: 1px solid rgba(255,255,255,0.14);
                color: rgba(244,232,255,0.7);
                border-radius:10px;
                padding: 8px 20px;
                cursor:pointer; font-size:0.85rem; width:100%; font-family:inherit;">
                Cancelar
            </button>
        </div>
    `;
    document.body.appendChild(settingsPanel);

    settingsPanel.addEventListener('click', (e) => {
        if (e.target === settingsPanel) settingsPanel.style.display = 'none';
    });

    document.querySelectorAll('.menu-icon.gear').forEach((button) => {
        button.style.cursor = 'pointer';
        button.addEventListener('click', () => {
            settingsPanel.style.display = 'flex';
        });
    });

    document.getElementById('settings-close-btn')?.addEventListener('click', () => {
        settingsPanel.style.display = 'none';
    });

    document.getElementById('settings-logout-btn')?.addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/';
    });

    function formatStatus(status) {
        const normalized = String(status || 'pending').toLowerCase();
        if (normalized === 'matched') {
            return { key: 'matched', label: 'Match' };
        }
        if (normalized === 'rejected') {
            return { key: 'rejected', label: 'Rechazada' };
        }
        return { key: 'pending', label: 'Pendiente' };
    }

    function formatDate(dateValue) {
        if (!dateValue) return '—';
        const parsed = new Date(dateValue);
        if (Number.isNaN(parsed.getTime())) return String(dateValue);
        return parsed.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    function escapeHtml(text) {
        return String(text ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function renderApplications(applications) {
        if (!applicationsGrid) return;

        if (!Array.isArray(applications) || applications.length === 0) {
            applicationsGrid.innerHTML = `
                <div class="applications-empty">
                    Todavía no hiciste postulaciones.<br>
                    Probá dar like a proyectos desde el feed.
                </div>
            `;
            return;
        }

        applicationsGrid.innerHTML = applications.map((application) => {
            const status = formatStatus(application.status);
            const creator = application.creator
                ? `${application.creator.firstName || ''} ${application.creator.lastName || ''}`.trim() || application.creator.username || '—'
                : '—';

            const chatAction = application.chat_available && application.match_id
                ? `<a class="application-chat-link" href="/chat?match=${application.match_id}" title="Ir al chat del proyecto">
                        <span class="menu-icon download"></span>
                   </a>`
                : `<button class="application-chat-link disabled" type="button" title="El chat se habilita cuando hay match" disabled>
                        <span class="menu-icon download"></span>
                   </button>`;

            return `
                <article class="application-card">
                    <div class="application-card-header">
                        <h2 class="application-card-title">${escapeHtml(application.project?.title || 'Proyecto')}</h2>
                        <span class="application-status ${status.key}">${status.label}</span>
                    </div>

                    <p class="application-description">${escapeHtml(application.project?.description || 'Sin descripción')}</p>

                    <div class="application-meta">
                        <div class="application-meta-item">
                            <span class="application-meta-label">Creador</span>
                            <span class="application-meta-value">${escapeHtml(creator)}</span>
                        </div>
                        <div class="application-meta-item">
                            <span class="application-meta-label">Fecha</span>
                            <span class="application-meta-value">${escapeHtml(formatDate(application.applied_at))}</span>
                        </div>
                    </div>

                    <div class="application-actions">
                        ${chatAction}
                    </div>
                </article>
            `;
        }).join('');
    }

    async function loadApplications() {
        try {
            const response = await fetch('/api/interests/mine');
            const applications = await response.json();

            if (!response.ok) {
                throw new Error(applications.error || 'No se pudieron cargar las postulaciones');
            }

            renderApplications(applications);
        } catch (error) {
            console.error('Error cargando postulaciones:', error);
            if (applicationsGrid) {
                applicationsGrid.innerHTML = `
                    <div class="applications-empty">
                        Error cargando postulaciones.<br>
                        Intenta recargar la página.
                    </div>
                `;
            }
        }
    }

    loadApplications();
});
