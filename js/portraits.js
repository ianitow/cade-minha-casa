/* =========================================================================
 * portraits.js — Jogo.Retratos
 * Rostos dos personagens desenhados 100% por código (sem imagens), num
 * contexto 2D qualquer (o canvas pequeno da caixa de diálogo estilo RPG).
 * Cada função recebe (c, w, h) e desenha um rosto centralizado.
 * ========================================================================= */
window.Jogo = window.Jogo || {};

Jogo.Retratos = (function () {

  function fundo(c, w, h, cor1, cor2) {
    const r = Math.min(w, h) * 0.16;
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, cor1); g.addColorStop(1, cor2);
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(r, 0);
    c.arcTo(w, 0, w, h, r);
    c.arcTo(w, h, 0, h, r);
    c.arcTo(0, h, 0, 0, r);
    c.arcTo(0, 0, w, 0, r);
    c.closePath(); c.fill();
  }

  // -------- João (bêbado, sorriso bobo, bochechas rosadas) --------
  function joao(c, w, h) {
    fundo(c, w, h, '#27406b', '#101a2e');
    const cx = w / 2, cy = h * 0.56, R = Math.min(w, h) * 0.30;
    // pescoço/ombros
    c.fillStyle = '#3b82d6';
    c.beginPath(); c.ellipse(cx, h + R * 0.6, R * 1.5, R, 0, 0, 7); c.fill();
    // cabeça
    c.fillStyle = '#e8b88a';
    c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
    // cabelo
    c.fillStyle = '#3a2418';
    c.beginPath(); c.arc(cx, cy - R * 0.12, R, Math.PI, 0); c.fill();
    c.fillRect(cx - R, cy - R * 0.22, R * 2, R * 0.22);
    // bochechas rosadas (ressaca)
    c.fillStyle = 'rgba(255,120,120,0.5)';
    c.beginPath(); c.arc(cx - R * 0.5, cy + R * 0.25, R * 0.22, 0, 7); c.arc(cx + R * 0.5, cy + R * 0.25, R * 0.22, 0, 7); c.fill();
    // olhos meio fechados (cansaço)
    c.strokeStyle = '#1a1226'; c.lineWidth = Math.max(2, R * 0.09); c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx - R * 0.5, cy - R * 0.05); c.lineTo(cx - R * 0.18, cy - R * 0.05); c.stroke();
    c.beginPath(); c.moveTo(cx + R * 0.18, cy - R * 0.05); c.lineTo(cx + R * 0.5, cy - R * 0.05); c.stroke();
    // sobrancelhas tortas
    c.lineWidth = Math.max(1.5, R * 0.06);
    c.beginPath(); c.moveTo(cx - R * 0.52, cy - R * 0.28); c.lineTo(cx - R * 0.2, cy - R * 0.22); c.stroke();
    c.beginPath(); c.moveTo(cx + R * 0.2, cy - R * 0.24); c.lineTo(cx + R * 0.52, cy - R * 0.30); c.stroke();
    // sorriso bobo
    c.lineWidth = Math.max(2, R * 0.08);
    c.beginPath(); c.arc(cx, cy + R * 0.25, R * 0.35, 0.2, Math.PI - 0.2); c.stroke();
  }

  // -------- Alien (cabeça verde, olhos pretos enormes, antenas) --------
  function alien(c, w, h) {
    fundo(c, w, h, '#143a24', '#06150d');
    const cx = w / 2, cy = h * 0.55, R = Math.min(w, h) * 0.30;
    // antenas
    c.strokeStyle = '#78eeaa'; c.lineWidth = Math.max(2, R * 0.09); c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx - R * 0.4, cy - R * 0.8); c.lineTo(cx - R * 0.6, cy - R * 1.35); c.stroke();
    c.beginPath(); c.moveTo(cx + R * 0.4, cy - R * 0.8); c.lineTo(cx + R * 0.6, cy - R * 1.35); c.stroke();
    c.fillStyle = '#bdffd8';
    c.beginPath(); c.arc(cx - R * 0.6, cy - R * 1.38, R * 0.12, 0, 7); c.arc(cx + R * 0.6, cy - R * 1.38, R * 0.12, 0, 7); c.fill();
    // cabeça (gota)
    c.fillStyle = '#62e096';
    c.beginPath(); c.ellipse(cx, cy, R, R * 1.2, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(189,255,216,0.4)';
    c.beginPath(); c.ellipse(cx - R * 0.3, cy - R * 0.4, R * 0.4, R * 0.5, 0, 0, 7); c.fill();
    // olhos pretos enormes
    c.fillStyle = '#0a0f14';
    c.beginPath(); c.ellipse(cx - R * 0.42, cy, R * 0.32, R * 0.5, 0.25, 0, 7); c.fill();
    c.beginPath(); c.ellipse(cx + R * 0.42, cy, R * 0.32, R * 0.5, -0.25, 0, 7); c.fill();
    // brilho
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.beginPath(); c.arc(cx - R * 0.5, cy - R * 0.15, R * 0.09, 0, 7); c.arc(cx + R * 0.34, cy - R * 0.15, R * 0.09, 0, 7); c.fill();
  }

  // -------- Chefe Líquido (rosto de água bravo) --------
  function chefe(c, w, h) {
    fundo(c, w, h, '#0c2c3e', '#03121c');
    const cx = w / 2, cy = h * 0.52, R = Math.min(w, h) * 0.34;
    const t = (typeof performance !== 'undefined' ? performance.now() : 0) / 1000;
    // corpo de água ondulado
    c.fillStyle = 'rgba(84,208,255,0.7)';
    c.beginPath(); c.ellipse(cx, cy + R * 0.2, R * (1 + Math.sin(t * 3) * 0.05), R * 1.15, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(120,224,255,0.55)';
    c.beginPath(); c.ellipse(cx, cy - R * 0.2, R * 0.7, R * 0.7, 0, 0, 7); c.fill();
    // olhos
    c.fillStyle = '#03121c';
    c.beginPath(); c.ellipse(cx - R * 0.4, cy - R * 0.1, R * 0.16, R * 0.24, 0, 0, 7); c.ellipse(cx + R * 0.4, cy - R * 0.1, R * 0.16, R * 0.24, 0, 0, 7); c.fill();
    c.fillStyle = '#bdf0ff';
    c.beginPath(); c.arc(cx - R * 0.36, cy - R * 0.18, R * 0.05, 0, 7); c.arc(cx + R * 0.46, cy - R * 0.18, R * 0.05, 0, 7); c.fill();
    // sobrancelhas bravas
    c.strokeStyle = '#03121c'; c.lineWidth = Math.max(2, R * 0.1); c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx - R * 0.6, cy - R * 0.4); c.lineTo(cx - R * 0.22, cy - R * 0.22); c.stroke();
    c.beginPath(); c.moveTo(cx + R * 0.22, cy - R * 0.22); c.lineTo(cx + R * 0.6, cy - R * 0.4); c.stroke();
    // boca brava
    c.lineWidth = Math.max(2, R * 0.1);
    c.beginPath(); c.arc(cx, cy + R * 0.55, R * 0.35, Math.PI + 0.3, -0.3); c.stroke();
  }

  // -------- Narrador (silhueta neutra com "?") --------
  function narrador(c, w, h) {
    fundo(c, w, h, '#3a2a52', '#160f24');
    const cx = w / 2, cy = h * 0.55, R = Math.min(w, h) * 0.30;
    c.fillStyle = 'rgba(255,255,255,0.12)';
    c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
    c.beginPath(); c.ellipse(cx, h + R * 0.4, R * 1.4, R, 0, 0, 7); c.fill();
    c.fillStyle = 'var(--amarelo)';
    c.fillStyle = '#ffd23f';
    c.font = 'bold ' + (R * 1.3).toFixed(0) + 'px Trebuchet MS, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('?', cx, cy);
  }

  const mapa = { joao, alien, chefe, narrador };

  function desenhar(c, quem, w, h) {
    c.clearRect(0, 0, w, h);
    (mapa[quem] || narrador)(c, w, h);
  }

  return { desenhar };
})();
