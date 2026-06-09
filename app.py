from flask import Flask, render_template, jsonify, request, redirect, url_for, session
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import requests as http
import os
import uuid
from dotenv import load_dotenv

load_dotenv()  # carga variables desde .env si existe

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-local-only')

# --- Conexión a Supabase via REST API ---
SUPABASE_URL     = os.environ.get('SUPABASE_URL', '')          # ej: https://xxx.supabase.co/rest/v1
SUPABASE_KEY     = os.environ.get('SUPABASE_KEY', '')
SUPABASE_PROJECT = SUPABASE_URL.replace('/rest/v1', '')        # ej: https://xxx.supabase.co
SUPABASE_STORAGE = f"{SUPABASE_PROJECT}/storage/v1"
SUPABASE_BUCKET  = 'images'

HEADERS = {
    "apikey":        SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type":  "application/json",
    "Prefer":        "return=representation",  # devuelve la fila insertada/actualizada
}


def sb_get(table, filters=None):
    """SELECT * FROM table WHERE filters"""
    params = {"select": "*"}
    if filters:
        params.update(filters)
    r = http.get(f"{SUPABASE_URL}/{table}", headers=HEADERS, params=params)
    r.raise_for_status()
    return r.json()


def sb_insert(table, data):
    """INSERT INTO table VALUES (data) RETURNING *"""
    r = http.post(f"{SUPABASE_URL}/{table}", headers=HEADERS, json=data)
    r.raise_for_status()
    result = r.json()
    return result[0] if isinstance(result, list) else result


def sb_update(table, filters, data):
    """UPDATE table SET data WHERE filters RETURNING *"""
    r = http.patch(f"{SUPABASE_URL}/{table}", headers=HEADERS, params=filters, json=data)
    r.raise_for_status()
    result = r.json()
    return result[0] if isinstance(result, list) and result else None


def sb_delete(table, filters):
    """DELETE FROM table WHERE filters RETURNING *"""
    r = http.delete(f"{SUPABASE_URL}/{table}", headers=HEADERS, params=filters)
    r.raise_for_status()
    result = r.json()
    return result[0] if isinstance(result, list) and result else None


# --- Helpers de contraseña ---
def hash_password(password):
    return generate_password_hash(password)

def verify_password(password, hashed_password):
    return check_password_hash(hashed_password, password)


# ============================================================
# RUTAS DE AUTENTICACIÓN
# ============================================================

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()

        required_fields = ['firstName', 'lastName', 'email', 'username', 'password']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'El campo {field} es requerido'}), 400

        # Verificar duplicados
        if sb_get('users', {'email': f'eq.{data["email"]}'}):
            return jsonify({'error': 'El email ya está registrado'}), 400
        if sb_get('users', {'username': f'eq.{data["username"]}'}):
            return jsonify({'error': 'El nombre de usuario ya está en uso'}), 400

        new_user = {
            'firstName':      data['firstName'],
            'lastName':       data['lastName'],
            'email':          data['email'],
            'username':       data['username'],
            'password':       hash_password(data['password']),
            'skills':         data.get('skills', '').split(',') if isinstance(data.get('skills'), str) and data.get('skills') else [],
            'age':            data.get('age', ''),
            'birthDate':      data.get('birthDate', ''),
            'languages':      data.get('languages', ''),
            'specialization': data.get('specialization', ''),
            'phone':          data.get('phone', ''),
            'linkedin':       data.get('linkedin', ''),
            'github':         data.get('github', ''),
            'portfolio':      data.get('portfolio', ''),
            'bio':            data.get('bio', ''),
            'status':         'Disponible',
            'certifications': data.get('certifications', []),
            'interests':      data.get('interests', []),
        }

        user = sb_insert('users', new_user)
        session['user_id'] = user['id']
        session['username'] = user['username']

        return jsonify({
            'message': 'Usuario registrado exitosamente',
            'user': {
                'id': user['id'], 'username': user['username'],
                'firstName': user['firstName'], 'lastName': user['lastName'],
            }
        }), 201

    except Exception as e:
        return jsonify({'error': f'Error en el registro: {str(e)}'}), 500


