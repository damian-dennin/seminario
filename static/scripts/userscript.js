function escapeHtml(text) {
    return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', () => {
    const expandedCard = document.getElementById('expanded-card');
    const closeExpanded = document.getElementById('close-expanded');
    let expandedView = false;

    const card = document.getElementById('project-card');
    const sidebar = document.getElementById('sidebar');
    const sidebarTrigger = document.getElementById('sidebar-trigger');


    const profileImageInput = document.getElementById('profile-image-input');
    const profileImagePreview = document.querySelector('.user-card-image');
    let selectedProfileImage = null;

    let startY = 0;
    let offsetY = 0;
    let isDragging = false;
    let isHoveringSidebar = false;
    let selectedProfileImageFile = null


    // Agregar al inicio del archivo, después de las variables globales existentes
let userData = null;

    function setPageChromeHidden(hidden) {
        document.body.classList.toggle('feed-chrome-hidden', hidden);
        if (hidden && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    }

    initEditButton();
        // Cargar datos del usuario al iniciar
        loadUserData();
        loadUserProjects();

// Función para cargar datos del usuario desde la base de datos
async function loadUserData() {
    try {
        const response = await fetch('/api/user/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            userData = await response.json();
            populateUserInterface();
        } else {
            console.error('Error al cargar datos del usuario');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
    }
}

// Función para poblar la interfaz con los datos del usuario
function populateUserInterface() {
    if (!userData) return;

    // Actualizar título/nombre en la tarjeta principal
    const cardTitle = document.querySelector('.card-title');
    if (cardTitle) {
        cardTitle.textContent = `${userData.firstName} ${userData.lastName}`;
        cardTitle.classList.remove('bio-loading-anim');
    }

    // Quitar animación de carga en la descripción
    const cardDesc = document.querySelector('.card-description');
    if (cardDesc) {
        cardDesc.classList.remove('bio-loading-anim');
    }

    // Foto de perfil o avatar con iniciales
    const initials = ((userData.firstName?.[0] || '') + (userData.lastName?.[0] || '')).toUpperCase();
    document.querySelectorAll('.user-card-image').forEach(av => {
        if (userData.photo_url) {
            // Si hay foto guardada, mostrarla
            av.style.backgroundImage = `url('${userData.photo_url}')`;
            av.style.backgroundSize = 'cover';
            av.style.backgroundPosition = 'center';
            // Ocultar iniciales si existen
            const existing = av.querySelector('.avatar-initials');
            if (existing) existing.style.display = 'none';
        } else {
            // Si no hay foto, mostrar iniciales
            av.style.backgroundImage = '';
            if (!av.querySelector('.avatar-initials')) {
                const span = document.createElement('span');
                span.className = 'avatar-initials';
                span.textContent = initials;
                av.appendChild(span);
            } else {
                const initSpan = av.querySelector('.avatar-initials');
                initSpan.textContent = initials;
                initSpan.style.display = '';
            }
        }
    });

    // Actualizar título en vista expandida
    const expandedTitle = document.querySelector('.expanded-title');
    if (expandedTitle) {
        expandedTitle.textContent = `${userData.firstName} ${userData.lastName}`;
    }

    // Actualizar estado de disponibilidad
    const statusBadge = document.querySelector('.status-badge');
    if (statusBadge) {
        statusBadge.textContent = userData.status || 'Disponible';
        statusBadge.className = `status-badge ${userData.status === 'Disponible' ? 'active' : ''}`;
    }

    // Actualizar estadísticas
    const statsElements = document.querySelectorAll('.stat-value');
    if (statsElements.length >= 4) {
        statsElements[0].textContent = userData.age || 'N/A';
        statsElements[1].textContent = userData.birthDate || 'N/A';
        statsElements[2].textContent = userData.languages || 'N/A';
        statsElements[3].textContent = userData.specialization || 'N/A';
    }

    // Actualizar estadísticas en la tarjeta principal (ocultar si está vacío)
    const cardStatSpans = document.querySelectorAll('.card-stats > span');
    const cardStats = document.querySelectorAll('.card-stats .stats-text');
    const statValues = [userData.age, userData.status || 'Disponible', userData.languages, userData.specialization];
    statValues.forEach((val, i) => {
        if (cardStats[i]) cardStats[i].textContent = val || '';
        if (cardStatSpans[i]) cardStatSpans[i].classList.toggle('stat-hidden', !val);
    });

    // Actualizar descripción de la tarjeta
    const cardDescription = document.querySelector('.card-description');
    if (cardDescription && userData.bio) {
        cardDescription.textContent = userData.bio;
    }

    // Actualizar información de contacto
    const contactsList = document.querySelectorAll('.objectives-list')[0];
    if (contactsList) {
        const contacts = [];
        if (userData.email) contacts.push(`Email: ${userData.email}`);
        if (userData.phone) contacts.push(`Teléfono: ${userData.phone}`);
        if (userData.linkedin) contacts.push(`LinkedIn: ${userData.linkedin}`);
        if (userData.github) contacts.push(`GitHub: ${userData.github}`);
        if (userData.portfolio) contacts.push(`Portfolio: ${userData.portfolio}`);

        contactsList.innerHTML = '';
        contacts.forEach(contact => {
            const item = document.createElement('div');
            item.className = 'objective-item';
            item.innerHTML = `<span>${escapeHtml(contact)}</span>`;
            contactsList.appendChild(item);
        });
    }

    // Actualizar bio en la sección "Sobre Mí"
    const sectionContent = document.querySelector('.section-content');
    if (sectionContent && userData.bio) {
        sectionContent.innerHTML = escapeHtml(userData.bio).replace(/\n/g, '<br>');
    }

    // Actualizar habilidades técnicas
    const techGrid = document.querySelector('.tech-grid');
    if (techGrid && userData.skills && userData.skills.length > 0) {
        techGrid.innerHTML = '';
        userData.skills.forEach(skill => {
            const techItem = document.createElement('div');
            techItem.className = 'tech-item';
            const shortName = skill.substring(0, 4);
            techItem.innerHTML = `
                <span class="tech-icon-expanded">${escapeHtml(shortName)}</span>
                <div class="tech-details">
                    <span class="tech-name">${escapeHtml(skill)}</span>
                    <span class="tech-level">Intermedio</span>
                </div>
            `;
            techGrid.appendChild(techItem);
        });
    }

    // Actualizar iconos de tecnología en la tarjeta principal
    const cardTech = document.querySelector('.card-tech');
    if (cardTech && userData.skills && userData.skills.length > 0) {
        cardTech.innerHTML = '';
        userData.skills.slice(0, 4).forEach(skill => {
            const techIcon = document.createElement('div');
            techIcon.className = 'tech-icon';
            techIcon.textContent = skill.substring(0, 4);
            cardTech.appendChild(techIcon);
        });
    }

    // Actualizar objetivos profesionales
    const objectivesListEl = document.querySelectorAll('.objectives-list')[1];
    if (objectivesListEl && userData.objectives && userData.objectives.length > 0) {
        objectivesListEl.innerHTML = '';
        userData.objectives.forEach(obj => {
            const item = document.createElement('div');
            item.className = 'objective-item';
            item.innerHTML = `<span>${escapeHtml(obj)}</span>`;
            objectivesListEl.appendChild(item);
        });
    }

    // Actualizar certificaciones
    const certificationsList = document.querySelectorAll('.objectives-list')[2];
    if (certificationsList && userData.certifications && userData.certifications.length > 0) {
        certificationsList.innerHTML = '';
        userData.certifications.forEach(cert => {
            const item = document.createElement('div');
            item.className = 'objective-item';
            item.innerHTML = `<span>${escapeHtml(cert)}</span>`;
            certificationsList.appendChild(item);
        });
    }
    

    // Actualizar áreas de interés
    const skillsGrid = document.querySelector('.skills-grid');
    if (skillsGrid && userData.interests && userData.interests.length > 0) {
        skillsGrid.innerHTML = '';
        userData.interests.forEach(interest => {
            const skillBadge = document.createElement('div');
            skillBadge.className = 'skill-badge';
            skillBadge.textContent = interest;
            skillsGrid.appendChild(skillBadge);
        });
    }

    // Actualizar estado
    if (statusBadge) {
        statusBadge.textContent = userData.status || 'Disponible';
    }
}

// Cargar y renderizar proyectos del usuario
async function loadUserProjects() {
    const container = document.getElementById('my-projects-list');
    if (!container) return;

    try {
        const r = await fetch('/api/user/projects');
        const projects = await r.json();

        if (!Array.isArray(projects) || projects.length === 0) {
            container.innerHTML = '<p style="opacity:0.5;font-size:0.9rem;">Todavía no creaste ningún proyecto.</p>';
            return;
        }

        container.innerHTML = '';
        projects.forEach(project => {
            const card = document.createElement('div');
            card.style.cssText = `
                background: rgba(255,255,255,0.06);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 12px;
                padding: 14px 16px;
                margin-bottom: 10px;
            `;

            const candidates = project.pending_candidates || 0;
            const candidateBadge = candidates > 0
                ? `<span style="background:#667eea;color:white;padding:2px 8px;border-radius:10px;font-size:0.75rem;margin-left:8px;">
                       👥 ${candidates} candidato${candidates > 1 ? 's' : ''}
                   </span>`
                : '';

            const flaggedBanner = project.moderation_status === 'flagged'
                ? `<div style="background:rgba(180,40,50,0.25);border:1px solid rgba(255,100,100,0.3);
                              border-radius:8px;padding:6px 10px;margin-bottom:8px;font-size:0.78rem;color:#ffaaaa;">
                       ⚠️ Dado de baja por reportes de la comunidad
                   </div>`
                : '';

            card.innerHTML = `
                ${flaggedBanner}
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                    <strong style="font-size:0.95rem;">${escapeHtml(project.title)}</strong>
                    ${candidateBadge}
                </div>
                <div style="font-size:0.8rem;opacity:0.6;margin-bottom:10px;">
                    ${escapeHtml(project.stats?.org_type || '')} · ${escapeHtml(project.stats?.language || '')} · ${escapeHtml(project.stats?.duration || '')}
                </div>
                <div style="display:flex;gap:8px;">
                    <button onclick="openEditProjectModal(${JSON.stringify(project).replace(/"/g, '&quot;')})"
                        style="flex:1;padding:6px;border-radius:8px;border:1px solid rgba(194,123,255,0.4);
                               background:rgba(97,58,103,0.35);color:#e8d0ff;font-size:0.8rem;cursor:pointer;">
                        ✏️ Editar
                    </button>
                    <button onclick="deleteProject(${project.id})"
                        style="padding:6px 10px;border-radius:8px;border:1px solid rgba(255,80,80,0.3);
                               background:rgba(120,30,30,0.3);color:#ffaaaa;font-size:0.8rem;cursor:pointer;">
                        🗑️
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        container.innerHTML = '<p style="opacity:0.5;font-size:0.9rem;">Error cargando proyectos.</p>';
    }
}

// ── Modal de edición de proyecto ────────────────────────────────────────────

function openEditProjectModal(project) {
    const modal = document.getElementById('edit-project-modal');
    if (!modal) return;

    // Poblar campos
    modal.querySelector('#ep-id').value        = project.id;
    modal.querySelector('#ep-title').value     = project.title || '';
    modal.querySelector('#ep-description').value = project.description || '';
    modal.querySelector('#ep-technologies').value = (project.technologies || [])
        .map(t => (typeof t === 'string' ? t : t.name)).join(', ');
    modal.querySelector('#ep-skills').value    = (project.skills_needed || []).join(', ');
    modal.querySelector('#ep-objectives').value = (project.objectives || []).join('\n');
    modal.querySelector('#ep-team').value      = project.stats?.team_size || '';
    modal.querySelector('#ep-duration').value  = project.stats?.duration || '';
    modal.querySelector('#ep-language').value  = project.stats?.language || '';
    modal.querySelector('#ep-org').value       = project.stats?.org_type || '';

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeEditProjectModal() {
    const modal = document.getElementById('edit-project-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
}

async function saveEditProject() {
    const modal = document.getElementById('edit-project-modal');
    const id    = modal.querySelector('#ep-id').value;
    const saveBtn = modal.querySelector('#ep-save-btn');

    const payload = {
        title:       modal.querySelector('#ep-title').value.trim(),
        description: modal.querySelector('#ep-description').value.trim(),
        technologies: modal.querySelector('#ep-technologies').value
            .split(',').map(s => s.trim()).filter(Boolean)
            .map(name => ({ name, icon: name.substring(0, 4) })),
        skills_needed: modal.querySelector('#ep-skills').value.split(',').map(s => s.trim()).filter(Boolean),
        objectives:  modal.querySelector('#ep-objectives').value.split('\n').map(s => s.trim()).filter(Boolean),
        stats: {
            team_size: modal.querySelector('#ep-team').value.trim(),
            duration:  modal.querySelector('#ep-duration').value.trim(),
            language:  modal.querySelector('#ep-language').value.trim(),
            org_type:  modal.querySelector('#ep-org').value,
        }
    };

    if (!payload.title) { alert('El título es obligatorio.'); return; }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';

    try {
        const r = await fetch(`/api/projects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (r.ok) {
            closeEditProjectModal();
            loadUserProjects(); // refrescar lista
        } else {
            const err = await r.json();
            alert(err.error || 'Error al guardar.');
        }
    } catch {
        alert('Error de red al guardar.');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Guardar';
    }
}

async function deleteProject(projectId) {
    if (!confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.')) return;

    try {
        const r = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
        if (r.ok) {
            loadUserProjects();
        } else {
            const err = await r.json();
            alert(err.error || 'Error al eliminar.');
        }
    } catch {
        alert('Error de red.');
    }
}

// Función para actualizar la vista expandida específicamente
function updateExpandedView() {
    if (!userData) return;
    
    // Actualizar todos los elementos de la vista expandida
    populateUserInterface();
    
    // Forzar actualización de elementos específicos de la vista expandida
    setTimeout(() => {
        const expandedTitle = document.querySelector('.expanded-title');
        if (expandedTitle) {
            expandedTitle.textContent = `${userData.firstName} ${userData.lastName}`;
        }
        
        const statusBadge = document.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.textContent = userData.status || 'Disponible';
        }
    }, 100);
}

// Función para recopilar datos de la interfaz
function collectUserData() {
    const updatedData = { ...userData };

    // Recopilar nombre
    const titleInput = document.querySelector('.title-input');
    if (titleInput) {
        const fullName = titleInput.value.trim().split(' ');
        updatedData.firstName = fullName[0] || '';
        updatedData.lastName = fullName.slice(1).join(' ') || '';
    }

    // Recopilar estadísticas
    const statInputs = document.querySelectorAll('.stat-value input');
    if (statInputs.length >= 4) {
        updatedData.age = statInputs[0].value;
        updatedData.birthDate = statInputs[1].value;
        updatedData.languages = statInputs[2].value;
        updatedData.specialization = statInputs[3].value;
    }

    // Recopilar bio
    const bioTextarea = document.querySelector('textarea');
    if (bioTextarea) {
        updatedData.bio = bioTextarea.value;
    }

    // Recopilar contactos
    const contactInputs = document.querySelectorAll('.objectives-list')[0]?.querySelectorAll('input');
    if (contactInputs) {
        contactInputs.forEach(input => {
            const value = input.value.trim();
            if (value.includes(':')) {
                const [type, info] = value.split(':').map(s => s.trim());
                switch (type.toLowerCase()) {
                    case 'email':
                        updatedData.email = info;
                        break;
                    case 'teléfono':
                    case 'telefono':
                    case 'phone':
                        updatedData.phone = info;
                        break;
                    case 'linkedin':
                        updatedData.linkedin = info;
                        break;
                    case 'github':
                        updatedData.github = info;
                        break;
                    case 'portfolio':
                        updatedData.portfolio = info;
                        break;
                }
            }
        });
    }

    // Recopilar estado de disponibilidad
    const statusSelect = document.querySelector('.status-select');
    if (statusSelect) {
        updatedData.status = statusSelect.value;
    }

    // Recopilar objetivos profesionales
    const objectivesSection = document.querySelectorAll('.objectives-list')[1];
    const objectives = [];
    if (objectivesSection) {
        objectivesSection.querySelectorAll('input').forEach(input => {
            if (input.value.trim()) objectives.push(input.value.trim());
        });
    }
    updatedData.objectives = objectives;

    // Recopilar habilidades técnicas
    const techItems = document.querySelectorAll('.tech-item');
    const skills = [];
    techItems.forEach(item => {
        const nameInput = item.querySelector('input[type="text"]');
        if (nameInput && nameInput.value.trim()) {
            skills.push(nameInput.value.trim());
        } else {
            const techName = item.querySelector('.tech-name');
            if (techName) {
                skills.push(techName.textContent.trim());
            }
        }
    });
    updatedData.skills = skills;

    // Recopilar certificaciones
    const certInputs = document.querySelectorAll('.objectives-list')[2]?.querySelectorAll('input');
    const certifications = [];
    if (certInputs) {
        certInputs.forEach(input => {
            if (input.value.trim()) {
                certifications.push(input.value.trim());
            }
        });
    }
    updatedData.certifications = certifications;

    // Recopilar intereses
    const interestInputs = document.querySelectorAll('.skills-grid input');
    const interests = [];
    interestInputs.forEach(input => {
        if (input.value.trim()) {
            interests.push(input.value.trim());
        }
    });
    updatedData.interests = interests;

    return updatedData;
}


// Sube una imagen al servidor y retorna la URL pública, o null si falla
async function uploadProfileImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'profile');
    try {
        const r = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await r.json();
        if (r.ok) return data.url;
        showErrorMessage(data.error || 'Error subiendo la imagen');
        return null;
    } catch {
        showErrorMessage('Error de conexión al subir la imagen');
        return null;
    }
}

// Función para guardar cambios en la base de datos
async function saveChangesToDatabase() {
    try {
        const updatedData = collectUserData();

        // Si el usuario seleccionó una imagen nueva, subirla primero
        if (selectedProfileImage) {
            showSuccessMessage('Subiendo imagen...');
            const url = await uploadProfileImage(selectedProfileImage);
            if (url) {
                updatedData.photo_url = url;
                selectedProfileImage = null;  // limpiar para no re-subir
            }
        }

        const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (response.ok) {
            const result = await response.json();
            userData = result;
            populateUserInterface();
            showSuccessMessage('Perfil actualizado exitosamente');
        } else {
            const errData = await response.json().catch(() => ({}));
            console.error('Error al actualizar el perfil', errData);
            showErrorMessage(errData.error || 'Error al actualizar el perfil');
            // Restaurar UI con los datos anteriores para no dejar estado inconsistente
            populateUserInterface();
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        showErrorMessage('Error de conexión al servidor');
        populateUserInterface();
    }
}

// Función para mostrar mensaje de éxito
function showSuccessMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.remove();
    }, 3000);
}

// Función para mostrar mensaje de error
function showErrorMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.remove();
    }, 3000);
}


    function handleProfileImageUpload() {
    // Solo permitir cambio de foto si está en modo edición
    if (!isEditMode) {
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            selectedProfileImage = file;
            const reader = new FileReader();
            
            reader.onload = (e) => {
                // Actualizar todas las imágenes de perfil
                document.querySelectorAll('.user-card-image').forEach(img => {
                    img.style.backgroundImage = `url(${e.target.result})`;
                    img.style.backgroundSize = 'cover';
                    img.style.backgroundPosition = 'center';
                });
            };
            
            reader.readAsDataURL(file);
        }
    });
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}
    
    // Controladores de tema oscuro corregidos
    const toggle = document.getElementById('theme-toggle');
    const togglemo = document.getElementById('theme-togglemo');

    // Función para sincronizar ambos toggles
    function syncThemeToggles(sourceToggle, targetToggle) {
        targetToggle.checked = sourceToggle.checked;
        document.body.classList.toggle('dark-mode', sourceToggle.checked);
    }

    // Event listener para el primer toggle
    toggle?.addEventListener('change', () => {
        syncThemeToggles(toggle, togglemo);
    });

    // Event listener para el segundo toggle (móvil)
    togglemo?.addEventListener('change', () => {
        syncThemeToggles(togglemo, toggle);
    });
    
    // Handlers for touch devices
    card.addEventListener('touchstart', handleStart, { passive: false });
    card.addEventListener('touchmove', handleMove, { passive: false });
    card.addEventListener('touchend', handleEnd);

    // Handlers for mouse devices
    card.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);



    // Sidebar trigger hover handler
    sidebarTrigger.addEventListener('mouseenter', () => {
        if (!isDragging) {
            isHoveringSidebar = true;
            sidebar.classList.add('active');
        }
    });

    sidebar.addEventListener('mouseleave', () => {
        isHoveringSidebar = false;
        sidebar.classList.remove('active');
    });

    document.addEventListener('mousemove', (e) => {
        const edgeDistance = window.innerWidth - e.clientX;
        if (edgeDistance < 15 && !isDragging && !isHoveringSidebar) {
            isHoveringSidebar = true;
            sidebar.classList.add('active');
        } else if (edgeDistance > 80 && !isDragging && isHoveringSidebar && e.target.id !== 'sidebar' && !sidebar.contains(e.target)) {
            isHoveringSidebar = false;
            sidebar.classList.remove('active');
        }
    });


    let isEditMode = false;

    function initEditButton() {
        const editBtn = document.getElementById('edit-profile-btn');
        if (editBtn) {
            editBtn.addEventListener('click', toggleEditMode);
        }
    }

    function toggleEditMode() {
        const editBtn = document.getElementById('edit-profile-btn');
        const expandedCard = document.getElementById('expanded-card');
        
        isEditMode = !isEditMode;
        
        if (isEditMode) {
            editBtn.textContent = 'Guardar';
            editBtn.style.background = 'linear-gradient(135deg, #7c4dcc 0%, #5c2d99 100%)';
            expandedCard.classList.add('edit-mode');
            makeEditable();
        } else {
            editBtn.textContent = 'Editar';
            editBtn.style.background = 'linear-gradient(135deg, #C27BFF 0%, #613A67 100%)';
            expandedCard.classList.remove('edit-mode');
            saveChanges();
            makeReadOnly();
        }
    }

    // Función auxiliar para calcular el ancho del texto
    function getTextWidth(text, font) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = font;
        return context.measureText(text).width;
    }


    function handleFeedProfileImageUpload() {
    // Solo permitir cambio de foto si está en modo edición
    if (!isEditMode) {
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            selectedProfileImageFile = file;
            const reader = new FileReader();
            
            reader.onload = (e) => {
                document.querySelectorAll('.user-card-image').forEach(img => {
                    img.style.backgroundImage = `url(${e.target.result})`;
                    img.style.backgroundSize = 'cover';
                    img.style.backgroundPosition = 'center';
                });
            };
            
            reader.readAsDataURL(file);
        }
    });
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}

