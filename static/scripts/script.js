document.addEventListener('DOMContentLoaded', () => {
    const expandedCard = document.getElementById('expanded-card');
    const closeExpanded = document.getElementById('close-expanded');
    let expandedView = false;

    let card = document.getElementById('project-card');
    const statusIndicators = document.getElementById('status-indicators');
    const likeIndicator = statusIndicators?.querySelector('.like-indicator');
    const dislikeIndicator = statusIndicators?.querySelector('.dislike-indicator');
    const ampliarIndicator = statusIndicators?.querySelector('.ampliar-indicator');
    const swipeFeedback = document.getElementById('swipe-feedback');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    const createProjectBtn = document.getElementById('create-project-btn');
    const createProjectCard = document.getElementById('create-project-card');
    const closeCreate = document.getElementById('close-create');
    const cancelCreate = document.getElementById('cancel-create');
    const createForm = document.getElementById('create-form');
    const tutorialOverlay = document.getElementById('tutorial-overlay');
    const tutorialClose = document.getElementById('tutorial-close');
    const tutorialSkip = document.getElementById('tutorial-skip');
    const tutorialStart = document.getElementById('tutorial-start');
    const tutorialDemoStage = document.getElementById('tutorial-demo-stage');
    const tutorialDemoCard = document.getElementById('tutorial-demo-card');
    const tutorialDemoCaption = document.getElementById('tutorial-demo-caption');

    const projectImageInput = document.getElementById('project-image');
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const removeImageBtn = document.getElementById('remove-image');
    const imagePlaceholder = imagePreview?.querySelector('.image-placeholder');
    const tutorialDemoMessages = {
        idle: 'Desliza la card para probar los gestos.',
        left: 'Swipe left: pasas al siguiente proyecto.',
        right: 'Swipe right: haces match con el proyecto.',
        up: 'Swipe up: abres la ficha completa.'
    };

    let selectedImageFile = null;

    let startX = 0;
    let startY = 0;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let tutorialDemoDragging = false;
    let tutorialDemoAnimating = false;
    let tutorialDemoStartX = 0;
    let tutorialDemoStartY = 0;
    let tutorialDemoOffsetX = 0;
    let tutorialDemoOffsetY = 0;
    const swipeFeedbackPalette = {
        right: {
            rgb: '76, 219, 139',
            x: '82%',
            y: '50%'
        },
        left: {
            rgb: '255, 99, 110',
            x: '18%',
            y: '50%'
        },
        up: {
            rgb: '84, 190, 255',
            x: '50%',
            y: '18%'
        }
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

    function setFeedChromeHidden(hidden) {
        document.body.classList.toggle('feed-chrome-hidden', hidden);

        if (hidden && sidebar?.classList.contains('sidebar-expanded')) {
            sidebar.classList.remove('sidebar-expanded');
            document.body.classList.remove('sidebar-expanded');
        }
    }

    function resetStatusIndicators() {
        if (!statusIndicators || !likeIndicator || !dislikeIndicator || !ampliarIndicator) return;

        statusIndicators.style.opacity = '0';
        likeIndicator.style.opacity = '0';
        dislikeIndicator.style.opacity = '0';
        ampliarIndicator.style.opacity = '0';
    }

    function updateStatusIndicators(direction) {
        if (!statusIndicators || !likeIndicator || !dislikeIndicator || !ampliarIndicator) return;

        statusIndicators.style.opacity = direction ? '1' : '0';
        likeIndicator.style.opacity = direction === 'right' ? '1' : '0';
        dislikeIndicator.style.opacity = direction === 'left' ? '1' : '0';
        ampliarIndicator.style.opacity = direction === 'up' ? '1' : '0';
    }

    function getSwipeThresholds(cardElement = card) {
        const rect = cardElement?.getBoundingClientRect();
        const width = rect?.width || 320;
        const height = rect?.height || 480;

        return {
            horizontal: Math.max(88, Math.min(138, width * 0.26)),
            vertical: Math.max(88, Math.min(138, height * 0.2)),
            previewX: Math.max(24, Math.min(56, width * 0.14)),
            previewY: Math.max(24, Math.min(48, height * 0.1)),
            feedbackX: Math.max(120, Math.min(220, width * 0.42)),
            feedbackY: Math.max(120, Math.min(220, height * 0.34))
        };
    }

    function getSwipeDirection(deltaX, deltaY, thresholds = getSwipeThresholds()) {
        const mostlyHorizontal = Math.abs(deltaX) >= Math.abs(deltaY) * 0.8;

        if (mostlyHorizontal && deltaX > thresholds.previewX) return 'right';
        if (mostlyHorizontal && deltaX < -thresholds.previewX) return 'left';
        if (deltaY < -thresholds.previewY) return 'up';
        return '';
    }

    projectImageInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;

        selectedImageFile = file;
        const reader = new FileReader();

        reader.onload = (loadEvent) => {
            if (previewImg) {
                previewImg.src = loadEvent.target.result;
                previewImg.style.display = 'block';
            }
            if (removeImageBtn) {
                removeImageBtn.style.display = 'block';
            }
            if (imagePlaceholder) {
                imagePlaceholder.style.display = 'none';
            }
        };

        reader.readAsDataURL(file);
    });

    removeImageBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        selectedImageFile = null;
        if (projectImageInput) projectImageInput.value = '';
        if (previewImg) {
            previewImg.src = '';
            previewImg.style.display = 'none';
        }
        removeImageBtn.style.display = 'none';
        if (imagePlaceholder) {
            imagePlaceholder.style.display = 'flex';
        }
    });

    function closeCreateModal() {
        if (!createProjectCard) return;

        createProjectCard.classList.remove('visible');
        setTimeout(() => {
            createProjectCard.classList.add('hidden');
            createForm?.reset();
            selectedImageFile = null;

            if (projectImageInput) projectImageInput.value = '';
            if (previewImg) {
                previewImg.src = '';
                previewImg.style.display = 'none';
            }
            if (removeImageBtn) {
                removeImageBtn.style.display = 'none';
            }
            if (imagePlaceholder) {
                imagePlaceholder.style.display = 'flex';
            }
        }, 400);
    }

    closeCreate?.addEventListener('click', closeCreateModal);
    cancelCreate?.addEventListener('click', closeCreateModal);

    createProjectBtn?.addEventListener('click', () => {
        if (!createProjectCard) return;

        createProjectCard.classList.remove('hidden');
        setTimeout(() => {
            createProjectCard.classList.add('visible');
        }, 10);
    });

    createProjectCard?.addEventListener('click', (e) => {
        if (e.target === createProjectCard) {
            closeCreateModal();
        }
    });

    // ── Botones táctiles mobile (swipe actions) ───────────────
    function openExpandedCard() {
        if (expandedView || !expandedCard) return;
        expandedCard.classList.remove('hidden');
        setTimeout(() => expandedCard.classList.add('visible'), 10);
        expandedView = true;
    }

    document.getElementById('mobile-action-pass')?.addEventListener('click', () => triggerSwipe('left'));
    document.getElementById('mobile-action-like')?.addEventListener('click', () => triggerSwipe('right'));
    document.getElementById('mobile-action-info')?.addEventListener('click', openExpandedCard);
    document.getElementById('mobile-action-create')?.addEventListener('click', () => {
        if (!createProjectCard) return;
        createProjectCard.classList.remove('hidden');
        setTimeout(() => createProjectCard.classList.add('visible'), 10);
    });

    // Sube imagen de proyecto y retorna la URL pública, o '' si no hay imagen
    async function uploadProjectImage(file) {
        if (!file) return '';
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'project');
        try {
            const r = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await r.json();
            if (r.ok) return data.url;
            console.error('Error subiendo imagen del proyecto:', data.error);
            return '';
        } catch {
            console.error('Error de conexión al subir imagen del proyecto');
            return '';
        }
    }

    createForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const declCheck = document.getElementById('declaration-check');
        const declWarning = document.getElementById('declaration-warning');
        if (declCheck && !declCheck.checked) {
            if (declWarning) declWarning.style.display = 'block';
            document.getElementById('declaration-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        if (declWarning) declWarning.style.display = 'none';

        const submitBtn = createForm.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Creando...'; }

        const teamSizeRaw = document.getElementById('team-size').value;
        const teamParts = teamSizeRaw.split('/').map((value) => parseInt(value.trim(), 10) || 0);
        const teamCurrent = teamParts.length > 1 ? teamParts[0] : 1;
        const teamMax = teamParts.length > 1 ? teamParts[1] : teamParts[0];

        const technologiesRaw = document.getElementById('technologies').value;
        const technologies = technologiesRaw
            .split(',')
            .map((tech) => tech.trim())
            .filter(Boolean)
            .map((tech) => ({ name: tech, icon: tech.substring(0, 4) }));

        const skillsRaw = document.getElementById('skills').value;
        const skillsNeeded = skillsRaw
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean);

        const offeredValue = Array.from(
            document.querySelectorAll('#offered-value-chips input[type="checkbox"]:checked')
        ).map((input) => input.value);

        // Subir imagen si el usuario seleccionó una
        const imageUrl = await uploadProjectImage(selectedImageFile);

        const projectData = {
            title: document.getElementById('project-name').value,
            status: document.getElementById('project-status').value,
            description: document.getElementById('description').value,
            image_url: imageUrl,
            stats: {
                team_current: teamCurrent,
                team_max: teamMax,
                duration: document.getElementById('duration').value || 'Indefinido',
                language: document.getElementById('language').value,
                type: document.getElementById('project-type').value,
                org_type: document.getElementById('org-type')?.value || '',
                project_stage: document.getElementById('project-stage')?.value || '',
                collaboration_mode: document.getElementById('collaboration-mode')?.value || '',
                weekly_commitment_hours: document.getElementById('weekly-commitment')?.value || '',
                expected_contribution: document.getElementById('expected-contribution')?.value || '',
                offered_value: offeredValue,
                organizer_statement: document.getElementById('organizer-statement')?.value || ''
            },
            declared: document.getElementById('declaration-check')?.checked || false,
            technologies,
            skills_needed: skillsNeeded,
            objectives: [],
            progress: 0
        };

        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectData)
            });

            if (response.ok) {
                const newProject = await response.json();
                if (window.projectsManager) {
                    window.projectsManager.projects.push(newProject);
                }
                selectedImageFile = null;
                closeCreateModal();
                showMatchToast('¡Proyecto creado exitosamente! 🚀');
                return;
            }

            const errorData = await response.json();
            alert(`Error al crear el proyecto: ${errorData.error || 'Error desconocido'}`);
        } catch (error) {
            console.error('Error al crear proyecto:', error);
            alert('Error de conexión al crear el proyecto');
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Crear Proyecto'; }
        }
    });

    const toggle = document.getElementById('theme-toggle');
    const togglemo = document.getElementById('theme-togglemo');

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

    function setTutorialDemoState(state) {
        if (tutorialDemoStage) {
            tutorialDemoStage.dataset.state = state;
        }

        if (tutorialDemoCaption) {
            tutorialDemoCaption.textContent = tutorialDemoMessages[state] || tutorialDemoMessages.idle;
        }
    }

    function resetTutorialDemoCard() {
        if (!tutorialDemoCard) return;

        tutorialDemoCard.classList.remove('is-dragging');
        tutorialDemoCard.style.transition = '';
        tutorialDemoCard.style.transform = '';
        tutorialDemoCard.style.opacity = '';
        tutorialDemoOffsetX = 0;
        tutorialDemoOffsetY = 0;
        tutorialDemoDragging = false;
        tutorialDemoAnimating = false;
    }

    function showTutorial() {
        if (!tutorialOverlay) return;

        resetTutorialDemoCard();
        setTutorialDemoState('idle');
        tutorialOverlay.classList.add('visible');
        tutorialOverlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('tutorial-open');
    }

    function closeTutorial() {
        if (!tutorialOverlay) return;

        resetTutorialDemoCard();
        setTutorialDemoState('idle');
        tutorialOverlay.classList.remove('visible');
        tutorialOverlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('tutorial-open');
        localStorage.setItem('stackr_tutorial_seen', '1');
    }

    tutorialClose?.addEventListener('click', closeTutorial);
    tutorialSkip?.addEventListener('click', closeTutorial);
    tutorialStart?.addEventListener('click', closeTutorial);
    tutorialOverlay?.addEventListener('click', (e) => {
        if (e.target === tutorialOverlay) {
            closeTutorial();
        }
    });

    function getTutorialDemoDirection(deltaX, deltaY) {
        const cardWidth = tutorialDemoCard?.getBoundingClientRect().width || 260;
        const cardHeight = tutorialDemoCard?.getBoundingClientRect().height || 340;
        const horizontalThreshold = Math.max(48, Math.min(82, cardWidth * 0.22));
        const verticalThreshold = Math.max(48, Math.min(82, cardHeight * 0.18));

        if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > horizontalThreshold) return 'right';
        if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < -horizontalThreshold) return 'left';
        if (deltaY < -verticalThreshold) return 'up';
        return 'idle';
    }

    function playTutorialDemo(action) {
        if (!tutorialDemoCard || !tutorialDemoStage || tutorialDemoAnimating) return;

        tutorialDemoAnimating = true;
        setTutorialDemoState(action);
        tutorialDemoCard.classList.remove('is-dragging');
        tutorialDemoCard.style.transition = 'transform 320ms ease, opacity 320ms ease';

        const stageRect = tutorialDemoStage.getBoundingClientRect();
        const cardRect = tutorialDemoCard.getBoundingClientRect();
        const horizontalTravel = Math.max(84, Math.min(136, Math.min(stageRect.width * 0.18, cardRect.width * 0.42)));
        const verticalTravel = Math.max(84, Math.min(136, Math.min(stageRect.height * 0.2, cardRect.height * 0.34)));

        const finalTransforms = {
            left: `translate(-${horizontalTravel}px, 0px) rotate(-12deg)`,
            right: `translate(${horizontalTravel}px, 0px) rotate(12deg)`,
            up: `translate(0px, -${verticalTravel}px) rotate(0deg)`
        };

        requestAnimationFrame(() => {
            tutorialDemoCard.style.transform = finalTransforms[action];
            tutorialDemoCard.style.opacity = '0.58';
        });

        setTimeout(() => {
            tutorialDemoCard.style.transform = 'translate(0px, 0px) rotate(0deg)';
            tutorialDemoCard.style.opacity = '1';
        }, 360);

        setTimeout(() => {
            tutorialDemoCard.style.transition = '';
            tutorialDemoAnimating = false;
            setTutorialDemoState('idle');
        }, 760);
    }

    function handleTutorialDemoStart(e) {
        if (!tutorialDemoCard || tutorialDemoAnimating) return;

        tutorialDemoDragging = true;
        tutorialDemoStartX = e.clientX;
        tutorialDemoStartY = e.clientY;
        tutorialDemoOffsetX = 0;
        tutorialDemoOffsetY = 0;
        tutorialDemoCard.classList.add('is-dragging');
        tutorialDemoCard.setPointerCapture?.(e.pointerId);
        setTutorialDemoState('idle');
        e.preventDefault();
    }

    function handleTutorialDemoMove(e) {
        if (!tutorialDemoDragging || !tutorialDemoCard) return;

        const rawX = e.clientX - tutorialDemoStartX;
        const rawY = e.clientY - tutorialDemoStartY;
        const cardRect = tutorialDemoCard.getBoundingClientRect();
        const limitX = Math.max(92, Math.min(150, cardRect.width * 0.44));
        const limitUp = Math.max(92, Math.min(150, cardRect.height * 0.38));
        const limitDown = Math.max(34, Math.min(56, cardRect.height * 0.14));

        tutorialDemoOffsetX = Math.max(-limitX, Math.min(limitX, rawX));
        tutorialDemoOffsetY = Math.max(-limitUp, Math.min(limitDown, rawY));

        const rotate = tutorialDemoOffsetX * 0.08;
        tutorialDemoCard.style.transform = `translate(${tutorialDemoOffsetX}px, ${tutorialDemoOffsetY}px) rotate(${rotate}deg)`;
        setTutorialDemoState(getTutorialDemoDirection(tutorialDemoOffsetX, tutorialDemoOffsetY));
    }

    function handleTutorialDemoEnd(e) {
        if (!tutorialDemoDragging) return;

        tutorialDemoCard?.releasePointerCapture?.(e.pointerId);
        const action = getTutorialDemoDirection(tutorialDemoOffsetX, tutorialDemoOffsetY);
        tutorialDemoDragging = false;

        if (action === 'idle') {
            resetTutorialDemoCard();
            setTutorialDemoState('idle');
            return;
        }

        playTutorialDemo(action);
    }

    tutorialDemoCard?.addEventListener('pointerdown', handleTutorialDemoStart);
    tutorialDemoCard?.addEventListener('pointermove', handleTutorialDemoMove);
    tutorialDemoCard?.addEventListener('pointerup', handleTutorialDemoEnd);
    tutorialDemoCard?.addEventListener('pointercancel', handleTutorialDemoEnd);

    if (!localStorage.getItem('stackr_tutorial_seen')) {
        showTutorial();
    }

    function setupSwipeHandlers(cardElement) {
        if (!cardElement) return;

        cardElement.removeEventListener('touchstart', handleStart);
        cardElement.removeEventListener('touchmove', handleMove);
        cardElement.removeEventListener('touchend', handleEnd);
        cardElement.removeEventListener('touchcancel', handleEnd);
        cardElement.removeEventListener('mousedown', handleStart);

        cardElement.addEventListener('touchstart', handleStart, { passive: false });
        cardElement.addEventListener('touchmove', handleMove, { passive: false });
        cardElement.addEventListener('touchend', handleEnd);
        cardElement.addEventListener('touchcancel', handleEnd);
        cardElement.addEventListener('mousedown', handleStart);

        card = cardElement;
    }

    if (card) {
        setupSwipeHandlers(card);
    }

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);

    sidebarToggle?.addEventListener('click', () => {
        sidebar?.classList.toggle('sidebar-expanded');
        document.body.classList.toggle('sidebar-expanded');
    });

    function handleStart(e) {
        if (expandedView) return;
        if (e.type === 'mousedown' && window.matchMedia('(min-width: 768px)').matches) return;

        card = document.getElementById('project-card');
        if (!card) return;

        card.classList.remove('card-entering');
        card.style.animation = 'none';
        isDragging = true;
        setFeedChromeHidden(true);

        if (createProjectBtn) {
            createProjectBtn.style.transition = 'opacity 0.3s ease';
            createProjectBtn.style.opacity = '0';
        }

        if (sidebar?.classList.contains('sidebar-expanded')) {
            sidebar.classList.remove('sidebar-expanded');
            document.body.classList.remove('sidebar-expanded');
        }

        if (e.type === 'mousedown') {
            e.preventDefault();
        }

        if (e.type === 'touchstart') {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        } else {
            startX = e.clientX;
            startY = e.clientY;
        }

        offsetX = 0;
        offsetY = 0;
        card.style.transition = 'none';
        clearSwipeFeedback();
        resetStatusIndicators();
    }

    function handleMove(e) {
        if (expandedView || !isDragging) return;

        card = document.getElementById('project-card');
        if (!card) return;

        let currentX;
        let currentY;

        if (e.type === 'touchmove') {
            e.preventDefault();
            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;
        } else {
            currentX = e.clientX;
            currentY = e.clientY;
        }

        offsetX = currentX - startX;
        offsetY = currentY - startY;

        const rotate = offsetX * 0.1;
        card.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${rotate}deg)`;

        const thresholds = getSwipeThresholds(card);
        const direction = getSwipeDirection(offsetX, offsetY, thresholds);

        updateStatusIndicators(direction);

        if (direction === 'right') {
            setSwipeFeedback('right', Math.min(1, Math.abs(offsetX) / thresholds.feedbackX));
        } else if (direction === 'left') {
            setSwipeFeedback('left', Math.min(1, Math.abs(offsetX) / thresholds.feedbackX));
        } else if (direction === 'up') {
            setSwipeFeedback('up', Math.min(1, Math.abs(offsetY) / thresholds.feedbackY));
        } else {
            clearSwipeFeedback();
        }
    }

    function handleEnd() {
        if (expandedView || !isDragging) return;

        card = document.getElementById('project-card');
        if (!card) return;

        isDragging = false;

        if (createProjectBtn) {
            createProjectBtn.style.transition = 'opacity 0.3s ease';
            createProjectBtn.style.opacity = '1';
        }

        card.style.transition = 'transform 0.5s ease';

        const thresholds = getSwipeThresholds(card);
        const mostlyHorizontal = Math.abs(offsetX) >= Math.abs(offsetY) * 0.8;

        resetStatusIndicators();

        if (mostlyHorizontal && offsetX > thresholds.horizontal) {
            setSwipeFeedback('right', 1);
            card.style.transform = `translate(${window.innerWidth}px, ${offsetY}px) rotate(30deg)`;
            setTimeout(() => {
                resetCard();
                handleSwipe('right');
                setFeedChromeHidden(false);
            }, 500);
            return;
        }

        if (mostlyHorizontal && offsetX < -thresholds.horizontal) {
            setSwipeFeedback('left', 1);
            card.style.transform = `translate(-${window.innerWidth}px, ${offsetY}px) rotate(-30deg)`;
            setTimeout(() => {
                resetCard();
                handleSwipe('left');
                setFeedChromeHidden(false);
            }, 500);
            return;
        }

        if (offsetY < -thresholds.vertical) {
            setSwipeFeedback('up', 1);
            card.style.transform = `translate(0px, -${window.innerHeight}px) rotate(0deg)`;

            setTimeout(() => {
                expandedCard?.classList.remove('hidden');
                expandedCard?.classList.add('visible');
                expandedView = true;
                card.style.transition = 'none';
                card.style.opacity = '0';
                card.style.transform = 'translate(0, 0) rotate(0deg)';
                card.style.transition = 'opacity 0.3s ease';
                card.style.opacity = '1';
                clearSwipeFeedback();
            }, 500);
            return;
        }

        card.style.transform = 'translate(0, 0) rotate(0deg)';
        clearSwipeFeedback();
        setTimeout(() => {
            if (!expandedView && !isDragging) {
                setFeedChromeHidden(false);
            }
        }, 220);
    }

    function resetCard() {
        card = document.getElementById('project-card');
        if (!card) return;

        card.style.transition = 'none';
        card.style.opacity = '0';
        card.style.transform = 'translate(0, 0) rotate(0deg)';
        clearSwipeFeedback();

        setTimeout(() => {
            card.style.transition = 'opacity 0.3s ease';
            card.style.opacity = '1';
        }, 50);
    }

    closeExpanded?.addEventListener('click', () => {
        clearSwipeFeedback();
        expandedCard.classList.remove('visible');
        setTimeout(() => {
            expandedCard.classList.add('hidden');
            expandedView = false;
            setFeedChromeHidden(false);
        }, 400);
    });

    function handleSwipe(direction) {
        if (!window.projectsManager) return;

        const currentProject = window.projectsManager.projects?.[window.projectsManager.currentProjectIndex];
        window.projectsManager.handleCardSwipe(direction);

        if (direction === 'right' && currentProject) {
            fetch('/api/interests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_id: currentProject.id })
            })
                .then((response) => response.json())
                .then(() => showMatchToast('¡Mostraste interés en este proyecto! 🚀'))
                .catch((error) => console.error('Error guardando interés:', error));
        }
    }

    function triggerSwipe(direction) {
        card = document.getElementById('project-card');
        if (!card || expandedView) return;

        card.style.transition = 'transform 0.5s ease';

        if (direction === 'right') {
            setSwipeFeedback('right', 1);
            card.style.transform = `translate(${window.innerWidth}px, 0) rotate(30deg)`;
            setTimeout(() => {
                resetCard();
                handleSwipe('right');
                setFeedChromeHidden(false);
            }, 500);
        } else if (direction === 'left') {
            setSwipeFeedback('left', 1);
            card.style.transform = `translate(-${window.innerWidth}px, 0) rotate(-30deg)`;
            setTimeout(() => {
                resetCard();
                handleSwipe('left');
                setFeedChromeHidden(false);
            }, 500);
        } else if (direction === 'up') {
            setSwipeFeedback('up', 1);
            card.style.transform = `translate(0px, -${window.innerHeight}px) rotate(0deg)`;
            setTimeout(() => {
                expandedCard?.classList.remove('hidden');
                expandedCard?.classList.add('visible');
                expandedView = true;
                card.style.transition = 'none';
                card.style.opacity = '0';
                card.style.transform = 'translate(0, 0) rotate(0deg)';
                card.style.transition = 'opacity 0.3s ease';
                card.style.opacity = '1';
                clearSwipeFeedback();
            }, 500);
        }
    }

    function showMatchToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        const isMobile = window.innerWidth <= 768;
        toast.style.cssText = `
            position: fixed; bottom: ${isMobile ? '90px' : '30px'}; left: 50%; transform: translateX(-50%);
            background: #667eea; color: white; padding: 12px 24px;
            border-radius: 24px; font-size: 0.95rem; z-index: 9999;
            box-shadow: 0 4px 16px rgba(0,0,0,0.3);
            animation: fadeInUp 0.3s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    }



    // ── Reporte anti-trabajo-encubierto ───────────────────────
    const reportBtn = document.getElementById('report-btn');

    reportBtn?.addEventListener('click', async () => {
        if (!window.projectsManager) return;
        const project = window.projectsManager.projects?.[window.projectsManager.currentProjectIndex];
        if (!project) return;

        const reasonSelect = document.getElementById('report-reason-select');
        const reason = reasonSelect?.value || 'trabajo_encubierto';
        const reasonLabels = {
            trabajo_encubierto: 'trabajo encubierto o no remunerado',
            spam: 'spam',
            ghosting: 'ghosting',
            abuso: 'abuso'
        };

        const confirmed = confirm(`¿Querés reportar este proyecto por ${reasonLabels[reason] || reason}?\n\nTu reporte será revisado.`);
        if (!confirmed) return;

        try {
            const res = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_id: project.id, reason })
            });
            const data = await res.json();
            if (res.ok || res.status === 200) {
                reportBtn.textContent = '✓ Reportado';
                reportBtn.disabled = true;
                reportBtn.style.opacity = '0.5';
                if (reasonSelect) reasonSelect.disabled = true;
                if (data.project_flagged) {
                    reportBtn.title = 'Este proyecto fue ocultado del feed por acumular reportes';
                }
            }
        } catch (err) {
            console.error('Error enviando reporte:', err);
        }
    });

    // ── Panel de filtros ──────────────────────────────────────
    const filterToggleBtn         = document.getElementById('filter-toggle-btn');
    const filterToggleBtnDesktop  = document.getElementById('filter-toggle-btn-desktop');
    const filterPanel             = document.getElementById('filter-panel');
    const filterOverlay           = document.getElementById('filter-overlay');
    const filterPanelClose        = document.getElementById('filter-panel-close');
    const filterApplyBtn          = document.getElementById('filter-apply-btn');
    const filterActiveDot         = document.getElementById('filter-active-dot');

    let activeFilters = { duration: '', org_type: '' };

    function openFilterPanel() {
        filterPanel?.classList.add('open');
        filterOverlay?.classList.add('visible');
        filterPanel?.setAttribute('aria-hidden', 'false');
    }

    function closeFilterPanel() {
        filterPanel?.classList.remove('open');
        filterOverlay?.classList.remove('visible');
        filterPanel?.setAttribute('aria-hidden', 'true');
    }

    function updateFilterDot() {
        const hasActive = activeFilters.duration || activeFilters.org_type;
        filterActiveDot?.classList.toggle('visible', !!hasActive);
    }

    // Chips: selección única por grupo
    document.querySelectorAll('#filter-duration .filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('#filter-duration .filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeFilters.duration = chip.dataset.value;
        });
    });

    document.querySelectorAll('#filter-org-type .filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('#filter-org-type .filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeFilters.org_type = chip.dataset.value;
        });
    });

    // Inicializar "Todas" como activo
    document.querySelector('#filter-duration .filter-chip')?.classList.add('active');
    document.querySelector('#filter-org-type .filter-chip')?.classList.add('active');

    filterToggleBtn?.addEventListener('click', openFilterPanel);
    filterToggleBtnDesktop?.addEventListener('click', openFilterPanel);
    filterOverlay?.addEventListener('click', closeFilterPanel);
    filterPanelClose?.addEventListener('click', closeFilterPanel);

    filterApplyBtn?.addEventListener('click', async () => {
        closeFilterPanel();
        updateFilterDot();
        if (window.projectsManager) {
            await window.projectsManager.applyFilters(activeFilters);
        }
    });

    fetch('/api/user/projects')
        .then((response) => response.json())
        .then((projects) => {
            if (Array.isArray(projects) && projects.length > 0) {
                const button = document.getElementById('candidates-btn');
                if (button) {
                    button.style.display = 'flex';
                }
            }
        })
        .catch(() => {});

    window.handleSwipe = handleSwipe;
    window.setupSwipeHandlers = setupSwipeHandlers;
    window.triggerSwipe = triggerSwipe;

    document.getElementById('btn-dislike')?.addEventListener('click', () => triggerSwipe('left'));
    document.getElementById('btn-like')?.addEventListener('click', () => triggerSwipe('right'));
    document.getElementById('btn-expand')?.addEventListener('click', () => triggerSwipe('up'));

    // ── Notificaciones de match en tiempo real ────────────────
    async function initMatchNotifications() {
        if (!window.supabase?.createClient) return;
        try {
            const configRes = await fetch('/api/config');
            if (!configRes.ok) return;
            const config = await configRes.json();
            const sb = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);
            const userId = config.currentUserId;

            sb.channel('match-notifications')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'matches' },
                    (payload) => {
                        const match = payload.new;
                        // Solo notificar si el match involucra al usuario actual
                        if (match.user_id !== userId && match.owner_id !== userId) return;

                        showMatchNotification();
                    }
                )
                .subscribe();
        } catch (e) {
            console.warn('No se pudieron iniciar las notificaciones de match:', e);
        }
    }

    function showMatchNotification() {
        // Badge (punto rojo) en el link de Chats del sidebar
        const chatLinks = document.querySelectorAll('a[href*="chat"]');
        chatLinks.forEach(link => {
            if (!link.querySelector('.notif-badge')) {
                const badge = document.createElement('span');
                badge.className = 'notif-badge';
                badge.style.cssText = `
                    display:inline-block; width:9px; height:9px;
                    background:#e74c3c; border-radius:50%;
                    margin-left:5px; vertical-align:middle;
                    box-shadow:0 0 6px rgba(231,76,60,0.8);
                    animation:notifPulse 1.4s ease-in-out infinite;
                `;
                link.appendChild(badge);
            }
        });

        // Overlay de match
        showMatchOverlay();
    }

    function showMatchOverlay() {
        document.getElementById('match-overlay')?.remove();

        const overlay = document.createElement('div');
        overlay.id = 'match-overlay';
        overlay.style.cssText = `
            position:fixed; inset:0; z-index:99999;
            background:rgba(8,4,18,0.88);
            display:flex; align-items:center; justify-content:center;
            backdrop-filter:blur(10px);
            animation:matchFadeIn 0.35s ease;
        `;

        overlay.innerHTML = `
            <style>
                @keyframes matchFadeIn   { from{opacity:0} to{opacity:1} }
                @keyframes matchSlideUp  { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
                @keyframes heartPop      { 0%{transform:scale(0) rotate(-15deg);opacity:0}
                                           60%{transform:scale(1.35) rotate(8deg);opacity:1}
                                           100%{transform:scale(1) rotate(0deg);opacity:1} }
                @keyframes notifPulse    { 0%,100%{box-shadow:0 0 6px rgba(231,76,60,0.8)}
                                           50%{box-shadow:0 0 14px rgba(231,76,60,1)} }
                @keyframes ringExpand    { 0%{transform:scale(0.6);opacity:0.8}
                                           100%{transform:scale(2.2);opacity:0} }
            </style>

            <div style="text-align:center; padding:40px 32px; animation:matchSlideUp 0.5s ease 0.15s both; max-width:420px; width:90%;">

                <!-- Ícono con anillos -->
                <div style="position:relative; display:inline-flex; align-items:center; justify-content:center; margin-bottom:24px;">
                    <div style="position:absolute; width:100px; height:100px; border-radius:50%;
                                border:2px solid rgba(194,123,255,0.5);
                                animation:ringExpand 1.2s ease 0.6s both;"></div>
                    <div style="position:absolute; width:100px; height:100px; border-radius:50%;
                                border:2px solid rgba(194,123,255,0.3);
                                animation:ringExpand 1.2s ease 0.9s both;"></div>
                    <div style="font-size:5rem; animation:heartPop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.3s both;">
                        💜
                    </div>
                </div>

                <h1 style="color:#fff; font-size:2.4rem; font-weight:900; margin:0 0 10px;
                            letter-spacing:-1px; line-height:1.1;">
                    ¡Es un match!
                </h1>
                <p style="color:#C27BFF; font-size:1.05rem; margin:0 0 36px; opacity:0.9;">
                    Alguien quiere trabajar con vos 🚀
                </p>

                <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
                    <a href="/chat" style="
                        padding:13px 30px;
                        background:linear-gradient(135deg,#667eea,#764ba2);
                        color:#fff; border-radius:28px; text-decoration:none;
                        font-weight:700; font-size:1rem;
                        box-shadow:0 6px 24px rgba(102,126,234,0.45);
                        transition:transform 0.15s ease;
                    " onmouseover="this.style.transform='scale(1.04)'"
                       onmouseout="this.style.transform='scale(1)'">
                        💬 Chatear ahora
                    </a>
                    <button onclick="document.getElementById('match-overlay').remove()" style="
                        padding:13px 30px;
                        background:rgba(255,255,255,0.1);
                        color:#fff; border:1px solid rgba(255,255,255,0.25);
                        border-radius:28px; cursor:pointer; font-size:1rem;
                        transition:background 0.15s ease;
                    " onmouseover="this.style.background='rgba(255,255,255,0.18)'"
                       onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                        Seguir explorando
                    </button>
                </div>

                <p style="color:rgba(255,255,255,0.25); font-size:0.75rem; margin-top:24px;">
                    Tocá fuera para cerrar
                </p>
            </div>
        `;

        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        document.body.appendChild(overlay);
        setTimeout(() => overlay?.remove(), 12000);
    }

    initMatchNotifications();

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

    // Cerrar al hacer click en el backdrop
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
});
