// Archivo: scripts/projects.js - Versión corregida con gestión de eventos mejorada

class ProjectsManager {
    constructor() {
        this.projects = [];
        this.currentProjectIndex = 0;
        this.viewedProjects = new Set();
        this.apiUrl = '/api/projects';
        this.eventHandlersAttached = false; // Control de eventos
        this.init();
    }

    async init() {
        await this.loadProjects();
        this.loadViewedProjects();
        this.renderCurrentProject();
        this.setupEventListeners();
    }

    async loadProjects() {
        // Mostrar skeleton mientras carga
        const cardContainer = document.querySelector('.card-container');
        if (cardContainer) {
            const skeleton = document.createElement('div');
            skeleton.className = 'card-skeleton';
            skeleton.id = 'card-skeleton';
            cardContainer.appendChild(skeleton);
        }

        try {
            const response = await fetch(this.apiUrl);
            this.projects = await response.json();

            const skeleton = document.getElementById('card-skeleton');
            if (skeleton) skeleton.remove();

            if (this.projects.length === 0) {
                this.showNoProjectsMessage();
            }
        } catch (error) {
            console.error('Error cargando proyectos:', error);
            const skeleton = document.getElementById('card-skeleton');
            if (skeleton) skeleton.remove();
            this.showNoProjectsMessage();
        }
    }

    loadViewedProjects() {
        // Usar sessionStorage para que los proyectos vistos persistan
        // aunque el usuario navegue a otra página y vuelva
        const stored = sessionStorage.getItem('stackr_viewedProjects');
        this.viewedProjects = stored
            ? new Set(JSON.parse(stored))
            : new Set();
    }

    saveViewedProjects() {
        sessionStorage.setItem(
            'stackr_viewedProjects',
            JSON.stringify([...this.viewedProjects])
        );
    }

    markProjectAsViewed(projectId) {
        this.viewedProjects.add(projectId);
        this.saveViewedProjects();
        console.log(`Proyecto ${projectId} marcado como visto. Total vistos: ${this.viewedProjects.size}`);
    }

    getUnviewedProjects() {
        return this.projects.filter(project => !this.viewedProjects.has(project.id));
    }

    allProjectsViewed() {
        return this.projects.length > 0 && this.viewedProjects.size >= this.projects.length;
    }

    resetViewedProjects() {
        this.viewedProjects.clear();
        sessionStorage.removeItem('stackr_viewedProjects');
    }

    showNoProjectsMessage() {
        const cardContainer = document.querySelector('.card-container');
        if (cardContainer) {
            cardContainer.innerHTML = `
                <div class="no-projects-message">
                    <div class="no-projects-icon">📋</div>
                    <h2>No hay proyectos disponibles</h2>
                    <p>No se han encontrado proyectos en la base de datos.</p>
                    <p>¡Sé el primero en crear un proyecto!</p>
                </div>
            `;
        }
        
        const statusIndicators = document.getElementById('status-indicators');
        if (statusIndicators) {
            statusIndicators.style.display = 'none';
        }
    }

    showAllProjectsViewedMessage() {
        const cardContainer = document.querySelector('.card-container');
        if (cardContainer) {
            cardContainer.innerHTML = `
                <div class="all-projects-viewed-message">
                    <div class="all-projects-icon">🎉</div>
                    <h2>¡Has visto todos los proyectos!</h2>
                    <p>Ya has revisado todos los ${this.projects.length} proyectos disponibles.</p>
                    <p>¿Quieres verlos nuevamente?</p>
                    <button class="restart-button" onclick="window.projectsManager.restartProjects()">
                        Ver proyectos otra vez
                    </button>
                </div>
            `;
        }
        
        const statusIndicators = document.getElementById('status-indicators');
        if (statusIndicators) {
            statusIndicators.style.display = 'none';
        }
    }

    restartProjects() {
        this.resetViewedProjects();
        this.currentProjectIndex = 0;
        
        const statusIndicators = document.getElementById('status-indicators');
        if (statusIndicators) {
            statusIndicators.style.display = 'flex';
        }
        
        // Forzar recreación completa de la tarjeta
        this.recreateProjectCard();
        this.renderCurrentProject();
    }

