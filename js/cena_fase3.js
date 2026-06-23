/* =========================================================================
 * cena_fase3.js — Fase 3: "A Última Chave"
 * Bar grande e escuro, com holofote no João. Revistar MUITOS esconderijos
 * até achar a chave (sorteada). Dica quente/frio no topo.
 * ========================================================================= */
window.Jogo = window.Jogo || {};
Jogo.Cenas = Jogo.Cenas || {};

Jogo.Cenas.fase3 = function (aoConcluir, aoPerder) {
  const R = Jogo.R, C = Jogo.CONFIG, P = C.d2.player;
  const mundo = { x0: -540, x1: 540, y0: -360, y1: 440 };

  const joao = { x: 0, y: 320, t: 0, andando: false, flip: false };
  const est = { ativo: false, venceu: false, perdeu: false };
  let chave = null;

  const aliens = Jogo.Aliens({
    quantos: C.d2.fase3Aliens, mundo, getJogador: () => joao,
    aoPegar: () => perder('capturado'),
    aoSurtar: () => perder('surto'),
  });

  const itens = [
    { x: -380, y: -160, nome: 'a mesa 1', tipo: 'mesa' }, { x: -180, y: -120, nome: 'a mesa 2', tipo: 'mesa' },
    { x: 120, y: -150, nome: 'a mesa 3', tipo: 'mesa' }, { x: 360, y: -120, nome: 'a mesa 4', tipo: 'mesa' },
    { x: -300, y: 120, nome: 'a mesa 5', tipo: 'mesa' }, { x: 300, y: 140, nome: 'a mesa 6', tipo: 'mesa' },
    { x: 0, y: 60, nome: 'a mesa 7', tipo: 'mesa' },
    { x: 0, y: -300, nome: 'o balcão', tipo: 'balcao' },
    { x: -480, y: 300, nome: 'a caixa de som', tipo: 'caixa' }, { x: 470, y: 300, nome: 'a jukebox', tipo: 'jukebox' },
    { x: -470, y: -260, nome: 'a lixeira', tipo: 'lixeira' }, { x: 470, y: -250, nome: 'o sofá', tipo: 'sofa' },
  ];
  itens.forEach((i) => (i.revistado = false));
  itens[Math.floor(Math.random() * itens.length)].contem = true;

  const busca = Jogo.Busca({
    itens, getJogador: () => joao, quenteFrio: true, dicaPadrao: C.txt.fase3.dica,
    aoAchar: (it) => { chave = { x: it.x, y: it.y - 48 }; vencer(); },
  });
  const desinscrever = Jogo.Input.aoAcao(busca.revistarProximo);

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  let alvo = null;

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
    aliens.update(dt, joao);
    R.cam.x += (joao.x - R.cam.x) * Math.min(1, 8 * dt);
    R.cam.y += (joao.y - R.cam.y) * Math.min(1, 8 * dt);
  }

  function vencer() {
    if (est.venceu || est.perdeu) return;
    est.venceu = true; est.ativo = false;
    Jogo.UI.dica(null); Jogo.UI.objetivo(C.txt.fase3.objetivo); Jogo.UI.alucinacao(null);
    Jogo.UI.balao(C.txt.fase3.vitoria, 3400);
    setTimeout(aoConcluir, 2800);
  }

  function perder(motivo) {
    if (est.perdeu || est.venceu) return;
    est.perdeu = true; est.ativo = false;
    Jogo.UI.dica(null);
    if (aoPerder) aoPerder(motivo);
  }

  function paredes() {
    R.ret(mundo.x0 - 40, mundo.y0 - 40, (mundo.x1 - mundo.x0) + 80, 38, '#241634', 6);
    R.ret(mundo.x0 - 40, mundo.y1 + 6, (mundo.x1 - mundo.x0) + 80, 38, '#1c1028', 6);
    R.ret(mundo.x0 - 40, mundo.y0 - 40, 38, (mundo.y1 - mundo.y0) + 80, '#201430', 6);
    R.ret(mundo.x1 + 6, mundo.y0 - 40, 38, (mundo.y1 - mundo.y0) + 80, '#201430', 6);
  }

  function draw(ctx) {
    R.piso(C.cores.chaoBar);
    R.pontilhado('rgba(255,255,255,0.03)', 60);
    paredes();

    const desenhos = [];
    itens.forEach((it) => {
      const rb = (it === alvo && !it.revistado) ? C.d2.busca.raio : 0;
      desenhos.push({ y: it.y, f: () => desenharItem(it, rb) });
    });
    aliens.desenhos().forEach((d) => desenhos.push(d));
    desenhos.push({ y: joao.y, f: () => R.pessoa(joao.x, joao.y, { t: joao.t, andando: joao.andando, flip: joao.flip, cor: '#3b82d6' }) });
    if (chave) desenhos.push({ y: chave.y + 100, f: () => R.item(chave.x, chave.y, 'chave', joao.t) });
    desenhos.sort((a, b) => a.y - b.y).forEach((d) => d.f());

    // escuridão + holofote por cima de tudo
    R.holofote(joao.x, joao.y, 280);
    aliens.efeito();   // alucinação por cima do holofote
  }

  function desenharItem(it, rb) {
    if (it.tipo === 'mesa') R.mesa(it.x, it.y, '#3a2618', rb);
    else if (it.tipo === 'balcao') { R.balcao(it.x, it.y, 320, '#4a2f1a'); if (rb) R.anelBusca(it.x, it.y, rb); }
    else if (it.tipo === 'lixeira') R.caixa(it.x, it.y, 44, 50, '#555', rb);
    else if (it.tipo === 'caixa') R.caixa(it.x, it.y, 52, 52, '#333', rb);
    else if (it.tipo === 'jukebox') R.caixa(it.x, it.y, 50, 70, '#2e6b3e', rb);
    else if (it.tipo === 'sofa') R.caixa(it.x, it.y, 80, 44, '#4a3a2a', rb);
    if (it.revistado) marcarRevistado(it);
  }
  function marcarRevistado(it) {
    const c = R.ctx(); c.save();
    c.strokeStyle = 'rgba(120,255,140,0.85)'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(R.sx(it.x) - 9, R.sy(it.y) - 30); c.lineTo(R.sx(it.x) - 2, R.sy(it.y) - 23); c.lineTo(R.sx(it.x) + 10, R.sy(it.y) - 38); c.stroke();
    c.restore();
  }

  Jogo.Audio.tocarMusica('f3');
  Jogo.UI.objetivo(C.txt.fase3.objetivo);
  Jogo.UI.contador(C.txt.revistados + ': 0/' + itens.length);
  R.cam.x = joao.x; R.cam.y = joao.y;
  Jogo.UI.cutscene(C.txt.fase3.intro, () => {
    Jogo.UI.mostrarHUD(true); Jogo.Input.mostrarToque(true); est.ativo = true;
  });

  return {
    get ativo() { return est.ativo; },
    update, draw, _dbg: { vencer, perder },
    dispose() { desinscrever(); aliens.parar(); Jogo.Input.mostrarToque(false); },
  };
};