function makeEditable() {
    const title = document.querySelector('.expanded-title');
    if (title) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = title.textContent;
        input.className = 'title-input';
        
        // Obtener el estilo computado del título original
        const computedStyle = window.getComputedStyle(title);
        const fontSize = computedStyle.fontSize;
        const fontWeight = computedStyle.fontWeight;
        const fontFamily = computedStyle.fontFamily;
        
        // Calcular el ancho del texto
        const font = `${fontWeight} ${fontSize} ${fontFamily}`;
        const textWidth = getTextWidth(title.textContent, font);
        
        // Configurar el input con el mismo estilo y ancho
        input.style.cssText = `
            font-size: ${fontSize};
            font-weight: ${fontWeight};
            font-family: ${fontFamily};
            background: transparent;
            border: 1px solid rgba(255,255,255,0.3);
            color: inherit;
            padding: 4px 8px;
            border-radius: 4px;
            width: ${Math.max(textWidth + 20, 150)}px;
            min-width: 150px;
            max-width: 80%;
        `;
        
        // Función para ajustar el ancho dinámicamente mientras se escribe
        input.addEventListener('input', function() {
            const currentWidth = getTextWidth(this.value || 'A', font);
            const newWidth = Math.max(currentWidth + 20, 150);
            this.style.width = Math.min(newWidth, window.innerWidth * 0.8) + 'px';
        });
        
        title.replaceWith(input);
        
        // Enfocar el input y seleccionar el texto
        setTimeout(() => {
            input.focus();
            input.select();
        }, 50);
    }
    
    // Hacer editable el estado (Disponible / No disponible / Ocupado)
    const statusBadge = document.querySelector('.status-badge');
    if (statusBadge) {
        const statusSelect = document.createElement('select');
        statusSelect.className = 'status-select';
        statusSelect.style.cssText = `
            background: rgba(255,255,255,0.15);
            border: 1px solid rgba(255,255,255,0.4);
            color: inherit;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.85rem;
            cursor: pointer;
        `;
        const currentStatus = (typeof userData !== 'undefined' && userData?.status)
            ? userData.status
            : statusBadge.textContent.trim();
        ['Disponible', 'No disponible', 'Ocupado'].forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.textContent = opt;
            if (opt === currentStatus) option.selected = true;
            statusSelect.appendChild(option);
        });
        statusBadge.replaceWith(statusSelect);
    }