    // MÉTODO NUEVO: Recrear completamente la tarjeta con estructura HTML
    recreateProjectCard() {
        const cardContainer = document.querySelector('.card-container');
        if (cardContainer) {
            cardContainer.innerHTML = `
                <div class="project-card" id="project-card">
                    <div class="card-title-row">
                        <img src="/static/imagenes/logoTomberS.png" alt="Logo Tomber Sur" class="logo-img-mini">
                        <h2 class="card-title">Nombre proyecto</h2>
                    </div>
                    <div class="card-image"></div>
                    <div class="card-stats">
                        <span><span class="fluent--people-team-16-filled iconos"></span><span class="stats-text">07/23</span></span>
                        <span><span class="tabler--clock iconos"></span><span class="stats-text">Indefinido</span></span>
                        <span><span class="material-symbols--translate iconos"></span><span class="stats-text">Español</span></span>
                        <span><span class="mdi--tools iconos"></span><span class="stats-text">Full Stack</span></span>
                    </div>
                    <div class="card-description">
                        Lorem ipsum dolor sit amet consectetur adipiscing elit...
                    </div>
                    <div class="card-tech">
                        <div class="tech-icon">Py</div>
                        <div class="tech-icon">Html</div>
                        <div class="tech-icon">Css</div>
                        <div class="tech-icon">Js</div>
                    </div>
                    <div class="actions">
                        <svg class="rotate-icon" viewBox="0 0 24 24">
                            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
                        </svg>
                    </div>
                </div>
            `;
            
            // Resetear el flag de eventos y reconectar
            this.eventHandlersAttached = false;
            this.setupEventListeners();
        }
    }

    renderCurrentProject() {
        if (this.projects.length === 0) {
            this.showNoProjectsMessage();
            return;
        }

        if (this.allProjectsViewed()) {
            this.showAllProjectsViewedMessage();
            return;
        }

        const unviewedProjects = this.getUnviewedProjects();
        
        if (unviewedProjects.length === 0) {
            this.showAllProjectsViewedMessage();
            return;
        }

        const project = unviewedProjects[0];
        this.updateProjectCard(project);
        this.updateExpandedCard(project);
        
        this.currentProjectIndex = this.projects.findIndex(p => p.id === project.id);
    }

    updateProjectCard(project) {
        const cardContainer = document.querySelector('.card-container');

        // Si no existe la tarjeta, recrearla completamente
        if (cardContainer && !cardContainer.querySelector('.project-card')) {
            this.recreateProjectCard();
        }

        // Fade-in suave al cambiar proyecto
        const card = document.getElementById('project-card');
        if (card) {
            card.classList.remove('card-entering');
            void card.offsetWidth; // forzar reflow
            card.classList.add('card-entering');
        }

        // Actualizar contenido de la carta
        const titleElement = document.querySelector('.card-title');
        if (titleElement) titleElement.textContent = project.title;

        const imageElement = document.querySelector('.card-image');
        if (imageElement && project.image_url) {
            imageElement.style.backgroundImage = `url('${project.image_url}')`;
        }

        this.updateStats(project.stats);
        const descElement = document.querySelector('.card-description');
        if (descElement) descElement.textContent = project.description;
        this.updateTechnologies(project.technologies);

        // Asegurar que los eventos están conectados
        if (!this.eventHandlersAttached) {
            this.setupEventListeners();
        }
    }

    updateStats(stats) {
        const statsElements = document.querySelectorAll('.stats-text');
        if (statsElements.length >= 4) {
            statsElements[0].textContent = `${stats.team_current}/${stats.team_max}`;
            statsElements[1].textContent = stats.duration;
            statsElements[2].textContent = stats.language;
            statsElements[3].textContent = stats.type;
        }
    }

