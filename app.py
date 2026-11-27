from flask import Flask, render_template, request, jsonify

from controllers import empresasCtrl
from controllers import videosCtrl
from controllers import usuariosCtrl
from controllers import lancamentosCtrl

import auth
from database.conn import close_connection

import os
from dotenv import load_dotenv # Usada para carregar variáveis de ambiente a partir de um arquivo .env
load_dotenv() # Carrega as variáveis de ambiente do arquivo .env para o ambiente de execução do Python

app = Flask(__name__)
app.config["SESSION_COOKIE_HTTPONLY"] = True # Cookie da sessão é acessível apenas via HTTP, evitando ataques XSS (Cross-Site Scripting)
app.config["SESSION_COOKIE_SAMESITE"] = "Lax" # Cookie da sessão é enviado apenas em requisições do mesmo site, evitando ataques CSRF (Cross-Site Request Forgery)

# Configuração da chave secreta para a sessão do Flask, obtida do arquivo .env
app.secret_key = os.getenv("SECRET_KEY")
if not app.secret_key:
    raise RuntimeError("SECRET_KEY não configurada no .env")


# Rota com a página principal do front que consome os dados
@app.route('/', methods=['GET']) 
def root():
    return render_template('index.html')


# Rota de busca por string, com paginação em até 5 vídeos por página
@app.route('/videos', methods=['GET'])
def buscar_videos():
    busca = request.args.get('busca', '')
    pagina = request.args.get('pagina', 1, type=int)

    return videosCtrl.buscar(busca, pagina)


# Rota para adicionar um novo vídeo, protegida por autenticação
@app.route('/videos', methods=['POST'])
@auth.login_required
def criar_video():
    return videosCtrl.criar()


# Rota de busca por string das empresas, sem paginação
@app.route('/empresas', methods=['GET'])
def buscar_empresas():
    busca = request.args.get('busca', '')

    return empresasCtrl.buscar(busca)


# Rota de uma empresa específica encontrada pelo seu id
@app.route('/empresas/<int:id>', methods=['GET'])
def pagina_empresa(id):
    return empresasCtrl.pagina(id)


# Rota para cadastrar um novo usuário
@app.route('/usuarios', methods=['POST'])
def cadastrar_usuario():
    return usuariosCtrl.cadastrar()


# Rota para listar os lançamentos, sem paginação
@app.route('/lancamentos', methods=['GET'])
def listar_lancamentos():
    return lancamentosCtrl.listar()

# Rota para login
@app.route('/auth/login', methods=['POST'])
def login():
    return usuariosCtrl.login()


# Rota para logout, encerrando a sessão atual
@app.route('/auth/logout', methods=['POST'])
def logout():
    return usuariosCtrl.logout()


# Rota para verificar se o usuário está autenticado
@app.route('/auth/me', methods=['GET'])
def verificar_login():
    return usuariosCtrl.me()


# Tratamento de rota inexistente
@app.errorhandler(404)
def erro_404(e):
    return jsonify({
        "erro": "Rota não encontrada"
    }), 404


# Tratamento de método HTTP não permitido
@app.errorhandler(405)
def erro_405(e):
    return jsonify({
        "erro": "Método HTTP não permitido para esta rota"
    }), 405


# Tratamento de erros internos do servidor
@app.errorhandler(500)
def erro_500(e):
    return jsonify({
        "erro": "Erro interno do servidor"
    }), 500


@app.teardown_appcontext # Fecha a conexão com o banco ao final do contexto da requisição
def fechar_conexao(exception=None):
    close_connection(exception)


if __name__ == "__main__":
    app.run(port=3000, host='0.0.0.0', debug=True, use_reloader=False)
    # Removemos o reloader pois ao recarregar o código solicitava a senha do banco múltiplas vezes no desenvolvimentoG