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
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--card-bg, #1e1e2e);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 16px;
        padding: 28px 32px;
        z-index: 9999;
        min-width: 260px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        text-align: center;
    `;
    settingsPanel.innerHTML = `
        <h3 style="margin-bottom:20px;font-size:1.1rem;">Configuración</h3>
        <button id="settings-logout-btn" style="
            width:100%; padding:10px; margin-bottom:10px;
            background: #e74c3c; color:white; border:none;
            border-radius:8px; cursor:pointer; font-size:0.95rem;">
            Cerrar sesión
        </button>
        <p style="font-size:0.8rem;opacity:0.5;margin-top:12px;">Más opciones — próximamente</p>
        <button id="settings-close-btn" style="
            margin-top:8px; background:transparent; border:none;
            color:inherit; opacity:0.6; cursor:pointer; font-size:0.85rem;">
            Cancelar
        </button>
    `;
    document.body.appendChild(settingsPanel);

    document.querySelectorAll('.menu-icon.gear').forEach((button) => {
        button.style.cursor = 'pointer';
        button.addEventListener('click', () => {
            settingsPanel.style.display = 'block';
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
