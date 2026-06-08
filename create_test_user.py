"""
Crea un usuario de testing y le asigna los 8 proyectos migrados.
Ejecutar UNA sola vez: python create_test_user.py
"""

import requests
from werkzeug.security import generate_password_hash

SUPABASE_URL = "https://hareuuvxfrepfwirhrkw.supabase.co/rest/v1"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcmV1dXZ4ZnJlcGZ3aXJocmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MjEzMjksImV4cCI6MjA5NTk5NzMyOX0.Aplt58VKlVyeA6zFGS_4_rl8668LTxHFcZOKVrbGoOs"

HEADERS = {
    "apikey":        SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type":  "application/json",
    "Prefer":        "return=representation",
}

# Credenciales del usuario de testing
TEST_USER = {
    "firstName":      "Demo",
    "lastName":       "TomberS",
    "email":          "demo@tombers.com",
    "username":       "demo_tombers",
    "password":       generate_password_hash("tombers2024"),
    "skills":         ["Python", "Flask", "JavaScript", "React"],
    "age":            "25",
    "languages":      "Español",
    "specialization": "Full Stack",
    "bio":            "Usuario de demostración de TomberS.",
    "status":         "Disponible",
    "certifications": [],
    "interests":      ["Desarrollo Web", "Startups", "Open Source"],
    "objectives":     ["Liderar proyectos innovadores", "Conectar con talento real"],
}

def create_user():
    # Verificar si ya existe
    r = requests.get(f"{SUPABASE_URL}/users", headers=HEADERS,
                     params={"email": "eq.demo@tombers.com", "select": "id"})
    existing = r.json()
    if existing:
        print(f"El usuario ya existe con id={existing[0]['id']}")
        return existing[0]['id']

    r = requests.post(f"{SUPABASE_URL}/users", headers=HEADERS, json=TEST_USER)
    r.raise_for_status()
    user = r.json()[0]
    print(f"✓ Usuario creado: id={user['id']}, username={user['username']}")
    return user['id']

def assign_projects(user_id):
    # Obtener proyectos sin dueño
    r = requests.get(f"{SUPABASE_URL}/projects", headers=HEADERS,
                     params={"creator_id": "is.null", "select": "id,title"})
    projects = r.json()

    if not projects:
        print("No hay proyectos sin dueño para asignar.")
        return

    print(f"\nAsignando {len(projects)} proyectos al usuario demo...")
    for p in projects:
        requests.patch(f"{SUPABASE_URL}/projects", headers=HEADERS,
                       params={"id": f"eq.{p['id']}"},
                       json={"creator_id": user_id})
        print(f"  ✓ '{p['title']}'")

if __name__ == "__main__":
    user_id = create_user()
    assign_projects(user_id)
    print("\n✅ Listo.")
    print("\n--- CREDENCIALES DE TESTING ---")
    print("  Email:    demo@tombers.com")
    print("  Password: tombers2024")
    print("  Username: demo_tombers")
