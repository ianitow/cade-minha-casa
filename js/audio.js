/* =========================================================================
 * audio.js — Jogo.Audio
 * Efeitos sonoros + música chiptune, 100% gerados por código (WebAudio).
 * Nenhum arquivo de áudio. O AudioContext só nasce após gesto do usuário
 * (botão "Jogar"), respeitando a política de autoplay dos navegadores.
 * ========================================================================= */
window.Jogo = window.Jogo || {};

Jogo.Audio = (function () {
  let ctx = null;
  let master = null;
  let mudo = false;
  let noiseBuffer = null;

  /* ----- Inicialização preguiçosa (chamada no 1º gesto) ----- */
  function garantir() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    noiseBuffer = criarNoise();
  }
  function resumir() {
    garantir();
    if (ctx.state === 'suspended') ctx.resume();
  }
  function criarNoise() {
    const len = ctx.sampleRate * 0.5;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function midiFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  /* ----- Bloco sonoro genérico (oscilador + envelope) ----- */
  function tom(opts) {
    if (!ctx || mudo) return;
    const t0 = opts.t != null ? opts.t : ctx.currentTime;
    const dur = opts.dur || 0.15;
    const osc = ctx.createOscillator();
    osc.type = opts.tipo || 'square';
    osc.frequency.setValueAtTime(opts.freq, t0);
    if (opts.freqFim) osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.freqFim), t0 + dur);
    const g = ctx.createGain();
    const vol = (opts.vol != null ? opts.vol : 0.25);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(opts.destino || master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function ruido(opts) {
    if (!ctx || mudo) return;
    const t0 = opts.t != null ? opts.t : ctx.currentTime;
    const dur = opts.dur || 0.1;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const filtro = ctx.createBiquadFilter();
    filtro.type = opts.filtro || 'highpass';
    filtro.frequency.value = opts.corte || 4000;
    const g = ctx.createGain();
    const vol = opts.vol != null ? opts.vol : 0.2;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filtro); filtro.connect(g); g.connect(opts.destino || master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  /* ============================ SFX ============================ */
  function arpejo(notas, passo, tipo, vol) {
    if (!ctx) return;
    const t = ctx.currentTime;
    notas.forEach((m, i) => tom({ freq: midiFreq(m), t: t + i * passo, dur: passo * 1.6, tipo: tipo || 'square', vol: vol || 0.22 }));
  }

  const SFX = {
    clique:   () => tom({ freq: 660, dur: 0.08, tipo: 'square', vol: 0.18 }),
    pegar:    () => arpejo([72, 76, 79, 84], 0.07, 'square', 0.22),       // ascendente alegre
    vazio:    () => tom({ freq: 200, freqFim: 90, dur: 0.22, tipo: 'sawtooth', vol: 0.2 }),
    passo:    () => ruido({ dur: 0.06, corte: 1800, filtro: 'lowpass', vol: 0.07 }),
    pombo:    () => { tom({ freq: 520, freqFim: 900, dur: 0.12, tipo: 'square', vol: 0.18 }); ruido({ dur: 0.08, corte: 5000, vol: 0.12 }); },
    captura:  () => { ruido({ dur: 0.18, corte: 3000, vol: 0.25 }); tom({ freq: 300, freqFim: 1200, dur: 0.18, tipo: 'square', vol: 0.2 }); },
    vitoria:  () => {
      if (!ctx) return;
      const t = ctx.currentTime;
      [ [72,0],[76,0.12],[79,0.24],[84,0.36],[79,0.48],[84,0.6] ].forEach(([m, dt]) =>
        tom({ freq: midiFreq(m), t: t + dt, dur: 0.22, tipo: 'square', vol: 0.26 }));
      [48, 55].forEach((m, i) => tom({ freq: midiFreq(m), t: t + i * 0.3, dur: 0.5, tipo: 'triangle', vol: 0.2 }));
    },
    derrota:  () => {
      if (!ctx) return;
      const t = ctx.currentTime;
      [67, 64, 60, 55].forEach((m, i) => tom({ freq: midiFreq(m), t: t + i * 0.14, dur: 0.2, tipo: 'sawtooth', vol: 0.22 }));
    },
    // blip curtíssimo do typewriter dos diálogos
    tecla:    () => tom({ freq: 1300, dur: 0.018, tipo: 'square', vol: 0.05 }),
    // zumbido alienígena quando você se aproxima demais
    alien:    () => { tom({ freq: 180, freqFim: 70, dur: 0.3, tipo: 'sawtooth', vol: 0.1 }); tom({ freq: 1100, freqFim: 1700, dur: 0.18, tipo: 'sine', vol: 0.05 }); },
    // boss jogando água
    agua:     () => { ruido({ dur: 0.16, corte: 1200, filtro: 'lowpass', vol: 0.16 }); tom({ freq: 360, freqFim: 140, dur: 0.16, tipo: 'sine', vol: 0.12 }); },
    // água acertou o João
    dano:     () => { ruido({ dur: 0.22, corte: 900, filtro: 'lowpass', vol: 0.22 }); tom({ freq: 200, freqFim: 60, dur: 0.2, tipo: 'sawtooth', vol: 0.14 }); },
  };

  function sfx(nome) { resumir(); if (SFX[nome]) SFX[nome](); }

  /* ====================== MÚSICA (chiptune) ====================== */
  // Sequenciador de 16 passos (semicolcheias). Cada fase tem melodia + baixo.
  const MUSICAS = {
    f1: { bpm: 132,
      mel:  [72,76,79,76, 72,76,79,81, 79,76,72,76, 74,77,81,79],
      bax:  [48,0,0,0,    48,0,0,0,    43,0,0,0,    41,0,0,0] },
    f2: { bpm: 104,
      mel:  [69,72,76,72, 74,71,67,71, 69,72,76,81, 79,76,72,71],
      bax:  [45,0,0,0,    45,0,0,0,    38,0,0,0,    40,0,0,0] },
    f3: { bpm: 120,
      mel:  [64,67,71,76, 74,71,67,66, 64,67,70,71, 72,71,67,64],
      bax:  [40,0,0,0,    40,0,0,0,    36,0,0,0,    35,0,0,0] },
    menu: { bpm: 96,
      mel:  [72,0,76,0, 79,0,76,0, 77,0,74,0, 71,0,67,0],
      bax:  [48,0,43,0, 41,0,43,0, 48,0,43,0, 41,0,43,0] },
  };

  let timerMusica = null;
  let musicaAtual = null;
  let passo = 0;
  let proxTempo = 0;
  const LOOKAHEAD = 0.12;     // segundos à frente que agendamos
  const TICK = 30;           // ms entre verificações do scheduler

  function agendarPasso(seq, n, t) {
    const secStep = (60 / seq.bpm) / 4;
    // melodia
    const m = seq.mel[n];
    if (m) tom({ freq: midiFreq(m), t, dur: secStep * 0.9, tipo: 'square', vol: 0.12 });
    // baixo
    const b = seq.bax[n];
    if (b) tom({ freq: midiFreq(b), t, dur: secStep * 3.5, tipo: 'triangle', vol: 0.14 });
    // chimbal nos contratempos
    if (n % 2 === 1) ruido({ t, dur: 0.03, corte: 7000, vol: 0.04 });
  }

  function scheduler() {
    if (!ctx || !musicaAtual) return;
    const seq = MUSICAS[musicaAtual];
    const secStep = (60 / seq.bpm) / 4;
    while (proxTempo < ctx.currentTime + LOOKAHEAD) {
      agendarPasso(seq, passo % seq.mel.length, proxTempo);
      passo++;
      proxTempo += secStep;
    }
  }

  function tocarMusica(faseId) {
    resumir();
    if (musicaAtual === faseId) return;
    pararMusica();
    if (!MUSICAS[faseId]) return;
    musicaAtual = faseId;
    passo = 0;
    proxTempo = ctx.currentTime + 0.1;
    timerMusica = setInterval(scheduler, TICK);
  }

  function pararMusica() {
    if (timerMusica) { clearInterval(timerMusica); timerMusica = null; }
    musicaAtual = null;
  }

  /* ----- Mudo ----- */
  function alternarMudo() {
    garantir();
    mudo = !mudo;
    if (master) master.gain.value = mudo ? 0 : 0.5;
    return mudo;   // true = mutado
  }

  return { resumir, sfx, tocarMusica, pararMusica, alternarMudo };
})();