    updateTechnologies(technologies) {
        const techContainer = document.querySelector('.card-tech');
        if (!techContainer) return;

        techContainer.innerHTML = '';
        technologies.forEach(tech => {
            const techIcon = document.createElement('div');
            techIcon.className = 'tech-icon';
            techIcon.textContent = tech.icon;
            techIcon.title = tech.name;
            techContainer.appendChild(techIcon);
        });
    }

    updateExpandedCard(project) {
        const expandedTitle = document.querySelector('.expanded-title');
        if (expandedTitle) expandedTitle.textContent = project.title;

        const expandedImage = document.querySelector('.expanded-image img');
        if (expandedImage && project.image_url) {
            expandedImage.src = project.image_url;
            expandedImage.alt = `Preview de ${project.title}`;
        }

        const sectionContent = document.querySelector('.section-content');
        if (sectionContent) sectionContent.textContent = project.description;

        this.updateExpandedStats(project.stats);
        this.updateExpandedTechnologies(project.technologies);

        if (project.objectives) {
            this.updateObjectives(project.objectives);
        }

        if (project.skills_needed) {
            this.updateSkillsNeeded(project.skills_needed);
        }

        if (project.progress) {
            this.updateProgress(project.progress);
        }
    }

    updateExpandedStats(stats) {
        const statValues = document.querySelectorAll('.stat-value');
        if (statValues.length >= 4) {
            statValues[0].textContent = `${stats.team_current}/${stats.team_max} miembros`;
            statValues[1].textContent = stats.duration;
            statValues[2].textContent = stats.language;
            statValues[3].textContent = stats.type;
        }
    }

    updateExpandedTechnologies(technologies) {
        const techGrid = document.querySelector('.tech-grid');
        if (!techGrid) return;

        techGrid.innerHTML = '';
        technologies.forEach(tech => {
            const techItem = document.createElement('div');
            techItem.className = 'tech-item';
            techItem.innerHTML = `
                <span class="tech-icon-expanded">${tech.icon}</span>
                <span class="tech-name">${tech.name}</span>
            `;
            techGrid.appendChild(techItem);
        });
    }

    updateObjectives(objectives) {
        const objectivesList = document.querySelector('.objectives-list');
        if (!objectivesList) return;

        objectivesList.innerHTML = '';
        objectives.forEach(objective => {
            const objectiveItem = document.createElement('div');
            objectiveItem.className = 'objective-item';
            objectiveItem.innerHTML = `
                <div class="objective-icon">${objective.icon}</div>
                <span>${objective.text}</span>
            `;
            objectivesList.appendChild(objectiveItem);
        });
    }

    updateSkillsNeeded(skills) {
        const skillsGrid = document.querySelector('.skills-grid');
        if (!skillsGrid) return;

        skillsGrid.innerHTML = '';
        skills.forEach(skill => {
            const skillBadge = document.createElement('div');
            skillBadge.className = 'skill-badge';
            skillBadge.textContent = skill;
            skillsGrid.appendChild(skillBadge);
        });
    }

