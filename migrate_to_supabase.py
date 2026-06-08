"""
Script de migración: projects_database.json → Supabase
Ejecutar UNA sola vez: python migrate_to_supabase.py
"""

import json
import requests

SUPABASE_URL = "https://hareuuvxfrepfwirhrkw.supabase.co/rest/v1"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcmV1dXZ4ZnJlcGZ3aXJocmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MjEzMjksImV4cCI6MjA5NTk5NzMyOX0.Aplt58VKlVyeA6zFGS_4_rl8668LTxHFcZOKVrbGoOs"

HEADERS = {
    "apikey":        SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type":  "application/json",
    "Prefer":        "return=representation",
}

def migrate_projects():
    with open('projects_database.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    projects = data.get('projects', [])
    print(f"Migrando {len(projects)} proyectos...\n")

    ok, errors = 0, 0
    for project in projects:
        project_data = {k: v for k, v in project.items() if k != 'id'}
        r = requests.post(f"{SUPABASE_URL}/projects", headers=HEADERS, json=project_data)
        if r.status_code in (200, 201):
            print(f"  ✓ '{project['title']}'")
            ok += 1
        else:
            print(f"  ✗ '{project['title']}': {r.status_code} — {r.text}")
            errors += 1

    print(f"\nMigración terminada: {ok} ok, {errors} errores")
    print("\nNota: los usuarios no se migraron (el hash de contraseñas cambió).")
    print("Los usuarios existentes deben registrarse de nuevo.")

if __name__ == '__main__':
    migrate_projects()
