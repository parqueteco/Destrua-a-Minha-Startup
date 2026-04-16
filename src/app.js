// ==========================================
// CONFIGURAÇÃO DA API
// ==========================================
// A API_KEY será substituída pelo Vite durante o build
const API_KEY = process.env.GEMINI_API_KEY;

// ==========================================
// ELEMENTOS DO DOM
// ==========================================
const screenInput = document.getElementById('screen-input');
const screenDashboard = document.getElementById('screen-dashboard');

const tabUrl = document.getElementById('tab-url');
const tabPdf = document.getElementById('tab-pdf');
const contentUrl = document.getElementById('content-url');
const contentPdf = document.getElementById('content-pdf');
const inputPdf = document.getElementById('startup-pdf');
const fileNameDisplay = document.getElementById('file-name-display');
const dropZone = document.getElementById('drop-zone');

const inputUrl = document.getElementById('startup-url');
const btnDestruir = document.getElementById('btn-destruir');
const btnText = document.getElementById('btn-text');
const btnIcon = document.getElementById('btn-icon');

const btnVoltarTop = document.getElementById('btn-voltar-top');
const btnReset = document.getElementById('btn-reset');

// Elementos de Dados do Dashboard
const els = {
    reportId: document.getElementById('report-id'),
    startupName: document.getElementById('startup-name'),
    startupUrlDisplay: document.getElementById('startup-url-display'),
    notaGeral: document.getElementById('nota-geral'),
    riscoLabel: document.getElementById('risco-label'),
    
    ideiaNota: document.getElementById('ideia-nota'),
    ideiaTexto: document.getElementById('ideia-texto'),
    
    copyNota: document.getElementById('copy-nota'),
    copyTexto: document.getElementById('copy-texto'),
    
    designNota: document.getElementById('design-nota'),
    designTexto: document.getElementById('design-texto'),
    
    propostaNota: document.getElementById('proposta-nota'),
    propostaTexto: document.getElementById('proposta-texto'),
    
    ctaNota: document.getElementById('cta-nota'),
    ctaTexto: document.getElementById('cta-texto'),
    
    impressaoNota: document.getElementById('impressao-nota'),
    impressaoTexto: document.getElementById('impressao-texto'),
    
    vereditoTexto: document.getElementById('veredito-texto'),
};

// ==========================================
// LÓGICA DE ESTADO
// ==========================================

function setLoading(isLoading) {
    if (!btnDestruir) return; // Guard clause
    if (isLoading) {
        btnText.innerText = 'Analisando...';
        btnIcon.innerText = 'hourglass_empty';
        btnIcon.classList.add('animate-spin');
        btnDestruir.disabled = true;
        btnDestruir.classList.add('opacity-70', 'cursor-not-allowed');
    } else {
        btnText.innerText = 'DESTRUIR!';
        btnIcon.innerText = 'local_fire_department';
        btnIcon.classList.remove('animate-spin');
        btnDestruir.disabled = false;
        btnDestruir.classList.remove('opacity-70', 'cursor-not-allowed');
    }
}

function showDashboard() {
    screenInput.classList.add('hidden');
    screenInput.classList.remove('flex');
    
    screenDashboard.classList.remove('hidden');
    screenDashboard.classList.add('flex');
    window.scrollTo(0, 0);
}

function resetApp() {
    inputUrl.value = '';
    inputPdf.value = '';
    fileNameDisplay.innerText = 'Arraste seu PDF aqui ou clique para selecionar';
    fileNameDisplay.classList.remove('text-white', 'font-bold');
    dropZone.classList.remove('border-primary', 'bg-surface-light/30');
    
    screenDashboard.classList.add('hidden');
    screenDashboard.classList.remove('flex');
    
    screenInput.classList.remove('hidden');
    screenInput.classList.add('flex');
    window.scrollTo(0, 0);
}

