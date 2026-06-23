/* =========================================================================
 * cena_fase2.js — Fase 2: "A Carteira Perdida"
 * Lanchonete top-down. Revistar mesas/balcão/lixeira até achar a carteira.
 * ========================================================================= */
window.Jogo = window.Jogo || {};
Jogo.Cenas = Jogo.Cenas || {};

Jogo.Cenas.fase2 = function (aoConcluir, aoPerder) {
  const R = Jogo.R, C = Jogo.CONFIG, P = C.d2.player;
  const mundo = { x0: -360, x1: 360, y0: -250, y1: 290 };

  const joao = { x: 0, y: 200, t: 0, andando: false, flip: false };
  const est = { ativo: false, venceu: false, perdeu: false };
  let carteira = null;

  const aliens = Jogo.Aliens({
    quantos: C.d2.fase2Aliens, mundo, getJogador: () => joao,
    aoPegar: () => perder('capturado'),
    aoSurtar: () => perder('surto'),
  });

  // objetos revistáveis
  const itens = [
    { x: -220, y: -120, nome: 'a mesa do canto', tipo: 'mesa' },
    { x: 0, y: -150, nome: 'a mesa do meio', tipo: 'mesa' },
    { x: 220, y: -120, nome: 'a mesa da janela', tipo: 'mesa' },
    { x: -200, y: 60, nome: 'a mesa perto da porta', tipo: 'mesa' },
    { x: 210, y: 70, nome: 'a mesa bamba', tipo: 'mesa' },
    { x: 0, y: -230, nome: 'o balcão', tipo: 'balcao' },
    { x: -310, y: 200, nome: 'a lixeira', tipo: 'lixeira' },
    { x: 310, y: -210, nome: 'o vaso de planta', tipo: 'planta' },
  ];
  itens.forEach((i) => (i.revistado = false));
  // carteira NÃO é pré-definida: só "aparece" nas últimas fileiras visitadas (acharNoFim)

  const busca = Jogo.Busca({
    itens, getJogador: () => joao, dicaPadrao: C.txt.fase2.dica,
    acharNoFim: true, janelaFim: 3,
    aoAchar: (it) => { carteira = { x: it.x, y: it.y - 46 }; vencer(); },
  });
  const desinscrever = Jogo.Input.aoAcao(busca.revistarProximo);

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pv(o) {
    const d = Math.hypot(o.x - joao.x, o.y - joao.y);
    return { pan: clamp((o.x - joao.x) / 420, -1, 1), vol: Math.max(0.12, Math.min(1, 1 - d / (o.raio * 1.2))) };
  }
  // MC: criança que fala (prioridade de voz perto dela; retoma de onde parou)
  const kat = { x: -150, y: 120, t: 0, raio: 150, cd: 1.0, offset: 0, falando: false, _h: null };
  let alvo = null;

  // ---- portais por onde os ETs surgem ----
  const portais = [];
  let portalT = 2.5;
  function atualizarPortais(dt) {
    portalT -= dt;
    if (portalT <= 0 && portais.length < 2 && aliens.aliens.length) {
      portalT = 3 + Math.random() * 3;
      portais.push({
        x: rnd(mundo.x0 + 70, mundo.x1 - 70), y: rnd(mundo.y0 + 30, mundo.y1 - 60),
        t: 0, escala: 0, fase: 'abre', alien: Math.floor(Math.random() * aliens.aliens.length), espera: 0,
      });
    }
    for (let i = portais.length - 1; i >= 0; i--) {
      const pt = portais[i]; pt.t += dt;
      if (pt.fase === 'abre') {
        pt.escala = Math.min(1, pt.escala + dt * 2.5);
        if (pt.escala >= 1) { const a = aliens.aliens[pt.alien]; if (a) { a.x = pt.x; a.y = pt.y; } pt.fase = 'fecha'; pt.espera = 0.5; }
      } else {
        pt.espera -= dt;
        if (pt.espera <= 0) { pt.escala = Math.max(0, pt.escala - dt * 2.5); if (pt.escala <= 0) portais.splice(i, 1); }
      }
    }
  }

  function update(dt) {
    joao.t += dt;
    const e = Jogo.Input.eixo();
    const mag = Math.hypot(e.x, e.y);
    if (mag > 0.05) {
      const correndo = Jogo.Input.estado.correr && mag > 0.5;
      const vel = correndo ? P.correr : P.andar;
      joao.x = clamp(joao.x + (e.x / mag) * vel * dt * Math.min(1, mag), mundo.x0, mundo.x1);
      joao.y = clamp(joao.y - (e.y / mag) * vel * dt * Math.min(1, mag), mundo.y0, mundo.y1);
      joao.andando = true; if (Math.abs(e.x) > 0.1) joao.flip = e.x < 0;
      joao._ps = (joao._ps || 0) - dt; if (joao._ps <= 0) { Jogo.Audio.sfx('passo'); joao._ps = correndo ? 0.26 : 0.4; }
    } else joao.andando = false;
    alvo = busca.update(dt);
    atualizarPortais(dt);
    aliens.update(dt, joao);

    // ---- MC KATRINA (fala; prioridade de voz perto dela) ----
    kat.t += dt;
    const pertoKat = Math.hypot(kat.x - joao.x, kat.y - joao.y) < kat.raio;
    aliens.pausarVoz(pertoKat);
    kat.cd -= dt;
    if (kat._h) {
      const d = pv(kat); kat._h.setPan(d.pan); kat._h.setVol(d.vol);
      if (kat._h.tocando === false) { kat._h = null; kat.falando = false; kat.offset = 0; kat.cd = 1.0; }   // terminou a fala → recomeça do início depois
      else if (!pertoKat) { kat.offset = kat._h.posicao ? kat._h.posicao() : 0; kat._h.stop(); kat._h = null; kat.falando = false; }   // saiu: guarda a posição p/ retomar
    } else if (pertoKat && kat.cd <= 0) {
      if (Jogo.Audio.vozOcupada()) aliens.parar();   // cala o ET pra a MC falar
      else { const d = pv(kat); kat._h = Jogo.Audio.tocarSom('crianca', { pan: d.pan, vol: d.vol, offset: kat.offset }); kat.falando = true; }
    }

    R.cam.x += (joao.x - R.cam.x) * Math.min(1, 8 * dt);
    R.cam.y += (joao.y - R.cam.y) * Math.min(1, 8 * dt);
  }

  function vencer() {
    if (est.venceu || est.perdeu) return;
    est.venceu = true; est.ativo = false;
    Jogo.UI.dica(null); Jogo.UI.alucinacao(null);
    Jogo.UI.balao(C.txt.fase2.vitoria, 3200);
    setTimeout(aoConcluir, 2600);
  }

  function perder(motivo) {
    if (est.perdeu || est.venceu) return;
    est.perdeu = true; est.ativo = false;
    Jogo.UI.dica(null);
    if (aoPerder) aoPerder(motivo);
  }

  function paredes() {
    R.ret(mundo.x0 - 40, mundo.y0 - 40, (mundo.x1 - mundo.x0) + 80, 36, '#3b2f4a', 6);
    R.ret(mundo.x0 - 40, mundo.y1 + 6, (mundo.x1 - mundo.x0) + 80, 36, '#2c2238', 6);
    R.ret(mundo.x0 - 40, mundo.y0 - 40, 36, (mundo.y1 - mundo.y0) + 80, '#34293f', 6);
    R.ret(mundo.x1 + 6, mundo.y0 - 40, 36, (mundo.y1 - mundo.y0) + 80, '#34293f', 6);
  }

  function draw(ctx) {
    R.piso(C.cores.chaoLanche);
    R.pontilhado('rgba(0,0,0,0.06)', 56);
    paredes();

    const desenhos = [];
    itens.forEach((it) => {
      const rb = (it === alvo && !it.revistado) ? C.d2.busca.raio : 0;
      desenhos.push({ y: it.y, f: () => desenharItem(it, rb) });
    });
    portais.forEach((pt) => desenhos.push({ y: pt.y, f: () => R.portal(pt.x, pt.y, { t: pt.t, escala: pt.escala }) }));
    aliens.desenhos().forEach((d) => desenhos.push(d));
    desenhos.push({ y: kat.y, f: () => { R.crianca(kat.x, kat.y, { t: kat.t, flip: false }); R.nomeNPC(kat.x, kat.y - 58, 'MC', '#ff5fae'); if (kat.falando) R.iconeVoz(kat.x, kat.y - 84, kat.t); } });
    desenhos.push({ y: joao.y, f: () => R.pessoa(joao.x, joao.y, { t: joao.t, andando: joao.andando, flip: joao.flip, cor: '#3b82d6' }) });
    if (carteira) desenhos.push({ y: carteira.y + 100, f: () => R.item(carteira.x, carteira.y, 'carteira', joao.t) });
    desenhos.sort((a, b) => a.y - b.y).forEach((d) => d.f());

    aliens.efeito();
  }

  function desenharItem(it, rb) {
    if (it.tipo === 'mesa') R.mesa(it.x, it.y, '#8a5a2b', rb);
    else if (it.tipo === 'balcao') R.balcao(it.x, it.y, 260), rb && R.anelBusca(it.x, it.y, rb);
    else if (it.tipo === 'lixeira') R.caixa(it.x, it.y, 44, 50, '#444', rb);
    else if (it.tipo === 'planta') R.caixa(it.x, it.y, 40, 56, '#2e6b3e', rb);
    if (it.revistado) marcarRevistado(it);
  }
  function marcarRevistado(it) {
    const ctx = R.ctx(); ctx.save();
    ctx.strokeStyle = 'rgba(120,255,140,0.8)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(R.sx(it.x) - 9, R.sy(it.y) - 30); ctx.lineTo(R.sx(it.x) - 2, R.sy(it.y) - 23); ctx.lineTo(R.sx(it.x) + 10, R.sy(it.y) - 38); ctx.stroke();
    ctx.restore();
  }

  Jogo.Audio.tocarLoop('dexter', 0.5);   // música-meme em loop na lanchonete
  Jogo.UI.objetivo(C.txt.fase2.objetivo);
  Jogo.UI.contador(C.txt.revistados + ': 0/' + itens.length);
  R.cam.x = joao.x; R.cam.y = joao.y;
  Jogo.UI.cutscene(C.txt.fase2.intro, () => {
    Jogo.UI.mostrarHUD(true); Jogo.Input.mostrarToque(true); est.ativo = true;
  });

  return {
    get ativo() { return est.ativo; },
    update, draw, _dbg: { vencer, perder },
    dispose() { desinscrever(); aliens.parar(); if (kat._h && kat._h.stop) kat._h.stop(); Jogo.Audio.pararLoop(); Jogo.Input.mostrarToque(false); },
  };
};
