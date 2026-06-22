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
   'alucinacao', 'alucBarra', 'chefeHP', 'chefeHPBarra', 'chefeHPNome',
   'loading', 'loadTexto', 'barraDentro', 'overlay'].forEach((id) => { el[id] = $(id); });

  let balaoTimer = null;
  let dialogoRaf = null;   // RAF do typewriter (cancelado em limparOverlay)

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

  // medidor de alucinação (0..1); null esconde
  function alucinacao(frac) {
    if (frac == null) { el.alucinacao.classList.add('hidden'); return; }
    el.alucinacao.classList.remove('hidden');
    const p = Math.max(0, Math.min(1, frac));
    el.alucBarra.style.width = (p * 100).toFixed(0) + '%';
    el.alucBarra.style.background = p < 0.5 ? '#7be07b' : p < 0.8 ? '#ffd23f' : '#ff4d4d';
    el.alucinacao.classList.toggle('alerta', p > 0.8);
  }

  // barra de vida do chefe (0..1); null esconde
  function chefeVida(frac) {
    if (frac == null) { el.chefeHP.classList.add('hidden'); return; }
    el.chefeHP.classList.remove('hidden');
    const p = Math.max(0, Math.min(1, frac));
    el.chefeHPBarra.style.width = (p * 100).toFixed(0) + '%';
  }

  /* ===================== OVERLAY ===================== */
  function limparOverlay() {
    if (dialogoRaf) { cancelAnimationFrame(dialogoRaf); dialogoRaf = null; }
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

  // ---- DIÁLOGO estilo RPG (retrato + typewriter; clique/Espaço completa/avança) ----
  function normLinha(l) { return (typeof l === 'string') ? { quem: 'narrador', txt: l } : l; }

  function dialogo(linhas, aoFim) {
    const C = Jogo.CONFIG;
    limparOverlay();
    el.overlay.className = 'dialogo';

    const caixa = document.createElement('div');
    caixa.className = 'caixaDialogo';
    caixa.innerHTML =
      '<canvas class="retrato" width="160" height="160"></canvas>' +
      '<div class="dlgCorpo">' +
        '<div class="nomeRetrato"></div>' +
        '<p class="dlgTxt"></p>' +
        '<p class="dicaOverlay">▶ toque / ESPAÇO</p>' +
      '</div>';
    el.overlay.appendChild(caixa);

    const cv = caixa.querySelector('.retrato');
    const ctx2d = cv.getContext('2d');
    const elNome = caixa.querySelector('.nomeRetrato');
    const elTxt = caixa.querySelector('.dlgTxt');

    const vel = (C && C.txt.dlgVel) || 45;   // chars/seg
    let i = 0, pos = 0, digitando = false, ultimoT = 0, txtAtual = '', somAcc = 0;

    function mostrarLinha(n) {
      const linha = normLinha(linhas[n]);
      txtAtual = linha.txt || '';
      const quem = linha.quem || 'narrador';
      // retrato
      Jogo.Retratos.desenhar(ctx2d, quem, cv.width, cv.height);
      // nome
      const nome = (C && C.txt.nomes && C.txt.nomes[quem] != null) ? C.txt.nomes[quem] : '';
      elNome.textContent = nome;
      elNome.style.display = nome ? 'block' : 'none';
      // typewriter
      pos = 0; digitando = true; somAcc = 0; elTxt.textContent = '';
      ultimoT = 0;
      if (dialogoRaf) cancelAnimationFrame(dialogoRaf);
      dialogoRaf = requestAnimationFrame(tick);
    }

    function tick(t) {
      if (!ultimoT) ultimoT = t;
      const dt = (t - ultimoT) / 1000; ultimoT = t;
      pos += vel * dt;
      const n = Math.min(txtAtual.length, Math.floor(pos));
      elTxt.textContent = txtAtual.slice(0, n);
      // som de tecla esparso
      somAcc += vel * dt;
      if (somAcc >= 3) { somAcc = 0; if (n < txtAtual.length) Jogo.Audio.sfx('tecla'); }
      if (n >= txtAtual.length) { digitando = false; dialogoRaf = null; return; }
      dialogoRaf = requestAnimationFrame(tick);
    }

    function avancar() {
      if (digitando) {                 // completa a linha na hora
        if (dialogoRaf) { cancelAnimationFrame(dialogoRaf); dialogoRaf = null; }
        elTxt.textContent = txtAtual; digitando = false; return;
      }
      i++;
      if (i < linhas.length) mostrarLinha(i);
      else { limparOverlay(); if (aoFim) aoFim(); }
    }

    mostrarLinha(0);
    el.overlay.onclick = avancar;
    document.onkeydown = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); avancar(); }
    };
  }

  // mantém a API antiga: cutscene agora é o diálogo RPG (string = narrador)
  function cutscene(linhas, aoFim) { return dialogo(linhas, aoFim); }

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
    if (opts.textoBotao2) {
      const btn2 = document.createElement('button');
      btn2.className = 'btnGrande secundario';
      btn2.textContent = opts.textoBotao2;
      btn2.onclick = () => { Jogo.Audio.resumir(); opts.aoBotao2(); };
      p.appendChild(btn2);
    }
  }

  return {
    mostrarLoading, esconderLoading, loadTexto, barra, progresso,
    mostrarHUD, objetivo, timer, contador, dica, balao,
    alucinacao, chefeVida,
    menu, cutscene, dialogo, telaFim, limparOverlay,
  };
})();