const profileImages = document.querySelectorAll('.user-card-image');
profileImages.forEach(profileImg => {
    if (!profileImg.querySelector('.upload-overlay')) {
        const uploadOverlay = document.createElement('div');
        uploadOverlay.className = 'upload-overlay';
        uploadOverlay.innerHTML = `
            <div class="upload-content">
                <span class="upload-icon">📷</span>
                <span class="upload-text">Cambiar Foto</span>
            </div>
        `;
        uploadOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.3s ease;
            border-radius: inherit;
        `;
        
        const uploadContent = uploadOverlay.querySelector('.upload-content');
        uploadContent.style.cssText = `
            text-align: center;
            color: white;
            font-size: 0.9rem;
        `;
        
        const uploadIcon = uploadOverlay.querySelector('.upload-icon');
        uploadIcon.style.cssText = `
            display: block;
            font-size: 2rem;
            margin-bottom: 0.5rem;
        `;
        
        profileImg.style.position = 'relative';
        profileImg.appendChild(uploadOverlay);
        
        // Solo mostrar overlay en hover si está en modo edición
        profileImg.addEventListener('mouseenter', () => {
            if (isEditMode) {
                uploadOverlay.style.opacity = '1';
            }
        });
        
        profileImg.addEventListener('mouseleave', () => {
            uploadOverlay.style.opacity = '0';
        });
        
        uploadOverlay.addEventListener('click', handleProfileImageUpload);
    }
});


    document.querySelectorAll('.stat-value').forEach(stat => {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = stat.textContent;
        input.style.background = 'transparent';
        input.style.border = '1px solid rgba(255,255,255,0.3)';
        input.style.color = 'inherit';
        input.style.padding = '2px 4px';
        stat.innerHTML = '';
        stat.appendChild(input);
    });
    
    const aboutSection = document.querySelector('.section-content');
    if (aboutSection) {
        const textarea = document.createElement('textarea');
        textarea.value = aboutSection.textContent.trim();
        textarea.rows = 6;
        textarea.style.width = '100%';
        textarea.style.resize = 'vertical';
        textarea.style.background = 'rgba(255,255,255,0.1)';
        textarea.style.border = '1px solid rgba(255,255,255,0.3)';
        textarea.style.color = 'inherit';
        textarea.style.padding = '8px';
        textarea.style.fontFamily = 'inherit';
        aboutSection.replaceWith(textarea);
    }
    
    document.querySelectorAll('.objectives-list .objective-item span').forEach(contact => {
        if (contact.textContent.includes(':')) {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = contact.textContent;
            input.style.width = '100%';
            input.style.background = 'transparent';
            input.style.border = '1px solid rgba(255,255,255,0.3)';
            input.style.color = 'inherit';
            input.style.padding = '4px';
            contact.replaceWith(input);
        }
    });
    
    const objectivesList = document.querySelectorAll('.objectives-list')[1]; 
    if (objectivesList) {
        objectivesList.querySelectorAll('.objective-item span').forEach(objective => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = objective.textContent;
            input.style.width = '100%';
            input.style.background = 'transparent';
            input.style.border = '1px solid rgba(255,255,255,0.3)';
            input.style.color = 'inherit';
            input.style.padding = '4px';
            objective.replaceWith(input);
        });
    }
    
document.querySelectorAll('.tech-item').forEach(techItem => {
    const techName = techItem.querySelector('.tech-name');
    const techLevel = techItem.querySelector('.tech-level');
    
    if (techName) {
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = techName.textContent;
        nameInput.style.cssText = `
            background: transparent;
            border: 1px solid rgba(255,255,255,0.3);
            color: inherit;
            padding: 2px 6px;
            font-size: 0.9rem;
            border-radius: 4px;
            width: ${Math.max(techName.textContent.length * 8 + 20, 60)}px;
            min-width: 60px;
            max-width: 150px;
        `;
        
        nameInput.addEventListener('input', function() {
            const minWidth = 60;
            const maxWidth = 150;
            const calculatedWidth = Math.max(this.value.length * 8 + 20, minWidth);
            this.style.width = Math.min(calculatedWidth, maxWidth) + 'px';
        });
        
        techName.replaceWith(nameInput);
    }
    
    if (techLevel) {
        const levelSelect = document.createElement('select');
        levelSelect.innerHTML = `
            <option value="Básico">Básico</option>
            <option value="Intermedio">Intermedio</option>
            <option value="Avanzado">Avanzado</option>
            <option value="Experto">Experto</option>
        `;
        levelSelect.value = techLevel.textContent;
        levelSelect.style.cssText = `
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.3);
            color: inherit;
            padding: 2px 4px;
            font-size: 0.8rem;
            border-radius: 4px;
            width: auto;
            min-width: 80px;
        `;
        techLevel.replaceWith(levelSelect);
    }
});
    
    const certificationsList = document.querySelectorAll('.objectives-list')[2]; 
    if (certificationsList) {
        certificationsList.querySelectorAll('.objective-item span').forEach(cert => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = cert.textContent;
            input.style.width = '100%';
            input.style.background = 'transparent';
            input.style.border = '1px solid rgba(255,255,255,0.3)';
            input.style.color = 'inherit';
            input.style.padding = '4px';
            cert.replaceWith(input);
        });
    }
    
    document.querySelectorAll('.skill-badge').forEach(skill => {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = skill.textContent;
        input.style.background = 'transparent';
        input.style.border = '1px solid rgba(255,255,255,0.3)';
        input.style.color = 'inherit';
        input.style.padding = '4px 8px';
        input.style.borderRadius = '12px';
        input.style.fontSize = '0.8rem';
        input.style.textAlign = 'center';
        skill.replaceWith(input);
    });
    
    addAddButtons();
}
function removeUploadOverlays() {
    document.querySelectorAll('.upload-overlay').forEach(overlay => {
        overlay.remove();
    });
}
function addAddButtons() {
    const contactsSection = document.querySelectorAll('.objectives-list')[0];
    if (contactsSection && !contactsSection.querySelector('.add-btn')) {
        const addContactBtn = createAddButton('Agregar Contacto', () => addNewContact());
        contactsSection.appendChild(addContactBtn);
    }
    
    const objectivesSection = document.querySelectorAll('.objectives-list')[1];
    if (objectivesSection && !objectivesSection.querySelector('.add-btn')) {
        const addObjectiveBtn = createAddButton('Agregar Objetivo', () => addNewObjective());
        objectivesSection.appendChild(addObjectiveBtn);
    }
    
    const techGrid = document.querySelector('.tech-grid');
    if (techGrid && !techGrid.querySelector('.add-btn')) {
        const addTechBtn = createAddButton('Agregar Tecnología', () => addNewTech());
        techGrid.appendChild(addTechBtn);
    }
    
    const certSection = document.querySelectorAll('.objectives-list')[2];
    if (certSection && !certSection.querySelector('.add-btn')) {
        const addCertBtn = createAddButton('Agregar Certificación', () => addNewCertification());
        certSection.appendChild(addCertBtn);
    }
    
    const skillsGrid = document.querySelector('.skills-grid');
    if (skillsGrid && !skillsGrid.querySelector('.add-btn')) {
        const addSkillBtn = createAddButton('Agregar Interés', () => addNewInterest());
        skillsGrid.appendChild(addSkillBtn);
    }
}

function createAddButton(text, onClick) {
    const btn = document.createElement('button');
    btn.textContent = '+ ' + text;
    btn.className = 'add-btn';
    btn.style.cssText = `
        background: rgba(255,255,255,0.1);
        border: 2px dashed rgba(255,255,255,0.3);
        color: inherit;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        margin-top: 10px;
        transition: all 0.3s ease;
    `;
    btn.onmouseover = () => btn.style.background = 'rgba(255,255,255,0.2)';
    btn.onmouseout = () => btn.style.background = 'rgba(255,255,255,0.1)';
    btn.onclick = onClick;
    return btn;
}

function addNewContact() {
    const contactsList = document.querySelectorAll('.objectives-list')[0];
    const newItem = document.createElement('div');
    newItem.className = 'objective-item';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Tipo: información (ej: Email: ejemplo@gmail.com)';
    input.style.cssText = 'width: 100%; background: transparent; border: 1px solid rgba(255,255,255,0.3); color: inherit; padding: 4px;';
    newItem.appendChild(input);
    contactsList.insertBefore(newItem, contactsList.querySelector('.add-btn'));
}

function addNewObjective() {
    const objectivesList = document.querySelectorAll('.objectives-list')[1];
    const newItem = document.createElement('div');
    newItem.className = 'objective-item';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Nuevo objetivo profesional...';
    input.style.cssText = 'width: 100%; background: transparent; border: 1px solid rgba(255,255,255,0.3); color: inherit; padding: 4px;';
    newItem.appendChild(input);
    objectivesList.insertBefore(newItem, objectivesList.querySelector('.add-btn'));
}

function addNewTech() {
    const techGrid = document.querySelector('.tech-grid');
    const newTech = document.createElement('div');
    newTech.className = 'tech-item';
    newTech.innerHTML = `
        <span class="tech-icon-expanded">?</span>
        <div class="tech-details">
            <input type="text" placeholder="Tecnología" style="
                background: transparent; 
                border: 1px solid rgba(255,255,255,0.3); 
                color: inherit; 
                padding: 2px 6px; 
                font-size: 0.9rem;
                border-radius: 4px;
                width: 80px;
                min-width: 60px;
                max-width: 150px;
            ">
            <select style="
                background: rgba(255,255,255,0.1); 
                border: 1px solid rgba(255,255,255,0.3); 
                color: inherit; 
                padding: 2px 4px; 
                font-size: 0.8rem;
                border-radius: 4px;
                width: auto;
                min-width: 80px;
            ">
                <option value="Básico">Básico</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
                <option value="Experto">Experto</option>
            </select>
        </div>
    `;
    
    const newInput = newTech.querySelector('input[type="text"]');
    newInput.addEventListener('input', function() {
        const minWidth = 60;
        const maxWidth = 150;
        const calculatedWidth = Math.max(this.value.length * 8 + 20, minWidth);
        this.style.width = Math.min(calculatedWidth, maxWidth) + 'px';
    });
    
    techGrid.insertBefore(newTech, techGrid.querySelector('.add-btn'));
}

function addNewCertification() {
    const certList = document.querySelectorAll('.objectives-list')[2];
    const newItem = document.createElement('div');
    newItem.className = 'objective-item';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Nombre de la certificación - Institución (Año)';
    input.style.cssText = 'width: 100%; background: transparent; border: 1px solid rgba(255,255,255,0.3); color: inherit; padding: 4px;';
    newItem.appendChild(input);
    certList.insertBefore(newItem, certList.querySelector('.add-btn'));
}

function addNewInterest() {
    const skillsGrid = document.querySelector('.skills-grid');
    const newSkill = document.createElement('input');
    newSkill.type = 'text';
    newSkill.placeholder = 'Nueva área de interés';
    newSkill.style.cssText = `
        background: transparent;
        border: 1px solid rgba(255,255,255,0.3);
        color: inherit;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        text-align: center;
        min-width: 120px;
    `;
    skillsGrid.insertBefore(newSkill, skillsGrid.querySelector('.add-btn'));
}


function makeReadOnly() {
    const titleInput = document.querySelector('.title-input');
    if (titleInput) {
        const h2 = document.createElement('h2');
        h2.className = 'expanded-title';
        h2.textContent = titleInput.value;
        titleInput.replaceWith(h2);
    }

    const statusSelect = document.querySelector('.status-select');
    if (statusSelect) {
        const badge = document.createElement('span');
        badge.className = `status-badge ${statusSelect.value === 'Disponible' ? 'active' : ''}`;
        badge.textContent = statusSelect.value;
        statusSelect.replaceWith(badge);
    }
    
    document.querySelectorAll('.stat-value input').forEach(input => {
        const parent = input.parentNode;
        parent.textContent = input.value;
    });

    const textarea = document.querySelector('textarea');
    if (textarea) {
        const p = document.createElement('p');
        p.className = 'section-content';
        // Usamos textContent + nodos de texto para los saltos de línea (evita XSS)
        textarea.value.split('\n').forEach((line, i, arr) => {
            p.appendChild(document.createTextNode(line));
            if (i < arr.length - 1) p.appendChild(document.createElement('br'));
        });
        textarea.replaceWith(p);
    }
    

    document.querySelectorAll('.objectives-list input').forEach(input => {
        if (input.value.trim()) {
            const span = document.createElement('span');
            span.textContent = input.value;
            input.replaceWith(span);
        } else {
            input.parentNode.remove(); 
        }
    });
    
    document.querySelectorAll('.tech-item').forEach(techItem => {
        const nameInput = techItem.querySelector('input[type="text"]');
        const levelSelect = techItem.querySelector('select');
        
        if (nameInput && levelSelect) {
            const techDetails = techItem.querySelector('.tech-details');
            if (nameInput.value.trim() && levelSelect.value) {
                techDetails.innerHTML = `
                    <span class="tech-name">${escapeHtml(nameInput.value)}</span>
                    <span class="tech-level">${escapeHtml(levelSelect.value)}</span>
                `;
            } else {
                techItem.remove(); 
            }
        }
    });
    
    document.querySelectorAll('.skills-grid input').forEach(input => {
        if (input.value.trim()) {
            const skillBadge = document.createElement('div');
            skillBadge.className = 'skill-badge';
            skillBadge.textContent = input.value;
            input.replaceWith(skillBadge);
        } else {
            input.remove(); 
        }
    });
    
    document.querySelectorAll('.add-btn').forEach(btn => btn.remove());

    removeUploadOverlays();
}
    function saveChanges() {
        console.log('Guardando cambios del perfil...');
        saveChangesToDatabase();
    }


    document.addEventListener('click', function(e) {
        if (e.target.closest('.project-card')) {
            setTimeout(initEditButton, 100); 
        }
    });

    document.querySelectorAll('.upload-overlay').forEach(overlay => overlay.remove());


    function handleStart(e) {
        isDragging = true;
        setPageChromeHidden(true);

        if (sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }

        if (e.type === 'mousedown') {
            e.preventDefault();
        }

        if (e.type === 'touchstart') {
            startY = e.touches[0].clientY;
        } else {
            startY = e.clientY;
        }

        offsetY = 0;
        card.style.transition = 'none';
    }

    function handleMove(e) {
        if (expandedView) return;
        if (!isDragging) return;

        let currentY;
        if (e.type === 'touchmove') {
            e.preventDefault();
            currentY = e.touches[0].clientY;
        } else {
            currentY = e.clientY;
        }

        offsetY = currentY - startY;

        if (offsetY > 0) offsetY = 0;

        card.style.transform = `translateY(${offsetY}px)`;
    }

    function handleEnd() {
        if (expandedView) return;
        if (!isDragging) return;
        isDragging = false;

        // Si se arrastró hacia arriba lo suficiente, mostrar vista expandida
        if (offsetY < -100) {
            card.style.transition = 'transform 0.5s ease';
            card.style.transform = `translateY(-${window.innerHeight}px)`;

            setTimeout(() => {
                expandedCard.classList.remove('hidden');
                requestAnimationFrame(() => {
                    expandedCard.classList.add('visible');
                });
                expandedView = true;

                // Resetear la card para cuando se cierre el expandido
                card.style.transition = 'none';
                card.style.opacity = '0';
                card.style.transform = 'translateY(0)';
                card.style.transition = 'opacity 0.3s ease';
                card.style.opacity = '1';
            }, 500);
        } else {
            // Volver a posición original
            card.style.transition = 'transform 0.5s ease';
            card.style.transform = 'translateY(0)';
            setTimeout(() => {
                if (!expandedView && !isDragging) {
                    setPageChromeHidden(false);
                }
            }, 220);
        }
    }

    function resetCard() {
        card.style.transition = 'none';
        card.style.opacity = '0';
        card.style.transform = 'translateY(0)';

        setTimeout(() => {
            card.style.transition = 'opacity 0.3s ease';
            card.style.opacity = '1';
        }, 100);
    }

    closeExpanded.addEventListener('click', () => {
        expandedCard.classList.remove('visible');
        setTimeout(() => {
            expandedCard.classList.add('hidden');
            expandedView = false;
            setPageChromeHidden(false);
        }, 400);
    });

    // Panel de configuración (botón gear)
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
            min-width: 260px; max-width: 320px; width: 90%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            text-align: center; color: #f3e8ff;">
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

    document.querySelectorAll('.menu-icon.gear').forEach(btn => {
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', () => {
            settingsPanel.style.display = 'flex';
        });
    });

    document.getElementById('settings-close-btn').addEventListener('click', () => {
        settingsPanel.style.display = 'none';
    });

    document.getElementById('settings-logout-btn').addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/';
    });

});
