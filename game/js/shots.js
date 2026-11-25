// Sizzle Rush screenshot staging: ?shot=kitchen|counter|assembly|serve puts a
// fresh game into a fixed, deterministic state and paints it once, so the
// screenshots are real renders of the game's own code. No randomness here.
import { spawnOrder } from './orders.js';
import { RECIPES } from './data.js';
import { takeItem, takePlate } from './chef.js';

// Fixed recipes per ticket so every screenshot run renders identically.
function setRecipes(board, indexes) {
  board.orders.forEach((order, i) => { order.recipe = RECIPES[indexes[i] % RECIPES.length]; });
}

function baseGame(game) {
  game.score = 0;
  game.fails = 0;
  game.level = 2;
  game.shiftLeft = 132;
  game.board.orders = [];
  game.board.served = 0;
  game.board.failed = 0;
  game.board.combo = 1;
  game.kitchen.plate = [];
  game.kitchen.board = null;
  game.kitchen.burners = [null, null];
  game.kitchen.flash = '';
  game.lastServe = null;
}

export function stageShot(name, game) {
  baseGame(game);
  const now = 0;
  if (name === 'counter') {
    game.chef.x = 220;
    game.chef.y = 430;
    takeItem(game.chef, 'tomato', 'raw');
    game.kitchen.board = { id: 'lettuce', progress: 0.55, done: false };
    game.kitchen.burners = [{ id: 'patty', progress: 0.7, state: 'cooking', doneIn: 0 }, null];
    game.kitchen.plate = ['cheese'];
    spawnOrder(game.board, 2, now);
    spawnOrder(game.board, 2, now);
    setRecipes(game.board, [0, 1]);
    game.board.orders[0].timeLeft = 38;
    game.board.orders[1].timeLeft = 24;
    game.score = 120;
    return 'play';
  }
  if (name === 'assembly') {
    game.chef.x = 470;
    game.chef.y = 520;
    takeItem(game.chef, 'cheese', 'raw');
    game.kitchen.plate = ['bun', 'patty'];
    game.kitchen.burners = [{ id: 'patty', progress: 1, state: 'done', doneIn: 1 }, null];
    spawnOrder(game.board, 2, now);
    spawnOrder(game.board, 2, now);
    spawnOrder(game.board, 2, now);
    setRecipes(game.board, [0, 3, 1]);
    game.board.orders[0].timeLeft = 31;
    game.board.orders[1].timeLeft = 18;
    game.board.orders[2].timeLeft = 44;
    game.score = 260;
    game.board.combo = 2;
    game.board.comboLeft = 8;
    game.kitchen.flash = 'Add the cheese to finish the Classic Burger!';
    game.kitchen.flashAt = 0;
    return 'play';
  }
  if (name === 'serve') {
    game.chef.x = 850;
    game.chef.y = 690;
    takePlate(game.chef, ['bun', 'patty', 'cheese']);
    game.kitchen.burners = [{ id: 'patty', progress: 1, state: 'done', doneIn: 0.5 }, null];
    spawnOrder(game.board, 2, now);
    spawnOrder(game.board, 2, now);
    setRecipes(game.board, [0, 2]);
    game.board.orders[0].timeLeft = 22;
    game.board.orders[1].timeLeft = 41;
    game.score = 480;
    game.board.combo = 3;
    game.board.comboLeft = 10;
    game.board.served = 4;
    game.lastServe = { points: 180, combo: 3, name: 'Classic Burger', at: 0 };
    game.shiftLeft = 58;
    return 'play';
  }
  // kitchen (cover): a busy mid-shift kitchen, chef at the stove with a patty.
  game.chef.x = 710;
  game.chef.y = 360;
  takeItem(game.chef, 'patty', 'raw');
  game.kitchen.board = { id: 'tomato', progress: 0.4, done: false };
  game.kitchen.burners = [
    { id: 'patty', progress: 0.55, state: 'cooking', doneIn: 0 },
    { id: 'patty', progress: 1, state: 'done', doneIn: 1.5 },
  ];
  game.kitchen.plate = ['bun', 'cheese'];
  spawnOrder(game.board, 2, now);
  spawnOrder(game.board, 2, now);
  spawnOrder(game.board, 2, now);
  setRecipes(game.board, [0, 1, 3]);
  game.board.orders[0].timeLeft = 42;
  game.board.orders[1].timeLeft = 26;
  game.board.orders[2].timeLeft = 12;
  game.score = 340;
  game.board.combo = 2;
  game.board.comboLeft = 6;
  game.board.served = 3;
  return 'play';
}
