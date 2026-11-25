// Sizzle Rush kitchen: what happens at each station. Chopping takes time on
// the board, patties cook on the stove burners and burn if left too long, the
// plating counter builds one dish, and the hatch serves a finished plate.
import { STATIONS, INGREDIENTS, CHOP_SECONDS, COOK_SECONDS, BURN_AFTER_SECONDS } from './data.js';
import { servePlate } from './orders.js';
import { chefHasItem, chefHasPlate, chefHandsEmpty, takeItem, takePlate, dropHands, nearestStation } from './chef.js';

export function createKitchen() {
  return {
    board: null, // { id, progress } while chopping
    burners: [null, null], // { id, progress, state:'cooking'|'done'|'burnt', doneIn }
    plate: [], // ingredient ids on the plating counter
    plateReady: false,
    flash: '', // short message shown over the kitchen
    flashAt: 0,
  };
}

export function setFlash(kitchen, text, now) {
  kitchen.flash = text;
  kitchen.flashAt = now;
}

// Advance chopping and cooking. Returns event strings for sounds.
export function updateKitchen(kitchen, dt, audio) {
  const events = [];
  if (kitchen.board) {
    kitchen.board.progress += dt / CHOP_SECONDS;
    if (kitchen.board.progress >= 1 && !kitchen.board.done) {
      kitchen.board.done = true;
      events.push('chopped');
    }
  }
  let anyCooking = false;
  for (const burner of kitchen.burners) {
    if (!burner) continue;
    if (burner.state === 'cooking') {
      anyCooking = true;
      burner.progress += dt / COOK_SECONDS;
      if (burner.progress >= 1) { burner.state = 'done'; burner.doneIn = 0; events.push('cooked'); }
    } else if (burner.state === 'done') {
      burner.doneIn += dt;
      if (burner.doneIn >= BURN_AFTER_SECONDS) {
        burner.state = 'burnt';
        events.push('burnt');
        if (audio) audio.burn();
      }
    }
  }
  if (audio) {
    if (anyCooking) audio.sizzleStart();
    else audio.sizzleStop();
  }
  return events;
}

// The one interact key (E / click on a station). Returns an event string.
export function tryInteract(game, now) {
  const { chef, kitchen, board, audio } = game;
  const station = nearestStation(chef, STATIONS);
  if (!station) { setFlash(kitchen, 'Walk up to a counter first!', now); return 'none'; }
  const held = chef.hands;

  if (station.kind === 'crate') {
    if (!chefHandsEmpty(chef)) { setFlash(kitchen, 'Hands full! Serve or trash it first.', now); return 'none'; }
    if (kitchen.board) { setFlash(kitchen, 'Finish chopping first!', now); return 'none'; }
    takeItem(chef, station.id, 'raw');
    if (audio) audio.pickup();
    return 'pickup';
  }

  if (station.kind === 'board') {
    if (kitchen.board && kitchen.board.done && chefHandsEmpty(chef)) {
      takeItem(chef, kitchen.board.id, 'chopped');
      kitchen.board = null;
      if (audio) audio.pickup();
      return 'pickup-chopped';
    }
    if (kitchen.board) { setFlash(kitchen, 'Still chopping...', now); return 'none'; }
    if (!chefHasItem(chef)) { setFlash(kitchen, 'Bring something to chop: tomato or lettuce.', now); return 'none'; }
    if (INGREDIENTS[held.id].prep !== 'chop' || held.state !== 'raw') {
      setFlash(kitchen, 'Only raw tomato and lettuce need chopping.', now);
      return 'none';
    }
    kitchen.board = { id: held.id, progress: 0 };
    dropHands(chef);
    if (audio) audio.place();
    return 'chop-start';
  }

  if (station.kind === 'stove') {
    if (chefHasItem(chef) && INGREDIENTS[held.id].prep === 'cook' && held.state === 'raw') {
      const slot = kitchen.burners.findIndex((b) => b === null);
      if (slot === -1) { setFlash(kitchen, 'Both burners are busy!', now); return 'none'; }
      kitchen.burners[slot] = { id: held.id, progress: 0, state: 'cooking', doneIn: 0 };
      dropHands(chef);
      if (audio) audio.place();
      return 'cook-start';
    }
    const slot = kitchen.burners.findIndex((b) => b && b.state !== 'cooking');
    if (slot !== -1 && chefHandsEmpty(chef)) {
      const burner = kitchen.burners[slot];
      kitchen.burners[slot] = null;
      takeItem(chef, burner.id, burner.state === 'done' ? 'cooked' : 'burnt');
      if (audio) audio.pickup();
      return burner.state === 'done' ? 'pickup-cooked' : 'pickup-burnt';
    }
    setFlash(kitchen, 'Bring a raw patty to cook, or pick up a finished one.', now);
    return 'none';
  }

  if (station.kind === 'plate') {
    if (chefHasItem(chef)) {
      const { id, state } = held;
      if (!isReadyItem(held)) {
        setFlash(kitchen, INGREDIENTS[id].prep === 'chop' ? 'Chop it first!' : 'Cook it first!', now);
        return 'none';
      }
      kitchen.plate.push(id);
      dropHands(chef);
      if (audio) audio.place();
      return 'plated';
    }
    if (chefHandsEmpty(chef) && kitchen.plate.length > 0) {
      takePlate(chef, kitchen.plate);
      kitchen.plate = [];
      if (audio) audio.pickup();
      return 'pickup-plate';
    }
    setFlash(kitchen, 'Bring a ready ingredient to the plate.', now);
    return 'none';
  }

  if (station.kind === 'hatch') {
    if (!chefHasPlate(chef)) { setFlash(kitchen, 'Carry a finished plate to the hatch.', now); return 'none'; }
    const served = tryServe(game, now);
    return served ? 'served' : 'no-match';
  }

  if (station.kind === 'trash') {
    if (chefHandsEmpty(chef)) { setFlash(kitchen, 'Nothing to throw away.', now); return 'none'; }
    dropHands(chef);
    if (audio) audio.fail();
    return 'trashed';
  }
  return 'none';
}

export function isReadyItem(item) {
  if (!item || item.kind !== 'item') return false;
  const prep = INGREDIENTS[item.id].prep;
  if (prep === 'chop') return item.state === 'chopped';
  if (prep === 'cook') return item.state === 'cooked';
  return item.state === 'raw';
}

// Serve the carried plate at the hatch. Scores when it matches an open order.
export function tryServe(game, now) {
  const { chef, kitchen, board, audio } = game;
  if (!chefHasPlate(chef)) return false;
  const result = servePlate(board, chef.hands.items, now);
  if (!result) {
    setFlash(kitchen, 'No order wants this plate yet!', now);
    if (audio) audio.fail();
    return false;
  }
  dropHands(chef);
  game.score += result.points;
  game.lastServe = { points: result.points, combo: result.combo, name: result.order.recipe.name, at: now };
  if (audio) audio.ding();
  return true;
}

// When chopping finishes, the chopped ingredient lands back in the chef's
// hands if they are free; otherwise it waits on the board as a finished item.
export function finishChop(game) {
  const { chef, kitchen } = game;
  const boardItem = kitchen.board;
  if (!boardItem || !boardItem.done) return;
  if (chefHandsEmpty(chef)) {
    takeItem(chef, boardItem.id, 'chopped');
    kitchen.board = null;
  }
  // Hands full: the chopped pile waits on the board until the chef picks it
  // up with E at the board.
}
