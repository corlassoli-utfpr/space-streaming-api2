from flask import Flask, render_template, request
from controllers import empresasCtrl
from controllers import videosCtrl
from controllers import usuariosCtrl
from database.conn import close_connection

app = Flask(__name__)

# Chave utilizada para proteger as sessões dos usuários
app.secret_key = "chave_temporaria"


@app.route('/') # Rota com a página principal do front que consome os dados
def root():
    return render_template('index.html')


# Rota de busca por string, com paginação em até 5 vídeos por página
@app.route('/videos')
def buscar_videos():
    busca = request.args.get('busca', '')
    pagina = request.args.get('pagina', 1, type=int)

    return videosCtrl.buscar(busca, pagina)


# Rota de busca por string das empresas, sem paginação
@app.route('/empresas')
def buscar_empresas():
    busca = request.args.get('busca', '')

    return empresasCtrl.buscar(busca)


# Rota de uma empresa específica encontrada pelo seu id
@app.route('/empresas/<int:id>')
def pagina_empresa(id):
    return empresasCtrl.pagina(id)


# Rota para cadastrar um novo usuário
@app.route('/usuarios', methods=['POST'])
def cadastrar_usuario():
    return usuariosCtrl.cadastrar()


# Rota para realizar login
@app.route('/login', methods=['POST'])
def login():
    return usuariosCtrl.login()


# Rota para encerrar a sessão
@app.route('/logout', methods=['POST'])
def logout():
    return usuariosCtrl.logout()


# Rota para verificar se o usuário está autenticado
@app.route('/verificar_login', methods=['GET'])
def verificar_login():
    return usuariosCtrl.verificar_login()


@app.teardown_appcontext # Fecha a conexão com o banco ao final do contexto da requisição
def fechar_conexao(exception=None):
    close_connection(exception)


if __name__ == "__main__":
    app.run(port=3000, host='0.0.0.0', debug=True, use_reloader=False)
    # Removemos o reloader pois ao recarregar o código solicitava a senha do banco múltiplas vezes no desenvolvimento
