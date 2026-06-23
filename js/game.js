/* =========================================================================
 * game.js — Jogo.Game (motor 2D)
 * Loop de render (requestAnimationFrame) + máquina de estados das cenas.
 * Carregado por último. Sem dependências externas.
 *
 * Fluxo: MENU → (abertura) → F1 → (transição1) → F2 → (transição2)
 *        → F3 → (final) → VITÓRIA → MENU
 * ========================================================================= */
window.Jogo = window.Jogo || {};

Jogo.Game = (function () {
  const R = Jogo.R, C = Jogo.CONFIG;
  let canvas, ctx, cenaAtual = null, ultimo = 0;

  function iniciar() {
    canvas = document.getElementById('renderCanvas');
    R.init(canvas);
    ctx = R.ctx();

    // clique/toque na tela = ação (revistar)
    canvas.addEventListener('pointerdown', function () {
      Jogo.Audio.resumir();
      if (Jogo.Input.acao) Jogo.Input.acao();
    });

    // botão de mudo
    const bm = document.getElementById('btnMudo');
    if (bm) bm.addEventListener('click', function () {
      const m = Jogo.Audio.alternarMudo();
      bm.textContent = m ? C.txt.mutado : C.txt.mudo;
    });

    Jogo.UI.esconderLoading();
    requestAnimationFrame(loop);
    irMenu();
  }

  function loop(t) {
    requestAnimationFrame(loop);
    let dt = (t - ultimo) / 1000; ultimo = t;
    if (!(dt > 0)) dt = 0;
    if (dt > 0.05) dt = 0.05;       // estabilidade após travadas
    ctx.clearRect(0, 0, R.W, R.H);
    const c = cenaAtual;
    if (c) { if (c.ativo) c.update(dt); c.draw(ctx); }
  }

  function trocar(fabrica) {
    // 1º limpa o estado anterior, DEPOIS constrói a nova cena
    if (cenaAtual && cenaAtual.dispose) { try { cenaAtual.dispose(); } catch (e) { console.warn(e); } }
    Jogo.Input.limparAcoes();
    Jogo.Audio.pararLoop();
    if (R.tremor) R.tremor(0);
    Jogo.UI.timer(null); Jogo.UI.contador(null); Jogo.UI.dica(null);
    Jogo.UI.alucinacao(null); Jogo.UI.chefeVida(null); Jogo.UI.mostrarHUD(false);
    const nova = fabrica();
    cenaAtual = nova; api.cenaAtual = nova;
  }

  let faseAtual = 1;

  /* -------- estados -------- */
  function irMenu() { trocar(cenaMenu); }
  function comecar() { Jogo.UI.cutscene(C.txt.abertura, irFase1); }
  function irFase1() { faseAtual = 1; trocar(() => Jogo.Cenas.fase1(() => Jogo.UI.cutscene(C.txt.transicao1, irFase2), perder)); }
  function irFase2() { faseAtual = 2; trocar(() => Jogo.Cenas.fase2(() => Jogo.UI.cutscene(C.txt.transicao2, irFase3), perder)); }
  function irFase3() { faseAtual = 3; trocar(() => Jogo.Cenas.fase3(() => Jogo.UI.cutscene(C.txt.transicao3, irFase4), perder)); }
  function irFase4() { faseAtual = 4; trocar(() => Jogo.Cenas.fase4(() => Jogo.UI.cutscene(C.txt.final, irVitoria), perder)); }
  function irVitoria() { trocar(cenaVitoria); }

  // recomeça SOMENTE a fase em que o jogador perdeu (cada irFaseN reconstrói via trocar)
  function reiniciarFase() {
    ({ 1: irFase1, 2: irFase2, 3: irFase3, 4: irFase4 }[faseAtual] || irFase1)();
  }

  // chamado pelas cenas via aoPerder(motivo): diálogo RPG de game over + tela de fim
  function perder(motivo) {
    const go = C.txt.gameover || {};
    const linhas = go[motivo] || go.padrao || ['Game over'];
    Jogo.Audio.pararLoop();
    if (motivo === 'capturado') Jogo.Audio.tocarSom('morte_et', { vol: 1 });   // "busquem conhecimento"
    else if (motivo === 'surto') Jogo.Audio.tocarSom('surto', { vol: 1 });      // miau triste
    else Jogo.Audio.sfx('derrota');
    Jogo.Audio.tocarSom('gyro', { vol: 1 });   // "foi quando o Gyro finalmente entendeu" (toca em toda morte)
    Jogo.UI.dialogo(linhas, () => {
      Jogo.UI.telaFim({
        titulo: C.txt.gameoverTitulo,
        linhas: [C.txt.gameoverSub],
        textoBotao: C.txt.tentarDeNovo,
        aoBotao: () => { Jogo.Audio.sfx('clique'); reiniciarFase(); },
        textoBotao2: C.txt.menu,
        aoBotao2: () => { Jogo.Audio.sfx('clique'); irMenu(); },
      });
    });
  }

  /* -------- cena de MENU (praça parada de fundo) -------- */
  function cenaMenu() {
    let t = 0;
    R.cam.x = 0; R.cam.y = 0;
    Jogo.Audio.tocarMusica('menu');
    Jogo.UI.mostrarHUD(false); Jogo.Input.mostrarToque(false);
    Jogo.UI.menu({
      titulo: C.txt.titulo, subtitulo: C.txt.subtitulo, textoBotao: C.txt.jogar,
      aoJogar: () => { Jogo.Audio.sfx('clique'); comecar(); },
    });
    return {
      ativo: true,
      update(dt) { t += dt; R.cam.x = Math.sin(t * 0.3) * 70; R.cam.y = Math.cos(t * 0.25) * 35; },
      draw() { fundoPraca(t); },
      dispose() {},
    };
  }

  function fundoPraca(t) {
    R.piso(C.cores.chaoPraca);
    R.pontilhado('rgba(255,255,255,0.05)', 70);
    R.faixa(-80, -600, 160, 1200, C.cores.caminhoPraca);
    R.predio(-400, -260, 150, 220, '#c46b9e'); R.predio(250, -280, 150, 240, '#5b8dd6');
    R.predio(-380, 170, 150, 200, '#6bb0c4'); R.predio(260, 160, 150, 200, '#e0a14f');
    R.arvore(-160, 120); R.arvore(170, 150);
    R.pessoa(0, 120, { t: t, andando: false, flip: false, cor: '#3b82d6' });
    R.pombo(120, 40, { t: t, dir: -1, hop: 8, hopFreq: 6 });
    R.item(132, 6, 'celular', t);
  }

  /* -------- cena de VITÓRIA (casa + confete) -------- */
  function cenaVitoria() {
    let t = 0;
    const cores = ['#ffd23f', '#ff6b6b', '#54d0ff', '#7be07b', '#c47bff'];
    const conf = [];
    for (let i = 0; i < 46; i++) conf.push({
      x: (Math.random() - 0.5) * 1000, y: Math.random() * -700 - 40,
      v: 120 + Math.random() * 170, w: 6 + Math.random() * 8,
      cor: cores[i % cores.length], ph: Math.random() * 6, sw: 20 + Math.random() * 40,
    });
    R.cam.x = 0; R.cam.y = 0;
    // zerou o jogo: toca "bem amigos, terminou" e, ao fim, volta a música
    Jogo.Audio.pararLoop(); Jogo.Audio.pararMusica();
    Jogo.Audio.tocarSom('fim', { vol: 1, onfim: () => Jogo.Audio.tocarMusica('menu') });
    Jogo.UI.mostrarHUD(false); Jogo.Input.mostrarToque(false);
    Jogo.UI.telaFim({
      titulo: '🎉 João chegou em casa!',
      linhas: ['Celular ✅  Carteira ✅  Chave ✅', 'Missão (e ressaca) cumprida.'],
      textoBotao: '↻ Jogar de novo',
      aoBotao: () => { Jogo.Audio.sfx('clique'); irMenu(); },
    });
    return {
      ativo: true,
      update(dt) { t += dt; conf.forEach((c) => { c.y += c.v * dt; c.x += Math.sin(t * 2 + c.ph) * c.sw * dt; if (c.y > 520) { c.y = -520; } }); },
      draw() { fundoCasa(t, conf); },
      dispose() {},
    };
  }

  function fundoCasa(t, conf) {
    R.piso('#243a6a');
    R.ret(-1600, 150, 3200, 900, '#3a4a2a');
    // casa
    R.ret(-140, -60, 280, 200, '#caa15a', 8);
    const c = ctx; c.fillStyle = '#8a3a3a';
    c.beginPath(); c.moveTo(R.sx(-160), R.sy(-60)); c.lineTo(R.sx(0), R.sy(-160)); c.lineTo(R.sx(160), R.sy(-60)); c.closePath(); c.fill();
    R.ret(-32, 40, 64, 100, '#5a3a1b', 6);   // porta
    R.ret(-110, -30, 50, 50, '#bfe6ff', 4); R.ret(60, -30, 50, 50, '#bfe6ff', 4);  // janelas
    R.pessoa(0, 230, { t: t, andando: false, flip: false, cor: '#3b82d6' });
    // confete
    conf.forEach((cf) => {
      const X = R.sx(cf.x), Y = R.sy(cf.y);
      c.save(); c.translate(X, Y); c.rotate(Math.sin(t * 3 + cf.ph));
      c.fillStyle = cf.cor; c.fillRect(-cf.w / 2, -cf.w / 2, cf.w, cf.w * 1.6); c.restore();
    });
  }

  const api = { iniciar, irMenu, irFase1, irFase2, irFase3, irFase4, irVitoria, comecar, reiniciarFase, cenaAtual: null };
  return api;
})();

/* boot */
(function () {
  function go() { Jogo.Game.iniciar(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
  else go();
})();
