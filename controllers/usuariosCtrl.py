from flask import jsonify, request, session
from werkzeug.security import generate_password_hash, check_password_hash
from models import usuarios

def cadastrar():
    dados = request.get_json(silent=True)

    if not isinstance(dados, dict): # Verifica se os dados são um dicionário
        return jsonify({"erro": "Dados inválidos ou não informados"}), 400

    nome = dados.get("nome")
    email = dados.get("email")
    senha = dados.get("senha")

    if not all(isinstance(campo, str) for campo in [nome, email, senha]): # Verifica se todos os campos são strings
        return jsonify({"erro": "Os campos devem ser textos"}), 400

    nome = nome.strip()
    email = email.strip()

    if not nome or not email or not senha:
        return jsonify({"erro": "Preencha todos os campos"}), 400

    if len(nome) > 100 or len(email) > 100:
        return jsonify({"erro": "Nome ou e-mail muito longo"}), 400

    if usuarios.buscar_por_email(email):
        return jsonify({"erro": "E-mail já cadastrado"}), 409

    senha_hash = generate_password_hash(senha) # Gera o hash da senha

    try:
        usuario_id = usuarios.criar(nome, email, senha_hash) # Cria o usuário no banco de dados e recebe seu ID

        return jsonify({
            "mensagem": "Usuário cadastrado com sucesso",
            "id": usuario_id
        }), 201

    except Exception:
        return jsonify({"erro": "Erro ao cadastrar usuário"}), 500

def login():
    dados = request.get_json(silent=True) # Impede que o Flask lance uma exceção se o JSON de dados for inválido

    if not isinstance(dados, dict):
        return jsonify({"erro": "Dados inválidos ou não informados"}), 400

    email = dados.get("email")
    senha = dados.get("senha")

    if not all(isinstance(campo, str) for campo in [email, senha]):
        return jsonify({"erro": "Informe e-mail e senha válidos"}), 400

    email = email.strip()

    if not email or not senha:
        return jsonify({"erro": "Informe e-mail e senha"}), 400

    usuario = usuarios.buscar_por_email(email) # Busca o usuário no banco de dados pelo e-mail informado

    # Verifica se o usuário existe e se a senha informada corresponde ao hash armazenado
    if usuario is None or not check_password_hash(usuario["senha_hash"], senha): 
        return jsonify({"erro": "E-mail ou senha incorretos"}), 401

    session.clear() # Limpa a sessão atual para evitar conflitos com sessões anteriores
    session["usuario_id"] = usuario["id"] # Armazena o ID do usuário na sessão para manter o estado de login

    return jsonify({
        "mensagem": "Login realizado com sucesso",
        "usuario": {
            "id": usuario["id"],
            "nome": usuario["nome"],
            "email": usuario["email"]
        }
    }), 200

def logout():
    session.clear() # Limpa a sessão atual

    return jsonify({
        "mensagem": "Logout realizado com sucesso"
    }), 200

def verificar_login():
    if "usuario_id" not in session: # Verifica se o usuário está autenticado na sessão atual
        return jsonify({"erro": "Usuário não autenticado"}), 401

    return jsonify({
        "autenticado": True,
        "usuario_id": session["usuario_id"]
    }), 200
