"""
Reemplaza todos los proyectos existentes por proyectos de demo
que cubren todas las combinaciones de filtros (duración × org_type).

Ejecutar: python seed_projects.py
"""

import requests, json

SUPABASE_URL = "https://hareuuvxfrepfwirhrkw.supabase.co/rest/v1"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcmV1dXZ4ZnJlcGZ3aXJocmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MjEzMjksImV4cCI6MjA5NTk5NzMyOX0.Aplt58VKlVyeA6zFGS_4_rl8668LTxHFcZOKVrbGoOs"

HEADERS = {
    "apikey":        SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type":  "application/json",
    "Prefer":        "return=representation",
}

# ── Proyectos demo ──────────────────────────────────────────────────────────
# Combinaciones cubiertas:
#   duración:  corto · medio · largo · indefinido
#   org_type:  académico · open_source · investigación · ong · personal
# ─────────────────────────────────────────────────────────────────────────────
PROJECTS = [
    {
        "title":       "App de estudio colaborativo",
        "description": "Plataforma web para que estudiantes universitarios armen grupos de estudio, compartan apuntes y se evalúen entre pares. Sin rol docente, 100% peer-to-peer.",
        "technologies": ["React", "Node.js", "Socket.IO", "PostgreSQL"],
        "skills_needed": ["Frontend", "Backend", "Diseño UX"],
        "objectives": ["Lanzar MVP para un curso piloto", "Iterar con feedback real de usuarios"],
        "stats": {
            "team_size":   "2-4 personas",
            "duration":    "2 semanas",
            "language":    "Español",
            "org_type":    "académico",
            "nature":      "mvp",
            "stage":       "prototipo",
            "compensation": "voluntario"
        },
        "declared": True,
        "moderation_status": "active",
    },
    {
        "title":       "Librería de componentes accesibles",
        "description": "Colección open source de componentes UI que cumplen WCAG 2.1 AA desde el día uno. Pensada para proyectos que quieren accesibilidad sin configuración extra.",
        "technologies": ["TypeScript", "Stencil.js", "CSS Custom Properties"],
        "skills_needed": ["Accesibilidad web", "TypeScript", "Documentación técnica"],
        "objectives": ["Publicar en npm con 20+ componentes", "Escribir Storybook completo"],
        "stats": {
            "team_size":   "3-5 personas",
            "duration":    "1 mes",
            "language":    "Inglés",
            "org_type":    "open_source",
            "nature":      "open_source",
            "stage":       "prototipo",
            "compensation": "voluntario"
        },
        "declared": True,
        "moderation_status": "active",
    },
    {
        "title":       "Análisis de micrometeoros en tiempo real",
        "description": "Sistema de ingesta y visualización de datos de estaciones meteorológicas de bajo costo (ESP32 + sensores DHT22). Los datos se publican abiertamente para investigación climática.",
        "technologies": ["Python", "InfluxDB", "Grafana", "MQTT", "MicroPython"],
        "skills_needed": ["IoT", "Python", "Visualización de datos"],
        "objectives": ["Conectar 5 estaciones en producción", "Publicar dataset con licencia abierta"],
        "stats": {
            "team_size":   "2-3 personas",
            "duration":    "3 meses",
            "language":    "Español",
            "org_type":    "investigación",
            "nature":      "research",
            "stage":       "prototipo",
            "compensation": "voluntario"
        },
        "declared": True,
        "moderation_status": "active",
    },
    {
        "title":       "Plataforma de voluntariado digital para ONGs",
        "description": "Conecta voluntarios tech con ONGs que necesitan ayuda puntual: un sitio, una automatización, una base de datos. Las ONGs publican microtareas y los voluntarios las resuelven en su tiempo libre.",
        "technologies": ["Vue.js", "Django", "Celery", "Redis"],
        "skills_needed": ["Full Stack", "DevOps", "Gestión de proyectos"],
        "objectives": ["Onboardear 10 ONGs piloto", "Completar 50 microtareas en beta"],
        "stats": {
            "team_size":   "4-6 personas",
            "duration":    "4 meses",
            "language":    "Español",
            "org_type":    "ong",
            "nature":      "impacto_social",
            "stage":       "idea",
            "compensation": "voluntario"
        },
        "declared": True,
        "moderation_status": "active",
    },
    {
        "title":       "Framework de productividad personal",
        "description": "Herramienta local-first para gestionar objetivos, tareas y hábitos sin depender de la nube. Los datos viven en el dispositivo del usuario; la sincronización es opcional y cifrada.",
        "technologies": ["Rust", "Tauri", "SQLite", "SvelteKit"],
        "skills_needed": ["Rust", "Desktop apps", "Diseño de sistemas"],
        "objectives": ["Versión desktop para Windows y macOS", "Plugin de sincronización cifrada"],
        "stats": {
            "team_size":   "1-3 personas",
            "duration":    "12 meses",
            "language":    "Inglés",
            "org_type":    "personal",
            "nature":      "open_source",
            "stage":       "idea",
            "compensation": "voluntario"
        },
        "declared": True,
        "moderation_status": "active",
    },
    {
        "title":       "Sistema de tutoría entre pares universitarios",
        "description": "Plataforma que facilita que estudiantes avanzados ofrezcan tutorías a estudiantes de primeros años, con seguimiento de sesiones y feedback para la institución educativa.",
        "technologies": ["Next.js", "Supabase", "WebRTC", "Tailwind"],
        "skills_needed": ["Frontend", "Backend", "Bases de datos"],
        "objectives": ["Piloto en una facultad", "Módulo de videollamada integrado"],
        "stats": {
            "team_size":   "3-5 personas",
            "duration":    "1 año",
            "language":    "Español",
            "org_type":    "académico",
            "nature":      "portfolio",
            "stage":       "idea",
            "compensation": "voluntario"
        },
        "declared": True,
        "moderation_status": "active",
    },
    {
        "title":       "CLI de automatización para workflows DevOps",
        "description": "Herramienta de línea de comandos open source que genera pipelines de CI/CD personalizados a partir de la descripción del proyecto. Soporta GitHub Actions, GitLab CI y Jenkins.",
        "technologies": ["Go", "Cobra CLI", "YAML", "Docker"],
        "skills_needed": ["Go", "DevOps", "CI/CD"],
        "objectives": ["Soporte para los 3 providers principales", "Publicar en Homebrew y apt"],
        "stats": {
            "team_size":   "2-4 personas",
            "duration":    "indefinido",
            "language":    "Inglés",
            "org_type":    "open_source",
            "nature":      "open_source",
            "stage":       "mvp",
            "compensation": "voluntario"
        },
        "declared": True,
        "moderation_status": "active",
    },
    {
        "title":       "Bot de Telegram para gestión de gastos grupales",
        "description": "Bot que registra gastos compartidos dentro de un grupo de Telegram y calcula automáticamente quién le debe qué a quién, sin necesidad de una app externa.",
        "technologies": ["Python", "python-telegram-bot", "SQLite"],
        "skills_needed": ["Python", "Bots", "Lógica de negocio"],
        "objectives": ["Lanzar en producción con 3 grupos beta", "Soporte multi-moneda"],
        "stats": {
            "team_size":   "1-2 personas",
            "duration":    "3 semanas",
            "language":    "Español",
            "org_type":    "personal",
            "nature":      "portfolio",
            "stage":       "idea",
            "compensation": "voluntario"
        },
        "declared": True,
        "moderation_status": "active",
    },
    {
        "title":       "API abierta de indicadores socioeconómicos regionales",
        "description": "Recopila, estandariza y expone como API REST los datos de organismos públicos (INDEC, Banco Mundial, etc.) para facilitar investigaciones y periodismo de datos.",
        "technologies": ["FastAPI", "Pandas", "PostgreSQL", "Docker"],
        "skills_needed": ["Python", "APIs REST", "ETL / datos abiertos"],
        "objectives": ["Cubrir 5 fuentes de datos públicas", "Documentación con OpenAPI"],
        "stats": {
            "team_size":   "2-4 personas",
            "duration":    "2 meses",
            "language":    "Español",
            "org_type":    "investigación",
            "nature":      "open_source",
            "stage":       "prototipo",
            "compensation": "voluntario"
        },
        "declared": True,
        "moderation_status": "active",
    },
    {
        "title":       "Red de mapeo colaborativo de comedores comunitarios",
        "description": "Mapa interactivo donde vecinos y voluntarios registran comedores, merenderos y ollas populares en su barrio. Los datos son abiertos y exportables para que organizaciones los usen.",
        "technologies": ["Leaflet.js", "Flask", "PostGIS", "OpenStreetMap"],
        "skills_needed": ["Mapas web", "Python", "Diseño de BD geoespacial"],
        "objectives": ["Lanzar en 3 municipios piloto", "API pública para descarga de datos"],
        "stats": {
            "team_size":   "3-5 personas",
            "duration":    "6 meses",
            "language":    "Español",
            "org_type":    "ong",
            "nature":      "impacto_social",
            "stage":       "prototipo",
            "compensation": "voluntario"
        },
        "declared": True,
        "moderation_status": "active",
    },
]