@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email y contraseña son requeridos'}), 400

        users = sb_get('users', {'email': f'eq.{data["email"]}'})
        if not users:
            return jsonify({'error': 'Email o contraseña incorrectos'}), 401

        user = users[0]
        if not verify_password(data['password'], user['password']):
            return jsonify({'error': 'Email o contraseña incorrectos'}), 401

        session['user_id'] = user['id']
        session['username'] = user['username']

        return jsonify({
            'message': 'Inicio de sesión exitoso',
            'user': {
                'id': user['id'], 'username': user['username'],
                'firstName': user['firstName'], 'lastName': user['lastName'],
            }
        }), 200

    except Exception as e:
        return jsonify({'error': f'Error en el login: {str(e)}'}), 500


@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Sesión cerrada exitosamente'}), 200


# ============================================================
# RUTAS DE PERFIL DE USUARIO
# ============================================================

@app.route('/api/user/profile')
def get_user_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'No hay sesión activa'}), 401

    users = sb_get('users', {'id': f'eq.{session["user_id"]}'})
    if not users:
        return jsonify({'error': 'Usuario no encontrado'}), 404

    user = users[0]
    user.pop('password', None)
    return jsonify(user)


@app.route('/api/user/profile', methods=['PUT'])
def update_user_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'No hay sesión activa'}), 401
    try:
        data = request.get_json()
        allowed_fields = [
            'firstName', 'lastName', 'age', 'birthDate', 'languages',
            'specialization', 'phone', 'linkedin', 'github', 'portfolio',
            'bio', 'skills', 'certifications', 'interests', 'status',
            'objectives', 'photo_url'
        ]
        update_data = {}
        for field in allowed_fields:
            if field in data:
                if field == 'skills' and isinstance(data[field], str):
                    update_data[field] = [s.strip() for s in data[field].split(',') if s.strip()]
                else:
                    update_data[field] = data[field]

        update_data['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        user = sb_update('users', {'id': f'eq.{session["user_id"]}'}, update_data)

        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404

        user.pop('password', None)
        return jsonify(user)

    except Exception as e:
        return jsonify({'error': f'Error actualizando perfil: {str(e)}'}), 500


# ============================================================
# RUTAS PROTEGIDAS (páginas)
# ============================================================

@app.route('/feed')
def feed():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    return render_template('feed.html')


@app.route('/bio')
def bio():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    return render_template('Bio.html')


# ============================================================
# RUTAS DE PROYECTOS
# ============================================================

@app.route('/api/projects')
def get_projects():
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    all_projects = sb_get('projects')
    visible_projects = [p for p in all_projects if p.get('creator_id') != session['user_id']]
    # Si todos los proyectos pertenecen al usuario actual (caso demo/seed),
    # devolvemos igualmente el catálogo para no dejar el feed vacío.
    return jsonify(visible_projects or all_projects)


@app.route('/api/projects/<int:project_id>')
def get_project(project_id):
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401

    projects = sb_get('projects', {'id': f'eq.{project_id}'})
    if not projects:
        return jsonify({'error': 'Proyecto no encontrado'}), 404
    return jsonify(projects[0])


@app.route('/api/projects', methods=['POST'])
def create_project():
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401

    new_project = request.get_json()
    if not new_project:
        return jsonify({'error': 'Body JSON requerido'}), 400
    if not new_project.get('title'):
        return jsonify({'error': 'El título del proyecto es requerido'}), 400
    new_project = dict(new_project)  # copia para no mutar el original
    new_project.pop('id', None)
    new_project['creator_id'] = session['user_id']
    new_project['created_at'] = datetime.now().strftime('%Y-%m-%d')
    new_project['updated_at'] = datetime.now().strftime('%Y-%m-%d')

    project = sb_insert('projects', new_project)
    return jsonify(project), 201


@app.route('/api/projects/<int:project_id>', methods=['PUT'])
def update_project(project_id):
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401

    existing = sb_get('projects', {'id': f'eq.{project_id}'})
    if not existing:
        return jsonify({'error': 'Proyecto no encontrado'}), 404

    if existing[0].get('creator_id') and existing[0]['creator_id'] != session['user_id']:
        return jsonify({'error': 'No tenés permiso para editar este proyecto'}), 403

    updated_data = request.get_json()
    if not updated_data:
        return jsonify({'error': 'Body JSON requerido'}), 400
    updated_data = dict(updated_data)
    updated_data.pop('id', None)
    updated_data['updated_at'] = datetime.now().strftime('%Y-%m-%d')

    project = sb_update('projects', {'id': f'eq.{project_id}'}, updated_data)
    return jsonify(project)


@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401

    existing = sb_get('projects', {'id': f'eq.{project_id}'})
    if not existing:
        return jsonify({'error': 'Proyecto no encontrado'}), 404

    if existing[0].get('creator_id') and existing[0]['creator_id'] != session['user_id']:
        return jsonify({'error': 'No tenés permiso para eliminar este proyecto'}), 403

    project = sb_delete('projects', {'id': f'eq.{project_id}'})
    return jsonify({'message': 'Proyecto eliminado', 'project': project or {}})


@app.route('/api/projects/search')
def search_projects():
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401

    query = request.args.get('q', '').lower()
    all_projects = sb_get('projects')

    filtered = []
    for project in all_projects:
        if query in project.get('title', '').lower():
            filtered.append(project)
            continue
        for tech in project.get('technologies', []):
            if query in tech.get('name', '').lower():
                filtered.append(project)
                break
        else:
            for skill in project.get('skills_needed', []):
                if query in skill.lower():
                    filtered.append(project)
                    break

    return jsonify(filtered)


@app.route('/api/user/projects')
def get_user_projects():
    """Proyectos creados por el usuario logueado"""
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    projects = sb_get('projects', {'creator_id': f'eq.{session["user_id"]}'})
    # Agregar conteo de candidatos pendientes por proyecto
    for project in projects:
        interests = sb_get('interests', {
            'project_id': f'eq.{project["id"]}',
            'status': 'eq.pending'
        })
        project['pending_candidates'] = len(interests)
    return jsonify(projects)


# ============================================================
# PÁGINAS NUEVAS
# ============================================================

@app.route('/candidates')
def candidates():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    return render_template('candidates.html')

@app.route('/chat')
def chat():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    return render_template('chat.html')


@app.route('/applications')
def applications():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    return render_template('applications.html')


# ============================================================
# API DE MATCHING
# ============================================================

@app.route('/api/interests', methods=['POST'])
def create_interest():
    """Usuario le da like a un proyecto (swipe derecha)"""
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401

    project_id = request.json.get('project_id')
    if not project_id:
        return jsonify({'error': 'project_id requerido'}), 400

    # Bloquear que el usuario se interese en su propio proyecto
    projects = sb_get('projects', {'id': f'eq.{project_id}'})
    if projects and projects[0].get('creator_id') == session['user_id']:
        return jsonify({'error': 'No podés mostrar interés en tu propio proyecto'}), 400

    existing = sb_get('interests', {
        'user_id':    f'eq.{session["user_id"]}',
        'project_id': f'eq.{project_id}'
    })
    if existing:
        return jsonify({'message': 'Ya mostraste interés en este proyecto'}), 200

    interest = sb_insert('interests', {
        'user_id':    session['user_id'],
        'project_id': project_id,
        'status':     'pending'
    })
    return jsonify(interest), 201


@app.route('/api/interests/candidates')
def get_candidates():
    """Dueño obtiene los candidatos que dieron like a sus proyectos"""
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401

    my_projects = sb_get('projects', {'creator_id': f'eq.{session["user_id"]}'})
    if not my_projects:
        return jsonify([])

    candidates = []
    for project in my_projects:
        interests = sb_get('interests', {'project_id': f'eq.{project["id"]}'})
        for interest in interests:
            # Verificar que no existe ya un match para este interés
            existing_match = sb_get('matches', {'interest_id': f'eq.{interest["id"]}'})
            if existing_match:
                # Ya fue procesado — actualizar status por si quedó inconsistente
                sb_update('interests', {'id': f'eq.{interest["id"]}'}, {'status': 'matched'})
                continue

            if interest.get('status') == 'rejected':
                continue

            users = sb_get('users', {'id': f'eq.{interest["user_id"]}'})
            if users:
                user = {k: v for k, v in users[0].items() if k != 'password'}
                candidates.append({
                    'interest_id': interest['id'],
                    'project':     project,
                    'user':        user
                })

    return jsonify(candidates)


@app.route('/api/interests/mine')
def get_my_interests():
    """Postulaciones del usuario logueado sobre proyectos"""
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401

    user_id = session['user_id']
    interests = sb_get('interests', {
        'user_id': f'eq.{user_id}',
        'order': 'created_at.desc'
    })

    applications = []
    for interest in interests:
        projects = sb_get('projects', {'id': f'eq.{interest["project_id"]}'})
        if not projects:
            continue

        project = projects[0]
        owners = sb_get('users', {'id': f'eq.{project["creator_id"]}'})
        owner = None
        if owners:
            owner = {k: v for k, v in owners[0].items() if k != 'password'}

        matches = sb_get('matches', {'interest_id': f'eq.{interest["id"]}'})
        match_id = matches[0]['id'] if matches else None
        status = 'matched' if match_id else interest.get('status', 'pending')

        if match_id and interest.get('status') != 'matched':
            sb_update('interests', {'id': f'eq.{interest["id"]}'}, {'status': 'matched'})

        applications.append({
            'interest_id': interest['id'],
            'status': status,
            'applied_at': interest.get('created_at') or project.get('created_at'),
            'project': project,
            'creator': owner,
            'match_id': match_id,
            'chat_available': bool(match_id)
        })

    return jsonify(applications)


@app.route('/api/matches', methods=['POST'])
def create_match():
    """Dueño acepta candidato → genera match"""
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401

    interest_id = request.json.get('interest_id')
    interests = sb_get('interests', {'id': f'eq.{interest_id}'})
    if not interests:
        return jsonify({'error': 'Interés no encontrado'}), 404

    interest = interests[0]
    projects = sb_get('projects', {'id': f'eq.{interest["project_id"]}'})
    if not projects or projects[0].get('creator_id') != session['user_id']:
        return jsonify({'error': 'No tenés permiso'}), 403

    # Verificar que no existe ya un match para este interés
    existing = sb_get('matches', {'interest_id': f'eq.{interest_id}'})
    if existing:
        return jsonify({'message': 'Match ya existente', 'match_id': existing[0]['id']}), 200

    sb_update('interests', {'id': f'eq.{interest_id}'}, {'status': 'matched'})

    match = sb_insert('matches', {
        'interest_id': interest_id,
        'user_id':     interest['user_id'],
        'owner_id':    session['user_id'],
        'project_id':  interest['project_id']
    })
    return jsonify(match), 201


@app.route('/api/interests/<int:interest_id>/reject', methods=['POST'])
def reject_candidate(interest_id):
    """Dueño rechaza candidato (swipe izquierda en candidates)"""
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401

    sb_update('interests', {'id': f'eq.{interest_id}'}, {'status': 'rejected'})
    return jsonify({'message': 'Candidato rechazado'}), 200


@app.route('/api/matches')
def get_matches():
    """Obtener todos los matches del usuario logueado"""
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401

    user_id = session['user_id']
    as_candidate = sb_get('matches', {'user_id':  f'eq.{user_id}'})
    as_owner     = sb_get('matches', {'owner_id': f'eq.{user_id}'})

    seen_ids = set()
    enriched = []
    for match in as_candidate + as_owner:
        if match['id'] in seen_ids:
            continue
        seen_ids.add(match['id'])

        projects = sb_get('projects', {'id': f'eq.{match["project_id"]}'})
        other_id = match['owner_id'] if match['user_id'] == user_id else match['user_id']
        others   = sb_get('users', {'id': f'eq.{other_id}'})

        if projects and others:
            other = {k: v for k, v in others[0].items() if k != 'password'}
            enriched.append({
                'match_id':   match['id'],
                'project':    projects[0],
                'other_user': other,
                'created_at': match['created_at']
            })

    return jsonify(enriched)


# ============================================================
# API DE CHAT
# ============================================================

@app.route('/api/chat/<int:match_id>')
def get_messages(match_id):
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401

    matches = sb_get('matches', {'id': f'eq.{match_id}'})
    if not matches:
        return jsonify({'error': 'Match no encontrado'}), 404

    match = matches[0]
    if match['user_id'] != session['user_id'] and match['owner_id'] != session['user_id']:
        return jsonify({'error': 'No tenés permiso'}), 403

    messages = sb_get('messages', {'match_id': f'eq.{match_id}', 'order': 'created_at.asc'})

    for msg in messages:
        users = sb_get('users', {'id': f'eq.{msg["sender_id"]}'})
        if users:
            msg['sender_name'] = f"{users[0]['firstName']} {users[0]['lastName']}"

    return jsonify(messages)


@app.route('/api/chat/<int:match_id>', methods=['POST'])
def send_message(match_id):
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401

    matches = sb_get('matches', {'id': f'eq.{match_id}'})
    if not matches:
        return jsonify({'error': 'Match no encontrado'}), 404

    match = matches[0]
    if match['user_id'] != session['user_id'] and match['owner_id'] != session['user_id']:
        return jsonify({'error': 'No tenés permiso'}), 403

    body = request.get_json() or {}
    content = body.get('content', '').strip()
    if not content:
        return jsonify({'error': 'El mensaje no puede estar vacío'}), 400

    message = sb_insert('messages', {
        'match_id':  match_id,
        'sender_id': session['user_id'],
        'content':   content
    })
    return jsonify(message), 201


# ============================================================
# UPLOAD DE IMÁGENES A SUPABASE STORAGE
# ============================================================

ALLOWED_MIME_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

@app.route('/api/upload', methods=['POST'])
def upload_image():
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401

    if 'file' not in request.files:
        return jsonify({'error': 'No se envió ningún archivo'}), 400

    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({'error': 'Archivo inválido'}), 400

    if file.content_type not in ALLOWED_MIME_TYPES:
        return jsonify({'error': 'Solo se permiten imágenes JPG, PNG, GIF o WebP'}), 400

    file_bytes = file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        return jsonify({'error': 'El archivo supera el límite de 5 MB'}), 400

    # Carpeta según el tipo: 'profile' o 'project'
    folder = request.form.get('type', 'profile')
    if folder not in ('profile', 'project'):
        folder = 'profile'

    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else 'jpg'
    filename = f"{folder}/{session['user_id']}_{uuid.uuid4().hex}.{ext}"

    storage_headers = {
        'apikey':        SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type':  file.content_type,
        'x-upsert':      'true',   # sobreescribe si ya existe el mismo path
    }

    r = http.post(
        f"{SUPABASE_STORAGE}/object/{SUPABASE_BUCKET}/{filename}",
        headers=storage_headers,
        data=file_bytes
    )

    if r.status_code not in (200, 201):
        return jsonify({'error': 'Error subiendo imagen', 'detail': r.text}), 500

    public_url = f"{SUPABASE_PROJECT}/storage/v1/object/public/{SUPABASE_BUCKET}/{filename}"
    return jsonify({'url': public_url}), 201


# ============================================================
# CONFIGURACIÓN PÚBLICA PARA EL FRONTEND (Supabase Realtime)
# ============================================================

@app.route('/api/config')
def get_config():
    """Retorna la config pública de Supabase para el cliente JS (solo usuarios autenticados)."""
    if 'user_id' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    return jsonify({
        'supabaseUrl':  SUPABASE_PROJECT,
        'supabaseKey':  SUPABASE_KEY,
        'currentUserId': session['user_id']
    })


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
