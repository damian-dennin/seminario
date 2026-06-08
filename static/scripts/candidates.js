document.addEventListener('DOMContentLoaded', () => {
    let candidates = [];
    let currentIndex = 0;
    let isDragging = false;
    let startX = 0, startY = 0, offsetX = 0, offsetY = 0;
    let expandedView = false;

    const card = document.getElementById('candidate-card');
    const expandedCard = document.getElementById('expanded-card');
    const closeExpanded = document.getElementById('close-expanded');
    const statusIndicators = document.getElementById('status-indicators');
    const likeIndicator = statusIndicators.querySelector('.like-indicator');
    const dislikeIndicator = statusIndicators.querySelector('.dislike-indicator');
    const ampliarIndicator = statusIndicators.querySelector('.ampliar-indicator');
    const swipeFeedback = document.getElementById('swipe-feedback');
    const sidebar = document.getElementById('sidebar');
    const sidebarTrigger = document.getElementById('sidebar-trigger');

    // Theme toggles
    const toggle = document.getElementById('theme-toggle');
    const togglemo = document.getElementById('theme-togglemo');
    toggle?.addEventListener('change', () => { togglemo.checked = toggle.checked; document.body.classList.toggle('dark-mode', toggle.checked); });
    togglemo?.addEventListener('change', () => { toggle.checked = togglemo.checked; document.body.classList.toggle('dark-mode', togglemo.checked); });

    const swipeFeedbackPalette = {
        right: { rgb: '76, 219, 139', x: '82%', y: '50%' },
        left: { rgb: '255, 99, 110', x: '18%', y: '50%' },
        up: { rgb: '84, 190, 255', x: '50%', y: '18%' }
    };

    function setSwipeFeedback(direction, strength = 0) {
        if (!swipeFeedback) return;
        const clampedStrength = Math.max(0, Math.min(1, strength));
        if (!direction || clampedStrength <= 0.01) {
            swipeFeedback.style.setProperty('--swipe-feedback-opacity', '0');
            return;
        }
        const palette = swipeFeedbackPalette[direction];
        if (!palette) return;
        swipeFeedback.style.setProperty('--swipe-feedback-rgb', palette.rgb);
        swipeFeedback.style.setProperty('--swipe-feedback-origin-x', palette.x);
        swipeFeedback.style.setProperty('--swipe-feedback-origin-y', palette.y);
        swipeFeedback.style.setProperty('--swipe-feedback-opacity', clampedStrength.toFixed(3));
    }

    function clearSwipeFeedback() {
        if (!swipeFeedback) return;
        swipeFeedback.style.setProperty('--swipe-feedback-opacity', '0');
    }

    function setPageChromeHidden(hidden) {
        document.body.classList.toggle('feed-chrome-hidden', hidden);
        if (hidden && sidebar?.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    }

    // Sidebar
    sidebarTrigger?.addEventListener('mouseenter', () => sidebar.classList.add('active'));
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

    async function loadCandidates() {
        const r = await fetch('/api/interests/candidates');
        candidates = await r.json();
        if (!Array.isArray(candidates) || candidates.length === 0) {
            showEmpty();
        } else {
            renderCandidate(currentIndex);
        }
    }

    function showEmpty() {
        document.querySelector('.card-container').innerHTML = `
            <div class="no-projects-message">
                <div class="no-projects-icon">👥</div>
                <h2>Sin candidatos por ahora</h2>
                <p>Cuando alguien muestre interés en tus proyectos, aparecerá aquí.</p>
            </div>`;
        statusIndicators.style.display = 'none';
    }

    function renderCandidate(index) {
        if (index >= candidates.length) {
            showEmpty();
            return;
        }
        const { user, project } = candidates[index];

        document.querySelector('.card-title').textContent = `${user.firstName} ${user.lastName}`;

        // Avatar con iniciales
        const initials = ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase();
        document.querySelectorAll('.user-card-image').forEach(av => {
            av.innerHTML = '';
            const span = document.createElement('span');
            span.className = 'avatar-initials';
            span.textContent = initials;
            av.appendChild(span);
        });

        const stats = document.querySelectorAll('.stats-text');
        if (stats.length >= 4) {
            stats[0].textContent = user.age || '—';
            stats[1].textContent = user.status || 'Disponible';
            stats[2].textContent = user.languages || '—';
            stats[3].textContent = user.specialization || '—';
        }

        document.querySelector('.card-description').textContent = user.bio || '';

        const techContainer = document.querySelector('.card-tech');
        techContainer.innerHTML = '';
        (user.skills || []).slice(0, 4).forEach(skill => {
            const d = document.createElement('div');
            d.className = 'tech-icon';
            d.textContent = skill.substring(0, 4);
            techContainer.appendChild(d);
        });

        document.querySelector('.candidate-project-tag').textContent = `Interesado en: ${project.title}`;

        // Vista expandida
        document.querySelector('.expanded-title').textContent = `${user.firstName} ${user.lastName}`;
        document.querySelector('.status-badge').textContent = user.status || 'Disponible';

        const statValues = document.querySelectorAll('.stat-value');
        if (statValues.length >= 3) {
            statValues[0].textContent = user.age || '—';
            statValues[1].textContent = user.languages || '—';
            statValues[2].textContent = user.specialization || '—';
        }

        document.getElementById('bio-content').textContent = user.bio || '';
        document.getElementById('project-interest').textContent = project.title;

        const skillsGrid = document.getElementById('skills-grid');
        skillsGrid.innerHTML = '';
        (user.skills || []).forEach(skill => {
            const item = document.createElement('div');
            item.className = 'tech-item';
            item.innerHTML = `<span class="tech-icon-expanded">${skill.substring(0,4)}</span><span class="tech-name">${skill}</span>`;
            skillsGrid.appendChild(item);
        });

        const contactList = document.getElementById('contact-list');
        contactList.innerHTML = '';
        const contacts = [];
        if (user.email) contacts.push(`Email: ${user.email}`);
        if (user.linkedin) contacts.push(`LinkedIn: ${user.linkedin}`);
        if (user.github) contacts.push(`GitHub: ${user.github}`);
        contacts.forEach(c => {
            const item = document.createElement('div');
            item.className = 'objective-item';
            item.innerHTML = `<span>${c}</span>`;
            contactList.appendChild(item);
        });
    }

    async function acceptCandidate() {
        const candidate = candidates[currentIndex];
        const r = await fetch('/api/matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interest_id: candidate.interest_id })
        });

        if (r.ok) {
            showToast(`¡Match con ${candidate.user.firstName}! 🎉 Abriendo chat...`);
            setTimeout(() => { window.location.href = '/chat'; }, 1500);
        } else {
            showToast('Error al generar el match');
            nextCandidate();
        }
    }

    async function rejectCandidate() {
        const candidate = candidates[currentIndex];
        await fetch(`/api/interests/${candidate.interest_id}/reject`, { method: 'POST' });
        nextCandidate();
    }

    function nextCandidate() {
        currentIndex++;
        card.style.transition = 'none';
        card.style.opacity = '0';
        card.style.transform = 'translate(0,0) rotate(0deg)';
        setTimeout(() => {
            renderCandidate(currentIndex);
            card.style.transition = 'opacity 0.3s ease';
            card.style.opacity = '1';
        }, 50);
    }

    function showToast(msg) {
        const t = document.createElement('div');
        t.textContent = msg;
        t.style.cssText = `position:fixed;bottom:30px;left:50%;transform:translateX(-50%);
            background:#667eea;color:white;padding:12px 24px;border-radius:24px;
            font-size:0.95rem;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.3);`;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2500);
    }

    // Botones en vista expandida
    document.getElementById('match-btn').addEventListener('click', () => { closeExpanded.click(); acceptCandidate(); });
    document.getElementById('reject-btn').addEventListener('click', () => { closeExpanded.click(); rejectCandidate(); });

    // Cerrar expandida
    closeExpanded.addEventListener('click', () => {
        expandedCard.classList.remove('visible');
        setTimeout(() => {
            expandedCard.classList.add('hidden');
            expandedView = false;
            setPageChromeHidden(false);
        }, 400);
    });

    // Swipe handlers
    card.addEventListener('mousedown', handleStart);
    card.addEventListener('touchstart', handleStart, { passive: false });
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    card.addEventListener('touchmove', handleMove, { passive: false });
    card.addEventListener('touchend', handleEnd);

    function handleStart(e) {
        if (candidates.length === 0) return;
        isDragging = true;
        setPageChromeHidden(true);
        card.style.transition = 'none';
        startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        offsetX = 0; offsetY = 0;
        clearSwipeFeedback();
        if (e.type === 'mousedown') e.preventDefault();
    }

    function handleMove(e) {
        if (!isDragging || expandedView) return;
        const cx = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const cy = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        if (e.type === 'touchmove') e.preventDefault();
        offsetX = cx - startX;
        offsetY = cy - startY;
        card.style.transform = `translate(${offsetX}px,${offsetY}px) rotate(${offsetX * 0.1}deg)`;
        statusIndicators.style.opacity = '1';
        likeIndicator.style.opacity = offsetX > 50 ? '1' : '0';
        dislikeIndicator.style.opacity = offsetX < -50 ? '1' : '0';
        ampliarIndicator.style.opacity = offsetY < -30 ? '1' : '0';

        if (offsetX > 12 && Math.abs(offsetX) >= Math.abs(offsetY) * 0.8) {
            setSwipeFeedback('right', Math.min(1, Math.abs(offsetX) / 180));
        } else if (offsetX < -12 && Math.abs(offsetX) >= Math.abs(offsetY) * 0.8) {
            setSwipeFeedback('left', Math.min(1, Math.abs(offsetX) / 180));
        } else if (offsetY < -12) {
            setSwipeFeedback('up', Math.min(1, Math.abs(offsetY) / 150));
        } else {
            clearSwipeFeedback();
        }
    }

    function handleEnd() {
        if (!isDragging) return;
        isDragging = false;
        card.style.transition = 'transform 0.5s ease';
        statusIndicators.style.opacity = '0';

        if (offsetX > 100) {
            setSwipeFeedback('right', 1);
            card.style.transform = `translate(${window.innerWidth}px,${offsetY}px) rotate(30deg)`;
            setTimeout(() => {
                setPageChromeHidden(false);
                acceptCandidate();
            }, 500);
        } else if (offsetX < -100) {
            setSwipeFeedback('left', 1);
            card.style.transform = `translate(-${window.innerWidth}px,${offsetY}px) rotate(-30deg)`;
            setTimeout(() => {
                setPageChromeHidden(false);
                rejectCandidate();
            }, 500);
        } else if (offsetY < -100) {
            setSwipeFeedback('up', 1);
            card.style.transform = `translateY(-${window.innerHeight}px)`;
            setTimeout(() => {
                expandedCard.classList.remove('hidden');
                requestAnimationFrame(() => expandedCard.classList.add('visible'));
                expandedView = true;
                card.style.transition = 'opacity 0.3s ease';
                card.style.opacity = '0';
                card.style.transform = 'translate(0,0)';
                clearSwipeFeedback();
                setTimeout(() => { card.style.opacity = '1'; }, 300);
            }, 500);
        } else {
            card.style.transform = 'translate(0,0) rotate(0deg)';
            clearSwipeFeedback();
            setTimeout(() => {
                if (!expandedView && !isDragging) {
                    setPageChromeHidden(false);
                }
            }, 220);
        }
    }

    loadCandidates();
});
