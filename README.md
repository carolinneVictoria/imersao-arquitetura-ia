# 🏆 Alura Album - Copa do Mundo Tech

O **Alura Album** é um tributo interativo à história da computação e da tecnologia, construído no formato de um álbum de figurinhas virtual animado. O projeto reúne mentes pioneiras da inteligência artificial, arquitetos de bancos de dados, desenvolvedores de sistemas operacionais e grandes educadores de tecnologia do Brasil.

Esta versão estendida traz recursos avançados de gamificação, efeitos visuais premium, som sintético e geração dinâmica de figurinhas por upload.

---

## ⚡ Novas Funcionalidades

1. **Sistema de Pacotinhos ("Pack Opening"):**
   * O usuário inicia a jornada com o álbum vazio e um estoque de pacotes.
   * Ao abrir um pacote, uma animação fluida de rasgar o envelope é ativada junto com efeitos sonoros de papel.
   * O pacote revela 4 figurinhas surpresas em formato 3D (face-down), que podem ser viradas pelo usuário clicando nelas.

2. **Inventário Inteligente:**
   * Lista todas as figurinhas obtidas que ainda não foram coladas.
   * Agrupa duplicatas indicando as quantidades (ex: `Qtd: 2`).
   * Ao clicar em "Colar no Álbum", a figurinha é colada na página correspondente e o álbum **vira as folhas sozinho** até a página exata da colagem, emitindo um efeito sonoro de cola sintetizado em tempo real.

3. **Efeito Holográfico Raro:**
   * Figurinhas de figuras lendárias (como Alan Turing, Linus Torvalds, Paulo Silveira, Gustavo Guanabara, etc.) ganham bordas douradas e um efeito de brilho holográfico dinâmico (`mix-blend-mode: color-dodge`) que reage ao movimento do cursor do mouse.

4. **Desafio Quiz Tech:**
   * Um quiz integrado de 3 perguntas aleatórias sobre as lendas da tecnologia presentes no álbum.
   * Acertar todas as 3 perguntas rende **+2 pacotinhos** de recompensa para o colecionador.

5. **Figurinha Personalizada #30 ("Você"):**
   * Interface onde o usuário faz upload de uma foto própria, preenche seu nome e cargo.
   * O backend processa o arquivo, salva-o fisicamente em disco junto aos metadados JSON e a figurinha é adicionada ao inventário do usuário para que ele possa se colar na última página do álbum!

---

## 🛠️ Tecnologias Utilizadas

* **Frontend:**
  * HTML5 Semântico.
  * Vanilla CSS3 (Design responsivo, Glassmorphism, animações 3D de flip-cards, gradientes holográficos).
  * JavaScript Moderno (Manipulação de DOM, Fetch API, persistência em `localStorage`).
  * **St.PageFlip Library:** Engine utilizada para simular a dobra e física realista das páginas do livro.
  * **Web Audio API:** Síntese de áudio nativa para gerar efeitos sonoros dinâmicos de virada de página e colagem de adesivos sem carregar arquivos de mídia externos.

* **Backend:**
  * **Python 3** com **FastAPI** para prover as APIs de figurinhas e receber upload de arquivos.
  * **Uvicorn** como servidor ASGI.
  * **python-multipart** para manipulação segura de uploads do formulário de figurinha personalizada.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
* Python 3 instalado.
* Navegador de internet moderno.

### Passo 1: Executar o Backend (FastAPI)
1. Abra um terminal na pasta raiz do projeto.
2. Ative o ambiente virtual e instale as dependências (caso necessário):
   ```powershell
   # Em sistemas Windows (PowerShell):
   .\backend\venv\Scripts\activate.ps1
   pip install fastapi uvicorn python-multipart
   ```
3. Execute o servidor:
   ```powershell
   # A partir da pasta raiz:
   .\backend\venv\Scripts\uvicorn.exe main:app --reload --app-dir .\backend
   ```
   *O servidor iniciará localmente no endereço: `http://127.0.0.1:8000`*

### Passo 2: Executar o Frontend (Navegador)
Como o frontend é composto por arquivos estáticos (`index.html`, `app.js` e `style.css`), você pode:
* Abrir o arquivo [index.html](index.html) diretamente com um duplo clique no navegador, **OU**
* Servir a pasta raiz usando o Apache do XAMPP (acessando `http://localhost/imersao-arquitetura-ia/index.html`), o que habilita um ambiente de produção local completo.

---

## 📂 Estrutura de Diretórios

```text
├── backend/
│   ├── figurinhas/          # Pasta de imagens das figurinhas e metadados JSON (Você)
│   ├── venv/                # Ambiente virtual do Python
│   └── main.py              # API FastAPI (Rotas GET e POST)
├── app.js                   # Lógica e regras de negócio do álbum, pacotes, quiz e inventário
├── index.html               # Estrutura principal das páginas e do painel lateral
├── style.css                # Estilização completa do álbum, efeitos sonoros de transição e animações
└── README.md                # Documentação do projeto
```

---

## 🏆 Coleção e Progresso
Toda a coleção do usuário é mantida de forma segura no armazenamento local (`localStorage`) do navegador. Se quiser reiniciar o álbum do zero para vivenciar a abertura de pacotes novamente, basta limpar os dados do site nas ferramentas de desenvolvedor do navegador (F12 > Aplicativo/Armazenamento > Limpar Dados do Site).
