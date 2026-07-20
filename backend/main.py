from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os

# Cria a instância da aplicação FastAPI
app = FastAPI()

# Define o caminho absoluto para a pasta de imagens para garantir que o servidor
# encontre a pasta independente de onde o comando de inicialização for executado
PASTA_BASE = os.path.dirname(os.path.abspath(__file__))
PASTA_IMAGENS = os.path.join(PASTA_BASE, "figurinhas")

# Configura o serviço de arquivos estáticos.
# Monta a pasta de imagens física no caminho virtual "/imgs"
app.mount("/imgs", StaticFiles(directory=PASTA_IMAGENS), name="imgs")

# Lista de figurinhas de exemplo pré-definida
figurinhas = [
    {
        "id": 1,
        "nome": "Alan Turing",
        "categoria": "IA",
        "imagem_url": "/imgs/01-alan-turing.jpg"
    },
    {
        "id": 2,
        "nome": "John McCarthy",
        "categoria": "IA",
        "imagem_url": "/imgs/02-john-mccarthy.jpg"
    }
]

# Define a rota GET "/figurinhas" para listar todas as figurinhas cadastradas
@app.get("/figurinhas")
def listar_figurinhas():
    # Retorna a lista de figurinhas em formato JSON
    return figurinhas
