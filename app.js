// ===================================================
// CONFIGURAÇÃO DA API
// Quando o frontend for servido pelo FastAPI (Dia 3), a API está
// no mesmo servidor — usamos uma URL relativa ou o endereço completo.
// ===================================================
const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:8000"
    : "https://imersao-arquitetura-ia.onrender.com";

// ===================================================
// GERENCIAMENTO DE ESTADO LOCAL (localStorage)
// ===================================================
const STATE = {
    pastedIds: [],       // IDs colados no álbum
    inventoryIds: [],    // IDs no inventário (com repetições)
    packsLeft: 3,        // Pacotes restantes para abrir
    activeStickers: []   // Lista total obtida da API
};

const RARE_IDS = [1, 3, 4, 6, 11, 16, 20, 21, 23, 30];

function loadState() {
    try {
        STATE.pastedIds = JSON.parse(localStorage.getItem("album_pasted_ids")) || [];
        STATE.inventoryIds = JSON.parse(localStorage.getItem("album_inventory_ids")) || [];
        STATE.packsLeft = localStorage.getItem("album_packs_left") !== null ? parseInt(localStorage.getItem("album_packs_left"), 10) : 3;
    } catch (e) {
        console.error("Erro ao carregar estado do localStorage:", e);
    }
}

function saveState() {
    try {
        localStorage.setItem("album_pasted_ids", JSON.stringify(STATE.pastedIds));
        localStorage.setItem("album_inventory_ids", JSON.stringify(STATE.inventoryIds));
        localStorage.setItem("album_packs_left", STATE.packsLeft);
    } catch (e) {
        console.error("Erro ao salvar estado no localStorage:", e);
    }
}

