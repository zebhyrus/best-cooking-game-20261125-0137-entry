// Sizzle Rush main: boot, the fixed-step loop, keyboard and mouse input, the
// title / play / paused / win / game-over screens, and the ?shot= screenshot
// mode that stages one frame and reports window.__shotReady.
import { VIEW_W, VIEW_H, SHIFT_SECONDS, TARGET_SCORE, MAX_FAILS } from './data.js';
import { createAudio } from './audio.js';
import { createOrderBoard, updateOrders, resetOrderIds } from './orders.js';
import { createChef, updateChef } from './chef.js';
import { createKitchen, updateKitchen, tryInteract, finishChop } from './kitchen.js';
import { drawGame } from './render.js';
import { stageShot } from './shots.js';

const STEP = 1 / 60;
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const ctx = canvas.getContext('2d');
const audio = createAudio();

function createGame() {
  resetOrderIds();
  return {
    chef: createChef(),
    kitchen: createKitchen(),
    board: createOrderBoard(),
    audio,
    score: 0,
    fails: 0,
    level: 1,
    shiftLeft: SHIFT_SECONDS,
    elapsed: 0,
    lastServe: null,
    screen: 'title',
  };
}

let game = createGame();
let screen = 'title';

function setScreen(next) {
  screen = next;
  game.screen = next;
  if (statusEl) statusEl.textContent = next === 'title' ? 'Sizzle Rush title screen. Press Enter to start.'
    : next === 'win' ? `Shift complete! Score ${game.score}.`
    : next === 'over' ? `Shift over. Score ${game.score}.`
    : next === 'paused' ? 'Game paused.' : 'Playing Sizzle Rush.';
}

function resetGame() {
  game = createGame();
  setScreen('play');
  audio.unlock();
}

const keys = { up: false, down: false, left: false, right: false };
const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
};

window.addEventListener('keydown', (event) => {
  const mapped = KEYMAP[event.code];
  if (mapped) { keys[mapped] = true; event.preventDefault(); return; }
  if (event.code === 'Enter' || event.code === 'Space') {
    event.preventDefault();
    if (screen === 'title' || screen === 'win' || screen === 'over') resetGame();
    else if (screen === 'paused') setScreen('play');
    return;
  }
  if (event.code === 'KeyE') {
    if (screen === 'play') {
      const result = tryInteract(game, game.elapsed);
      if (result === 'served') checkEnd();
    }
    return;
  }
  if (event.code === 'KeyP') {
    if (screen === 'play') setScreen('paused');
    else if (screen === 'paused') setScreen('play');
    return;
  }
  if (event.code === 'KeyM') {
    const muted = audio.toggleMute();
    game.kitchen.flash = muted ? 'Sound off (M to turn back on)' : 'Sound on';
    game.kitchen.flashAt = game.elapsed;
  }
});
window.addEventListener('keyup', (event) => {
  const mapped = KEYMAP[event.code];
  if (mapped) keys[mapped] = false;
});

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (VIEW_W / rect.width),
    y: (event.clientY - rect.top) * (VIEW_H / rect.height),
  };
}

canvas.addEventListener('pointerdown', (event) => {
  audio.unlock();
  if (screen === 'title' || screen === 'win' || screen === 'over') { resetGame(); return; }
  if (screen !== 'play') return;
  const point = canvasPoint(event);
  const dx = point.x - game.chef.x;
  const dy = point.y - game.chef.y;
  if (Math.hypot(dx, dy) < 70) {
    const result = tryInteract(game, game.elapsed);
    if (result === 'served') checkEnd();
  } else {
    game.chef.target = point;
  }
});

function checkEnd() {
  if (game.score >= TARGET_SCORE) { setScreen('win'); audio.win(); }
}

function step(dt) {
  if (screen !== 'play') return;
  game.elapsed += dt;
  game.shiftLeft -= dt;
  game.level = 1 + Math.floor(game.elapsed / 45);
  updateChef(game.chef, keys, dt);
  const events = updateKitchen(game.kitchen, dt, audio);
  for (const event of events) {
    if (event === 'chopped') { finishChop(game); audio.chop(); }
    if (event === 'cooked') audio.ding();
    if (event === 'burnt') game.kitchen.flash = 'A patty burnt! Trash it and grill a fresh one.';
  }
  const failed = updateOrders(game.board, game.level, dt, game.elapsed, audio);
  if (failed.length > 0) {
    game.fails += failed.length;
    audio.fail();
    game.kitchen.flash = `Order #${failed[0].id} went late! (${game.fails}/${MAX_FAILS} strikes)`;
    game.kitchen.flashAt = game.elapsed;
  }
  if (game.fails >= MAX_FAILS) { setScreen('over'); return; }
  if (game.shiftLeft <= 0) {
    game.shiftLeft = 0;
    setScreen(game.score >= TARGET_SCORE ? 'win' : 'over');
    if (game.score >= TARGET_SCORE) audio.win();
  }
  checkEnd();
}

function frame(now) {
  const dt = Math.min(MAX_FRAME, (now - frame.last) / 1000 || 0);
  frame.last = now;
  let acc = dt;
  while (acc > 0) {
    const s = Math.min(STEP, acc);
    step(s);
    acc -= s;
  }
  drawGame(ctx, game, screen, game.elapsed);
  requestAnimationFrame(frame);
}
frame.last = performance.now();

// Headless hooks: the play-test drives the real game through these.
window.__sizzle = {
  get game() { return game; },
  get screen() { return screen; },
  start() { resetGame(); },
  interact() { return tryInteract(game, game.elapsed); },
  step(dt) { step(dt); },
};

if (shotName) {
  const staged = stageShot(shotName, game);
  setScreen(staged);
  game.elapsed = 0.01;
  let painted = 0;
  (function paint() {
    drawGame(ctx, game, staged, 0.01);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }());
} else {
  setScreen('title');
  requestAnimationFrame(frame);
}
