// Sizzle Rush chef: movement, the carry slot, and the click-to-move target.
// The chef carries at most one thing: one ingredient, or one finished plate.
import { VIEW_W, VIEW_H, stationCenter } from './data.js';

export const CHEF_SPEED = 340;
export const CHEF_RADIUS = 26;

export function createChef() {
  return {
    x: 640, y: 430, vx: 0, vy: 0,
    dir: 1, moving: false, walkPhase: 0,
    hands: null, // { kind:'item', id, state } or { kind:'plate', items:[ids] }
    target: null, // click-to-move {x,y} or null
  };
}

export function chefHasItem(chef) {
  return chef.hands !== null && chef.hands.kind === 'item';
}

export function chefHasPlate(chef) {
  return chef.hands !== null && chef.hands.kind === 'plate';
}

export function chefHandsEmpty(chef) {
  return chef.hands === null;
}

export function takeItem(chef, id, state) {
  chef.hands = { kind: 'item', id, state: state || 'raw' };
}

export function takePlate(chef, items) {
  chef.hands = { kind: 'plate', items: [...items] };
}

export function dropHands(chef) {
  const held = chef.hands;
  chef.hands = null;
  return held;
}

// Move with WASD/arrows, or toward a click target. Stops at the floor edges
// and slows near the click target so the chef lands on it.
export function updateChef(chef, keys, dt) {
  let mx = 0;
  let my = 0;
  if (keys.left) mx -= 1;
  if (keys.right) mx += 1;
  if (keys.up) my -= 1;
  if (keys.down) my += 1;
  if (mx !== 0 || my !== 0) {
    chef.target = null;
    const len = Math.hypot(mx, my);
    mx /= len;
    my /= len;
  } else if (chef.target) {
    const dx = chef.target.x - chef.x;
    const dy = chef.target.y - chef.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 8) {
      chef.target = null;
    } else {
      mx = dx / dist;
      my = dy / dist;
      if (dist < 60) { mx *= dist / 60; my *= dist / 60; }
    }
  }
  chef.moving = mx !== 0 || my !== 0;
  chef.x = Math.min(VIEW_W - 30, Math.max(30, chef.x + mx * CHEF_SPEED * dt));
  chef.y = Math.min(VIEW_H - 24, Math.max(196, chef.y + my * CHEF_SPEED * dt));
  if (mx !== 0) chef.dir = mx > 0 ? 1 : -1;
  if (chef.moving) chef.walkPhase += dt * 11;
}

// The station the chef is close enough to use, or null. Crates and the trash
// are used from the side; the counters from in front.
export function nearestStation(chef, stations) {
  let best = null;
  let bestDist = 110;
  for (const station of stations) {
    const c = stationCenter(station);
    const d = Math.hypot(chef.x - c.x, chef.y - c.y);
    if (d < bestDist) { bestDist = d; best = station; }
  }
  return best;
}
