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

  const sx = (x) => x - cam.x + W / 2;
  const sy = (y) => y - cam.y + H / 2;
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
  };
})();
