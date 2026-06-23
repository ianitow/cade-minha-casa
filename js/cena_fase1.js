/* =========================================================================
 * cena_fase1.js — Fase 1: "Cadê Meu Celular?" (mapa grande + fazendinha)
 * Vários pombos idênticos, só UM com o celular. Aliens da ressaca vagueiam
 * (encostar = game over; perto = sobe a alucinação). No fundo do mapa há
 * FAZENDINHAS com vacas sendo ABDUZIDAS por discos voadores. Tem também o
 * cachorro (late) e o "Seu Zé" (NPC que fala) como easter eggs.
 * ========================================================================= */
window.Jogo = window.Jogo || {};
Jogo.Cenas = Jogo.Cenas || {};

Jogo.Cenas.fase1 = function (aoConcluir, aoPerder) {
  const R = Jogo.R, C = Jogo.CONFIG, P = C.d2.player, PB = C.d2.pombo, FE = C.d2.fase1Extra;
  const mundo = { x0: -760, x1: 760, y0: -980, y1: 780 };

  const joao = { x: 0, y: 560, t: 0, andando: false, flip: false };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pv(o) {   // pan/vol posicional p/ áudio
    const d = Math.hypot(o.x - joao.x, o.y - joao.y);
    return { pan: clamp((o.x - joao.x) / 420, -1, 1), vol: Math.max(0.12, Math.min(1, 1 - d / (o.raio * 1.2))) };
  }

  // ---- pombos (1 com o celular) ----
  const posic = [[120, 240], [-260, 60], [320, -160], [-360, 320], [380, 360], [-120, -260], [220, 540], [-460, -120], [60, -420], [480, 120]];
  const pombos = [];
  for (let i = 0; i < FE.quantos; i++) {
    const sp = posic[i % posic.length];
    pombos.push({ x: sp[0] + rnd(-30, 30), y: sp[1] + rnd(-30, 30), t: Math.random() * 6, dir: -1, heading: Math.random() * 6.28, troca: 0, vivo: true, temCelular: false, foraDeCena: false });
  }
  pombos[Math.floor(Math.random() * pombos.length)].temCelular = true;

  const est = { ativo: false, venceu: false, perdeu: false, tempo: C.d2.fase1Tempo };

  const aliens = Jogo.Aliens({
    quantos: FE.aliens, mundo, getJogador: () => joao,
    aoPegar: () => perder('capturado'),
    aoSurtar: () => perder('surto'),
  });

  // ---- cenário: prédios da cidade (em cima) + casas/árvores (mapa todo) ----
  const predios = [
    [-740, -940, 160, 260, '#c46b9e'], [-540, -960, 150, 230, '#7e6bd0'], [-330, -940, 150, 250, '#5b8dd6'],
    [300, -960, 160, 260, '#e0a14f'], [500, -940, 160, 240, '#6bb0c4'],
    [-740, -640, 150, 220, '#8a6bd0'], [560, -640, 150, 220, '#d0796b'],
  ];
  const casas = [   // [x, y, cor]
    [-560, 360, '#caa15a'], [-360, 520, '#b07a4a'], [520, 520, '#a6b06a'],
    [620, -120, '#caa15a'], [-660, 60, '#9a8acb'], [340, 200, '#b9926a'],
  ];
  const arvores = [[-200, 200], [200, 260], [-300, -120], [260, -60], [-180, 460], [420, 440], [-520, 220], [560, 280], [-80, 40], [120, -200], [-420, 520], [620, 360]];
  const bancos = [[-60, 300], [180, 420], [-300, 140]];

  // ---- duas fazendinhas com abdução ----
  function criarFazenda(cx, cy) {
    const cows = [];
    for (let i = 0; i < 3; i++) cows.push({ x: cx - 90 + i * 90 + rnd(-12, 12), y: cy + rnd(-26, 26), abduz: 0 });
    const nv = { x: cx, y: cy - 210, t: Math.random() * 5, alvo: -1, beam: 0, espera: 1 + Math.random() * 3 };
    function update(dt) {
      nv.t += dt;
      if (nv.alvo < 0) {
        nv.beam = Math.max(0, nv.beam - dt * 2);
        nv.x += Math.sin(nv.t * 0.5) * 26 * dt;
        nv.espera -= dt;
        if (nv.espera <= 0) { nv.alvo = Math.floor(Math.random() * cows.length); }
      } else {
        const cow = cows[nv.alvo];
        nv.x += (cow.x - nv.x) * Math.min(1, 2.4 * dt);
        if (Math.abs(nv.x - cow.x) < 8) { nv.beam = Math.min(1, nv.beam + dt * 2.5); cow.abduz = Math.min(1, cow.abduz + dt * 0.45); }
        if (cow.abduz >= 1) { cow.abduz = 0; cow.x = cx + rnd(-130, 130); cow.y = cy + rnd(-26, 26); nv.alvo = -1; nv.espera = 2 + Math.random() * 3; }
      }
      nv.x = clamp(nv.x, cx - 150, cx + 150);
    }
    function partes() {
      const arr = [];
      cows.forEach((c) => arr.push({ y: c.y, f: () => R.vaca(c.x, c.y, { t: nv.t, abduz: c.abduz }) }));
      arr.push({ y: nv.y + 200, f: () => R.nave(nv.x, nv.y, { t: nv.t, beam: nv.beam, beamLen: (cy - nv.y) + 24 }) });
      return arr;
    }
    return { cx, cy, update, partes };
  }
  const fazendas = [criarFazenda(-520, -360), criarFazenda(520, -380)];

  // ---- easter eggs: cachorro + Seu Zé ----
  const dog = { x: 260, y: 600, t: 0, dir: -1, raio: 150, cd: 1.5, maxT: 0, falando: false, _h: null };
  // Seu Zé fica em frente ao BAR DO ZÉ (topo do mapa), perto da entrada
  const ze = { x: 170, y: mundo.y0 + 130, t: 0, raio: 160, cd: 1.2, falando: false, _h: null };

  function update(dt) {
    joao.t += dt; dog.t += dt; ze.t += dt;

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

    // ---- pombos ----
    for (const p of pombos) {
      if (!p.vivo) continue;
      p.t += dt;
      if (p.foraDeCena) {
        p.x += Math.cos(p.heading) * PB.fuga * 1.4 * dt;
        p.y += Math.sin(p.heading) * PB.fuga * 1.4 * dt;
        if (!R.noVisor(p.x, p.y, 90)) p.vivo = false;
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
      if (dist < PB.raioCaptura) { if (p.temCelular) { vencer(); return; } else pombaErrada(p); }
    }

    // ---- fazendas ----
    fazendas.forEach((f) => f.update(dt));

    // ---- aliens + alucinação + vozes ----
    aliens.update(dt, joao);

    // ---- cachorro (late perto; PARA o som ao se afastar) ----
    dog.cd -= dt;
    const distDog = Math.hypot(dog.x - joao.x, dog.y - joao.y);
    if (dog._h) {
      const d = pv(dog);
      if (dog._h.setPan) { dog._h.setPan(d.pan); dog._h.setVol(d.vol); }
      dog.maxT -= dt;
      const acabou = (dog._h.tocando === false) || dog.maxT <= 0;
      if (distDog > dog.raio * 1.1 || acabou) {           // afastou ou acabou → para
        if (dog._h.stop) dog._h.stop();
        dog._h = null; dog.falando = false;
        dog.cd = acabou ? 6 : 1.0;
      }
    } else if (dog.cd <= 0 && distDog < dog.raio) {
      const d = pv(dog);
      dog._h = Jogo.Audio.tocarSom('cachorro', { pan: d.pan, vol: d.vol });
      dog.falando = true; dog.maxT = 8;
    }

    // ---- Seu Zé (fala usando o canal único de voz; tem PRIORIDADE perto dele) ----
    const pertoZe = Math.hypot(ze.x - joao.x, ze.y - joao.y) < ze.raio;
    aliens.pausarVoz(pertoZe);   // perto do Zé os ETs cedem o canal
    ze.cd -= dt;
    if (ze._h) {
      const d = pv(ze); if (ze._h.setPan) { ze._h.setPan(d.pan); ze._h.setVol(d.vol); }
      if (!pertoZe) { if (ze._h.stop) ze._h.stop(); ze._h = null; ze.falando = false; ze.cd = 1.0; }   // saiu de perto → para
      else if (!Jogo.Audio.vozOcupada()) { ze._h = null; ze.falando = false; ze.cd = 1.5 + Math.random() * 1.5; }
    } else if (pertoZe) {
      if (Jogo.Audio.vozOcupada()) aliens.parar();        // corta o ET pra o Zé poder falar
      else if (ze.cd <= 0) { const d = pv(ze); const h = Jogo.Audio.tocarVoz('seu_ze', { pan: d.pan, vol: d.vol }); if (h) { ze._h = h; ze.falando = true; } else ze.cd = 0.4; }
    }

    // ---- cronômetro de fôlego ----
    est.tempo -= dt;
    Jogo.UI.timer(est.tempo);
    if (est.tempo <= 0) {
      est.tempo = C.d2.fase1Tempo;
      joao.x = 0; joao.y = 560;
      Jogo.Audio.sfx('derrota');
      Jogo.UI.balao(C.txt.fase1.cansou, 2600);
    }

    R.cam.x += (joao.x - R.cam.x) * Math.min(1, 7 * dt);
    R.cam.y += (joao.y - R.cam.y) * Math.min(1, 7 * dt);
  }

  function pombaErrada(p) {
    if (p.foraDeCena) return;
    p.foraDeCena = true;
    p.heading = Math.atan2(p.y - joao.y, p.x - joao.x);
    Jogo.Audio.sfx('pombo');
    const l = C.txt.fase1.errado;
    Jogo.UI.balao(l[Math.floor(Math.random() * l.length)], 2200);
  }

  function vencer() {
    if (est.venceu || est.perdeu) return;
    est.venceu = true; est.ativo = false;
    Jogo.UI.timer(null); Jogo.UI.dica(null); Jogo.UI.alucinacao(null);
    aliens.parar();
    Jogo.Audio.sfx('captura'); Jogo.Audio.sfx('vitoria');
    Jogo.UI.balao(C.txt.fase1.vitoria, 3200);
    setTimeout(aoConcluir, 2600);
  }

  function perder(motivo) {
    if (est.perdeu || est.venceu) return;
    est.perdeu = true; est.ativo = false;
    Jogo.UI.timer(null); Jogo.UI.dica(null);
    aliens.parar();
    if (aoPerder) aoPerder(motivo);
  }

  function desenharCasa(x, y, cor) {
    R.ret(x - 55, y - 70, 110, 78, cor, 6);
    const c = R.ctx();
    c.fillStyle = '#8a3a3a';
    c.beginPath(); c.moveTo(R.sx(x - 64), R.sy(y - 70)); c.lineTo(R.sx(x), R.sy(y - 116)); c.lineTo(R.sx(x + 64), R.sy(y - 70)); c.closePath(); c.fill();
    R.ret(x - 14, y - 40, 28, 40, '#5a3a1b', 4);
    R.ret(x - 44, y - 56, 24, 22, '#bfe6ff', 3); R.ret(x + 22, y - 56, 24, 22, '#bfe6ff', 3);
  }
  function desenharFazendaFundo(f) {
    R.ret(f.cx - 180, f.cy - 70, 360, 150, '#7a9e54', 14);       // grama
    const c = R.ctx(); c.strokeStyle = '#caa15a'; c.lineWidth = 4;
    for (let px = f.cx - 170; px <= f.cx + 170; px += 40) { c.beginPath(); c.moveTo(R.sx(px), R.sy(f.cy + 78)); c.lineTo(R.sx(px), R.sy(f.cy + 60)); c.stroke(); }
    c.beginPath(); c.moveTo(R.sx(f.cx - 174), R.sy(f.cy + 70)); c.lineTo(R.sx(f.cx + 174), R.sy(f.cy + 70)); c.stroke();
  }

  function draw(ctx) {
    R.piso(C.cores.chaoPraca);
    R.pontilhado('rgba(255,255,255,0.05)', 70);
    R.faixa(-90, mundo.y0, 180, mundo.y1 - mundo.y0 + 80, C.cores.caminhoPraca);   // avenida vertical
    R.faixa(mundo.x0, -40, mundo.x1 - mundo.x0 + 80, 150, C.cores.caminhoPraca);   // rua horizontal
    fazendas.forEach(desenharFazendaFundo);

    const lista = [];
    lista.push({ y: mundo.y0 + 120, f: () => { R.predio(-120, mundo.y0 - 20, 240, 130, '#3a2a1a'); desenharLetreiroBar(ctx, 0, mundo.y0 - 40); } });
    predios.forEach((p) => lista.push({ y: p[1] + p[3], f: () => R.predio(p[0], p[1], p[2], p[3], p[4]) }));
    casas.forEach((h) => lista.push({ y: h[1], f: () => desenharCasa(h[0], h[1], h[2]) }));
    arvores.forEach((a) => lista.push({ y: a[1], f: () => R.arvore(a[0], a[1]) }));
    bancos.forEach((b) => lista.push({ y: b[1], f: () => R.banco(b[0], b[1]) }));
    fazendas.forEach((f) => f.partes().forEach((d) => lista.push(d)));
    pombos.forEach((p) => { if (p.vivo) lista.push({ y: p.y, f: () => R.pombo(p.x, p.y, { t: p.t, dir: p.dir, hop: PB.hop, hopFreq: PB.hopFreq }) }); });
    aliens.desenhos().forEach((d) => lista.push(d));
    lista.push({ y: dog.y, f: () => { R.cachorro(dog.x, dog.y, { t: dog.t, dir: dog.dir }); if (dog.falando) R.iconeVoz(dog.x, dog.y - 44, dog.t); } });
    lista.push({ y: ze.y, f: () => { R.pessoa(ze.x, ze.y, { t: ze.t, andando: false, flip: true, cor: '#9a8a6a' }); R.nomeNPC(ze.x, ze.y - 74, 'Seu Zé', '#ffd23f'); if (ze.falando) R.iconeVoz(ze.x, ze.y - 104, ze.t); } });
    lista.push({ y: joao.y, f: () => R.pessoa(joao.x, joao.y, { t: joao.t, andando: joao.andando, flip: joao.flip, cor: '#3b82d6' }) });
    lista.sort((a, b) => a.y - b.y).forEach((d) => d.f());

    aliens.efeito();
  }

  function desenharLetreiroBar(ctx, x, y) {
    const X = R.sx(x), Y = R.sy(y);
    ctx.save();
    ctx.fillStyle = 'rgba(20,12,30,0.9)';
    ctx.strokeStyle = '#ff5fae'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.rect(X - 80, Y - 26, 160, 40); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 18px "PressStart", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('BAR DO ZÉ', X, Y - 4);
    ctx.restore();
  }

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
    dispose() { aliens.parar(); Jogo.Input.mostrarToque(false); },
  };
};
