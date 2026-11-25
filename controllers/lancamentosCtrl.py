from flask import jsonify
from models import lancamentos

def listar():
    resultado = lancamentos.listar()
    return jsonify(resultado), 200