from database.conn import get_connection

def buscar(busca, pagina):
    conexao = get_connection()
    cursor = conexao.cursor(dictionary=True)

    try:
        limite = 5
        offset = (pagina - 1) * limite

        # Conta o total de vídeos encontrados pela busca
        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM videos v
            WHERE v.titulo LIKE %s
        """, ("%" + busca + "%",))

        total = cursor.fetchone()["total"]

        # Busca os vídeos da página solicitada
        cursor.execute("""
            SELECT
                v.id,
                v.titulo,
                v.youtube_id,
                v.url,
                v.thumbnail,
                v.duracao,
                l.id AS lancamento_id,
                l.nome AS lancamento,
                e.id AS empresa_id,
                e.nome AS empresa
            FROM videos v
            JOIN lancamentos l ON v.lancamento_id = l.id
            JOIN empresas e ON l.empresa_id = e.id
            WHERE v.titulo LIKE %s
            ORDER BY v.id
            LIMIT %s OFFSET %s
        """, ("%" + busca + "%", limite, offset))

        resultado = cursor.fetchall()

        return {
            "videos": resultado,
            "total": total
        }

    finally:
        cursor.close()


def criar(titulo, youtube_id, url, thumbnail, duracao, lancamento_id):
    conexao = get_connection()
    cursor = conexao.cursor()

    try:
        cursor.execute("""
            INSERT INTO videos (titulo, youtube_id, url, thumbnail, duracao, lancamento_id)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (titulo, youtube_id, url, thumbnail, duracao, lancamento_id))

        conexao.commit()

        return cursor.lastrowid

    except Exception:
        conexao.rollback()
        raise

    finally:
        cursor.close()
