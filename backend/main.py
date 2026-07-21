from fastapi import FastAPI, HTTPException, UploadFile, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import glob
import json

# Cria a instância da aplicação FastAPI
app = FastAPI()

# Configura o middleware CORS para aceitar requisições de qualquer origem
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define caminhos absolutos para a pasta de imagens
PASTA_BASE = os.path.dirname(os.path.abspath(__file__))
PASTA_IMAGENS = os.path.join(PASTA_BASE, "figurinhas")

# Lista com as 30 figurinhas.
# Apenas as figurinhas que possuem imagem na pasta 'figurinhas' devem ficar ativas.
# As demais (que não possuem imagem) devem ser comentadas.
figurinhas = [
    {"id": 1, "nome": "Alan Turing", "categoria": "IA", "imagem_url": "/figurinhas/1/imagem"},
    {"id": 2, "nome": "John McCarthy", "categoria": "IA", "imagem_url": "/figurinhas/2/imagem"},
    {"id": 3, "nome": "Sam Altman", "categoria": "IA", "imagem_url": "/figurinhas/3/imagem"},
    {"id": 4, "nome": "Geoffrey Hinton", "categoria": "IA", "imagem_url": "/figurinhas/4/imagem"},
    {"id": 5, "nome": "Yann LeCun", "categoria": "IA", "imagem_url": "/figurinhas/5/imagem"},
    {"id": 6, "nome": "Guido van Rossum", "categoria": "PYTHON", "imagem_url": "/figurinhas/6/imagem"},
    {"id": 7, "nome": "Tim Peters", "categoria": "PYTHON", "imagem_url": "/figurinhas/7/imagem"},
    {"id": 8, "nome": "Raymond Hettinger", "categoria": "PYTHON", "imagem_url": "/figurinhas/8/imagem"},
    {"id": 9, "nome": "Travis Oliphant", "categoria": "PYTHON", "imagem_url": "/figurinhas/9/imagem"},
    {"id": 10, "nome": "Wes McKinney", "categoria": "PYTHON", "imagem_url": "/figurinhas/10/imagem"},
    {"id": 11, "nome": "Edgar F. Codd", "categoria": "BANCO DE DADOS", "imagem_url": "/figurinhas/11/imagem"},
    {"id": 12, "nome": "Larry Ellison", "categoria": "BANCO DE DADOS", "imagem_url": "/figurinhas/12/imagem"},
    {"id": 13, "nome": "Michael Widenius", "categoria": "BANCO DE DADOS", "imagem_url": "/figurinhas/13/imagem"},
    {"id": 14, "nome": "Salvatore Sanfilippo", "categoria": "BANCO DE DADOS", "imagem_url": "/figurinhas/14/imagem"},
    {"id": 15, "nome": "Eliot Horowitz", "categoria": "BANCO DE DADOS", "imagem_url": "/figurinhas/15/imagem"},
    {"id": 16, "nome": "Linus Torvalds", "categoria": "SISTEMAS OPERACIONAIS", "imagem_url": "/figurinhas/16/imagem"},
    {"id": 17, "nome": "Dennis Ritchie", "categoria": "SISTEMAS OPERACIONAIS", "imagem_url": "/figurinhas/17/imagem"},
    {"id": 18, "nome": "Richard Stallman", "categoria": "SISTEMAS OPERACIONAIS", "imagem_url": "/figurinhas/18/imagem"},
    {"id": 19, "nome": "Bill Gates", "categoria": "SISTEMAS OPERACIONAIS", "imagem_url": "/figurinhas/19/imagem"},
    {"id": 20, "nome": "Steve Jobs", "categoria": "SISTEMAS OPERACIONAIS", "imagem_url": "/figurinhas/20/imagem"},
    {"id": 21, "nome": "Paulo Silveira", "categoria": "BRASIL", "imagem_url": "/figurinhas/21/imagem"},
    {"id": 22, "nome": "Guilherme Silveira", "categoria": "BRASIL", "imagem_url": "/figurinhas/22/imagem"},
    {"id": 23, "nome": "Gustavo Guanabara", "categoria": "BRASIL", "imagem_url": "/figurinhas/23/imagem"},
    {"id": 24, "nome": "Maurício Aniche", "categoria": "BRASIL", "imagem_url": "/figurinhas/24/imagem"},
    {"id": 25, "nome": "Andre David", "categoria": "BRASIL", "imagem_url": "/figurinhas/25/imagem"},
    {"id": 26, "nome": "Guilherme Lima", "categoria": "BRASIL", "imagem_url": "/figurinhas/26/imagem"},
    {"id": 27, "nome": "Gi Space Coding", "categoria": "BRASIL", "imagem_url": "/figurinhas/27/imagem"},
    {"id": 28, "nome": "Vinicius Neves", "categoria": "BRASIL", "imagem_url": "/figurinhas/28/imagem"},
    {"id": 29, "nome": "Rafaela Ballerini", "categoria": "BRASIL", "imagem_url": "/figurinhas/29/imagem"},
    {"id": 30, "nome": "Você", "categoria": "BRASIL", "imagem_url": "/figurinhas/30/imagem", "role": "Coloque sua figurinha aqui!"}
]

