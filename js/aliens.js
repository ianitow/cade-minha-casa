/* =========================================================================
 * aliens.js — Jogo.Aliens (2D)
 * Fábrica reutilizável (no padrão de Jogo.Busca) que controla os aliens
 * errantes + o MEDIDOR DE ALUCINAÇÃO + a detecção de derrota.
 *
 * Os aliens só existem na cabeça do João (ressaca). Eles VAGUEIAM (não
 * perseguem), então dá pra fugir. Ficar dentro da "aura" enche o medidor;
 * encostar = game over; medidor a 100% = game over.
 * ========================================================================= */
window.Jogo = window.Jogo || {};

Jogo.Aliens = function (opts) {
  const C = Jogo.CONFIG, A = C.d2.aliens;
  const mundo   = opts.mundo;
  const passeio = opts.passeio != null ? opts.passeio : A.passeio;
  const aura    = opts.aura    != null ? opts.aura    : A.aura;
  const captura = opts.captura != null ? opts.captura : A.captura;
  const subida  = opts.subida  != null ? opts.subida  : A.subida;
  const descida = opts.descida != null ? opts.descida : A.descida;
  const quantos = opts.quantos != null ? opts.quantos : 3;
  const getJogador = opts.getJogador;

  const aliens = [];
  let nivel = 0, perdeu = false, somT = 0;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function spawnUm(joao) {
    let x, y, tent = 0;
    do {
      x = rnd(mundo.x0 + 30, mundo.x1 - 30);
      y = rnd(mundo.y0 + 30, mundo.y1 - 30);
      tent++;
    } while (joao && Math.hypot(x - joao.x, y - joao.y) < aura * 1.3 && tent < 20);
    return { x, y, t: Math.random() * 6.28, heading: Math.random() * 6.28, troca: 0, dir: -1, fase: Math.random() * 6.28 };
  }

  function init() {
    const j = getJogador ? getJogador() : null;
    for (let i = 0; i < quantos; i++) aliens.push(spawnUm(j));
  }
  init();

  function perder(tipo) {
    if (perdeu) return;
    perdeu = true;
    if (tipo === 'pegou' && opts.aoPegar) opts.aoPegar();
    else if (tipo === 'surto' && opts.aoSurtar) opts.aoSurtar();
  }

  function update(dt, joao) {
    if (perdeu) return nivel;
    let pressao = 0;
    for (const a of aliens) {
      a.t += dt;
      a.troca -= dt;
      if (a.troca <= 0) { a.heading += (Math.random() - 0.5) * 1.6; a.troca = 1 + Math.random() * 1.4; }
      a.x += Math.cos(a.heading) * passeio * dt;
      a.y += Math.sin(a.heading) * passeio * dt;
      if (a.x < mundo.x0 || a.x > mundo.x1) a.heading = Math.PI - a.heading;
      if (a.y < mundo.y0 || a.y > mundo.y1) a.heading = -a.heading;
      a.x = clamp(a.x, mundo.x0, mundo.x1);
      a.y = clamp(a.y, mundo.y0, mundo.y1);
      a.dir = Math.cos(a.heading) >= 0 ? 1 : -1;

      const d = Math.hypot(a.x - joao.x, a.y - joao.y);
      if (d < captura) { perder('pegou'); return nivel; }
      if (d < aura) pressao += (1 - d / aura);
    }
    nivel = clamp(nivel + (pressao > 0 ? pressao * subida : -descida) * dt, 0, 1);
    Jogo.UI.alucinacao(nivel);
    // zumbido de tensão enquanto perto
    if (pressao > 0) { somT -= dt; if (somT <= 0) { Jogo.Audio.sfx('alien'); somT = 1.1 - Math.min(0.7, pressao * 0.3); } }
    if (nivel >= 1) perder('surto');
    return nivel;
  }

  // a água do boss (Fase 4) também alimenta ESTE medidor
  function bump(amount) {
    if (perdeu) return;
    nivel = clamp(nivel + amount, 0, 1);
    Jogo.UI.alucinacao(nivel);
    if (nivel >= 1) perder('surto');
  }

  // entra na lista {y,f} da cena ANTES do sort (profundidade correta)
  function desenhos() {
    return aliens.map((a) => ({
      y: a.y,
      f: () => Jogo.R.alienigena(a.x, a.y, { t: a.t, dir: a.dir, fase: a.fase }),
    }));
  }

  // efeito psicodélico em tela cheia — desenhar POR ÚLTIMO
  function efeito() { Jogo.R.efeitoAlucinacao(nivel); }

  function reset() {
    perdeu = false; nivel = 0; somT = 0;
    aliens.length = 0; init();
  }

  return {
    update, desenhos, efeito, bump, reset,
    get nivel() { return nivel; },
    get perdeu() { return perdeu; },
    aliens,
  };
};
