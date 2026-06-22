# Cadê Minha Casa? 🏙️🍺

Jogo **2D** de aventura e humor para navegador. Depois de uma noite no bar,
**João** acorda perdido — sem celular, sem carteira e sem as chaves de casa.
Em **3 fases** ele precisa recuperar tudo e voltar pra casa.

- **Fase 1 — Cadê Meu Celular?** Persiga (correndo!) o pombo que roubou seu celular. Encoste nele pra pegar.
- **Fase 2 — A Carteira Perdida** Revasculhe as mesas da lanchonete até achar a carteira.
- **Fase 3 — A Última Chave** Cace a chave escondida no bar, no escuro, guiado por uma lanterna e dicas de "quente/frio".

Feito com **HTML + CSS + JavaScript puro** (Canvas 2D). **Sem bibliotecas, sem build,
sem downloads.** Áudio (efeitos + música chiptune) é gerado por código com a WebAudio API.

## Como rodar

**É só abrir o `index.html` no navegador** (dois cliques). Não precisa de servidor,
internet, nem instalar nada.

```
# alternativa, se preferir um servidor local:
python3 -m http.server 8000   # depois abra http://localhost:8000
```

## Controles

| Ação | Teclado | Toque |
|------|---------|-------|
| Andar | `W A S D` / setas | joystick (canto inferior esquerdo) |
| Correr | `Shift` | empurrar o joystick até o limite |
| Revistar / interagir | `E` ou `Espaço`, ou **clicar** na tela | botão "Revistar" |
| Avançar diálogo | clique / `Espaço` | toque |
| Mudo | botão 🔊 no canto superior direito | — |

## Estrutura

```
index.html              # canvas + HUD + ordem dos <script>
css/style.css           # HUD/telas em HTML sobre o canvas
js/config.js            # constantes e TODO o texto/roteiro (PT-BR)
js/audio.js             # WebAudio: efeitos + música chiptune por fase
js/ui.js                # loading, HUD, cutscenes, menu, telas de fim
js/input.js             # teclado + joystick de toque
js/render.js            # motor de desenho 2D (câmera + formas)
js/busca.js             # mecânica de "revistar" (Fases 2 e 3)
js/cena_fase1.js        # Fase 1 — perseguição ao pombo
js/cena_fase2.js        # Fase 2 — busca na lanchonete
js/cena_fase3.js        # Fase 3 — busca no bar (com lanterna)
js/game.js              # loop de render + máquina de estados (menu/vitória)
```

Tudo é desenhado com **formas no canvas** (personagens, prédios, móveis), então
não depende de imagens nem de fontes de emoji — funciona em qualquer navegador.
Os emojis aparecem só no HUD em HTML (objetivos, telas), onde o navegador os renderiza.

## Ajustes rápidos

- Velocidades e dificuldade: `js/config.js` → bloco `d2` (`player`, `pombo`, `busca`, `fase1Tempo`).
- Textos e piadas: `js/config.js` → bloco `txt`.
- A carteira (Fase 2) e a chave (Fase 3) ficam num lugar **sorteado** a cada partida.