def obter_dados_figurinha_30():
    caminho_meta = os.path.join(PASTA_IMAGENS, "30-voce.json")
    nome = "Você"
    role = "Coloque sua figurinha aqui!"
    if os.path.exists(caminho_meta):
        try:
            with open(caminho_meta, "r", encoding="utf-8") as f:
                meta = json.load(f)
                nome = meta.get("nome", nome)
                role = meta.get("role", role)
        except Exception:
            pass
    return nome, role

# Endpoint GET "/figurinhas" para retornar a lista de figurinhas ativas
@app.get("/figurinhas")
def listar_figurinhas():
    nome_30, role_30 = obter_dados_figurinha_30()
    lista_atualizada = []
    for f in figurinhas:
        # Copia dicionário para não modificar o original global diretamente
        item = dict(f)
        if item["id"] == 30:
            item["nome"] = nome_30
            item["role"] = role_30
        lista_atualizada.append(item)
    return lista_atualizada

# Endpoint POST "/figurinhas/30" para fazer upload da foto e salvar metadados personalizados
@app.post("/figurinhas/30")
async def salvar_figurinha_30(
    file: UploadFile,
    nome: str = Form("Você"),
    role: str = Form("Coloque sua figurinha aqui!")
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".avif"]:
        raise HTTPException(status_code=400, detail="Formato de imagem inválido")
    
    # Remove arquivos de imagem antigos do id 30
    padrao_antigo = os.path.join(PASTA_IMAGENS, "30*")
    for f in glob.glob(padrao_antigo):
        try:
            # Não remove o JSON de configuração se ele estiver sendo sobrescrito abaixo
            if not f.endswith(".json"):
                os.remove(f)
        except Exception:
            pass
            
    # Salva a nova imagem
    nome_arquivo = f"30-voce{ext}"
    caminho_imagem = os.path.join(PASTA_IMAGENS, nome_arquivo)
    with open(caminho_imagem, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
        
    # Salva os metadados em JSON
    caminho_meta = os.path.join(PASTA_IMAGENS, "30-voce.json")
    with open(caminho_meta, "w", encoding="utf-8") as f_meta:
        json.dump({"nome": nome, "role": role}, f_meta, ensure_ascii=False, indent=4)
        
    return {"status": "sucesso", "nome": nome, "role": role}


# Endpoint GET "/figurinhas/{id}/imagem" para buscar e retornar a imagem da figurinha pelo ID
@app.get("/figurinhas/{id}/imagem")
def obter_imagem_figurinha(id: int):
    # Procura por arquivo com prefixo correspondente de dois dígitos seguido de caracter não numérico
    # Exemplo: id=1 busca por "01[!0-9]*" para não coincidir com id=10, 11, etc.
    padrao = os.path.join(PASTA_IMAGENS, f"{id:02d}[!0-9]*")
    arquivos = glob.glob(padrao)
    
    # Se nenhuma imagem correspondente for encontrada, retorna erro 404
    if not arquivos:
        raise HTTPException(status_code=404, detail="Imagem não encontrada para este ID")
    
    # Retorna o primeiro arquivo correspondente encontrado como resposta de arquivo
    return FileResponse(arquivos[0])