function updateDashboard(data) {
    // Gerar ID aleatório para o relatório
    els.reportId.innerText = Math.floor(1000 + Math.random() * 9000);

    // Atualizar Nome e URL da Startup
    els.startupName.innerText = data.nome_startup || "STARTUP DESCONHECIDA";
    els.startupUrlDisplay.innerText = data.url_startup || "URL NÃO FORNECIDA";
    els.startupUrlDisplay.href = data.url_startup || "#";

    // Atualizar Nota Geral e Label de Risco
    const notaGeral = parseFloat(data.nota_geral);
    els.notaGeral.innerText = notaGeral.toFixed(1);
    
    if (notaGeral < 4) {
        els.riscoLabel.innerText = "RISCO CRÍTICO DE FRACASSO";
        els.riscoLabel.className = "font-headline font-extrabold text-2xl md:text-5xl text-primary tracking-tight uppercase";
    } else if (notaGeral < 7) {
        els.riscoLabel.innerText = "RISCO ALTO DE ESTAGNAÇÃO";
        els.riscoLabel.className = "font-headline font-extrabold text-2xl md:text-5xl text-orange-500 tracking-tight uppercase";
    } else {
        els.riscoLabel.innerText = "CHANCES MODERADAS DE SOBREVIVÊNCIA";
        els.riscoLabel.className = "font-headline font-extrabold text-2xl md:text-5xl text-yellow-500 tracking-tight uppercase";
    }

    // Atualizar Cards
    els.ideiaNota.innerText = parseFloat(data.ideia_nota).toFixed(1);
    els.ideiaTexto.innerText = data.ideia_texto;

    els.copyNota.innerText = parseFloat(data.copy_nota).toFixed(1);
    els.copyTexto.innerText = data.copy_texto;

    els.designNota.innerText = parseFloat(data.design_nota).toFixed(1);
    els.designTexto.innerText = data.design_texto;

    els.propostaNota.innerText = parseFloat(data.proposta_nota).toFixed(1);
    els.propostaTexto.innerText = data.proposta_texto;

    els.ctaNota.innerText = parseFloat(data.cta_nota).toFixed(1);
    els.ctaTexto.innerText = data.cta_texto;

    els.impressaoNota.innerText = parseFloat(data.impressao_nota).toFixed(1);
    els.impressaoTexto.innerText = data.impressao_texto;

    // Atualizar Veredito
    els.vereditoTexto.innerText = data.veredito_texto;
}

// ==========================================
// INTEGRAÇÃO COM GEMINI API
// ==========================================

