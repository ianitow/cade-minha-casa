/* =========================================================================
 * cena_fase1.js — Fase 1: "Cadê Meu Celular?"
 * Perseguição 2D top-down. Agora são VÁRIOS pombos idênticos e só UM está
 * com o celular — você precisa encostar até achar o ladrão. Os ALIENS da
 * ressaca vagueiam pela praça: encostar = game over, ficar perto enche o
 * medidor de alucinação. O cronômetro de fôlego continua valendo.
 * ========================================================================= */
window.Jogo = window.Jogo || {};
Jogo.Cenas = Jogo.Cenas || {};

Jogo.Cenas.fase1 = function (aoConcluir, aoPerder) {
  const R = Jogo.R, C = Jogo.CONFIG, P = C.d2.player, PB = C.d2.pombo, FE = C.d2.fase1Extra;
  const mundo = { x0: -420, x1: 420, y0: -620, y1: 560 };

  const joao = { x: 0, y: 320, t: 0, andando: false, flip: false };

  // vários pombos idênticos; só 1 carrega o celular (escondido = difícil)
  const posicoes = [[70, 150], [-180, -40], [210, -260], [-280, 240], [260, 180], [-80, -380], [120, 420], [-330, -200]];
  const pombos = [];
  for (let i = 0; i < FE.quantos; i++) {
    const sp = posicoes[i % posicoes.length];
    pombos.push({ x: sp[0], y: sp[1], t: Math.random() * 6, dir: -1, heading: Math.random() * 6.28, troca: 0,
                  vivo: true, temCelular: false, foraDeCena: false });
  }
  pombos[Math.floor(Math.random() * pombos.length)].temCelular = true;

  const est = { ativo: false, venceu: false, perdeu: false, tempo: C.d2.fase1Tempo };

  const aliens = Jogo.Aliens({
    quantos: FE.aliens, mundo, getJogador: () => joao,
    aoPegar: () => perder('capturado'),
    aoSurtar: () => perder('surto'),
  });

  // cenário estático
  const predios = [
    [-420, -560, 150, 240, '#c46b9e'], [-420, -260, 150, 200, '#7e6bd0'],
    [270, -520, 150, 220, '#5b8dd6'], [270, -240, 150, 240, '#e0a14f'],
    [-420, 120, 150, 220, '#6bb0c4'], [270, 140, 150, 200, '#c4796b'],
  ];
  const arvores = [[-150, 180], [150, 220], [-200, -180], [180, -120], [-120, 420]];

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function update(dt) {
    joao.t += dt;

    // ---- João ----
    const e = Jogo.Input.eixo();
    const mag = Math.hypot(e.x, e.y);
    if (mag > 0.05) {
      const correndo = Jogo.Input.estado.correr && mag > 0.5;
      const vel = correndo ? P.correr : P.andar;
      const nx = e.x / mag, ny = -e.y / mag;
      joao.x = clamp(joao.x + nx * vel * dt * Math.min(1, mag), mundo.x0, mundo.x1);
      joao.y = clamp(joao.y + ny * vel * dt * Math.min(1, mag), mundo.y0, mundo.y1);
      joao.andando = true;
      if (Math.abs(nx) > 0.1) joao.flip = nx < 0;
      joao._ps = (joao._ps || 0) - dt;
      if (joao._ps <= 0) { Jogo.Audio.sfx('passo'); joao._ps = correndo ? 0.26 : 0.4; }
    } else joao.andando = false;

    // ---- Pombos ----
    for (const p of pombos) {
      if (!p.vivo) continue;
      p.t += dt;

      if (p.foraDeCena) {  // pombo errado fugindo de vez
        p.x += Math.cos(p.heading) * PB.fuga * 1.4 * dt;
        p.y += Math.sin(p.heading) * PB.fuga * 1.4 * dt;
        if (!R.noVisor(p.x, p.y, 80)) p.vivo = false;
        continue;
      }

      const toX = p.x - joao.x, toY = p.y - joao.y;
      const dist = Math.hypot(toX, toY) || 1;
      if (dist < PB.raioPanico) {
        let fx = toX / dist, fy = toY / dist;
        const s = Math.sin(p.t * PB.serpFreq) * PB.serp;
        let ax = fx - fy * s, ay = fy + fx * s;
        const al = Math.hypot(ax, ay) || 1; ax /= al; ay /= al;
        p.x += ax * PB.fuga * dt; p.y += ay * PB.fuga * dt;
        p.dir = ax >= 0 ? 1 : -1;
      } else {
        p.troca -= dt;
        if (p.troca <= 0) { p.heading += (Math.random() - 0.5) * 1.6; p.troca = 1 + Math.random() * 1.4; }
        p.x += Math.cos(p.heading) * PB.passeio * dt;
        p.y += Math.sin(p.heading) * PB.passeio * dt;
        p.dir = Math.cos(p.heading) >= 0 ? 1 : -1;
      }
      if (p.x < mundo.x0 || p.x > mundo.x1) p.heading = Math.PI - p.heading;
      if (p.y < mundo.y0 || p.y > mundo.y1) p.heading = -p.heading;
      p.x = clamp(p.x, mundo.x0, mundo.x1);
      p.y = clamp(p.y, mundo.y0, mundo.y1);

      if (dist < PB.raioCaptura) {
        if (p.temCelular) { vencer(); return; }
        else pombaErrada(p);
      }
    }

    // ---- aliens + alucinação ----
    aliens.update(dt, joao);

    // ---- cronômetro de fôlego ----
    est.tempo -= dt;
    Jogo.UI.timer(est.tempo);
    if (est.tempo <= 0) {
      est.tempo = C.d2.fase1Tempo;
      joao.x = 0; joao.y = 320;
      Jogo.Audio.sfx('derrota');
      Jogo.UI.balao(C.txt.fase1.cansou, 2600);
    }

    // câmera segue o João
    R.cam.x += (joao.x - R.cam.x) * Math.min(1, 7 * dt);
    R.cam.y += (joao.y - R.cam.y) * Math.min(1, 7 * dt);
  }

  function pombaErrada(p) {
    if (p.foraDeCena) return;
    p.foraDeCena = true;
    p.heading = Math.atan2(p.y - joao.y, p.x - joao.x);   // foge para longe do João
    Jogo.Audio.sfx('pombo');
    const l = C.txt.fase1.errado;
    Jogo.UI.balao(l[Math.floor(Math.random() * l.length)], 2200);
  }

  function vencer() {
    if (est.venceu || est.perdeu) return;
    est.venceu = true; est.ativo = false;
    Jogo.UI.timer(null); Jogo.UI.dica(null); Jogo.UI.alucinacao(null);
    Jogo.Audio.sfx('captura'); Jogo.Audio.sfx('vitoria');
    Jogo.UI.balao(C.txt.fase1.vitoria, 3200);
    setTimeout(aoConcluir, 2600);
  }

  function perder(motivo) {
    if (est.perdeu || est.venceu) return;
    est.perdeu = true; est.ativo = false;
    Jogo.UI.timer(null); Jogo.UI.dica(null);
    if (aoPerder) aoPerder(motivo);
  }

  function draw(ctx) {
    R.piso(C.cores.chaoPraca);
    R.pontilhado('rgba(255,255,255,0.05)', 70);
    R.faixa(-80, mundo.y0, 160, mundo.y1 - mundo.y0 + 80, C.cores.caminhoPraca);

    const lista = [];
    lista.push({ y: mundo.y0 + 90, f: () => { R.predio(-110, mundo.y0 - 40, 220, 130, '#3a2a1a'); desenharLetreiroBar(ctx, 0, mundo.y0 - 60); } });
    predios.forEach((p) => lista.push({ y: p[1] + p[3], f: () => R.predio(p[0], p[1], p[2], p[3], p[4]) }));
    arvores.forEach((a) => lista.push({ y: a[1], f: () => R.arvore(a[0], a[1]) }));
    lista.push({ y: 200, f: () => R.banco(-60, 200) });
    pombos.forEach((p) => { if (p.vivo) lista.push({ y: p.y, f: () => R.pombo(p.x, p.y, { t: p.t, dir: p.dir, hop: PB.hop, hopFreq: PB.hopFreq }) }); });
    aliens.desenhos().forEach((d) => lista.push(d));
    lista.push({ y: joao.y, f: () => R.pessoa(joao.x, joao.y, { t: joao.t, andando: joao.andando, flip: joao.flip, cor: '#3b82d6' }) });
    lista.sort((a, b) => a.y - b.y).forEach((d) => d.f());

    aliens.efeito();   // alucinação por cima de tudo
  }

  function desenharLetreiroBar(ctx, x, y) {
    const X = R.sx(x), Y = R.sy(y);
    ctx.save();
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
    _dbg: { vencer, perder },
    dispose() { Jogo.Input.mostrarToque(false); },
  };
};
