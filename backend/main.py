from fastapi import FastAPI

# Cria a instância da aplicação FastAPI
app = FastAPI()

# Define a rota para o endpoint raiz "GET /"
@app.get("/")
def hello_world():
    # Retorna uma mensagem de boas-vindas em formato JSON
    return {"mensagem": "Olá, mundo! 🌍"}
