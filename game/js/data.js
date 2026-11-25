// Sizzle Rush data: the ingredients, the recipes, the kitchen layout and the
// tuning numbers. Nothing here touches the screen or the network; every other
// module reads its facts from this file.
export const VIEW_W = 1280;
export const VIEW_H = 800;
export const SHIFT_SECONDS = 180;
export const TARGET_SCORE = 600;
export const MAX_FAILS = 3;
export const CHOP_SECONDS = 1.6;
export const COOK_SECONDS = 4;
export const BURN_AFTER_SECONDS = 4;
export const COMBO_WINDOW_SECONDS = 12;

// One ingredient: its colour, what it needs before it can be plated, and the
// crate it comes from. Prep is 'chop', 'cook' or 'none'.
export const INGREDIENTS = {
  bun: { name: 'Bun', color: '#e8a94f', dark: '#b97a26', prep: 'none', key: 'Bun' },
  patty: { name: 'Patty', color: '#8a4b2d', dark: '#5d3018', prep: 'cook', key: 'Patty' },
  cheese: { name: 'Cheese', color: '#f7c948', dark: '#d99e06', prep: 'none', key: 'Cheese' },
  tomato: { name: 'Tomato', color: '#e5484d', dark: '#a92c31', prep: 'chop', key: 'Tomato' },
  lettuce: { name: 'Lettuce', color: '#4caf50', dark: '#2e7d32', prep: 'chop', key: 'Lettuce' },
};

export const INGREDIENT_IDS = ['bun', 'patty', 'cheese', 'tomato', 'lettuce'];

export function needsPrep(id) {
  return INGREDIENTS[id].prep;
}

export function isReady(item) {
  if (!item) return false;
  if (item.kind === 'plate') return false;
  const prep = INGREDIENTS[item.id].prep;
  if (prep === 'chop') return item.state === 'chopped';
  if (prep === 'cook') return item.state === 'cooked';
  return item.state === 'raw';
}

// Recipes: a name, the dish colour, and the exact multiset of ingredient ids.
// A plate matches an order only when its items are exactly this multiset.
export const RECIPES = [
  { name: 'Classic Burger', dish: 'Burger', color: '#e8a94f', items: ['bun', 'patty', 'cheese'] },
  { name: 'Garden Salad', dish: 'Salad', color: '#4caf50', items: ['tomato', 'lettuce', 'cheese'] },
  { name: 'Cheesy Melt', dish: 'Melt', color: '#f7c948', items: ['bun', 'cheese', 'tomato'] },
  { name: 'Garden Burger', dish: 'Garden Burger', color: '#7cb342', items: ['bun', 'patty', 'lettuce', 'tomato'] },
  { name: 'Double Stack', dish: 'Double Stack', color: '#8a4b2d', items: ['bun', 'patty', 'patty', 'tomato'] },
];

export function pickRecipe(random) {
  return RECIPES[Math.floor(random() * RECIPES.length)];
}

export function sortedItems(items) {
  return [...items].sort();
}

export function sameMultiset(a, b) {
  if (a.length !== b.length) return false;
  const sa = sortedItems(a);
  const sb = sortedItems(b);
  for (let i = 0; i < sa.length; i += 1) if (sa[i] !== sb[i]) return false;
  return true;
}

// Station rectangles on the 1280x800 floor. kind: 'crate' (one per ingredient),
// 'board', 'stove', 'plate', 'hatch', 'trash'.
export const STATIONS = [
  { kind: 'crate', id: 'bun', label: 'BUNS', x: 24, y: 196, w: 150, h: 92 },
  { kind: 'crate', id: 'patty', label: 'PATTIES', x: 24, y: 300, w: 150, h: 92 },
  { kind: 'crate', id: 'cheese', label: 'CHEESE', x: 24, y: 404, w: 150, h: 92 },
  { kind: 'crate', id: 'tomato', label: 'TOMATOES', x: 24, y: 508, w: 150, h: 92 },
  { kind: 'crate', id: 'lettuce', label: 'LETTUCE', x: 24, y: 612, w: 150, h: 92 },
  { kind: 'board', label: 'CHOP BOARD', x: 250, y: 196, w: 240, h: 130 },
  { kind: 'stove', label: 'STOVE', x: 560, y: 196, w: 300, h: 130 },
  { kind: 'trash', label: 'TRASH', x: 930, y: 196, w: 150, h: 96 },
  { kind: 'plate', label: 'PLATING COUNTER', x: 250, y: 560, w: 470, h: 150 },
  { kind: 'hatch', label: 'SERVE HATCH', x: 900, y: 540, w: 356, h: 180 },
];

export function stationCenter(station) {
  return { x: station.x + station.w / 2, y: station.y + station.h / 2 };
}

export function stationByKind(kind, id) {
  return STATIONS.find((s) => s.kind === kind && (id === undefined || s.id === id));
}

// Points for a served order: base by recipe size, plus a time bonus for how
// much of the order timer was left, times the combo multiplier.
export function servePoints(recipe, timeLeft, timeTotal, combo) {
  const base = 60 + recipe.items.length * 20;
  const bonus = Math.round(40 * Math.max(0, timeLeft / timeTotal));
  return (base + bonus) * combo;
}