def get_demo_creator_id():
    """Obtiene el id del usuario demo (demo@tombers.com) si existe."""
    r = requests.get(f"{SUPABASE_URL}/users", headers=HEADERS,
                     params={"email": "eq.demo@tombers.com", "select": "id"})
    data = r.json()
    return data[0]["id"] if data else None

def delete_all_projects():
    """Elimina TODOS los proyectos existentes."""
    # Obtener ids
    r = requests.get(f"{SUPABASE_URL}/projects", headers=HEADERS, params={"select": "id,title"})
    projects = r.json()
    if not projects:
        print("No hay proyectos para eliminar.")
        return
    print(f"Eliminando {len(projects)} proyectos existentes...")
    for p in projects:
        requests.delete(f"{SUPABASE_URL}/projects", headers=HEADERS,
                        params={"id": f"eq.{p['id']}"})
        print(f"  ✗ '{p['title']}'")

def insert_projects(creator_id):
    print(f"\nInsertando {len(PROJECTS)} proyectos demo...")
    for p in PROJECTS:
        payload = {**p, "creator_id": creator_id}
        r = requests.post(f"{SUPABASE_URL}/projects", headers=HEADERS, json=payload)
        if r.ok:
            inserted = r.json()
            title = inserted[0]["title"] if inserted else p["title"]
            org   = p["stats"]["org_type"]
            dur   = p["stats"]["duration"]
            print(f"  ✓ '{title}'  [{org} · {dur}]")
        else:
            print(f"  ✗ ERROR en '{p['title']}': {r.text}")

if __name__ == "__main__":
    creator_id = get_demo_creator_id()
    if not creator_id:
        print("⚠️  No se encontró el usuario demo (demo@tombers.com).")
        print("   Ejecutá primero: python create_test_user.py")
        print("   Los proyectos se crearán sin dueño (creator_id=null).")

    delete_all_projects()
    insert_projects(creator_id)

    print("\n✅ Seed completado.")
    print("\nCombinaciones de filtros cubiertas:")
    print("  Duración  → corto (2 sem, 1 mes, 3 sem) · medio (2-4 meses) · largo (6 m, 1 año, 12 m) · indefinido")
    print("  Org type  → académico · open_source · investigación · ong · personal")