// ===================================================
// FUNÇÃO: Preenche os slots do álbum condicionalmente
// ===================================================
async function preencherFigurinhas() {
    try {
        const response = await fetch(`${API_BASE_URL}/figurinhas`);
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
        }
        STATE.activeStickers = await response.json();
        const porId = new Map(STATE.activeStickers.map(f => [f.id, f]));

        const slots = document.querySelectorAll(".sticker-slot");
        for (const slot of slots) {
            const slotNumeroEl = slot.querySelector(".slot-number");
            if (!slotNumeroEl) continue;

            const id = parseInt(slotNumeroEl.textContent.replace("#", ""), 10);
            if (!porId.has(id)) continue;

            const figurinha = porId.get(id);

            // Atualiza os metadados textuais do slot (nome, papel/role)
            const slotNameEl = slot.querySelector(".slot-name");
            const slotRoleEl = slot.querySelector(".slot-role");
            if (slotNameEl) slotNameEl.textContent = figurinha.nome;
            if (slotRoleEl && figurinha.role) slotRoleEl.textContent = figurinha.role;

            // Limpa qualquer imagem e classe anterior antes de processar
            const imgExistente = slot.querySelector(".sticker-img");
            if (imgExistente) {
                imgExistente.remove();
            }
            slot.classList.remove("slot-preenchido");
            slot.classList.remove("rare-sticker");

            // Se a figurinha foi colada pelo usuário
            if (STATE.pastedIds.includes(id)) {
                const img = document.createElement("img");
                img.src = `${API_BASE_URL}${figurinha.imagem_url}`;
                img.alt = figurinha.nome;
                img.className = "sticker-img";

                img.onload = () => slot.classList.add("slot-preenchido");
                img.onerror = () => console.warn(`Imagem não encontrada: ${figurinha.nome}`);

                slot.insertBefore(img, slot.firstChild);

                // Aplica efeito holográfico se for rara
                if (RARE_IDS.includes(id)) {
                    slot.classList.add("rare-sticker");
                    
                    if (!slot.dataset.holoBound) {
                        slot.dataset.holoBound = "true";
                        slot.addEventListener("mousemove", (e) => {
                            const rect = slot.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const y = e.clientY - rect.top;
                            const px = (x / rect.width) * 100;
                            const py = (y / rect.height) * 100;
                            slot.style.setProperty("--hologram-x", `${px}%`);
                            slot.style.setProperty("--hologram-y", `${py}%`);
                        });
                    }
                }
            }
        }
        console.log(`✅ Figurinhas atualizadas com base nas coladas!`);
    } catch (erro) {
        console.warn("⚠️ Não foi possível carregar as figurinhas da API:", erro.message);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const bookElement = document.getElementById("book");
    const btnPrev = document.getElementById("btn-prev");
    const btnNext = document.getElementById("btn-next");
    const soundToggle = document.getElementById("sound-toggle");
    const iconOn = soundToggle.querySelector(".sound-icon-on");
    const iconOff = soundToggle.querySelector(".sound-icon-off");

    let isMuted = false;
    let pageFlip = null;

    // 1. Initialize St.PageFlip
    try {
        pageFlip = new St.PageFlip(bookElement, {
            width: 550, // Base page width
            height: 800, // Base page height
            size: "stretch",
            minWidth: 315,
            maxWidth: 1000,
            minHeight: 420,
            maxHeight: 1350,
            drawShadow: true,
            maxShadowOpacity: 0.4, // Aumenta levemente contraste da sombra
            showCover: true,
            mobileScrollSupport: true,
            useMouseEvents: false, // Desativa gestos padrão do StPageFlip para evitar cliques indesejados nas bordas/páginas
            showPageCorners: false, // Remove dobras dos cantos no hover
            disableFlipByClick: true, // Garante que a virada por cliques simples esteja desativada
            flippingTime: 800 // Transição mais ágil e snappier (800ms em vez de 1000ms)
        });

        // Load pages from HTML
        pageFlip.loadFromHTML(document.querySelectorAll(".page"));

        // Estado de arraste personalizado
        let activeDragPage = null;
        let isClicking = false;
        let startX = 0;
        let startY = 0;
        let dragStarted = false;

        // Monitora o mousedown/touchstart em cada página para iniciar a intenção de arraste
        document.querySelectorAll(".page").forEach((page, index) => {
            page.addEventListener("mousedown", (e) => {
                if (e.target.closest("button") || e.target.closest("a")) return;
                isClicking = true;
                startX = e.clientX;
                startY = e.clientY;
                dragStarted = false;
                activeDragPage = { page, index };
            });

            page.addEventListener("touchstart", (e) => {
                if (e.target.closest("button") || e.target.closest("a")) return;
                const touch = e.touches[0];
                isClicking = true;
                startX = touch.clientX;
                startY = touch.clientY;
                dragStarted = false;
                activeDragPage = { page, index };
            });
        });

        // Executa o movimento de dobra apenas se o mouse/dedo se mover além de um limiar (threshold)
        const handleMove = (clientX, clientY, isTouch = false) => {
            if (!isClicking || !activeDragPage) return;
            
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            const bookRect = bookElement.getBoundingClientRect();

            // Só ativa o flip se mover mais de 10px (evita disparar ao clicar e soltar estático)
            if (distance > 10 && !dragStarted) {
                dragStarted = true;
                let cornerX, cornerY;
                
                // Determina canto vertical (topo vs base) em coordenadas relativas ao livro
                const centerY = bookRect.top + bookRect.height / 2;
                if (startY < centerY) {
                    cornerY = 0; // Canto superior
                } else {
                    cornerY = bookRect.height; // Canto inferior
                }

                // Determina canto horizontal (direita vs esquerda) em coordenadas relativas ao livro
                if (activeDragPage.index % 2 === 0) {
                    cornerX = bookRect.width; // Canto direito
                } else {
                    cornerX = 0; // Canto esquerdo
                }
                
                document.body.classList.add("dragging");
                pageFlip.startUserTouch({ x: cornerX, y: cornerY });
            }
            
            if (dragStarted) {
                const relX = clientX - bookRect.left;
                const relY = clientY - bookRect.top;
                pageFlip.userMove({ x: relX, y: relY }, isTouch);
            }
        };

        const handleRelease = (clientX, clientY, isTouch = false) => {
            if (dragStarted) {
                const bookRect = bookElement.getBoundingClientRect();
                const relX = clientX - bookRect.left;
                const relY = clientY - bookRect.top;
                pageFlip.userStop({ x: relX, y: relY }, isTouch);
            }
            isClicking = false;
            dragStarted = false;
            activeDragPage = null;
            document.body.classList.remove("dragging");
        };

        window.addEventListener("mousemove", (e) => {
            handleMove(e.clientX, e.clientY, false);
        });

        window.addEventListener("touchmove", (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                handleMove(touch.clientX, touch.clientY, true);
            }
        });

        window.addEventListener("mouseup", (e) => {
            handleRelease(e.clientX, e.clientY, false);
        });

        window.addEventListener("touchend", (e) => {
            const touch = e.changedTouches[0] || e.touches[0];
            if (touch) {
                handleRelease(touch.clientX, touch.clientY, true);
            } else {
                handleRelease(startX, startY, true);
            }
        });

        // Show book after successful initialization
        bookElement.style.display = "block";

        // Dia 3: Busca as figurinhas da API e preenche o álbum
        // A função é async, chamamos sem await para não bloquear a inicialização do álbum
        preencherFigurinhas();

    } catch (error) {
        console.error("Erro ao inicializar a biblioteca PageFlip:", error);
    }

    // 2. Sound Effect Generator (Web Audio API)
    function playPaperTurnSound() {
        if (isMuted) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const audioCtx = new AudioContext();
            const duration = 0.45; // seconds
            const sampleRate = audioCtx.sampleRate;
            const bufferSize = sampleRate * duration;
            const buffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
            const data = buffer.getChannelData(0);

            // Synthesize white noise with a custom page-flip volume envelope
            for (let i = 0; i < bufferSize; i++) {
                const progress = i / bufferSize;
                // Noise value between -1 and 1
                const noise = Math.random() * 2 - 1;

                // Volume envelope: smooth curve that peaks around 30% of the duration
                let envelope = 0;
                if (progress < 0.3) {
                    envelope = progress / 0.3; // Rapid ramp up
                } else {
                    envelope = (1 - progress) / 0.7; // Smooth decay
                }

                // Add minor irregular spikes to simulate paper friction/crackle
                const paperCrackle = Math.random() > 0.985 ? (Math.random() * 2 - 1) * 0.35 : 0;

                data[i] = (noise * 0.65 + paperCrackle) * envelope * 0.12;
            }

            // Create nodes
            const noiseNode = audioCtx.createBufferSource();
            noiseNode.buffer = buffer;

            // Bandpass filter to extract the "whoosh" sound of paper shuffling
            const bandpassFilter = audioCtx.createBiquadFilter();
            bandpassFilter.type = "bandpass";
            bandpassFilter.Q.value = 2.0;

            // Dynamic frequency sweep: starts at 1500Hz, sweeps down to 350Hz (sound of page moving away)
            bandpassFilter.frequency.setValueAtTime(1500, audioCtx.currentTime);
            bandpassFilter.frequency.exponentialRampToValueAtTime(350, audioCtx.currentTime + duration);

            // Lowpass filter to remove harsh high-frequency digital artifacts
            const lowpassFilter = audioCtx.createBiquadFilter();
            lowpassFilter.type = "lowpass";
            lowpassFilter.frequency.setValueAtTime(3800, audioCtx.currentTime);

            // Connect graph: Source -> Bandpass -> Lowpass -> Destination
            noiseNode.connect(bandpassFilter);
            bandpassFilter.connect(lowpassFilter);
            lowpassFilter.connect(audioCtx.destination);

            noiseNode.start();
        } catch (e) {
            console.warn("Falha ao tocar som de virada de página:", e);
        }
    }

    // 3. Audio State Controls
    soundToggle.addEventListener("click", () => {
        isMuted = !isMuted;
        window.isMutedGlobal = isMuted;
        if (isMuted) {
            iconOn.classList.add("hidden");
            iconOff.classList.remove("hidden");
        } else {
            iconOn.classList.remove("hidden");
            iconOff.classList.add("hidden");
        }
    });

    // 4. Navigation controls and events
    if (pageFlip) {
        // Play turn sound when page starts flipping
        pageFlip.on("changeState", (e) => {
            if (e.data === "flipping") {
                playPaperTurnSound();
            }
        });

        // Discrete arrow toggle depending on current page
        pageFlip.on("flip", (e) => {
            const currentPage = e.data;
            const totalPages = pageFlip.getPageCount();

            // Hide left button on cover page
            if (currentPage === 0) {
                btnPrev.classList.add("hidden");
            } else {
                btnPrev.classList.remove("hidden");
            }

            // Hide right button on back cover
            if (currentPage === totalPages - 1) {
                btnNext.classList.add("hidden");
            } else {
                btnNext.classList.remove("hidden");
            }
        });

        // Click events for navigational arrows
        btnPrev.addEventListener("click", () => {
            pageFlip.flipPrev();
        });

        btnNext.addEventListener("click", () => {
            pageFlip.flipNext();
        });

        // Keyboard events for navigational arrows
        document.addEventListener("keydown", (e) => {
            if (e.key === "ArrowLeft") {
                pageFlip.flipPrev();
            } else if (e.key === "ArrowRight") {
                pageFlip.flipNext();
            }
        });

        // Hide left button initially since start page is 0
        btnPrev.classList.add("hidden");
    }

    // ===================================================
    // GLOBAL MUTED STATE BRIDGE
    // ===================================================
    window.isMutedGlobal = isMuted;

    // ===================================================
    // GLUE CARD SOUND SYNTHESIZER
    // ===================================================
    function playGlueSound() {
        if (window.isMutedGlobal) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const audioCtx = new AudioContext();
            const duration = 0.25;
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(550, audioCtx.currentTime + duration);
            
            gainNode.gain.setValueAtTime(0.18, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {
            console.warn("Erro ao tocar som de cola:", e);
        }
    }

    // ===================================================
    // SIDEBAR NAVIGATION & INITIALIZATION
    // ===================================================
    const collectorPanelToggle = document.getElementById("collector-panel-toggle");
    const collectorSidebar = document.getElementById("collector-sidebar");
    const closeSidebar = document.getElementById("close-sidebar");

    // Abrir Sidebar
    collectorPanelToggle.addEventListener("click", () => {
        collectorSidebar.classList.add("open");
    });

    // Fechar Sidebar
    closeSidebar.addEventListener("click", () => {
        collectorSidebar.classList.remove("open");
    });

    // Eventos de Tab
    const tabButtons = collectorSidebar.querySelectorAll(".tab-btn");
    const tabPanes = collectorSidebar.querySelectorAll(".tab-pane");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetTab = btn.getAttribute("data-tab");
            
            tabButtons.forEach(b => b.classList.remove("active"));
            tabPanes.forEach(p => p.classList.remove("active"));
            
            btn.classList.add("active");
            document.getElementById(targetTab).classList.add("active");
            
            if (targetTab === "tab-inventory") {
                renderInventoryList();
            }
        });
    });

    // ===================================================
    // TAB 1: PACOTES (PACK OPENING) LOGIC
    // ===================================================
    const boosterPack = document.getElementById("booster-pack");
    const packsCountEl = document.getElementById("packs-count");
    const revealedTitle = document.getElementById("revealed-title");
    const revealedCardsContainer = document.getElementById("revealed-cards");

    function updatePacksUI() {
        packsCountEl.textContent = STATE.packsLeft;
        if (STATE.packsLeft <= 0) {
            boosterPack.style.opacity = "0.35";
            boosterPack.style.pointerEvents = "none";
        } else {
            boosterPack.style.opacity = "1";
            boosterPack.style.pointerEvents = "auto";
        }
    }

    boosterPack.addEventListener("click", () => {
        if (STATE.packsLeft <= 0) return;

        STATE.packsLeft--;
        saveState();
        updatePacksUI();

        playPaperTurnSound();
        boosterPack.classList.add("ripping");

        setTimeout(() => {
            boosterPack.classList.remove("ripping");
            
            // Seleciona 4 cards aleatórios (ID de 1 a 29)
            const poolSize = 29;
            const newCards = [];
            for (let i = 0; i < 4; i++) {
                const randomId = Math.floor(Math.random() * poolSize) + 1;
                newCards.push(randomId);
                STATE.inventoryIds.push(randomId);
            }
            saveState();

            // Mostra cards revelados
            revealedTitle.classList.remove("hidden");
            revealedCardsContainer.innerHTML = "";

            newCards.forEach(id => {
                const sticker = STATE.activeStickers.find(s => s.id === id);
                if (!sticker) return;

                const cardWrapper = document.createElement("div");
                cardWrapper.className = "pack-card-wrapper";
                cardWrapper.innerHTML = `
                    <div class="pack-card">
                        <div class="pack-card-back">?</div>
                        <div class="pack-card-front">
                            <img src="${API_BASE_URL}${sticker.imagem_url}" alt="${sticker.nome}">
                            <div class="card-overlay-name">${sticker.nome}</div>
                        </div>
                    </div>
                `;

                cardWrapper.addEventListener("click", () => {
                    const card = cardWrapper.querySelector(".pack-card");
                    if (!card.classList.contains("flipped")) {
                        card.classList.add("flipped");
                        playPaperTurnSound();
                    }
                });

                revealedCardsContainer.appendChild(cardWrapper);
            });

            // Atualiza contadores
            document.getElementById("inventory-count").textContent = STATE.inventoryIds.length;

        }, 800);
    });

    // ===================================================
    // TAB 2: INVENTÁRIO LOGIC
    // ===================================================
    const inventoryListEl = document.getElementById("inventory-list");
    const inventoryCountEl = document.getElementById("inventory-count");

    function renderInventoryList() {
        inventoryCountEl.textContent = STATE.inventoryIds.length;
        inventoryListEl.innerHTML = "";

        if (STATE.inventoryIds.length === 0) {
            inventoryListEl.innerHTML = `<div class="inventory-empty">Seu inventário está vazio. Abra pacotes ou responda o quiz!</div>`;
            return;
        }

        const counts = {};
        STATE.inventoryIds.forEach(id => {
            counts[id] = (counts[id] || 0) + 1;
        });

        const sortedIds = Object.keys(counts).map(Number).sort((a, b) => a - b);

        sortedIds.forEach(id => {
            const sticker = STATE.activeStickers.find(s => s.id === id);
            if (!sticker) return;

            const isRare = RARE_IDS.includes(id);
            const isPasted = STATE.pastedIds.includes(id);

            const itemEl = document.createElement("div");
            itemEl.className = "inventory-item";
            itemEl.innerHTML = `
                <div class="item-info">
                    <span class="item-title">${sticker.nome} ${isRare ? '✨' : ''}</span>
                    <div class="item-meta">
                        <span>#${String(id).padStart(2, '0')}</span>
                        <span>•</span>
                        <span>${sticker.categoria}</span>
                        <span>•</span>
                        <span class="item-qty">Qtd: ${counts[id]}</span>
                    </div>
                </div>
                <button class="btn-paste" data-id="${id}">
                    ${isPasted ? 'Colar Repetida' : 'Colar no Álbum'}
                </button>
            `;

            const pasteBtn = itemEl.querySelector(".btn-paste");
            pasteBtn.addEventListener("click", () => {
                pasteSticker(id);
            });

            inventoryListEl.appendChild(itemEl);
        });
    }

    function pasteSticker(id) {
        const index = STATE.inventoryIds.indexOf(id);
        if (index > -1) {
            STATE.inventoryIds.splice(index, 1);
        }

        if (!STATE.pastedIds.includes(id)) {
            STATE.pastedIds.push(id);
        }

        saveState();
        playGlueSound();
        preencherFigurinhas();

        // Vira a página automaticamente
        if (pageFlip) {
            const pageIndex = Math.ceil(id / 5);
            pageFlip.flip(pageIndex);
        }

        renderInventoryList();
        verificarAlbumCompleto();
    }

    function verificarAlbumCompleto() {
        if (STATE.pastedIds.length === 30) {
            setTimeout(() => {
                alert("🏆 PARABÉNS! Você completou o Álbum da Copa do Mundo Tech! Você se tornou uma verdadeira lenda da tecnologia!");
            }, 1000);
        }
    }

    // ===================================================
    // TAB 3: QUIZ TRIVIA GAME LOGIC
    // ===================================================
    const QUIZ_QUESTIONS = [
        {
            q: "Quem é considerado o pai da computação e criou a máquina que decifrou códigos na 2ª Guerra?",
            o: ["John McCarthy", "Alan Turing", "Dennis Ritchie", "Sam Altman"],
            a: 1
        },
        {
            q: "Qual linguagem de programação foi criada por Guido van Rossum?",
            o: ["C++", "Java", "Python", "Ruby"],
            a: 2
        },
        {
            q: "Quem é o cofundador do Linux e criador do Git?",
            o: ["Richard Stallman", "Steve Jobs", "Bill Gates", "Linus Torvalds"],
            a: 3
        },
        {
            q: "Quem escreveu o Zen do Python?",
            o: ["Tim Peters", "Raymond Hettinger", "Wes McKinney", "Guido van Rossum"],
            a: 0
        },
        {
            q: "Qual termo John McCarthy cunhou em 1956?",
            o: ["Deep Learning", "Machine Learning", "Inteligência Artificial", "Sistemas Inteligentes"],
            a: 2
        },
        {
            q: "Quem cofundou a Alura junto com Guilherme Silveira?",
            o: ["Paulo Silveira", "Gustavo Guanabara", "Andre David", "Guilherme Lima"],
            a: 0
        },
        {
            q: "Quem é o criador do canal Curso em Vídeo e grande educador de tecnologia no Brasil?",
            o: ["Maurício Aniche", "Vinicius Neves", "Gustavo Guanabara", "Paulo Silveira"],
            a: 2
        },
        {
            q: "Qual banco de dados in-memory noSQL foi criado por Salvatore Sanfilippo?",
            o: ["MongoDB", "MySQL", "Redis", "Oracle"],
            a: 2
        }
    ];

    let quizState = {
        active: false,
        questions: [],
        currentIndex: 0,
        correctCount: 0
    };

    const quizWelcome = document.getElementById("quiz-welcome");
    const quizGame = document.getElementById("quiz-game");
    const quizResult = document.getElementById("quiz-result");
    const startQuizBtn = document.getElementById("start-quiz-btn");
    const quizQuestionText = document.getElementById("quiz-question-text");
    const quizOptionsContainer = document.getElementById("quiz-options-container");
    const quizCurrentNum = document.getElementById("quiz-current-num");
    const quizResultTitle = document.getElementById("quiz-result-title");
    const quizResultText = document.getElementById("quiz-result-text");
    const quizRestartBtn = document.getElementById("quiz-restart-btn");

    startQuizBtn.addEventListener("click", startQuiz);
    quizRestartBtn.addEventListener("click", startQuiz);

    function startQuiz() {
        const shuffled = [...QUIZ_QUESTIONS].sort(() => 0.5 - Math.random());
        quizState.questions = shuffled.slice(0, 3);
        quizState.currentIndex = 0;
        quizState.correctCount = 0;
        quizState.active = true;

        quizWelcome.classList.add("hidden");
        quizResult.classList.add("hidden");
        quizGame.classList.remove("hidden");

        renderQuizQuestion();
    }

    function renderQuizQuestion() {
        const question = quizState.questions[quizState.currentIndex];
        quizCurrentNum.textContent = quizState.currentIndex + 1;
        quizQuestionText.textContent = question.q;
        quizOptionsContainer.innerHTML = "";

        question.o.forEach((opt, idx) => {
            const btn = document.createElement("button");
            btn.className = "quiz-opt-btn";
            btn.textContent = opt;
            btn.addEventListener("click", () => handleQuizAnswer(idx, btn));
            quizOptionsContainer.appendChild(btn);
        });
    }

    function handleQuizAnswer(selectedIndex, clickedBtn) {
        const question = quizState.questions[quizState.currentIndex];
        const correctIndex = question.a;
        const optionsButtons = quizOptionsContainer.querySelectorAll(".quiz-opt-btn");

        optionsButtons.forEach(btn => btn.style.pointerEvents = "none");

        if (selectedIndex === correctIndex) {
            clickedBtn.classList.add("correct");
            quizState.correctCount++;
        } else {
            clickedBtn.classList.add("wrong");
            optionsButtons[correctIndex].classList.add("correct");
        }

        setTimeout(() => {
            quizState.currentIndex++;
            if (quizState.currentIndex < 3) {
                renderQuizQuestion();
            } else {
                finishQuiz();
            }
        }, 1500);
    }

    function finishQuiz() {
        quizGame.classList.add("hidden");
        quizResult.classList.remove("hidden");

        if (quizState.correctCount === 3) {
            quizResultTitle.textContent = "🏆 Perfeito!";
            quizResultText.innerHTML = `Você acertou 3 de 3 e ganhou <strong>+2 pacotes</strong> de figurinhas!`;
            STATE.packsLeft += 2;
            saveState();
            updatePacksUI();
        } else if (quizState.correctCount === 2) {
            quizResultTitle.textContent = "👍 Quase lá!";
            quizResultText.innerHTML = `Você acertou 2 de 3. Precisa acertar todas para ganhar pacotes!`;
        } else {
            quizResultTitle.textContent = "📚 Continue estudando!";
            quizResultText.textContent = `Você acertou ${quizState.correctCount} de 3. Tente de novo!`;
        }
    }

    // ===================================================
    // TAB 4: CRIAR FIGURINHA #30 UPLOAD LOGIC
    // ===================================================
    const customCardForm = document.getElementById("custom-card-form");
    const customFileInput = document.getElementById("custom-file");
    const fileLabelText = document.getElementById("file-label-text");
    const uploadPreviewContainer = document.getElementById("upload-preview-container");
    const uploadPreview = document.getElementById("upload-preview");
    const customStatusMsg = document.getElementById("custom-status-msg");

    customFileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            fileLabelText.textContent = file.name;
            const reader = new FileReader();
            reader.onload = (event) => {
                uploadPreview.src = event.target.result;
                uploadPreviewContainer.classList.remove("hidden");
            };
            reader.readAsDataURL(file);
        } else {
            fileLabelText.textContent = "Selecionar Imagem";
            uploadPreviewContainer.classList.add("hidden");
        }
    });

    customCardForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const nomeInput = document.getElementById("custom-name").value.trim();
        const roleInput = document.getElementById("custom-role").value.trim();
        const file = customFileInput.files[0];

        if (!nomeInput || !roleInput || !file) {
            showCustomStatus("Preencha todos os campos e selecione uma foto!", "error");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("nome", nomeInput);
        formData.append("role", roleInput);

        showCustomStatus("Enviando dados...", "info");

        try {
            const response = await fetch(`${API_BASE_URL}/figurinhas/30`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const errDetail = await response.json();
                throw new Error(errDetail.detail || "Erro no upload");
            }

            const data = await response.json();
            
            showCustomStatus("Figurinha criada com sucesso! Ela foi adicionada ao seu inventário.", "success");
            
            if (!STATE.inventoryIds.includes(30)) {
                STATE.inventoryIds.push(30);
            }
            saveState();

            customCardForm.reset();
            fileLabelText.textContent = "Selecionar Imagem";
            uploadPreviewContainer.classList.add("hidden");

            await preencherFigurinhas();
            renderInventoryList();

        } catch (error) {
            console.error(error);
            showCustomStatus(`Erro: ${error.message}`, "error");
        }
    });

    function showCustomStatus(msg, type) {
        customStatusMsg.textContent = msg;
        customStatusMsg.className = "status-msg";
        customStatusMsg.classList.remove("hidden");
        if (type === "success") {
            customStatusMsg.classList.add("success");
        } else if (type === "error") {
            customStatusMsg.classList.add("error");
        } else {
            customStatusMsg.style.background = "rgba(0, 240, 255, 0.1)";
            customStatusMsg.style.border = "1px solid rgba(0, 240, 255, 0.4)";
            customStatusMsg.style.color = "#00f0ff";
        }
    }

    // ===================================================
    // INICIALIZAÇÃO DE ESTADO DO COLECONADOR
    // ===================================================
    loadState();
    updatePacksUI();
    renderInventoryList();
});

