from functools import wraps # Importa a função wraps do módulo functools, que é usada para preservar as informações da função original ao criar um decorador
from flask import jsonify, session

def login_required(func):
    @wraps(func) # Decorador que preserva o nome e a documentação da função original
    def verificar_autenticacao(*args, **kwargs): # Recebe os argumentos posicionais e nomeados da função original

        if "usuario_id" not in session: # Verifica se o usuário está autenticado na sessão atual
            return jsonify({
                "erro": "Usuário não autenticado"
            }), 401

        return func(*args, **kwargs) # Chama a função original com os argumentos recebidos, caso o usuário esteja autenticado

    return verificar_autenticacao # Retorna a função decorada, agora verificada