async function analyzeStartup() {
    if (!API_KEY || API_KEY === 'SUA_API_KEY_AQUI') {
        alert("ERRO: Chave da API do Gemini não configurada. Configure a secret GEMINI_API_KEY no GitHub.");
        return;
    }

    const isUrlMode = contentUrl.classList.contains('block');
    let requestBody;

    const systemPrompt = `Você é um Venture Capitalist veterano, cínico, implacável e com zero paciência. O usuário enviará a URL de uma landing page ou o texto de um pitch.

Sua Missão: Faça um 'roast' brutal, destruindo a proposta de valor, apontando falhas, clichês e ilusões dos fundadores (como uso de buzzwords, CRUD glorificado, falta de moat, CAC inviável).

Regras de Estilo:
- Seja impiedoso, mas engraçado. Use analogias absurdas.
- Abuse de termos do ecossistema de forma irônica (ex: burn rate, pivotar, CRUD glorificado, Y Combinator, valuation, feature disfarçada de empresa).
- Dê notas rigorosas de 0 a 10 (seja cruel, médias entre 2 e 5 são o padrão).
- Nunca elogie de forma genuína. Se algo for bom, diga que é "o mínimo esperado" ou "genérico".

Regra de Densidade (MUITO IMPORTANTE): Para CADA categoria (Ideia, Copy, Design, Proposta, CTA, Impressão Geral), você DEVE escrever EXATAMENTE 1 parágrafo denso e bem construído (cerca de 4 a 5 linhas, não muito curto). O Veredito Final deve continuar sendo um parágrafo bem longo, épico e destruidor.

Você deve OBRIGATORIAMENTE retornar a resposta em formato JSON estrito, extraindo o nome da empresa e preenchendo as chaves:
{
"nome_startup": "Extraia o nome oficial do site/pitch",
"url_startup": "A URL fornecida ou 'PDF Upload'",
"nota_geral": "Nota de 0 a 10 com uma casa decimal (ex: 2.5)",
"ideia_nota": "Nota",
"ideia_texto": "1 parágrafo denso e sarcástico",
"copy_nota": "Nota",
"copy_texto": "1 parágrafo denso e sarcástico",
"design_nota": "Nota",
"design_texto": "1 parágrafo denso e sarcástico",
"proposta_nota": "Nota",
"proposta_texto": "1 parágrafo denso e sarcástico",
"cta_nota": "Nota",
"cta_texto": "1 parágrafo denso e sarcástico",
"impressao_nota": "Nota",
"impressao_texto": "1 parágrafo denso e sarcástico",
"veredito_texto": "Parágrafo longo e destruidor"
}`;

    if (isUrlMode) {
        const url = inputUrl.value.trim();
        if (!url) {
            alert("Por favor, insira uma URL válida.");
            return;
        }

        setLoading(true);

        // Passo 1: Extração de Texto com Jina AI
        let scrapedText = "";
        try {
            btnText.innerText = 'Lendo o site...';
            const jinaResponse = await fetch(`https://r.jina.ai/${url}`);
            if (!jinaResponse.ok) {
                throw new Error(`Jina AI falhou com status: ${jinaResponse.status}`);
            }
            scrapedText = await jinaResponse.text();
        } catch (jinaError) {
            console.warn("Falha ao extrair texto com Jina AI:", jinaError);
            scrapedText = "[ERRO: Não foi possível extrair o conteúdo do site. Faça a análise baseada apenas na URL fornecida e em conhecimentos gerais sobre o domínio, se houver.]";
        }

        btnText.innerText = 'Analisando...';
        const userPrompt = `Analise a seguinte startup. URL: ${url}\n\nConteúdo da Landing Page:\n${scrapedText}`;

        requestBody = {
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        };

    } else {
        // Modo PDF
        const file = inputPdf.files[0];
        if (!file) {
            alert("Por favor, selecione um arquivo PDF.");
            return;
        }

        setLoading(true);
        btnText.innerText = 'Lendo PDF...';

        try {
            const base64Data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });

            btnText.innerText = 'Analisando...';
            const userPrompt = `Analise o seguinte pitch deck (PDF) da startup e faça o roast.`;

            requestBody = {
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{
                    parts: [
                        { text: userPrompt },
                        { inlineData: { mimeType: "application/pdf", data: base64Data } }
                    ]
                }],
                generationConfig: { responseMimeType: "application/json" }
            };
        } catch (error) {
            console.error("Erro ao ler PDF:", error);
            alert("Erro ao ler o arquivo PDF.");
            setLoading(false);
            return;
        }
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Extrair o texto da resposta
        let jsonString = data.candidates[0].content.parts[0].text;
        
        // Limpar formatação markdown se houver (ex: ```json ... ```)
        jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        const parsedData = JSON.parse(jsonString);
        
        updateDashboard(parsedData);
        showDashboard();

    } catch (error) {
        console.error("Erro ao analisar startup:", error);
        alert("Ocorreu um erro ao tentar destruir esta startup. Verifique o console para mais detalhes ou tente novamente.");
    } finally {
        setLoading(false);
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================

// Guard para rodar apenas se o DOM existir
if (tabUrl) {
    // Tabs
    tabUrl.addEventListener('click', () => {
        tabUrl.classList.add('text-primary', 'border-primary', 'bg-surface-light/30');
        tabUrl.classList.remove('text-text-muted', 'border-transparent');
        
        tabPdf.classList.remove('text-primary', 'border-primary', 'bg-surface-light/30');
        tabPdf.classList.add('text-text-muted', 'border-transparent');
        
        contentUrl.classList.remove('hidden');
        contentUrl.classList.add('block');
        
        contentPdf.classList.remove('block');
        contentPdf.classList.add('hidden');
    });

    tabPdf.addEventListener('click', () => {
        tabPdf.classList.add('text-primary', 'border-primary', 'bg-surface-light/30');
        tabPdf.classList.remove('text-text-muted', 'border-transparent');
        
        tabUrl.classList.remove('text-primary', 'border-primary', 'bg-surface-light/30');
        tabUrl.classList.add('text-text-muted', 'border-transparent');
        
        contentPdf.classList.remove('hidden');
        contentPdf.classList.add('block');
        
        contentUrl.classList.remove('block');
        contentUrl.classList.add('hidden');
    });

    // File Input
    inputPdf.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            fileNameDisplay.innerText = file.name;
            fileNameDisplay.classList.add('text-white', 'font-bold');
            dropZone.classList.add('border-primary', 'bg-surface-light/30');
        } else {
            fileNameDisplay.innerText = 'Arraste seu PDF aqui ou clique para selecionar';
            fileNameDisplay.classList.remove('text-white', 'font-bold');
            dropZone.classList.remove('border-primary', 'bg-surface-light/30');
        }
    });

    btnDestruir.addEventListener('click', () => {
        analyzeStartup();
    });

    // Permitir envio com Enter (apenas no modo URL)
    inputUrl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            analyzeStartup();
        }
    });

    btnVoltarTop.addEventListener('click', resetApp);
    btnReset.addEventListener('click', resetApp);
}
