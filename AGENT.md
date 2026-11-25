# Sizzle Rush — build notes

## What it is

A complete 2D canvas cooking game ("Sizzle Rush") built from scratch for the
make.fun best cooking game bounty. One chef, one kitchen, one dinner rush:
orders with recipes and countdowns, five ingredients, chopping, grilling with
a burn window, plating, serving, combo scoring, escalating difficulty, and
win / game-over screens. All art is drawn in code (canvas shapes), all sound
is synthesized with WebAudio. No copied names, characters, art or music.

## v2 (2026-11-25, play-tested + polished)

- Real CDP play-through in headless Chrome (keyboard, mouse, full shift):
  fixed the click-to-move trap (a click above the floor left an unreachable
  target the chef chased forever) and the centre-only station reach (wide
  counters were usable only from their middle — reach is now measured to the
  station rectangle, so the plating counter, hatch and stove work from any
  edge). Grabbing ingredients while something chops is allowed now.
- Seven recipes (added Cheesy Garden, Double Cheese); the station the chef
  can use glows gold with a floating E badge; stove shows flickering flames
  and rising steam; urgent tickets pulse; serve popups pop-scale on a dark
  pill; HUD shows score progress toward 600 and the combo timer; the timer
  reads TIME 2:12 in plain text. Space also works as the interact key.
- Sounds: distinct pop (plating) and serve jingle, chop pitch varies.

## How it was built

Static files under `game/` (index.html + CSS + ES modules, no build step, no
network requests). The source is split by job:

- `game/js/data.js` — ingredients, recipes, station layout, tuning numbers
- `game/js/audio.js` — synthesized WebAudio sounds (chop, sizzle, ding, alarm)
- `game/js/orders.js` — the order board: spawning, timers, serving, combos
- `game/js/chef.js` — chef movement (keyboard + click-to-move) and carrying
- `game/js/kitchen.js` — stations: crates, chop board, stove, plate, hatch, trash
- `game/js/render.js` — all canvas drawing (kitchen, tickets, chef, overlays)
- `game/js/shots.js` — deterministic screenshot staging (`?shot=...`)
- `game/js/main.js` — boot, fixed-step loop, input, screens, headless hooks

`main.ts` copies `game/` + `screenshots/` to the output dir and writes
`dossier.json` with the vendored `vendor/makefun-game.ts`.

## Controls

- Move: WASD / arrow keys, or click a spot on the floor (click-to-move)
- E or Space (or click near the chef): use the nearest station — take an ingredient,
  start chopping, place / pick up a patty, add to the plate, pick up the plate,
  serve at the hatch, trash a burnt item. The usable station glows gold.
- P: pause, M: mute, Enter: start / restart

## Flow

Crate (raw) → chop board (tomato/lettuce) or stove (patty, 4 s, burns after
4 s more) → plating counter (exact recipe) → pick up plate → serve hatch.
A plate only scores when it matches an open order exactly. Fast consecutive
serves raise the combo to x3. 600 points before the 3-minute shift ends wins;
3 late orders ends the shift.
