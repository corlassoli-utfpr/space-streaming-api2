
from database.conn import get_connection

def buscar_por_email(email):
    conexao = get_connection()
    cursor = conexao.cursor(dictionary=True) # Retorna em formato de dicionário

    try:
        cursor.execute("""
            SELECT id, nome, senha_hash, email
            FROM usuarios
            WHERE email = %s
        """, (email,)) # Apenas encontra o valor onde o email corresponde

        resultado = cursor.fetchone()
        return resultado

    finally:
        cursor.close()

def criar(nome, email, senha_hash):
    conexao = get_connection()
    cursor = conexao.cursor() # Retorna em formato de tupla

    try:
        cursor.execute("""
            INSERT INTO usuarios (nome, email, senha_hash)
            VALUES (%s, %s, %s)
        """, (nome, email, senha_hash)) # Insere os valores fornecidos nos campos correspondentes da tabela usuarios

        conexao.commit()

        return cursor.lastrowid # Retorna o ID do usuário cadastrado

    except Exception:
        conexao.rollback() # Desfaz a transação em caso de erro
        raise

    finally:
        cursor.close()
