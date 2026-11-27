from flask import jsonify, request
from models import videos, lancamentos

def buscar(busca, pagina): # Chama a função do model e retorna o resultado em json
    resultado = videos.buscar(busca, pagina)

    return jsonify(resultado)

def criar():
    dados = request.get_json(silent=True)

    if not isinstance(dados, dict): # Verifica se os dados são um dicionário
        return jsonify({"erro": "Dados inválidos ou não informados"}), 400

    titulo = dados.get("titulo")
    youtube_id = dados.get("youtube_id")
    url = dados.get("url")
    thumbnail = dados.get("thumbnail") or None # Campo opcional
    duracao = dados.get("duracao")
    lancamento_id = dados.get("lancamento_id")

    obrigatorios = [titulo, youtube_id, url, duracao]

    if not all(isinstance(campo, str) for campo in obrigatorios):
        return jsonify({"erro": "Os campos devem ser textos"}), 400

    if thumbnail is not None and not isinstance(thumbnail, str):
        return jsonify({"erro": "Os campos devem ser textos"}), 400

    # bool é subclasse de int em Python, por isso é excluído explicitamente
    if not isinstance(lancamento_id, int) or isinstance(lancamento_id, bool):
        return jsonify({"erro": "Lançamento inválido"}), 400

    titulo = titulo.strip()
    youtube_id = youtube_id.strip()
    url = url.strip()
    duracao = duracao.strip()

    if thumbnail is not None:
        thumbnail = thumbnail.strip() or None

    if not titulo or not youtube_id or not url or not duracao:
        return jsonify({"erro": "Preencha todos os campos obrigatórios"}), 400

    if (len(titulo) > 200 or len(youtube_id) > 50 or len(url) > 255
            or len(duracao) > 20 or (thumbnail and len(thumbnail) > 255)):
        return jsonify({"erro": "Um ou mais campos excedem o tamanho permitido"}), 400

    if lancamentos.buscar_por_id(lancamento_id) is None: # Garante que o lançamento existe
        return jsonify({"erro": "Lançamento não encontrado"}), 404

    try:
        video_id = videos.criar(titulo, youtube_id, url, thumbnail, duracao, lancamento_id)

        return jsonify({
            "mensagem": "Vídeo adicionado com sucesso",
            "id": video_id
        }), 201

    except Exception:
        return jsonify({"erro": "Erro ao adicionar vídeo"}), 500
