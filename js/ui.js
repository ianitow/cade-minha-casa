/* =========================================================================
 * ui.js — Jogo.UI
 * Toda a interface em HTML/CSS sobreposta ao canvas:
 * loading, HUD (objetivo/timer/contador/dica/balão) e telas
 * (menu, cutscene, fim/vitória).
 * ========================================================================= */
window.Jogo = window.Jogo || {};

Jogo.UI = (function () {
  const $ = (id) => document.getElementById(id);
  const el = {};
  ['hud', 'objetivo', 'timer', 'contador', 'dica', 'balao',
   'loading', 'loadTexto', 'barraDentro', 'overlay'].forEach((id) => { el[id] = $(id); });

  let balaoTimer = null;

  /* ===================== LOADING ===================== */
  function mostrarLoading() { el.loading.classList.remove('hidden'); barra(0); }
  function esconderLoading() { el.loading.classList.add('hidden'); }
  function loadTexto(t) { if (el.loadTexto) el.loadTexto.textContent = t; }
  function barra(frac) {
    const p = Math.max(0, Math.min(1, frac)) * 100;
    if (el.barraDentro) el.barraDentro.style.width = p.toFixed(0) + '%';
  }
  function progresso(evt) {
    if (evt && evt.lengthComputable && evt.total) barra(evt.loaded / evt.total);
  }

  /* ===================== HUD ===================== */
  function mostrarHUD(b) { el.hud.classList.toggle('hidden', !b); }
  function objetivo(t) { el.objetivo.textContent = t; }

  function timer(seg) {
    if (seg == null) { el.timer.classList.add('hidden'); return; }
    el.timer.classList.remove('hidden');
    const s = Math.max(0, Math.ceil(seg));
    const mm = Math.floor(s / 60), ss = s % 60;
    el.timer.textContent = '⏱ ' + mm + ':' + (ss < 10 ? '0' : '') + ss;
    el.timer.classList.toggle('urgente', s <= 10);
  }

  function contador(txt) {
    if (txt == null) { el.contador.classList.add('hidden'); return; }
    el.contador.classList.remove('hidden');
    el.contador.textContent = txt;
  }

  function dica(t) {
    if (!t) { el.dica.classList.add('hidden'); return; }
    el.dica.textContent = t;
    el.dica.classList.remove('hidden');
  }

  function balao(t, ms) {
    el.balao.textContent = t;
    el.balao.classList.remove('hidden');
    if (balaoTimer) clearTimeout(balaoTimer);
    balaoTimer = setTimeout(() => el.balao.classList.add('hidden'), ms || 2600);
  }

  /* ===================== OVERLAY ===================== */
  function limparOverlay() {
    el.overlay.className = 'hidden';
    el.overlay.innerHTML = '';
    el.overlay.onclick = null;
    document.onkeydown = null;
  }

  function painel(htmlInterno) {
    const div = document.createElement('div');
    div.className = 'painelOverlay';
    div.innerHTML = htmlInterno;
    el.overlay.appendChild(div);
    return div;
  }

  // ---- MENU inicial ----
  function menu(opts) {
    limparOverlay();
    el.overlay.className = 'menu';
    const p = painel(
      '<h1>' + opts.titulo + '</h1>' +
      '<p class="sub">' + opts.subtitulo + '</p>'
    );
    const btn = document.createElement('button');
    btn.className = 'btnGrande';
    btn.textContent = opts.textoBotao;
    btn.onclick = () => { Jogo.Audio.resumir(); opts.aoJogar(); };
    p.appendChild(btn);
    const cred = document.createElement('p');
    cred.className = 'creditos';
    cred.textContent = 'Canvas 2D · sem instalar nada · feito pra rir';
    p.appendChild(cred);
  }

  // ---- CUTSCENE (revela linha por linha; clique/Espaço avança) ----
  function cutscene(linhas, aoFim) {
    limparOverlay();
    el.overlay.className = 'cutscene';
    const p = painel('');
    const hint = document.createElement('p');
    hint.className = 'dicaOverlay';
    hint.textContent = '▶ clique ou ESPAÇO para continuar';

    let i = 0;
    function revelar() {
      if (i < linhas.length) {
        const linha = document.createElement('p');
        linha.className = 'linha';
        linha.textContent = linhas[i];
        p.appendChild(linha);
        p.appendChild(hint);   // appendChild move o hint p/ o fim (sempre por último)
        i++;
      } else {
        limparOverlay();
        aoFim();
      }
    }
    revelar(); // primeira linha já aparece
    const avancar = () => revelar();
    el.overlay.onclick = avancar;
    document.onkeydown = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); avancar(); }
    };
  }

  // ---- TELA DE FIM / VITÓRIA ----
  function telaFim(opts) {
    limparOverlay();
    el.overlay.className = 'fim';
    const linhasHtml = (opts.linhas || []).map((l) => '<p class="linha">' + l + '</p>').join('');
    const p = painel(
      (opts.titulo ? '<h1>' + opts.titulo + '</h1>' : '') + linhasHtml
    );
    const btn = document.createElement('button');
    btn.className = 'btnGrande';
    btn.textContent = opts.textoBotao || 'Continuar';
    btn.onclick = () => { Jogo.Audio.resumir(); opts.aoBotao(); };
    p.appendChild(btn);
  }

  return {
    mostrarLoading, esconderLoading, loadTexto, barra, progresso,
    mostrarHUD, objetivo, timer, contador, dica, balao,
    menu, cutscene, telaFim, limparOverlay,
  };
})();
