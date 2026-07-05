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

    // Settings panel y escapeHtml provistos por sidebar.js

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
