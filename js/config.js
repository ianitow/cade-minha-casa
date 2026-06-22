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
  },

  /* =====================================================================
   * TEXTOS — todo o roteiro de humor em um só lugar.
   * ===================================================================== */
  txt: {
    titulo: 'Cadê Minha Casa?',
    subtitulo: 'As desventuras de João depois do bar',
    jogar: '▶  Jogar',

    abertura: [
      'João acordou numa praça. A boca seca, a cabeça latejando.',
      'Sem celular. Sem carteira. Sem chaves. Sem ideia de onde está.',
      'Só uma certeza: precisa voltar pra casa antes que o dia acabe.',
      'O problema… ele nem sabe em que bairro acordou.',
    ],

    fase1: {
      nome: 'Fase 1 — Cadê Meu Celular?',
      objetivo: '🐦 Pegue o pombo que roubou seu celular!',
      dica: 'WASD / setas para andar · SHIFT para correr',
      intro: [
        'Um POMBO está bicando algo brilhante no chão…',
        'É o SEU celular! O safado pega no bico e sai voando!',
        'Corra atrás dele. Encoste no pombo pra recuperar o aparelho.',
      ],
      cansou: 'João ficou sem fôlego e teve que recomeçar. Maldita ressaca.',
      vitoria: 'PEGOU! O pombo soltou o celular. 47 ligações perdidas da sua mãe.',
    },

    transicao1: [
      '📱 Celular recuperado!',
      'Bateria em 3%. Última localização registrada:',
      '“Lanchonete do Zé — 03:47”',
      'No histórico: uma selfie sua abraçado com um poste.',
      'É melhor ir até a lanchonete. A carteira pode estar lá.',
    ],

    fase2: {
      nome: 'Fase 2 — A Carteira Perdida',
      objetivo: '👛 Revistar a lanchonete e achar sua carteira',
      dica: 'Chegue perto e aperte [E] (ou clique) para revistar',
      intro: [
        'Lanchonete do Zé. Cheiro de coxinha e arrependimento.',
        'Você sentou em ALGUMA mesa de madrugada… mas qual?',
        'Revasculhe mesas, cadeiras e o chão até achar a carteira.',
      ],
      vitoria: 'Achou a carteira! Vazia, claro. Mas tinha um bilhete dentro…',
    },

    transicao2: [
      '👛 Carteira recuperada!',
      'Dentro dela, um bilhete na sua própria letra tremida:',
      '“João: vc tá MUITO bêbado. Escondi a chave de casa no BAR',
      'pra vc não perder igual da última vez. Assinado: vc mesmo.”',
      'Genial. Agora é voltar ao bar e achar essa chave.',
    ],

    fase3: {
      nome: 'Fase 3 — A Última Chave',
      objetivo: '🔑 Encontrar a chave escondida no bar',
      dica: 'A chave pode estar em QUALQUER lugar. Revista tudo! [E] / clique',
      intro: [
        'De volta ao Bar do Destino. Luz baixa, muita tranqueira.',
        'Você escondeu a chave em algum canto pra não perdê-la…',
        'O highlight fica mais QUENTE (laranja/vermelho) perto da chave.',
      ],
      vitoria: 'ACHOU A CHAVE! Estava dentro de um copo de chopp. Óbvio.',
    },

    final: [
      '🔑 Com a chave em mãos, João finalmente chegou em casa.',
      'Tomou 2 litros de água, jurou que nunca mais bebe…',
      '…e dormiu até as 4 da tarde do dia seguinte.',
      'FIM 🎉',
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
  },
};
