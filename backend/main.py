from fastapi import FastAPI

# Cria a instância da aplicação FastAPI
app = FastAPI()

# Define a rota para o endpoint raiz "GET /"
@app.get("/")
def hello_world():
    # Retorna uma mensagem de boas-vindas em formato JSON
    return {"mensagem": "Olá, mundo! 🌍"}

# Define a rota para retornar a lista de figurinhas "GET /figurinhas"
@app.get("/figurinhas")
def listar_figurinhas():
    # Lista contendo duas figurinhas de exemplo
    figurinhas = [
        {"id": 1, "nome": "Alan Turing", "categoria": "IA"},
        {"id": 2, "nome": "John McCarthy", "categoria": "IA"}
    ]
    # Retorna a lista de figurinhas em formato JSON
    return figurinhas
