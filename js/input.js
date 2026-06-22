/* =========================================================================
 * input.js — Jogo.Input
 * Teclado (WASD/setas, Shift=correr, E/Espaço=ação) + joystick virtual no
 * toque. Mantém um estado compartilhado lido pelo Player, e dispara
 * callbacks de "ação" para as fases de busca.
 * ========================================================================= */
window.Jogo = window.Jogo || {};

Jogo.Input = (function () {
  const estado = {
    frente: false, tras: false, esq: false, dir: false,
    correr: false,
    eixoX: 0, eixoY: 0,     // analógico do joystick (sobrepõe os booleanos)
    joystick: false,
  };

  const callbacksAcao = [];   // disparados a cada toque/tecla de ação

  function dispararAcao() {
    Jogo.Audio && Jogo.Audio.resumir();
    callbacksAcao.slice().forEach((cb) => cb());
  }
  function aoAcao(cb) {
    callbacksAcao.push(cb);
    return () => { const i = callbacksAcao.indexOf(cb); if (i >= 0) callbacksAcao.splice(i, 1); };
  }
  function limparAcoes() { callbacksAcao.length = 0; }

  /* ---------------- Teclado ---------------- */
  function onKey(e, down) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    estado.frente = down; break;
      case 'KeyS': case 'ArrowDown':  estado.tras = down; break;
      case 'KeyA': case 'ArrowLeft':  estado.esq = down; break;
      case 'KeyD': case 'ArrowRight': estado.dir = down; break;
      case 'ShiftLeft': case 'ShiftRight': estado.correr = down; break;
      case 'KeyE': case 'Space':
        if (down && !e.repeat) dispararAcao();
        break;
      default: return;
    }
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
  }
  window.addEventListener('keydown', (e) => onKey(e, true));
  window.addEventListener('keyup', (e) => onKey(e, false));

  /* ---------------- Joystick virtual (toque) ---------------- */
  let jsBase = null, jsKnob = null, btnAcao = null, criado = false, pid = null;

  function injetarEstilo() {
    const s = document.createElement('style');
    s.textContent =
      '#jsBase{position:absolute;left:24px;bottom:24px;width:120px;height:120px;border-radius:50%;' +
      'background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.4);z-index:20;touch-action:none;pointer-events:auto;}' +
      '#jsKnob{position:absolute;left:35px;top:35px;width:50px;height:50px;border-radius:50%;' +
      'background:rgba(255,210,63,.85);box-shadow:0 2px 8px rgba(0,0,0,.4);}' +
      '#btnAcao{position:absolute;right:24px;bottom:40px;width:96px;height:96px;border-radius:50%;' +
      'background:rgba(255,140,41,.85);border:3px solid #fff;color:#1a1226;font-weight:bold;font-size:16px;' +
      'z-index:20;pointer-events:auto;touch-action:none;}';
    document.head.appendChild(s);
  }

  function criarJoystick() {
    if (criado) return;
    criado = true;
    injetarEstilo();
    jsBase = document.createElement('div'); jsBase.id = 'jsBase';
    jsKnob = document.createElement('div'); jsKnob.id = 'jsKnob';
    jsBase.appendChild(jsKnob);
    btnAcao = document.createElement('button'); btnAcao.id = 'btnAcao'; btnAcao.textContent = 'Revistar / Correr';
    document.body.appendChild(jsBase);
    document.body.appendChild(btnAcao);

    const raio = 60;
    function set(dx, dy) {
      const len = Math.hypot(dx, dy) || 1;
      const cl = Math.min(len, raio);
      const nx = dx / len * cl, ny = dy / len * cl;
      jsKnob.style.left = (35 + nx) + 'px';
      jsKnob.style.top = (35 + ny) + 'px';
      estado.joystick = true;
      estado.eixoX = nx / raio;
      estado.eixoY = -ny / raio;          // tela: y p/ baixo é positivo → invertido
      estado.correr = (cl / raio) > 0.8;
    }
    function reset() {
      jsKnob.style.left = '35px'; jsKnob.style.top = '35px';
      estado.joystick = false; estado.eixoX = 0; estado.eixoY = 0; estado.correr = false;
      pid = null;
    }
    jsBase.addEventListener('pointerdown', (e) => { pid = e.pointerId; jsBase.setPointerCapture(pid); const r = jsBase.getBoundingClientRect(); set(e.clientX - (r.left + 60), e.clientY - (r.top + 60)); });
    jsBase.addEventListener('pointermove', (e) => { if (e.pointerId !== pid) return; const r = jsBase.getBoundingClientRect(); set(e.clientX - (r.left + 60), e.clientY - (r.top + 60)); });
    jsBase.addEventListener('pointerup', reset);
    jsBase.addEventListener('pointercancel', reset);
    btnAcao.addEventListener('pointerdown', (e) => { e.preventDefault(); dispararAcao(); });
  }

  // Cria o joystick só quando há toque de verdade
  window.addEventListener('touchstart', function once() {
    criarJoystick();
    window.removeEventListener('touchstart', once);
  }, { passive: true });

  function mostrarToque(b) {
    if (!criado) return;
    jsBase.style.display = b ? 'block' : 'none';
    btnAcao.style.display = b ? 'block' : 'none';
  }

  /* ---------------- Vetor de movimento (-1..1) ---------------- */
  function eixo() {
    if (estado.joystick) return { x: estado.eixoX, y: estado.eixoY };
    return {
      x: (estado.dir ? 1 : 0) - (estado.esq ? 1 : 0),
      y: (estado.frente ? 1 : 0) - (estado.tras ? 1 : 0),
    };
  }

  return { estado, eixo, aoAcao, limparAcoes, mostrarToque, acao: dispararAcao };
})();
