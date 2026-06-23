/* =========================================================================
 * busca.js — Jogo.Busca (2D)
 * Mecânica de "revistar" objetos das Fases 2 e 3. Chega perto + [E]/clique
 * revista o objeto mais próximo. Vazio = balão de humor; certo = aoAchar.
 * ========================================================================= */
window.Jogo = window.Jogo || {};

Jogo.Busca = function (opts) {
  const C = Jogo.CONFIG;
  const raio = opts.raio || C.d2.busca.raio;
  const itens = opts.itens;          // [{ x, y, nome, contem, revistado:false }]
  const total = itens.length;
  let revistados = 0;
  let achou = false;
  // acharNoFim: o item premiado só "aparece" nas últimas fileiras visitadas
  const janelaFim = opts.janelaFim || 3;
  const itemAlvo = opts.acharNoFim ? null : itens.find((i) => i.contem);

  function dist(it) {
    const j = opts.getJogador();
    return Math.hypot(it.x - j.x, it.y - j.y);
  }
  function maisProximo() {
    let melhor = null, md = raio;
    for (const it of itens) {
      if (it.revistado) continue;
      const d = dist(it);
      if (d < md) { md = d; melhor = it; }
    }
    return melhor;
  }
  function revistar(it) {
    if (!it || it.revistado) return;
    it.revistado = true; revistados++;
    Jogo.UI.contador(C.txt.revistados + ': ' + revistados + '/' + total);
    // revelação tardia: só pode conter o item nas últimas `janelaFim` buscas
    if (opts.acharNoFim && !achou) {
      const restantes = total - revistados;     // ainda não revistados
      if (restantes <= janelaFim - 1) {
        if (restantes === 0 || Math.random() < 1 / (restantes + 1)) it.contem = true;
      }
    }
    if (it.contem) {
      achou = true;
      Jogo.Audio.sfx('pegar'); Jogo.Audio.sfx('vitoria');
      if (opts.aoAchar) opts.aoAchar(it);
    } else {
      Jogo.Audio.sfx('vazio');
      const l = C.txt.vazios;
      Jogo.UI.balao(l[Math.floor(Math.random() * l.length)], 2200);
    }
  }
  function revistarProximo() { revistar(maisProximo()); }

  let dicaT = 0;
  function update(dt) {
    const it = maisProximo();
    if (it) Jogo.UI.dica('🔎 [E] / toque — revistar ' + (it.nome || 'aqui'));
    else Jogo.UI.dica(opts.dicaPadrao || C.txt.fase2.dica);

    if (opts.quenteFrio && itemAlvo) {
      dicaT -= dt;
      if (dicaT <= 0) {
        dicaT = 0.8;
        const d = dist(itemAlvo);
        if (d < 150) Jogo.UI.objetivo('🔥 ' + C.txt.quente);
        else if (d > 380) Jogo.UI.objetivo('❄️ ' + C.txt.frio);
        else Jogo.UI.objetivo(C.txt.fase3.objetivo);
      }
    }
    return it;   // p/ a fase desenhar o anel de destaque
  }

  return {
    update, revistar, revistarProximo, maisProximo,
    get revistados() { return revistados; }, total,
  };
};
