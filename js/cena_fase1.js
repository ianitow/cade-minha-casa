/* =========================================================================
 * cena_fase1.js — Fase 1: "Cadê Meu Celular?"
 * Perseguição 2D top-down: João corre atrás do pombo que roubou o celular.
 * ========================================================================= */
window.Jogo = window.Jogo || {};
Jogo.Cenas = Jogo.Cenas || {};

Jogo.Cenas.fase1 = function (aoConcluir) {
  const R = Jogo.R, C = Jogo.CONFIG, P = C.d2.player, PB = C.d2.pombo;
  const mundo = { x0: -420, x1: 420, y0: -620, y1: 560 };

  const joao = { x: 0, y: 320, t: 0, andando: false, flip: false };
  const pombo = { x: 70, y: 150, t: 0, dir: -1, heading: Math.random() * 6.28, troca: 0 };

  const est = { ativo: false, venceu: false, tempo: C.d2.fase1Tempo };
  let pegou = false;

  // cenário estático (prédios, árvores, banco)
  const predios = [
    [-420, -560, 150, 240, '#c46b9e'], [-420, -260, 150, 200, '#7e6bd0'],
    [270, -520, 150, 220, '#5b8dd6'], [270, -240, 150, 240, '#e0a14f'],
    [-420, 120, 150, 220, '#6bb0c4'], [270, 140, 150, 200, '#c4796b'],
  ];
  const arvores = [[-150, 180], [150, 220], [-200, -180], [180, -120], [-120, 420]];

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function update(dt) {
    joao.t += dt; pombo.t += dt;

    // ---- João ----
    const e = Jogo.Input.eixo();
    const mag = Math.hypot(e.x, e.y);
    if (mag > 0.05) {
      const correndo = Jogo.Input.estado.correr && mag > 0.5;
      const vel = correndo ? P.correr : P.andar;
      const nx = e.x / mag, ny = -e.y / mag;     // tela: cima = y negativo
      joao.x = clamp(joao.x + nx * vel * dt * Math.min(1, mag), mundo.x0, mundo.x1);
      joao.y = clamp(joao.y + ny * vel * dt * Math.min(1, mag), mundo.y0, mundo.y1);
      joao.andando = true;
      if (Math.abs(nx) > 0.1) joao.flip = nx < 0;
      // passos
      joao._ps = (joao._ps || 0) - dt;
      if (joao._ps <= 0) { Jogo.Audio.sfx('passo'); joao._ps = correndo ? 0.26 : 0.4; }
    } else joao.andando = false;

    // ---- Pombo (IA de fuga) ----
    const toX = pombo.x - joao.x, toY = pombo.y - joao.y;
    const dist = Math.hypot(toX, toY) || 1;
    if (dist < PB.raioPanico) {
      let fx = toX / dist, fy = toY / dist;
      const s = Math.sin(pombo.t * PB.serpFreq) * PB.serp;
      let ax = fx - fy * s, ay = fy + fx * s;
      const al = Math.hypot(ax, ay) || 1; ax /= al; ay /= al;
      pombo.x += ax * PB.fuga * dt; pombo.y += ay * PB.fuga * dt;
      pombo.dir = ax >= 0 ? 1 : -1;
    } else {
      pombo.troca -= dt;
      if (pombo.troca <= 0) { pombo.heading += (Math.random() - 0.5) * 1.6; pombo.troca = 1 + Math.random() * 1.4; }
      pombo.x += Math.cos(pombo.heading) * PB.passeio * dt;
      pombo.y += Math.sin(pombo.heading) * PB.passeio * dt;
      pombo.dir = Math.cos(pombo.heading) >= 0 ? 1 : -1;
    }
    if (pombo.x < mundo.x0 || pombo.x > mundo.x1) { pombo.heading = Math.PI - pombo.heading; }
    if (pombo.y < mundo.y0 || pombo.y > mundo.y1) { pombo.heading = -pombo.heading; }
    pombo.x = clamp(pombo.x, mundo.x0, mundo.x1);
    pombo.y = clamp(pombo.y, mundo.y0, mundo.y1);

    // ---- captura ----
    if (dist < PB.raioCaptura) vencer();

    // ---- timer ----
    est.tempo -= dt;
    Jogo.UI.timer(est.tempo);
    if (est.tempo <= 0) {
      est.tempo = C.d2.fase1Tempo;
      joao.x = 0; joao.y = 320; pombo.x = 150; pombo.y = -180;
      Jogo.Audio.sfx('derrota');
      Jogo.UI.balao(C.txt.fase1.cansou, 2600);
    }

    // câmera segue o João
    R.cam.x += (joao.x - R.cam.x) * Math.min(1, 7 * dt);
    R.cam.y += (joao.y - R.cam.y) * Math.min(1, 7 * dt);
  }

  function vencer() {
    if (est.venceu) return;
    est.venceu = true; est.ativo = false; pegou = true;
    Jogo.UI.timer(null); Jogo.UI.dica(null);
    Jogo.Audio.sfx('captura'); Jogo.Audio.sfx('vitoria');
    Jogo.UI.balao(C.txt.fase1.vitoria, 3200);
    setTimeout(aoConcluir, 2600);
  }

  function draw(ctx) {
    R.piso(C.cores.chaoPraca);
    R.pontilhado('rgba(255,255,255,0.05)', 70);
    R.faixa(-80, mundo.y0, 160, mundo.y1 - mundo.y0 + 80, C.cores.caminhoPraca);

    // tudo ordenado por base-y → sobreposição (profundidade) correta
    const lista = [];
    lista.push({ y: mundo.y0 + 90, f: () => { R.predio(-110, mundo.y0 - 40, 220, 130, '#3a2a1a'); desenharLetreiroBar(ctx, 0, mundo.y0 - 60); } });
    predios.forEach((p) => lista.push({ y: p[1] + p[3], f: () => R.predio(p[0], p[1], p[2], p[3], p[4]) }));
    arvores.forEach((a) => lista.push({ y: a[1], f: () => R.arvore(a[0], a[1]) }));
    lista.push({ y: 200, f: () => R.banco(-60, 200) });
    lista.push({ y: pombo.y, f: () => { R.pombo(pombo.x, pombo.y, { t: pombo.t, dir: pombo.dir, hop: PB.hop, hopFreq: PB.hopFreq }); if (!pegou) R.item(pombo.x + 10 * pombo.dir, pombo.y - 34, 'celular', pombo.t); } });
    lista.push({ y: joao.y, f: () => R.pessoa(joao.x, joao.y, { t: joao.t, andando: joao.andando, flip: joao.flip, cor: '#3b82d6' }) });
    lista.sort((a, b) => a.y - b.y).forEach((d) => d.f());
  }

  function desenharLetreiroBar(ctx, x, y) {
    const X = R.sx(x), Y = R.sy(y);
    ctx.save();
    // plaquinha de neon
    ctx.fillStyle = 'rgba(20,12,30,0.9)';
    ctx.strokeStyle = '#ff5fae'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.rect(X - 70, Y - 26, 140, 40); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 24px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('BAR DO ZÉ', X, Y - 5);
    ctx.restore();
  }

  // música + objetivo + intro
  Jogo.Audio.tocarMusica('f1');
  Jogo.UI.objetivo(C.txt.fase1.objetivo);
  Jogo.UI.dica(C.txt.fase1.dica);
  R.cam.x = joao.x; R.cam.y = joao.y;
  Jogo.UI.cutscene(C.txt.fase1.intro, () => {
    Jogo.UI.mostrarHUD(true); Jogo.Input.mostrarToque(true);
    Jogo.UI.timer(est.tempo); est.ativo = true;
  });

  return {
    get ativo() { return est.ativo; },
    update, draw,
    _dbg: { vencer },
    dispose() { Jogo.Input.mostrarToque(false); },
  };
};
