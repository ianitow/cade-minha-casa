/* =========================================================================
 * config.js — Constantes globais, URLs de assets e TODOS os textos PT-BR.
 * Tudo pendurado em window.Jogo para evitar poluição do escopo global.
 * ========================================================================= */
window.Jogo = window.Jogo || {};

Jogo.CONFIG = {
  /* ---- Mundo / física ---- */
  mundo: {
    limite: 38,          // metade do lado do mapa jogável (clamp em X e Z)
    gravidade: -0.4,
  },

  /* ---- João (jogador) ---- */
  player: {
    velAndar: 7.5,       // unidades/seg
    velCorrer: 13.5,
    velRotacao: 12,      // lerp de rotação (maior = vira mais rápido)
    escala: 0.12,        // ajuste empírico p/ HVGirl.glb
    alturaCamera: 1.7,
  },

  /* ---- Pombo (Fase 1) ---- */
  pombo: {
    velFuga: 11.5,       // < velCorrer do João, senão é impossível pegar
    velPasseio: 2.2,     // anda devagar quando o João está longe
    raioPanico: 11,      // distância em que entra em pânico e foge
    raioCaptura: 2.2,    // distância em que é capturado
    serpenteado: 5.5,    // amplitude do zigue-zague
    serpFreq: 4.0,       // frequência do zigue-zague
    quicaAltura: 0.7,    // amplitude do "pulinho" no Y
    quicaFreq: 9,
  },

  /* ---- Busca (Fases 2 e 3) ---- */
  busca: {
    raioInteracao: 4.5,  // distância p/ aparecer "[E] Revistar"
  },

  fase1: { tempo: 60 },  // segundos antes do João "cansar" (reinício suave)

  /* ---- URLs dos modelos (baixados por baixar-assets.sh para models/) ----
   * Cada um tem fallback procedural se faltar — o jogo nunca trava. */
  assets: {
    joao:  'models/joao.glb',   // HVGirl.glb (riggado: idle/walk/run)
    pombo: 'models/pombo.glb',  // Duck.glb (Khronos)
  },

  /* ---- Ajustes 2D (pixels/seg, pixels) ---- */
  d2: {
    player: { andar: 235, correr: 410 },
    pombo:  { fuga: 350, passeio: 75, raioPanico: 280, raioCaptura: 48,
              serp: 0.55, serpFreq: 5.5, hop: 11, hopFreq: 10 },
    busca:  { raio: 92 },
    fase1Tempo: 60,

    /* ---- Aliens (alucinação da ressaca) — em TODAS as fases ----
     * passeio < player.andar (235) → sempre dá pra fugir.
     * aura: distância onde a alucinação sobe. captura: encostou = game over. */
    aliens: { passeio: 90, aura: 210, captura: 40, subida: 0.5, descida: 0.3 },

    /* quantos aliens / pombos por fase */
    fase1Extra: { quantos: 6, aliens: 3 },
    fase2Aliens: 2,
    fase3Aliens: 3,

    /* ---- Chefe de água (Fase 4) ---- */
    chefe: {
      hp: 5,
      cadencia: [1.4, 1.0, 0.7],   // intervalo entre rajadas por estágio (hp alto→baixo)
      velProjetil: 250,             // água do boss (dá pra desviar andando)
      velTiro: 560,                 // cerveja arremessada
      raioPegar: 50,                // pega a cerveja andando por cima
      raioAcerto: 56,               // cerveja acerta o boss
      raioDano: 36,                 // água acerta o João
      spike: 0.18,                  // quanto a água enche o medidor
      spawnCerveja: 2.4,            // segundos entre spawns de cerveja
      maxCervejas: 3,
      aliens: 2,                    // aliens ambientes na arena
    },
  },

  /* ---- Cores dos ambientes ---- */
  cores: {
    ceuPraca:      '#7ec8f0',
    chaoPraca:     '#6fae54',
    caminhoPraca:  '#b9a06b',
    ceuLanche:     '#2b2438',
    chaoLanche:    '#5a4636',
    ceuBar:        '#140d1c',
    chaoBar:       '#2a1d33',
    ceuChefe:      '#06121f',
    chaoChefe:     '#0e2b3a',
  },

  /* =====================================================================
   * TEXTOS — todo o roteiro de humor em um só lugar.
   * ===================================================================== */
  txt: {
    titulo: 'Cadê Minha Casa?',
    subtitulo: 'As desventuras (alienígenas) de João depois do bar',
    jogar: '▶  Jogar',

    /* Nomes exibidos nos diálogos estilo RPG (chave = "quem" do retrato) */
    nomes: { joao: 'João', alien: '???', chefe: 'O Chefão Líquido', narrador: '' },
    dlgVel: 45,   // velocidade do typewriter (caracteres por segundo)

    abertura: [
      'João acordou numa praça. A boca seca, a cabeça latejando.',
      'Sem celular. Sem carteira. Sem chaves. Sem ideia de onde está.',
      { quem: 'joao', txt: 'Ai… minha cabeça. Que ressaca cósmica é essa?' },
      { quem: 'joao', txt: 'Peraí… aquilo ali é… um ALIENÍGENA?! Tem VÁRIOS!' },
      'Calma, João. São só alucinações da bebedeira. Provavelmente.',
      { quem: 'alien', txt: 'blluuurp… 🛸' },
      'Quanto mais perto deles você fica, mais a sua cabeça surta.',
      'Se um encostar em você, ou se você surtar de vez… era uma vez o João.',
      'Respira, desvia dos ETs e volta pra casa antes que o dia acabe.',
    ],

    fase1: {
      nome: 'Fase 1 — Cadê Meu Celular?',
      objetivo: '🐦 Ache o pombo certo (1 de vários) e fuja dos aliens!',
      dica: 'WASD / setas para andar · SHIFT para correr · fuja dos ETs',
      intro: [
        'Um bando de POMBOS bica algo brilhante no chão…',
        'Um deles está com o SEU celular! Mas qual? São todos iguais!',
        { quem: 'joao', txt: 'Encosta em cada pombo até achar o ladrão. E foge dos aliens!' },
      ],
      cansou: 'João ficou sem fôlego e teve que recomeçar. Maldita ressaca.',
      vitoria: 'PEGOU O CERTO! O pombo soltou o celular. 47 ligações perdidas da sua mãe.',
      // sorteado quando você pega o pombo ERRADO
      errado: [
        'Pombo errado! Esse só tinha uma batata frita no bico.',
        'Nada de celular. Esse aqui só queria atenção mesmo.',
        'Errou! O pombo te encarou com desprezo e levantou voo.',
        'Esse não. Ele soltou uma pena na sua cara de propósito.',
        'Pombo errado! Ele fez “rurru” num tom claramente ofensivo.',
        'Não era esse. Você abraçou um pombo aleatório em praça pública.',
      ],
    },

    transicao1: [
      '📱 Celular recuperado!',
      'Bateria em 3%. Última localização registrada:',
      '“Lanchonete do Zé — 03:47”',
      'No histórico: uma selfie sua abraçado com um poste e um alien ao fundo.',
      { quem: 'joao', txt: 'Os ETs me seguiram até aqui?! Preciso da carteira. Rápido.' },
    ],

    fase2: {
      nome: 'Fase 2 — A Carteira Perdida',
      objetivo: '👛 Revistar a lanchonete e achar sua carteira (sem surtar)',
      dica: 'Chegue perto e aperte [E] / clique para revistar · fuja dos ETs',
      intro: [
        'Lanchonete do Zé. Cheiro de coxinha e arrependimento.',
        'Você sentou em ALGUMA mesa de madrugada… mas qual?',
        { quem: 'joao', txt: 'Tem aliens entre as mesas também! Revisto rápido e dou no pé.' },
      ],
      vitoria: 'Achou a carteira! Vazia, claro. Mas tinha um bilhete dentro…',
    },

    transicao2: [
      '👛 Carteira recuperada!',
      'Dentro dela, um bilhete na sua própria letra tremida:',
      '“João: vc tá MUITO bêbado. Tem ET por tudo. Escondi a chave no BAR',
      'pra vc não perder igual da última vez. Assinado: vc mesmo.”',
      { quem: 'joao', txt: 'Eu mesmo me avisei sobre os aliens? Que noite foi essa…' },
    ],

    fase3: {
      nome: 'Fase 3 — A Última Chave',
      objetivo: '🔑 Encontrar a chave escondida no bar (e não surtar)',
      dica: 'A chave pode estar em QUALQUER lugar. Revista tudo! [E] / clique',
      intro: [
        'De volta ao Bar do Destino. Luz baixa, muita tranqueira.',
        'Você escondeu a chave em algum canto pra não perdê-la…',
        { quem: 'alien', txt: 'blurp blurp 👽 (até no escuro tem ET)' },
        'O highlight fica mais QUENTE (laranja/vermelho) perto da chave.',
      ],
      vitoria: 'ACHOU A CHAVE! Estava dentro de um copo de chopp. Óbvio.',
    },

    transicao3: [
      '🔑 Chave em mãos! João abre a porta de casa, aliviado…',
      '…mas a sala está INUNDADA e algo gigante se ergue da água.',
      { quem: 'chefe', txt: 'GLUB GLUB. EU SOU A SUA RESSACA EM FORMA DE ÁGUA.' },
      { quem: 'chefe', txt: 'VOU TE HIDRATAR À FORÇA, HUMANO CAMBALEANTE!' },
      { quem: 'joao', txt: 'Água?! NUNCA! Me dá uma cerveja que eu resolvo isso!' },
      'Desvie dos jatos d’água, pegue as cervejas do chão e tÁque nele!',
    ],

    fase4: {
      nome: 'Fase 4 — O Chefão Líquido',
      objetivo: '🍺 Acerte cervejas no boss e desvie da água!',
      dica: 'Ande por cima da cerveja p/ pegar · [E] / botão p/ arremessar',
      intro: [
        { quem: 'chefe', txt: 'A ÁGUA SEMPRE VENCE A CERVEJA, SEU PARDAL MOLHADO!' },
        { quem: 'joao', txt: 'Isso é o que veremos, seu aguaceiro intergaláctico!' },
        'Pegue as cervejas no chão e arremesse no boss. Desvie da água!',
      ],
      vitoria: 'O Chefão Líquido evaporou em um “PSCHIIIU”! Você venceu a ressaca!',
    },

    final: [
      'Com o boss derrotado, a sala secou e os aliens sumiram.',
      { quem: 'joao', txt: 'Eram alucinação esse tempo todo… né? NÉ?' },
      'João tomou 2 litros de água (por vontade própria, dessa vez)…',
      '…jurou que nunca mais bebe e dormiu até as 4 da tarde.',
      'FIM 🎉 (até o próximo churrasco)',
    ],

    // Balões de humor ao revistar um lugar VAZIO (sorteados)
    vazios: [
      'Nada. Só migalha de pão e arrependimento.',
      'Uma guardanapo com um número de telefone borrado. Não era.',
      'Aqui só tem poeira e uma azeitona solitária.',
      'Achou R$ 0,75 em moedas. Investimento emocional alto, retorno baixo.',
      'Um chiclete grudado. Por que você cutucou isso?',
      'Nada aqui além da sua dignidade. Ah não, essa também sumiu.',
      'Só um palito de dente e memórias confusas.',
      'Vazio. Mas tem um cheiro estranho que você prefere não investigar.',
    ],

    quente: 'Tá esquentando…',
    frio: 'Frio. Procura noutro canto.',
    revistados: 'Revistados',
    mudo: '🔊',
    mutado: '🔇',

    /* ---- Game over (reinicia a fase atual) ---- */
    gameoverTitulo: '💀 Fim de jogo',
    gameoverSub: 'A ressaca venceu desta vez.',
    tentarDeNovo: '↻ Tentar de novo',
    menu: '☰ Menu',
    alucinacao: 'Alucinação',
    chefeVida: 'Chefão Líquido',
    gameover: {
      // alien encostou em você
      capturado: [
        { quem: 'alien', txt: 'peguei vc, terráqueo molenga. blluurp.' },
        'Um alien encostou em João. Ele desmaiou de susto na calçada.',
      ],
      // medidor de alucinação chegou a 100%
      surto: [
        { quem: 'joao', txt: 'TEM ET EM TUDO! NO POSTE! NA LIXEIRA! NO MEU SAPATO!' },
        'João surtou completamente. A vizinhança chamou a ambulância.',
      ],
      // levou água demais do boss
      chefe: [
        { quem: 'chefe', txt: 'HIDRATADO! AGORA VOCÊ É 70% ÁGUA, COMO DEVE SER.' },
        'João foi encharcado até virar poça. A cerveja chorou.',
      ],
      padrao: [ 'Deu ruim. João precisa tentar de novo.' ],
    },
  },
};
