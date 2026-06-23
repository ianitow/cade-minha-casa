# Cadê Minha Casa? 🏙️🍺👽

Jogo **2D** de aventura e humor para navegador. Depois de uma noite no bar,
**João** acorda perdido — sem celular, sem carteira, sem as chaves de casa…
e, por causa do porre, **vendo ALIENS por todo lado**. Em **4 fases** ele
precisa recuperar tudo, fugir dos ETs (que só existem na ressaca dele) e
voltar pra casa.

- **Fase 1 — Cadê Meu Celular?** Vários pombos idênticos voam pela praça e **só um** está com seu celular. Encoste neles até achar o ladrão — e fuja dos aliens.
- **Fase 2 — A Carteira Perdida** Revasculhe as mesas da lanchonete até achar a carteira, desviando dos ETs.
- **Fase 3 — A Última Chave** Cace a chave escondida no bar, no escuro, guiado por uma lanterna e dicas de "quente/frio".
- **Fase 4 — O Chefão Líquido (BOSS)** Um alienígena **feito de água** te encharca de jatos. Desvie, pegue as **cervejas** do chão e **tÁque de volta** até derrotá-lo.

### Aliens & alucinação (perigo em todas as fases)
Os aliens **vagueiam** pelo cenário. Se um **encostar** em você, é game over.
Ficar **muito perto** por muito tempo enche o **medidor de alucinação** (👁 no
HUD) — chegou a **100%**, João surta e você perde. Ao perder, dá pra **tentar
de novo a mesma fase**. As mensagens da história são em **estilo RPG** (retrato
do personagem + texto datilografado).

Feito com **HTML + CSS + JavaScript puro** (Canvas 2D). **Sem bibliotecas, sem build.**
Os personagens (inclusive aliens e o boss) são desenhados por código — nenhuma imagem.
Visual **pixelado** (fontes 8-bit) e diálogos estilo **RPG** (retrato + typewriter,
com **negrito, cores e ícones**).

### Áudio & easter eggs
Além dos efeitos/chiptune gerados por código, há vozes e memes em **MP3** (pasta `audio/`):
- **Vozes dos ETs** (`et_*`) tocam ao você se aproximar — **uma de cada vez**, com **som posicional** (esquerda/direita + volume por distância) e um **ícone de fala** sobre o ET que está falando.
- **Cachorro** late (`animals`) e o **NPC "Seu Zé"** fala (`eu-finjo…`) ao chegar perto.
- **Fase 1:** discos voadores **abduzindo vacas** nas fazendinhas.
- **Fase 2:** ETs surgem por **portais** e a carteira só aparece nas **últimas buscas**; toca **dexter** em loop.
- **Morte por ET:** `busquem_conhecimento` (captura) ou `miau-triste` (surto). **Bolha do boss:** `vinheta-xaropinho`.
- **Ao zerar:** toca `bem-amigos-terminou` e a música volta em seguida.

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
| Revistar / pegar / arremessar | `E` ou `Espaço`, ou **clicar** na tela | botão de ação |
| Avançar diálogo | clique / `Espaço` | toque |
| Mudo | botão 🔊 no canto superior direito | — |

## Estrutura

```
index.html              # canvas + HUD + ordem dos <script>
css/style.css           # HUD/telas em HTML sobre o canvas (medidores, diálogo RPG)
js/config.js            # constantes e TODO o texto/roteiro (PT-BR)
js/audio.js             # WebAudio: efeitos + música chiptune por fase
js/portraits.js         # rostos dos personagens (retratos do diálogo RPG)
js/ui.js                # loading, HUD, diálogo RPG (typewriter), menu, telas de fim
js/input.js             # teclado + joystick de toque
js/render.js            # motor de desenho 2D (câmera + formas, aliens, boss)
js/aliens.js            # aliens errantes + medidor de alucinação (todas as fases)
js/busca.js             # mecânica de "revistar" (Fases 2 e 3)
js/cena_fase1.js        # Fase 1 — vários pombos + aliens
js/cena_fase2.js        # Fase 2 — busca na lanchonete + aliens
js/cena_fase3.js        # Fase 3 — busca no bar (com lanterna) + aliens
js/cena_fase4.js        # Fase 4 — BOSS: o Chefão Líquido
js/game.js              # loop de render + máquina de estados (menu/game over/vitória)
```

Tudo é desenhado com **formas no canvas** (personagens, prédios, móveis), então
não depende de imagens nem de fontes de emoji — funciona em qualquer navegador.
Os emojis aparecem só no HUD em HTML (objetivos, telas), onde o navegador os renderiza.

## Ajustes rápidos

- Velocidades e dificuldade: `js/config.js` → bloco `d2` (`player`, `pombo`, `busca`, `fase1Tempo`).
- **Aliens / alucinação:** `js/config.js` → `d2.aliens` (`passeio`, `aura`, `captura`, `subida`, `descida`) e quantidade por fase (`fase1Extra.aliens`, `fase2Aliens`, `fase3Aliens`).
- **Boss (Fase 4):** `js/config.js` → `d2.chefe` (vida, cadência dos jatos, velocidades, dano da água).
- Textos e piadas: `js/config.js` → bloco `txt` (diálogos RPG aceitam `{ quem, txt }` e markup de cor `[a]…[/]`, `**negrito**`).
- O pombo certo (Fase 1), a carteira (Fase 2) e a chave (Fase 3) ficam **sorteados** a cada partida.

## Créditos
- Fontes pixeladas (em `fonts/`, licença **OFL**): **Press Start 2P** e **VT323** (Google Fonts).
- Áudios em `audio/` são memes/efeitos usados como easter eggs.
