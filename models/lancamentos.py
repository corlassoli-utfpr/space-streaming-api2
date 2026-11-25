from database.conn import get_connection

def buscar_por_empresa(empresa_id):
    conexao = get_connection()
    cursor = conexao.cursor(dictionary=True) # Retorna em formato de dicionário

    try:
        # Busca os lançamentos relacionados a uma empresa
        cursor.execute("""
            SELECT
                id,
                nome,
                data,
                status,
                foguete,
                missao,
                local,
                descricao
            FROM lancamentos
            WHERE empresa_id = %s
            ORDER BY data DESC
        """, (empresa_id,)) # Todos os lançamentos onde o id da empresa é correspondente

        resultado = cursor.fetchall()

        return resultado
    finally:
        cursor.close()

def listar():
    conexao = get_connection()
    cursor = conexao.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT
                l.id,
                l.nome,
                e.nome AS empresa
            FROM lancamentos l
            JOIN empresas e ON l.empresa_id = e.id
            ORDER BY l.id DESC
        """)

        return cursor.fetchall()
    finally:
        cursor.close()

def buscar_por_id(id):
    conexao = get_connection()
    cursor = conexao.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT id, nome
            FROM lancamentos
            WHERE id = %s
        """, (id,))

        return cursor.fetchone()
    finally:
        cursor.close()