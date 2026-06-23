/* =========================================================================
 * cena_fase4.js — Fase 4: "O Chefão Líquido" (BOSS)
 * Um alienígena feito de ÁGUA joga jatos no João. Ele desvia andando,
 * pega as CERVEJAS do chão e arremessa de volta (mira automática no boss).
 * Zerar a vida do boss = vitória. Levar água demais enche a alucinação.
 * Câmera ESTÁTICA (boss no topo + João embaixo sempre visíveis).
 * ========================================================================= */
window.Jogo = window.Jogo || {};
Jogo.Cenas = Jogo.Cenas || {};

Jogo.Cenas.fase4 = function (aoConcluir, aoPerder) {
  const R = Jogo.R, C = Jogo.CONFIG, P = C.d2.player, CF = C.d2.chefe;
  const mundo = { x0: -420, x1: 420, y0: -220, y1: 280 };
  const camY = (mundo.y0 + mundo.y1) / 2;

  const joao = { x: 0, y: 240, t: 0, andando: false, flip: false };
  const chefe = { x: 0, y: mundo.y0 + 10, hp: CF.hp, hpMax: CF.hp, t: 0, atkT: 1.4, hitFlash: 0 };
  const est = { ativo: false, venceu: false, perdeu: false };

  const aguas = [];      // jatos do boss: {x,y,vx,vy,t}
  const cervejas = [];   // cervejas no chão: {x,y,t}
  const tiros = [];      // cervejas arremessadas: {x,y,vx,vy,t}
  let segurando = false;
  let spawnT = 0.8;
  let bolhaCd = 0;       // cooldown p/ não empilhar o som da bolha

  const aliens = Jogo.Aliens({
    quantos: CF.aliens, mundo, getJogador: () => joao,
    aoPegar: () => perder('capturado'),
    aoSurtar: () => perder('chefe'),
  });

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  // ---- arremessar (botão de ação / [E] / clique / toque) ----
  function arremessar() {
    if (!est.ativo || !segurando) return;
    segurando = false;
    const cx = chefe.x, cy = chefe.y + 70;
    const dx = cx - joao.x, dy = cy - (joao.y - 24), d = Math.hypot(dx, dy) || 1;
    tiros.push({ x: joao.x, y: joao.y - 24, vx: dx / d * CF.velTiro, vy: dy / d * CF.velTiro, t: 0 });
    Jogo.Audio.sfx('clique');
  }
  const desinscrever = Jogo.Input.aoAcao(arremessar);

  function disparoBoss() {
    const fase = chefe.hp > 3 ? 0 : chefe.hp > 1 ? 1 : 2;
    const nShots = fase + 1;
    const base = Math.atan2((joao.y - 24) - (chefe.y + 70), joao.x - chefe.x);
    for (let i = 0; i < nShots; i++) {
      const off = (i - (nShots - 1) / 2) * 0.22;
      const ang = base + off;
      aguas.push({ x: chefe.x, y: chefe.y + 80, vx: Math.cos(ang) * CF.velProjetil, vy: Math.sin(ang) * CF.velProjetil, t: 0 });
    }
    Jogo.Audio.sfx('agua');
    chefe.atkT = CF.cadencia[fase];
  }

  function update(dt) {
    joao.t += dt; chefe.t += dt;
    if (chefe.hitFlash > 0) chefe.hitFlash -= dt;
    if (bolhaCd > 0) bolhaCd -= dt;

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

    // ---- pegar cerveja (andando por cima) ----
    if (!segurando) {
      for (let i = 0; i < cervejas.length; i++) {
        const cz = cervejas[i];
        if (Math.hypot(cz.x - joao.x, cz.y - joao.y) < CF.raioPegar) {
          cervejas.splice(i, 1); segurando = true; Jogo.Audio.sfx('pegar'); break;
        }
      }
    }
    Jogo.UI.dica(segurando ? '🍺 [E] / botão: ARREMESSAR no boss!' : 'Pegue uma cerveja no chão (ande por cima)');

    // ---- spawn de cervejas ----
    spawnT -= dt;
    if (spawnT <= 0 && cervejas.length < CF.maxCervejas) {
      cervejas.push({ x: rnd(mundo.x0 + 50, mundo.x1 - 50), y: rnd(20, mundo.y1 - 30), t: 0 });
      spawnT = CF.spawnCerveja;
    }
    cervejas.forEach((cz) => (cz.t += dt));

    // ---- boss ----
    chefe.x = Math.sin(chefe.t * 0.6) * 200;
    chefe.atkT -= dt;
    if (chefe.atkT <= 0) disparoBoss();

    // ---- jatos de água ----
    for (let i = aguas.length - 1; i >= 0; i--) {
      const w = aguas[i];
      w.t += dt; w.x += w.vx * dt; w.y += w.vy * dt;
      if (Math.hypot(w.x - joao.x, w.y - (joao.y - 22)) < CF.raioDano) {
        aguas.splice(i, 1); Jogo.Audio.sfx('dano'); aliens.bump(CF.spike);
        if (bolhaCd <= 0) { Jogo.Audio.tocarSom('boss_bolha', { vol: 0.9 }); bolhaCd = 0.5; }
        continue;
      }
      if (w.x < mundo.x0 - 60 || w.x > mundo.x1 + 60 || w.y < mundo.y0 - 60 || w.y > mundo.y1 + 120) aguas.splice(i, 1);
    }

    // ---- cervejas arremessadas ----
    for (let i = tiros.length - 1; i >= 0; i--) {
      const tr = tiros[i];
      tr.t += dt; tr.x += tr.vx * dt; tr.y += tr.vy * dt;
      if (Math.hypot(tr.x - chefe.x, tr.y - (chefe.y + 70)) < CF.raioAcerto) {
        tiros.splice(i, 1);
        chefe.hp--; chefe.hitFlash = 0.22;
        Jogo.Audio.sfx('captura');
        Jogo.UI.chefeVida(chefe.hp / chefe.hpMax);
        if (chefe.hp <= 0) { vencer(); return; }
        continue;
      }
      if (tr.x < mundo.x0 - 80 || tr.x > mundo.x1 + 80 || tr.y < mundo.y0 - 120 || tr.y > mundo.y1 + 80) tiros.splice(i, 1);
    }

    // ---- aliens + alucinação ----
    aliens.update(dt, joao);

    // câmera estática
    R.cam.x = 0; R.cam.y = camY;
  }

  function vencer() {
    if (est.venceu || est.perdeu) return;
    est.venceu = true; est.ativo = false;
    Jogo.UI.dica(null); Jogo.UI.chefeVida(null); Jogo.UI.alucinacao(null);
    Jogo.Audio.sfx('vitoria');
    Jogo.UI.balao(C.txt.fase4.vitoria, 3400);
    setTimeout(aoConcluir, 2800);
  }

  function perder(motivo) {
    if (est.perdeu || est.venceu) return;
    est.perdeu = true; est.ativo = false;
    Jogo.UI.dica(null);
    if (aoPerder) aoPerder(motivo);
  }

  function paredes() {
    R.ret(mundo.x0 - 40, mundo.y0 - 40, (mundo.x1 - mundo.x0) + 80, 38, '#0a2230', 6);
    R.ret(mundo.x0 - 40, mundo.y1 + 6, (mundo.x1 - mundo.x0) + 80, 38, '#07161f', 6);
    R.ret(mundo.x0 - 40, mundo.y0 - 40, 38, (mundo.y1 - mundo.y0) + 80, '#08202c', 6);
    R.ret(mundo.x1 + 6, mundo.y0 - 40, 38, (mundo.y1 - mundo.y0) + 80, '#08202c', 6);
  }

  function draw(ctx) {
    R.piso(C.cores.chaoChefe);
    R.pontilhado('rgba(120,224,255,0.05)', 60);
    paredes();

    const lista = [];
    lista.push({ y: chefe.y, f: () => R.chefeAgua(chefe.x, chefe.y, { t: chefe.t, hitFlash: chefe.hitFlash }) });
    cervejas.forEach((cz) => lista.push({ y: cz.y, f: () => R.item(cz.x, cz.y, 'cerveja', cz.t) }));
    aliens.desenhos().forEach((d) => lista.push(d));
    lista.push({ y: joao.y, f: () => {
      R.pessoa(joao.x, joao.y, { t: joao.t, andando: joao.andando, flip: joao.flip, cor: '#3b82d6' });
      if (segurando) R.item(joao.x + (joao.flip ? -16 : 16), joao.y - 4, 'cerveja', joao.t);
    } });
    lista.sort((a, b) => a.y - b.y).forEach((d) => d.f());

    // projéteis por cima
    aguas.forEach((w) => R.gotaAgua(w.x, w.y, 16, w.t));
    tiros.forEach((tr) => R.item(tr.x, tr.y, 'cerveja', tr.t));

    aliens.efeito();   // alucinação por cima de tudo
  }

  // música (reaproveita a do bar) + objetivo + intro
  Jogo.Audio.tocarMusica('f3');
  Jogo.UI.objetivo(C.txt.fase4.objetivo);
  R.cam.x = 0; R.cam.y = camY;
  Jogo.UI.cutscene(C.txt.fase4.intro, () => {
    Jogo.UI.mostrarHUD(true); Jogo.Input.mostrarToque(true);
    Jogo.UI.chefeVida(1); est.ativo = true;
  });

  return {
    get ativo() { return est.ativo; },
    update, draw,
    _dbg: { vencer, perder, chefe, joao, cervejas, tiros, aguas, get segurando() { return segurando; } },
    dispose() { desinscrever(); aliens.parar(); Jogo.Input.mostrarToque(false); },
  };
};
