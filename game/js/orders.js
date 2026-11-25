// Sizzle Rush orders: the order board. Orders arrive on a schedule that gets
// faster as the shift goes on, each with a recipe and a countdown. Serving the
// exact plate an order asks for scores; letting one run out is a strike.
import { pickRecipe, servePoints, sameMultiset, COMBO_WINDOW_SECONDS } from './data.js';

let nextOrderId = 1;

export function createOrderBoard() {
  return { orders: [], spawnIn: 1.5, served: 0, failed: 0, combo: 1, comboLeft: 0, lastServeAt: -999 };
}

export function orderTimeLimit(level) {
  return Math.max(28, 52 - level * 4);
}

export function maxOpenOrders(level) {
  return Math.min(4, 2 + Math.floor(level / 2));
}

export function spawnInterval(level) {
  return Math.max(7, 13 - level);
}

export function spawnOrder(board, level, now) {
  const recipe = pickRecipe(Math.random);
  const total = orderTimeLimit(level);
  const order = {
    id: nextOrderId,
    recipe,
    timeLeft: total,
    timeTotal: total,
    bornAt: now,
    alarmed: false,
  };
  nextOrderId += 1;
  board.orders.push(order);
  return order;
}

// Advance timers and spawning. Returns 'failed' order objects whose timers ran out.
export function updateOrders(board, level, dt, now, audio) {
  const failed = [];
  board.spawnIn -= dt;
  if (board.spawnIn <= 0 && board.orders.length < maxOpenOrders(level)) {
    spawnOrder(board, level, now);
    board.spawnIn = spawnInterval(level);
  }
  if (board.comboLeft > 0) {
    board.comboLeft -= dt;
    if (board.comboLeft <= 0) board.combo = 1;
  }
  for (let i = board.orders.length - 1; i >= 0; i -= 1) {
    const order = board.orders[i];
    order.timeLeft -= dt;
    if (!order.alarmed && order.timeLeft < 8 && order.timeLeft > 0) {
      order.alarmed = true;
      if (audio) audio.alarm();
    }
    if (order.timeLeft <= 0) {
      board.orders.splice(i, 1);
      board.failed += 1;
      board.combo = 1;
      board.comboLeft = 0;
      failed.push(order);
    }
  }
  return failed;
}

// Try to serve a plate's items against the open orders. Returns the served
// order and points, or null when no order matches the plate exactly.
export function servePlate(board, plateItems, now) {
  for (let i = 0; i < board.orders.length; i += 1) {
    const order = board.orders[i];
    if (sameMultiset(plateItems, order.recipe.items)) {
      board.orders.splice(i, 1);
      const fast = now - board.lastServeAt <= COMBO_WINDOW_SECONDS;
      board.combo = fast ? Math.min(3, board.combo + 1) : 1;
      board.comboLeft = COMBO_WINDOW_SECONDS;
      board.lastServeAt = now;
      board.served += 1;
      const points = servePoints(order.recipe, order.timeLeft, order.timeTotal, board.combo);
      return { order, points, combo: board.combo };
    }
  }
  return null;
}

export function resetOrderIds() {
  nextOrderId = 1;
}