    updateProgress(progress) {
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${progress}% Completado`;
    }

    getNextUnviewedProject() {
        const unviewedProjects = this.getUnviewedProjects();
        return unviewedProjects.length > 0 ? unviewedProjects[0] : null;
    }

    nextProject() {
        if (this.projects.length === 0) return;
        
        const currentProject = this.projects[this.currentProjectIndex];
        if (currentProject) {
            this.markProjectAsViewed(currentProject.id);
        }
        
        this.renderCurrentProject();
        
        const unviewedCount = this.getUnviewedProjects().length;
        console.log(`Proyectos restantes por ver: ${unviewedCount}`);
    }

    previousProject() {
        if (this.projects.length === 0) return;
        
        this.currentProjectIndex = (this.currentProjectIndex - 1 + this.projects.length) % this.projects.length;
        const project = this.projects[this.currentProjectIndex];
        this.updateProjectCard(project);
        this.updateExpandedCard(project);
        console.log(`Mostrando proyecto ${this.currentProjectIndex + 1} de ${this.projects.length}`);
    }

    getRandomProject() {
        const unviewedProjects = this.getUnviewedProjects();
        if (unviewedProjects.length === 0) {
            this.showAllProjectsViewedMessage();
            return;
        }
        
        const randomProject = unviewedProjects[Math.floor(Math.random() * unviewedProjects.length)];
        this.currentProjectIndex = this.projects.findIndex(p => p.id === randomProject.id);
        this.renderCurrentProject();
    }

    // MÉTODO MEJORADO: Setup de event listeners con control de duplicados
    setupEventListeners() {
        // Evitar duplicar event listeners
        if (this.eventHandlersAttached) {
            return;
        }

        // Listener para el botón de refresh
        const rotateIcon = document.querySelector('.rotate-icon');
        if (rotateIcon) {
            rotateIcon.addEventListener('click', () => {
                this.previousProject();
            });
        }

        // Conectar los manejadores de swipe usando la función global
        const newCard = document.getElementById('project-card');
        if (newCard && window.setupSwipeHandlers) {
            console.log('Conectando eventos de swipe a la nueva tarjeta');
            window.setupSwipeHandlers(newCard);
        }

        this.setupCardEventListeners();
        this.eventHandlersAttached = true;
    }

    setupCardEventListeners() {
        const joinButton = document.querySelector('.action-btn.primary');
        if (joinButton) {
            joinButton.addEventListener('click', () => {
                if (this.projects.length > 0) {
                    const currentProject = this.projects[this.currentProjectIndex];
                    if (currentProject) {
                        this.joinProject(currentProject);
                    }
                }
            });
        }
    }

    async joinProject(project) {
        try {
            const r = await fetch('/api/interests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_id: project.id })
            });
            const data = await r.json();

            const toast = document.createElement('div');
            toast.textContent = r.ok
                ? `¡Mostraste interés en "${project.title}"! 🚀`
                : (data.error || 'No se pudo registrar el interés');
            toast.style.cssText = `
                position:fixed; bottom:90px; left:50%; transform:translateX(-50%);
                background:${r.ok ? '#667eea' : '#e74c3c'};
                color:white; padding:12px 24px; border-radius:24px;
                font-size:0.9rem; z-index:9999;
                box-shadow:0 4px 16px rgba(0,0,0,0.3);`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2500);
        } catch (error) {
            console.error('Error al unirse al proyecto:', error);
        }
    }

    async searchProjects(query) {
        try {
            const response = await fetch(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`);
            const filteredProjects = await response.json();
            this.projects = filteredProjects;
            this.resetViewedProjects();
            this.currentProjectIndex = 0;
            this.eventHandlersAttached = false; // Reset flag
            this.renderCurrentProject();
        } catch (error) {
            console.error('Error en búsqueda:', error);
        }
    }

    async getProjectById(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`);
            return await response.json();
        } catch (error) {
            console.error('Error obteniendo proyecto:', error);
            return null;
        }
    }

    handleCardSwipe(direction) {
        if (this.projects.length === 0) return;
        
        if (direction === 'left' || direction === 'right') {
            console.log(`Carta deslizada hacia ${direction}, marcando como visto y cargando siguiente...`);
            this.nextProject();
        }
    }

    getViewingStats() {
        return {
            total: this.projects.length,
            viewed: this.viewedProjects.size,
            remaining: this.projects.length - this.viewedProjects.size,
            percentage: this.projects.length > 0 ? Math.round((this.viewedProjects.size / this.projects.length) * 100) : 0
        };
    }
}

// Inicializar el gestor de proyectos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.projectsManager = new ProjectsManager();
});

// Funciones auxiliares para integración
function loadNextProject() {
    if (window.projectsManager) {
        window.projectsManager.nextProject();
    }
}

function loadPreviousProject() {
    if (window.projectsManager) {
        window.projectsManager.previousProject();
    }
}

function refreshProject() {
    if (window.projectsManager) {
        window.projectsManager.previousProject();
    }
}

function handleSwipe(direction) {
    if (window.projectsManager) {
        window.projectsManager.handleCardSwipe(direction);
    }
}

function getViewingStats() {
    if (window.projectsManager) {
        return window.projectsManager.getViewingStats();
    }
    return null;
}