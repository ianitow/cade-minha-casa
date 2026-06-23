/* =========================================================================
 * render.js — Jogo.R
 * Motor de desenho 2D em Canvas. Câmera que segue o jogador e helpers para
 * desenhar tudo com FORMAS (sem depender de fontes de emoji), então funciona
 * em qualquer máquina/navegador, inclusive abrindo o arquivo direto.
 * ========================================================================= */
window.Jogo = window.Jogo || {};

Jogo.R = (function () {
  let canvas, ctx, dpr = 1, W = 0, H = 0;
  const cam = { x: 0, y: 0 };

  function init(cv) {
    canvas = cv;
    ctx = canvas.getContext('2d');
    redimensionar();
    window.addEventListener('resize', redimensionar);
  }
  function redimensionar() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  let shx = 0, shy = 0;
  const sx = (x) => x - cam.x + shx + W / 2;
  const sy = (y) => y - cam.y + shy + H / 2;
  // tremedeira de tela: intensidade 0..1 (cresce com a alucinação)
  function tremor(intensidade) {
    const m = intensidade > 0 ? intensidade : 0;
    const amp = Math.max(0, m - 0.12) * 18;
    if (amp <= 0) { shx = 0; shy = 0; return; }
    shx = (Math.random() * 2 - 1) * amp;
    shy = (Math.random() * 2 - 1) * amp;
  }
  function noVisor(x, y, m) { m = m || 120; const X = sx(x), Y = sy(y); return X > -m && X < W + m && Y > -m && Y < H + m; }

  /* ---- primitivas (recebem coords de MUNDO) ---- */
  function limpar(cor) { ctx.fillStyle = cor; ctx.fillRect(0, 0, W, H); }

  function retArred(X, Y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(X + r, Y);
    ctx.arcTo(X + w, Y, X + w, Y + h, r);
    ctx.arcTo(X + w, Y + h, X, Y + h, r);
    ctx.arcTo(X, Y + h, X, Y, r);
    ctx.arcTo(X, Y, X + w, Y, r);
    ctx.closePath();
  }
  function ret(x, y, w, h, cor, r) { ctx.fillStyle = cor; retArred(sx(x), sy(y), w, h, r || 0); ctx.fill(); }
  function circ(x, y, raio, cor) { ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(sx(x), sy(y), raio, 0, 7); ctx.fill(); }
  function sombra(x, y, w) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(sx(x), sy(y), w, w * 0.4, 0, 0, 7); ctx.fill(); }

  /* ---- fundo: piso + textura sutil de paralaxe ---- */
  function piso(cor) { limpar(cor); }
  function pontilhado(cor, passo) {
    passo = passo || 64;
    ctx.fillStyle = cor;
    const ox = ((-cam.x % passo) + passo) % passo;
    const oy = ((-cam.y % passo) + passo) % passo;
    for (let X = ox - passo; X < W + passo; X += passo)
      for (let Y = oy - passo; Y < H + passo; Y += passo) { ctx.beginPath(); ctx.arc(X, Y, 2, 0, 7); ctx.fill(); }
  }
  function faixa(x, y, w, h, cor) { ret(x, y, w, h, cor, 6); }

  /* ---- cenário ---- */
  function predio(x, y, w, h, cor) {
    if (!noVisor(x + w / 2, y + h / 2, Math.max(w, h))) return;
    ret(x, y, w, h, cor, 8);
    // telhado mais escuro
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; retArred(sx(x), sy(y), w, 16, 8); ctx.fill();
    // janelas
    ctx.fillStyle = '#fff7c0';
    for (let jy = y + 28; jy < y + h - 18; jy += 34)
      for (let jx = x + 16; jx < x + w - 18; jx += 30) { retArred(sx(jx), sy(jy), 16, 20, 3); ctx.fill(); }
  }
  function arvore(x, y) {
    if (!noVisor(x, y, 60)) return;
    sombra(x, y, 26);
    ret(x - 5, y - 30, 10, 30, '#7a4a25', 3);
    circ(x, y - 44, 26, '#2f7d35');
    circ(x - 12, y - 36, 18, '#3a8e41');
    circ(x + 12, y - 36, 18, '#3a8e41');
  }
  function banco(x, y) { sombra(x, y, 34); ret(x - 34, y - 14, 68, 10, '#6a4a2a', 3); ret(x - 30, y - 6, 6, 10, '#5a3a1b'); ret(x + 24, y - 6, 6, 10, '#5a3a1b'); }

  function mesa(x, y, cor, raioBusca) {
    cor = cor || '#8a5a2b';
    if (raioBusca) anelBusca(x, y, raioBusca);
    sombra(x, y + 4, 38);
    ret(x - 34, y - 30, 68, 50, '#5a3a1b', 8);   // base/sombra
    ret(x - 36, y - 36, 72, 50, cor, 10);        // tampo
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; retArred(sx(x - 36), sy(y - 36), 72, 14, 10); ctx.fill();
  }
  function caixa(x, y, w, h, cor, raioBusca) {
    if (raioBusca) anelBusca(x, y, raioBusca);
    sombra(x, y, w * 0.55);
    ret(x - w / 2, y - h, w, h, cor, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; retArred(sx(x - w / 2), sy(y - h), w, 10, 8); ctx.fill();
  }
  function balcao(x, y, w, cor) {
    cor = cor || '#6b4a2a';
    sombra(x, y + 8, w * 0.5);
    ret(x - w / 2, y - 40, w, 50, cor, 8);
    ret(x - w / 2, y - 46, w, 12, '#7c5a36', 8);
  }

  /* anel pulsante de "revistar aqui" */
  function anelBusca(x, y, raio) {
    const t = (performance.now() / 1000);
    const p = 0.5 + 0.5 * Math.sin(t * 4);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,210,63,' + (0.55 + p * 0.4) + ')';
    ctx.lineWidth = 3 + p * 2;
    ctx.beginPath(); ctx.arc(sx(x), sy(y), raio * (0.85 + p * 0.12), 0, 7); ctx.stroke();
    ctx.restore();
  }

  /* ---- personagem (João), âncora nos pés (x,y) ---- */
  function pessoa(x, y, o) {
    o = o || {};
    const bob = o.andando ? Math.sin(o.t * 12) * 2.5 : Math.sin(o.t * 3) * 1.2;
    const X = sx(x), Y = sy(y) - bob;
    const flip = o.flip ? -1 : 1;
    sombra(x, y, 18);
    ctx.save();
    ctx.translate(X, Y); ctx.scale(flip, 1);
    // pernas
    const passo = o.andando ? Math.sin(o.t * 12) * 4 : 0;
    rr(-9, -16, 8, 18, '#3a2e55'); rr(1, -16, 8, 18, '#3a2e55');
    rr(-9 + passo, -4, 8, 6, '#2a2030'); rr(1 - passo, -4, 8, 6, '#2a2030');
    // tronco (camisa)
    rr(-13, -40, 26, 26, o.cor || '#3b82d6', 6);
    // braços
    rr(-17, -38, 6, 18, o.cor || '#3b82d6', 3); rr(11, -38, 6, 18, o.cor || '#3b82d6', 3);
    // cabeça
    ctx.fillStyle = '#e8b88a'; ctx.beginPath(); ctx.arc(0, -50, 12, 0, 7); ctx.fill();
    // cabelo
    ctx.fillStyle = '#3a2418'; ctx.beginPath(); ctx.arc(0, -54, 12, Math.PI, 0); ctx.fill();
    rr(-12, -54, 24, 5, '#3a2418', 2);
    // olhos
    ctx.fillStyle = '#1a1226'; ctx.beginPath(); ctx.arc(-4, -49, 1.7, 0, 7); ctx.arc(5, -49, 1.7, 0, 7); ctx.fill();
    ctx.restore();
  }

  /* ---- pombo, âncora nos pés ---- */
  function pombo(x, y, o) {
    o = o || {};
    const hop = Math.abs(Math.sin(o.t * (o.hopFreq || 10))) * (o.hop || 11);
    const X = sx(x), Y = sy(y) - hop;
    const dir = o.dir >= 0 ? 1 : -1;
    sombra(x, y, 16);
    ctx.save();
    ctx.translate(X, Y); ctx.scale(dir, 1);
    // corpo
    ctx.fillStyle = '#9aa3ad'; ctx.beginPath(); ctx.ellipse(0, -10, 15, 11, 0, 0, 7); ctx.fill();
    // peito mais claro
    ctx.fillStyle = '#c3cad2'; ctx.beginPath(); ctx.ellipse(5, -8, 8, 8, 0, 0, 7); ctx.fill();
    // asa (bate)
    const asa = Math.sin(o.t * 16) * 4;
    ctx.fillStyle = '#7e8893'; ctx.beginPath(); ctx.ellipse(-3, -12 - asa * 0.2, 9, 6, asa * 0.05, 0, 7); ctx.fill();
    // cabeça
    ctx.fillStyle = '#9aa3ad'; ctx.beginPath(); ctx.arc(11, -20, 8, 0, 7); ctx.fill();
    // bico
    ctx.fillStyle = '#f2a23a'; ctx.beginPath(); ctx.moveTo(18, -21); ctx.lineTo(26, -19); ctx.lineTo(18, -16); ctx.closePath(); ctx.fill();
    // olho
    ctx.fillStyle = '#1a1226'; ctx.beginPath(); ctx.arc(13, -22, 1.8, 0, 7); ctx.fill();
    // rabo
    ctx.fillStyle = '#7e8893'; ctx.beginPath(); ctx.moveTo(-14, -12); ctx.lineTo(-24, -8); ctx.lineTo(-14, -6); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* ---- itens (celular/carteira/chave/cerveja), com flutuar ---- */
  function item(x, y, tipo, t) {
    const fl = Math.sin((t || 0) * 3) * 3;
    const X = sx(x), Y = sy(y) - fl;
    sombra(x, y, 12);
    ctx.save(); ctx.translate(X, Y);
    if (tipo === 'celular') {
      rr(-7, -22, 14, 24, '#15151c', 4);
      ctx.fillStyle = '#54d0ff'; retArred(-5, -19, 10, 16, 2); ctx.fill();
    } else if (tipo === 'carteira') {
      rr(-13, -10, 26, 18, '#7a4a25', 4);
      rr(-13, -10, 26, 6, '#8a5a30', 4);
      ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(8, -1, 3, 0, 7); ctx.fill();
    } else if (tipo === 'chave') {
      ctx.strokeStyle = '#f4c430'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(-6, -8, 6, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-1, -8); ctx.lineTo(12, -8); ctx.lineTo(12, -3); ctx.moveTo(8, -8); ctx.lineTo(8, -3); ctx.stroke();
    } else if (tipo === 'cerveja') {
      rr(-9, -20, 16, 22, '#f4b63a', 3);
      ctx.fillStyle = '#fff'; retArred(-9, -22, 16, 7, 3); ctx.fill();
      rr(7, -16, 6, 12, 'rgba(255,255,255,0.0)'); ctx.strokeStyle = '#f4b63a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(10, -10, 6, -1.2, 1.2); ctx.stroke();
    }
    ctx.restore();
  }

  /* ---- escuridão de bar com holofote no jogador (Fase 3) ---- */
  function holofote(px, py, raio) {
    const X = sx(px), Y = sy(py - 20);
    // brilho quente
    let g = ctx.createRadialGradient(X, Y, 0, X, Y, raio * 0.8);
    g.addColorStop(0, 'rgba(255,240,200,0.20)'); g.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // escuridão nas bordas
    g = ctx.createRadialGradient(X, Y, raio * 0.35, X, Y, raio);
    g.addColorStop(0, 'rgba(8,4,16,0)'); g.addColorStop(1, 'rgba(8,4,16,0.9)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  /* ---- alienígena (alucinação), âncora nos pés ---- */
  function alienigena(x, y, o) {
    o = o || {};
    if (!noVisor(x, y, 90)) return;
    const t = o.t || 0, fase = o.fase || 0;
    const bob = Math.sin(t * 2 + fase) * 5;
    const dir = (o.dir >= 0) ? 1 : -1;
    const X = sx(x), Y = sy(y) - bob;
    sombra(x, y, 16);
    ctx.save();
    ctx.translate(X, Y); ctx.scale(dir, 1);
    // aura/brilho
    let g = ctx.createRadialGradient(0, -34, 4, 0, -34, 48);
    g.addColorStop(0, 'rgba(140,255,190,0.35)'); g.addColorStop(1, 'rgba(140,255,190,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -34, 48, 0, 7); ctx.fill();
    // corpo (gota translúcida, leve squash)
    const sq = 1 + Math.sin(t * 4 + fase) * 0.06;
    ctx.fillStyle = 'rgba(98,224,150,0.78)';
    ctx.beginPath(); ctx.ellipse(0, -16, 14, 16 * sq, 0, 0, 7); ctx.fill();
    // cabeça grande
    ctx.fillStyle = 'rgba(120,238,170,0.92)';
    ctx.beginPath(); ctx.ellipse(0, -40, 16, 18, 0, 0, 7); ctx.fill();
    // antenas com olhos na ponta
    const wig = Math.sin(t * 5 + fase) * 3;
    ctx.strokeStyle = 'rgba(120,238,170,0.92)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-7, -52); ctx.lineTo(-10 + wig, -64); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(7, -52); ctx.lineTo(10 + wig, -64); ctx.stroke();
    // olhos pretos grandes
    ctx.fillStyle = '#0a0f14';
    ctx.beginPath(); ctx.ellipse(-10 + wig, -65, 4, 5, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(10 + wig, -65, 4, 5, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-6, -40, 4.5, 6, 0.3, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(6, -40, 4.5, 6, -0.3, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(-7, -42, 1.3, 0, 7); ctx.arc(5, -42, 1.3, 0, 7); ctx.fill();
    ctx.restore();
  }

  /* ---- chefe de água (Fase 4), âncora no topo (x,y) ---- */
  function chefeAgua(x, y, o) {
    o = o || {};
    const t = o.t || 0;
    const X = sx(x), Y = sy(y);
    const flash = o.hitFlash > 0;
    ctx.save();
    ctx.translate(X, Y);
    // halo
    let g = ctx.createRadialGradient(0, 70, 10, 0, 70, 140);
    g.addColorStop(0, 'rgba(84,208,255,0.30)'); g.addColorStop(1, 'rgba(84,208,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 70, 140, 0, 7); ctx.fill();
    // pingos escorrendo
    ctx.fillStyle = 'rgba(84,208,255,0.5)';
    for (let i = -2; i <= 2; i++) {
      const dx = i * 28, dy = 122 + (Math.sin(t * 3 + i) * 0.5 + 0.5) * 26;
      ctx.beginPath(); ctx.ellipse(dx, dy, 6, 11, 0, 0, 7); ctx.fill();
    }
    // corpo
    ctx.fillStyle = flash ? 'rgba(220,245,255,0.92)' : 'rgba(84,208,255,0.6)';
    const w1 = 72 + Math.sin(t * 3) * 8;
    ctx.beginPath(); ctx.ellipse(0, 80, w1, 72 + Math.cos(t * 2.5) * 6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = flash ? 'rgba(255,255,255,0.95)' : 'rgba(120,224,255,0.55)';
    ctx.beginPath(); ctx.ellipse(0, 46, 56 + Math.sin(t * 4) * 6, 52, 0, 0, 7); ctx.fill();
    // olhos
    ctx.fillStyle = '#06121f';
    ctx.beginPath(); ctx.ellipse(-22, 50, 9, 12, 0, 0, 7); ctx.ellipse(22, 50, 9, 12, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#bdf0ff';
    ctx.beginPath(); ctx.arc(-19, 46, 3, 0, 7); ctx.arc(25, 46, 3, 0, 7); ctx.fill();
    // boca brava
    ctx.strokeStyle = '#06121f'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 88, 20, Math.PI + 0.35, -0.35); ctx.stroke();
    ctx.restore();
  }

  /* ---- gota/projétil de água ---- */
  function gotaAgua(x, y, raio, t) {
    const X = sx(x), Y = sy(y);
    ctx.save();
    ctx.translate(X, Y);
    const wob = Math.sin((t || 0) * 12) * 0.15;
    ctx.fillStyle = 'rgba(84,208,255,0.85)';
    ctx.beginPath(); ctx.ellipse(0, 0, raio * (1 + wob), raio * (1 - wob), 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(189,240,255,0.9)';
    ctx.beginPath(); ctx.arc(-raio * 0.3, -raio * 0.3, raio * 0.3, 0, 7); ctx.fill();
    ctx.restore();
  }

  /* ---- efeito de alucinação em tela cheia (espaço de tela; ignora câmera) ---- */
  function efeitoAlucinacao(frac) {
    if (!(frac > 0)) return;
    const f = Math.min(1, frac);
    const tt = performance.now() / 1000;
    ctx.save();
    // ondas de cor psicodélicas
    ctx.globalCompositeOperation = 'overlay';
    const blobs = [
      { hue: (tt * 40) % 360,        ox: Math.sin(tt * 0.8) * W * 0.25, oy: Math.cos(tt * 0.7) * H * 0.25 },
      { hue: (tt * 40 + 140) % 360,  ox: Math.cos(tt * 0.6) * W * 0.30, oy: Math.sin(tt * 0.9) * H * 0.20 },
      { hue: (tt * 40 + 250) % 360,  ox: Math.sin(tt * 1.1) * W * 0.20, oy: Math.cos(tt * 0.5) * H * 0.30 },
    ];
    for (const b of blobs) {
      const cx = W / 2 + b.ox, cy = H / 2 + b.oy;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.6);
      g.addColorStop(0, 'hsla(' + b.hue.toFixed(0) + ',90%,60%,' + (0.35 * f).toFixed(3) + ')');
      g.addColorStop(1, 'hsla(' + b.hue.toFixed(0) + ',90%,60%,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'source-over';
    // vinheta escura pulsante
    const pulse = 0.5 + 0.5 * Math.sin(tt * 6);
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * (0.35 - f * 0.1), W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(20,0,30,0)');
    vg.addColorStop(1, 'rgba(20,0,30,' + (0.55 * f + 0.15 * f * pulse).toFixed(3) + ')');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  /* ---- vaca (fazendinha), âncora nos pés; o.abduz 0..1 = sobe no raio ---- */
  function vaca(x, y, o) {
    o = o || {};
    if (!noVisor(x, y, 80)) return;
    const t = o.t || 0;
    const flut = o.abduz || 0;
    const lift = flut * 80;
    const X = sx(x), Y = sy(y) - lift;
    if (flut < 0.05) sombra(x, y, 18);
    ctx.save();
    ctx.translate(X, Y);
    if (flut > 0) ctx.rotate(Math.sin(t * 6) * 0.18 * flut);
    rr(-20, -22, 40, 20, '#f3f3f3', 8);                  // corpo
    ctx.fillStyle = '#2a2a2a';                            // manchas
    ctx.beginPath(); ctx.ellipse(-8, -14, 6, 5, 0, 0, 7); ctx.ellipse(8, -10, 5, 4, 0, 0, 7); ctx.fill();
    rr(14, -20, 14, 12, '#f3f3f3', 5);                   // cabeça
    rr(24, -16, 6, 7, '#f0b8c0', 3);                     // focinho
    ctx.fillStyle = '#1a1226'; ctx.beginPath(); ctx.arc(19, -16, 1.6, 0, 7); ctx.fill();
    rr(-16, -4, 5, 8, '#d8d8d8'); rr(-4, -4, 5, 8, '#d8d8d8'); rr(6, -4, 5, 8, '#d8d8d8'); rr(14, -4, 5, 8, '#d8d8d8');
    ctx.fillStyle = '#caa15a'; ctx.beginPath(); ctx.arc(17, -30, 2, 0, 7); ctx.arc(24, -30, 2, 0, 7); ctx.fill();
    ctx.restore();
  }

  /* ---- disco voador + raio trator (o.beam 0..1, o.beamLen) ---- */
  function nave(x, y, o) {
    o = o || {};
    if (!noVisor(x, y, 240)) return;
    const t = o.t || 0;
    const X = sx(x), Y = sy(y) + Math.sin(t * 2) * 4;
    const beam = o.beam || 0, len = o.beamLen || 130;
    ctx.save();
    ctx.translate(X, Y);
    if (beam > 0) {
      const g = ctx.createLinearGradient(0, 14, 0, 14 + len);
      g.addColorStop(0, 'rgba(120,255,180,' + (0.5 * beam).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(120,255,180,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(-10, 14); ctx.lineTo(10, 14); ctx.lineTo(34, 14 + len); ctx.lineTo(-34, 14 + len); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(180,255,210,' + (0.6 * beam).toFixed(3) + ')'; ctx.lineWidth = 2;
      for (let k = 0; k < 3; k++) { const p = ((t * 0.6 + k / 3) % 1); const yy = 14 + p * len; const w = 10 + p * 24; ctx.beginPath(); ctx.ellipse(0, yy, w, w * 0.3, 0, 0, 7); ctx.stroke(); }
    }
    ctx.fillStyle = 'rgba(150,220,255,0.85)';            // domo
    ctx.beginPath(); ctx.ellipse(0, -6, 16, 14, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#9aa3ad'; ctx.beginPath(); ctx.ellipse(0, 4, 40, 14, 0, 0, 7); ctx.fill();   // disco
    ctx.fillStyle = '#6b7480'; ctx.beginPath(); ctx.ellipse(0, 8, 40, 10, 0, 0, 7); ctx.fill();
    for (let k = -2; k <= 2; k++) { const on = (Math.floor(t * 4) + k) % 2 === 0; ctx.fillStyle = on ? '#ffd23f' : '#7a5a1a'; ctx.beginPath(); ctx.arc(k * 14, 6, 2.5, 0, 7); ctx.fill(); }
    ctx.restore();
  }

  /* ---- portal giratório (o.escala 0..1 abre/fecha) ---- */
  function portal(x, y, o) {
    o = o || {};
    const t = o.t || 0, e = (o.escala != null ? o.escala : 1);
    if (e <= 0.01 || !noVisor(x, y, 120)) return;
    const X = sx(x), Y = sy(y - 26), R0 = 32 * e;
    ctx.save();
    ctx.translate(X, Y);
    let g = ctx.createRadialGradient(0, 0, 2, 0, 0, R0 * 1.7);
    g.addColorStop(0, 'rgba(196,123,255,0.6)'); g.addColorStop(1, 'rgba(196,123,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R0 * 1.7, 0, 7); ctx.fill();
    for (let k = 0; k < 4; k++) {
      ctx.save(); ctx.rotate(t * (1 + k * 0.5) * (k % 2 ? -1 : 1));
      ctx.strokeStyle = k % 2 ? 'rgba(120,255,180,0.85)' : 'rgba(196,123,255,0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(0, 0, R0 * (1 - k * 0.18), R0 * (1 - k * 0.18) * 0.7, 0, 0.3, 5.6); ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(10,2,20,0.85)'; ctx.beginPath(); ctx.ellipse(0, 0, R0 * 0.4, R0 * 0.28, 0, 0, 7); ctx.fill();
    ctx.restore();
  }

  /* ---- cachorro (easter egg), âncora nos pés ---- */
  function cachorro(x, y, o) {
    o = o || {};
    if (!noVisor(x, y, 60)) return;
    const t = o.t || 0, X = sx(x), Y = sy(y), dir = o.dir >= 0 ? 1 : -1;
    sombra(x, y, 14);
    ctx.save(); ctx.translate(X, Y); ctx.scale(dir, 1);
    const wag = Math.sin(t * 12) * 5;
    rr(-16, -16, 30, 12, '#a86a3a', 6);                  // corpo
    rr(10, -22, 14, 13, '#b97a44', 5);                   // cabeça
    rr(9, -25, 6, 8, '#7a4a25', 3);                      // orelha
    ctx.fillStyle = '#1a1226'; ctx.beginPath(); ctx.arc(22, -15, 1.8, 0, 7); ctx.arc(18, -17, 1.5, 0, 7); ctx.fill();
    rr(-14, -4, 5, 7, '#8a5a30'); rr(-2, -4, 5, 7, '#8a5a30'); rr(8, -4, 5, 7, '#8a5a30');
    ctx.strokeStyle = '#a86a3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-16, -14); ctx.lineTo(-24, -20 + wag); ctx.stroke();
    ctx.restore();
  }

  /* ---- galinha (Fase 1), âncora nos pés ---- */
  function galinha(x, y, o) {
    o = o || {};
    if (!noVisor(x, y, 50)) return;
    const t = o.t || 0, X = sx(x), Y = sy(y), dir = o.dir >= 0 ? 1 : -1;
    const bob = Math.abs(Math.sin(t * 8)) * 3;
    sombra(x, y, 12);
    ctx.save(); ctx.translate(X, Y - bob); ctx.scale(dir, 1);
    // corpo
    ctx.fillStyle = '#f5f5f5'; ctx.beginPath(); ctx.ellipse(0, -12, 12, 11, 0, 0, 7); ctx.fill();
    // asa
    ctx.fillStyle = '#e0e0e0'; ctx.beginPath(); ctx.ellipse(-2, -12, 6, 7, 0, 0, 7); ctx.fill();
    // cabeça
    ctx.fillStyle = '#f5f5f5'; ctx.beginPath(); ctx.arc(8, -22, 6, 0, 7); ctx.fill();
    // crista + barbela
    ctx.fillStyle = '#e0443a'; ctx.beginPath(); ctx.arc(7, -28, 2.4, 0, 7); ctx.arc(10, -27, 2.2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(9, -17, 2, 0, 7); ctx.fill();
    // bico
    ctx.fillStyle = '#f2a23a'; ctx.beginPath(); ctx.moveTo(13, -22); ctx.lineTo(19, -20); ctx.lineTo(13, -19); ctx.closePath(); ctx.fill();
    // olho
    ctx.fillStyle = '#1a1226'; ctx.beginPath(); ctx.arc(9, -23, 1.3, 0, 7); ctx.fill();
    // pernas
    ctx.strokeStyle = '#f2a23a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-3, -2); ctx.lineTo(-3, 2); ctx.moveTo(4, -2); ctx.lineTo(4, 2); ctx.stroke();
    ctx.restore();
  }

  /* ---- criança (Fase 2), versão baixinha da pessoa, âncora nos pés ---- */
  function crianca(x, y, o) {
    o = o || {};
    const bob = o.andando ? Math.sin(o.t * 12) * 2 : Math.sin(o.t * 3) * 1;
    const X = sx(x), Y = sy(y) - bob, flip = o.flip ? -1 : 1;
    sombra(x, y, 13);
    ctx.save();
    ctx.translate(X, Y); ctx.scale(flip * 0.72, 0.72);   // menorzinha
    rr(-8, -16, 7, 16, '#3a2e55'); rr(1, -16, 7, 16, '#3a2e55');   // pernas
    rr(-12, -38, 24, 24, o.cor || '#e0567a', 6);                    // tronco
    rr(-16, -36, 6, 16, o.cor || '#e0567a', 3); rr(10, -36, 6, 16, o.cor || '#e0567a', 3);
    ctx.fillStyle = '#e8b88a'; ctx.beginPath(); ctx.arc(0, -48, 11, 0, 7); ctx.fill();   // cabeça
    ctx.fillStyle = '#2a1a12'; ctx.beginPath(); ctx.arc(0, -52, 11, Math.PI, 0); ctx.fill();
    rr(-11, -52, 22, 4, '#2a1a12', 2);
    ctx.fillStyle = '#1a1226'; ctx.beginPath(); ctx.arc(-4, -47, 1.6, 0, 7); ctx.arc(4, -47, 1.6, 0, 7); ctx.fill();
    ctx.restore();
  }

  /* ---- gato (Fase 3, no escuro: olhinhos brilham), âncora nos pés ---- */
  function gato(x, y, o) {
    o = o || {};
    if (!noVisor(x, y, 50)) return;
    const t = o.t || 0, X = sx(x), Y = sy(y), dir = o.dir >= 0 ? 1 : -1;
    sombra(x, y, 13);
    ctx.save(); ctx.translate(X, Y); ctx.scale(dir, 1);
    const cor = '#5a5560', cor2 = '#46414c';
    // rabo (balança)
    ctx.strokeStyle = cor; ctx.lineWidth = 4; ctx.beginPath();
    ctx.moveTo(-12, -8); ctx.quadraticCurveTo(-22, -10, -20 + Math.sin(t * 4) * 4, -20); ctx.stroke();
    // corpo
    ctx.fillStyle = cor; ctx.beginPath(); ctx.ellipse(-2, -8, 13, 8, 0, 0, 7); ctx.fill();
    // cabeça
    ctx.fillStyle = cor2; ctx.beginPath(); ctx.arc(10, -16, 7, 0, 7); ctx.fill();
    // orelhas
    ctx.beginPath(); ctx.moveTo(5, -22); ctx.lineTo(7, -28); ctx.lineTo(10, -22); ctx.closePath();
    ctx.moveTo(12, -22); ctx.lineTo(15, -28); ctx.lineTo(16, -22); ctx.closePath(); ctx.fill();
    // olhos que brilham (verde)
    ctx.fillStyle = '#9cff7a'; ctx.beginPath(); ctx.arc(8, -16, 1.7, 0, 7); ctx.arc(13, -16, 1.7, 0, 7); ctx.fill();
    // patas
    ctx.fillStyle = cor2; rr(-8, -2, 4, 4, cor2); rr(2, -2, 4, 4, cor2);
    ctx.restore();
  }

  /* ---- ícone de "falando" (balão com ondas), em coords de mundo ---- */
  function iconeVoz(x, y, t) {
    const X = sx(x), Y = sy(y);
    ctx.save(); ctx.translate(X, Y);
    rr(-15, -13, 30, 22, 'rgba(255,255,255,0.96)', 6);
    ctx.fillStyle = 'rgba(255,255,255,0.96)'; ctx.beginPath(); ctx.moveTo(-5, 9); ctx.lineTo(5, 9); ctx.lineTo(-3, 16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1a1226';
    for (let k = 0; k < 3; k++) { const h = 4 + (0.5 + 0.5 * Math.sin((t || 0) * 10 + k)) * 11; ctx.fillRect(-9 + k * 7, -2 - h / 2, 4, h); }
    ctx.restore();
  }

  /* ---- nome flutuante de NPC (ex.: "Seu Zé") ---- */
  function nomeNPC(x, y, texto, cor) {
    const X = sx(x), Y = sy(y);
    ctx.save();
    ctx.font = 'bold 12px "PressStart", "Courier New", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(texto).width + 18;
    ctx.fillStyle = 'rgba(20,12,30,0.92)'; retArred(X - w / 2, Y - 12, w, 22, 5); ctx.fill();
    ctx.strokeStyle = cor || '#ffd23f'; ctx.lineWidth = 2; retArred(X - w / 2, Y - 12, w, 22, 5); ctx.stroke();
    ctx.fillStyle = cor || '#ffd23f'; ctx.fillText(texto, X, Y + 1);
    ctx.restore();
  }

  /* helper local: retângulo arredondado em coords de TELA já transladadas (dentro de save/translate) */
  function rr(x, y, w, h, cor, r) {
    if (cor) ctx.fillStyle = cor;
    r = r || 0; r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath(); ctx.fill();
  }

  return {
    init, redimensionar, cam,
    get W() { return W; }, get H() { return H; }, ctx: () => ctx,
    sx, sy, noVisor, limpar, piso, pontilhado, faixa,
    ret, circ, sombra,
    predio, arvore, banco, mesa, caixa, balcao, anelBusca,
    pessoa, pombo, item, holofote,
    alienigena, chefeAgua, gotaAgua, efeitoAlucinacao,
    vaca, nave, portal, cachorro, galinha, gato, crianca, iconeVoz, nomeNPC, tremor,
  };
})();
