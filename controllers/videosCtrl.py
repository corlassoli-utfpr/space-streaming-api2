from flask import jsonify, request
from models import videos
from models import lancamentos

def buscar(busca, pagina): # Chama a função do model e retorna o resultado em json
    resultado = videos.buscar(busca, pagina)

    return jsonify(resultado)

def criar():
    dados = request.get_json(silent=True) # Evita que o request.json retorne erro caso não seja enviado um json válido

    if not isinstance(dados, dict): # Verifica se os dados recebidos são um dicionário
        return jsonify({"erro": "Dados inválidos ou não informados"}), 400

    titulo = dados.get("titulo")
    youtube_id = dados.get("youtube_id")
    url = dados.get("url")
    thumbnail = dados.get("thumbnail")
    duracao = dados.get("duracao")
    lancamento_id = dados.get("lancamento_id")

    campos_texto = [titulo, youtube_id, url, thumbnail, duracao]

    if not all(isinstance(campo, str) for campo in campos_texto): # Verifica se todos os campos são do tipo string
        return jsonify({"erro": "Os campos devem ser textos"}), 400

    titulo = titulo.strip()
    youtube_id = youtube_id.strip()
    url = url.strip()
    thumbnail = thumbnail.strip()
    duracao = duracao.strip()

    if not all([titulo, youtube_id, url, thumbnail, duracao]):
        return jsonify({"erro": "Preencha todos os campos"}), 400

    if type(lancamento_id) is not int or lancamento_id <= 0:
        return jsonify({"erro": "ID do lançamento inválido"}), 400

    lancamento = lancamentos.buscar_por_id(lancamento_id)

    if lancamento is None:
        return jsonify({"erro": "Lançamento não encontrado"}), 404

    try: # Tenta criar o vídeo chamando a função do model e retorna o resultado em json
        video_id = videos.criar(
            titulo,
            youtube_id,
            url,
            thumbnail,
            duracao,
            lancamento_id
        )

        return jsonify({
            "mensagem": "Vídeo cadastrado com sucesso",
            "id": video_id
        }), 201

    except Exception:
        return jsonify({"erro": "Erro ao cadastrar vídeo"}), 500