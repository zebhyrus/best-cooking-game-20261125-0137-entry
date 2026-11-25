// Sizzle Rush render: every picture in the game is drawn here with canvas
// shapes, so the game needs no image files. One draw() paints the HUD, the
// order board, every station, the chef and the current screen overlay.
import { VIEW_W, VIEW_H, STATIONS, INGREDIENTS, INGREDIENT_IDS, SHIFT_SECONDS, TARGET_SCORE, MAX_FAILS, stationCenter } from './data.js';
import { CHEF_RADIUS, nearestStation } from './chef.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawIngredientIcon(ctx, id, x, y, r, state) {
  const ing = INGREDIENTS[id];
  ctx.save();
  ctx.translate(x, y);
  if (state === 'burnt') {
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-r * 0.4, -r * 0.3); ctx.quadraticCurveTo(0, -r * 0.9, r * 0.4, -r * 0.3); ctx.stroke();
    ctx.restore();
    return;
  }
  if (id === 'bun') {
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.arc(0, r * 0.15, r, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.fillRect(-r, r * 0.1, r * 2, r * 0.28);
    ctx.fillStyle = '#fff3c4';
    for (const [sx, sy] of [[-0.45, -0.45], [0.1, -0.65], [0.5, -0.35]]) {
      ctx.beginPath(); ctx.ellipse(sx * r, sy * r, r * 0.12, r * 0.08, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'patty') {
    ctx.fillStyle = state === 'cooked' ? '#6d3a1f' : ing.color;
    rr(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.5); ctx.fill();
    ctx.fillStyle = state === 'cooked' ? '#8a4b2d' : '#a86a42';
    for (const [sx, sy] of [[-0.5, -0.2], [0.3, 0.15], [-0.1, 0.3]]) {
      ctx.beginPath(); ctx.arc(sx * r, sy * r, r * 0.14, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'cheese') {
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.moveTo(-r, r * 0.6); ctx.lineTo(r, r * 0.6); ctx.lineTo(0, -r * 0.8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = ing.dark;
    for (const [sx, sy] of [[-0.3, 0.25], [0.25, 0.3], [0, -0.1]]) {
      ctx.beginPath(); ctx.arc(sx * r, sy * r, r * 0.12, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'tomato') {
    if (state === 'chopped') {
      ctx.fillStyle = ing.color;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath(); ctx.arc(i * r * 0.62, (i % 2) * r * 0.25, r * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff8a80';
        ctx.beginPath(); ctx.arc(i * r * 0.62, (i % 2) * r * 0.25, r * 0.26, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = ing.color;
      }
    } else {
      ctx.fillStyle = ing.color;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2e7d32';
      ctx.beginPath(); ctx.ellipse(0, -r * 0.85, r * 0.35, r * 0.18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.25, r * 0.15, -0.6, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = ing.color;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath(); ctx.ellipse((i - 1) * r * 0.55, 0, r * 0.55, r * 0.75, (i - 1) * 0.35, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = ing.dark; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -r * 0.6); ctx.lineTo(0, r * 0.6); ctx.stroke();
  }
  ctx.restore();
}

function drawTicket(ctx, order, x, y, w, h, now) {
  const frac = Math.max(0, order.timeLeft / order.timeTotal);
  const urgent = order.timeLeft < 8;
  // Urgent tickets pulse so a dying order is impossible to miss.
  const pulse = urgent ? 0.75 + 0.25 * Math.sin(now * 6) : 1;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = urgent ? '#fff1f1' : '#fffdf5';
  ctx.strokeStyle = urgent ? '#e5484d' : '#c9a86a';
  ctx.lineWidth = urgent ? 3 : 2;
  rr(ctx, x, y, w, h, 10); ctx.fill(); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#333';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(order.recipe.name, x + 10, y + 22);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#777';
  ctx.fillText(`#${order.id}`, x + 10, y + 40);
  let ix = x + 12;
  for (const id of order.recipe.items) {
    drawIngredientIcon(ctx, id, ix + 11, y + 50, 10, 'raw');
    ix += 28;
  }
  ctx.fillStyle = '#e8e0cc';
  rr(ctx, x + 10, y + h - 12, w - 20, 7, 3); ctx.fill();
  ctx.fillStyle = urgent ? '#e5484d' : '#4caf50';
  rr(ctx, x + 10, y + h - 12, (w - 20) * frac, 7, 3); ctx.fill();
  ctx.fillStyle = urgent ? '#e5484d' : '#333';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.ceil(order.timeLeft)}s`, x + w - 10, y + 24);
  ctx.restore();
}

function drawChef(ctx, chef, now) {
  const bob = chef.moving ? Math.sin(chef.walkPhase) * 3 : 0;
  ctx.save();
  ctx.translate(chef.x, chef.y + bob);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(0, 26, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f5f0e6';
  rr(ctx, -24, -8, 48, 44, 12); ctx.fill();
  ctx.fillStyle = '#e5484d';
  ctx.fillRect(-24, 18, 48, 6);
  ctx.fillStyle = '#ffdbac';
  ctx.beginPath(); ctx.arc(0, -20, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-8, -38, 11, 0, Math.PI * 2); ctx.arc(8, -38, 11, 0, Math.PI * 2); ctx.arc(0, -42, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#333';
  ctx.beginPath(); ctx.arc(-5 + chef.dir * 3, -20, 2, 0, Math.PI * 2); ctx.arc(5 + chef.dir * 3, -20, 2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(chef.dir * 3, -15, 5, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.restore();
  if (chef.hands) {
    ctx.save();
    ctx.translate(chef.x, chef.y - 62 + bob);
    if (chef.hands.kind === 'plate') {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(0, 0, 34, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c9a86a'; ctx.lineWidth = 2; ctx.stroke();
      let ix = -24;
      for (const id of chef.hands.items) { drawIngredientIcon(ctx, id, ix + 10, -4, 10, 'raw'); ix += 20; }
    } else {
      drawIngredientIcon(ctx, chef.hands.id, 0, 0, 18, chef.hands.state);
      ctx.fillStyle = '#333'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      const label = chef.hands.state === 'raw' ? INGREDIENTS[chef.hands.id].name : `${INGREDIENTS[chef.hands.id].name} (${chef.hands.state})`;
      ctx.fillText(label, 0, 32);
    }
    ctx.restore();
  }
}

function drawStation(ctx, station, game, now) {
  const { kitchen } = game;
  ctx.save();
  // Soft drop shadow so counters sit on the floor instead of floating on it.
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  rr(ctx, station.x + 3, station.y + 6, station.w, station.h, 12); ctx.fill();
  ctx.fillStyle = '#8d6e63';
  rr(ctx, station.x, station.y, station.w, station.h, 12); ctx.fill();
  ctx.fillStyle = '#a1887f';
  rr(ctx, station.x + 4, station.y + 4, station.w - 8, 18, 8); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(station.label, station.x + station.w / 2, station.y + 18);
  const cx = station.x + station.w / 2;
  const cy = station.y + station.h / 2 + 12;
  if (station.kind === 'crate') {
    drawIngredientIcon(ctx, station.id, cx, cy, 24, 'raw');
  } else if (station.kind === 'board') {
    ctx.fillStyle = '#d7a86a';
    rr(ctx, station.x + 30, station.y + 34, station.w - 60, 62, 8); ctx.fill();
    ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 2;
    ctx.stroke();
    if (kitchen.board) {
      drawIngredientIcon(ctx, kitchen.board.id, cx, cy, 20, kitchen.board.done ? 'chopped' : 'raw');
      ctx.fillStyle = '#e8e0cc';
      rr(ctx, station.x + 40, station.y + station.h - 18, station.w - 80, 8, 4); ctx.fill();
      ctx.fillStyle = kitchen.board.done ? '#4caf50' : '#ff9800';
      rr(ctx, station.x + 40, station.y + station.h - 18, (station.w - 80) * Math.min(1, kitchen.board.progress), 8, 4); ctx.fill();
    } else {
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif';
      ctx.fillText('E to chop', cx, cy + 4);
    }
  } else if (station.kind === 'stove') {
    for (let i = 0; i < 2; i += 1) {
      const bx = station.x + 62 + i * 150;
      const by = cy;
      ctx.fillStyle = '#37474f';
      ctx.beginPath(); ctx.arc(bx, by, 44, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(bx, by, 36, 0, Math.PI * 2); ctx.stroke();
      const burner = kitchen.burners[i];
      if (burner) {
        // Flickering flame ring while a patty cooks, and rising steam once
        // it is done or cooking — the stove reads as hot at a glance.
        if (burner.state === 'cooking') {
          const flick = 0.75 + 0.25 * Math.sin(now * 9 + i * 2.4);
          ctx.fillStyle = `rgba(255,${Math.round(120 + 60 * flick)},0,${0.5 * flick})`;
          ctx.beginPath(); ctx.arc(bx, by, 50 * flick, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,213,79,0.55)';
          ctx.beginPath(); ctx.arc(bx, by, 40 * flick, 0, Math.PI * 2); ctx.fill();
        }
        if (burner.state !== 'burnt') {
          for (let s = 0; s < 3; s += 1) {
            const phase = ((now * 0.45 + s / 3 + i * 0.31) % 1);
            const sx = bx + Math.sin(now * 2 + s * 2.1 + i) * 8 * phase;
            const sy = by - 18 - phase * 46;
            ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - phase)})`;
            ctx.beginPath(); ctx.arc(sx, sy, 5 + phase * 9, 0, Math.PI * 2); ctx.fill();
          }
        }
        drawIngredientIcon(ctx, burner.id, bx, by, 22, burner.state === 'burnt' ? 'burnt' : burner.state);
        const frac = burner.state === 'cooking' ? burner.progress : burner.state === 'done' ? 1 - burner.doneIn / 4 : 1;
        ctx.strokeStyle = burner.state === 'burnt' ? '#e5484d' : burner.state === 'done' ? '#4caf50' : '#ff9800';
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(bx, by, 48, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, frac))); ctx.stroke();
        if (burner.state === 'done') {
          ctx.fillStyle = '#4caf50';
          ctx.beginPath(); ctx.arc(bx + 34, by - 34, 11, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif';
          ctx.fillText('✓', bx + 34, by - 30);
        } else if (burner.state === 'burnt') {
          ctx.fillStyle = '#e5484d';
          ctx.beginPath(); ctx.arc(bx + 34, by - 34, 11, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif';
          ctx.fillText('✕', bx + 34, by - 30);
        }
      } else {
        ctx.fillStyle = '#90a4ae'; ctx.font = 'bold 12px sans-serif';
        ctx.fillText('FREE', bx, by + 4);
      }
    }
  } else if (station.kind === 'trash') {
    ctx.fillStyle = '#546e7a';
    rr(ctx, cx - 28, cy - 26, 56, 52, 8); ctx.fill();
    ctx.fillStyle = '#37474f';
    ctx.fillRect(cx - 32, cy - 32, 64, 8);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif';
    ctx.fillText('×', cx, cy + 8);
  } else if (station.kind === 'plate') {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(cx, cy, 110, 34, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c9a86a'; ctx.lineWidth = 3; ctx.stroke();
    let ix = cx - 90;
    for (const id of kitchen.plate) { drawIngredientIcon(ctx, id, ix + 18, cy - 6, 16, 'raw'); ix += 42; }
    if (kitchen.plate.length === 0) {
      ctx.fillStyle = '#999'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('Build the dish here — E to add', cx, cy + 4);
    }
  } else if (station.kind === 'hatch') {
    ctx.fillStyle = '#ffe082';
    rr(ctx, station.x + 16, station.y + 30, station.w - 32, station.h - 46, 10); ctx.fill();
    ctx.fillStyle = '#f9a825';
    ctx.beginPath(); ctx.arc(cx, cy - 6, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif';
    ctx.fillText('DING!', cx, cy - 2);
    ctx.fillStyle = '#5d4037'; ctx.font = 'bold 13px sans-serif';
    ctx.fillText('Press E with a finished plate', cx, station.y + station.h - 30);
  }
  ctx.restore();
}

export function drawGame(ctx, game, screen, now) {
  const { chef, kitchen, board, score, level } = game;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#f3e5c8';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#e8d5ae';
  for (let y = 180; y < VIEW_H; y += 64) {
    for (let x = ((y / 64) % 2) * 32; x < VIEW_W; x += 64) {
      ctx.fillRect(x, y, 30, 30);
    }
  }
  // HUD
  ctx.fillStyle = '#3e2723';
  ctx.fillRect(0, 0, VIEW_W, 64);
  ctx.fillStyle = '#ffd54f';
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🍳 SIZZLE RUSH', 20, 42);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`SCORE ${score}`, 320, 42);
  // Score progress toward the target — the win condition is always visible.
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(320, 50, 140, 6);
  ctx.fillStyle = '#ffd54f';
  ctx.fillRect(320, 50, 140 * Math.min(1, score / TARGET_SCORE), 6);
  ctx.fillStyle = '#ffd54f';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(`TARGET ${TARGET_SCORE}`, 480, 40);
  ctx.fillStyle = board.combo > 1 ? '#ff7043' : '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(board.combo > 1 ? `COMBO x${board.combo}` : 'COMBO x1', 640, 42);
  if (board.combo > 1 && board.comboLeft > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(640, 50, 90, 6);
    ctx.fillStyle = '#ff7043';
    ctx.fillRect(640, 50, 90 * Math.max(0, board.comboLeft / 12), 6);
  }
  const shiftLeft = Math.max(0, game.shiftLeft);
  ctx.fillStyle = shiftLeft < 30 ? '#ff8a80' : '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'right';
  ctx.fillText(`TIME ${Math.floor(shiftLeft / 60)}:${String(Math.floor(shiftLeft % 60)).padStart(2, '0')}`, 1010, 42);
  ctx.fillStyle = '#e5484d';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`✖ ${'●'.repeat(MAX_FAILS - game.fails)}${'○'.repeat(game.fails)}`, 1180, 42);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#4caf50';
  ctx.fillRect(760, 50, 200 * (shiftLeft / SHIFT_SECONDS), 6);
  // Order board
  ctx.fillStyle = '#5d4037';
  rr(ctx, 16, 72, VIEW_W - 32, 108, 12); ctx.fill();
  ctx.fillStyle = '#ffd54f';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('ORDER BOARD', 30, 96);
  ctx.fillStyle = '#fff';
  ctx.font = '13px sans-serif';
  ctx.fillText('Serve the exact recipe before its timer runs out — 3 late orders ends the shift!', 160, 96);
  if (board.orders.length === 0) {
    ctx.fillStyle = '#d7ccc8'; ctx.font = 'bold 16px sans-serif';
    ctx.fillText('No orders yet — grab ingredients and get ready...', 30, 150);
  }
  board.orders.forEach((order, i) => {
    drawTicket(ctx, order, 30 + i * 300, 106, 280, 66, now);
  });
  // Stations, then chef on top. The station the chef can use right now gets
  // a golden glow and an E key badge, so the controls teach themselves.
  for (const station of STATIONS) drawStation(ctx, station, game, now);
  if (screen === 'play') {
    const near = nearestStation(chef, STATIONS);
    if (near) {
      ctx.save();
      ctx.strokeStyle = '#ffd54f';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ffd54f';
      ctx.shadowBlur = 14;
      rr(ctx, near.x - 3, near.y - 3, near.w + 6, near.h + 6, 14); ctx.stroke();
      ctx.shadowBlur = 0;
      // The E key floats above the chef, never colliding with a station label.
      const bx = chef.x;
      const by = chef.y - 84;
      ctx.fillStyle = '#ffd54f';
      ctx.beginPath(); ctx.arc(bx, by, 14, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#3e2723'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('E', bx, by + 6);
      ctx.restore();
    }
  }
  drawChef(ctx, chef, now);
  // Flash + serve popup
  if (kitchen.flash && now - kitchen.flashAt < 2.5) {
    ctx.font = 'bold 15px sans-serif';
    const w = ctx.measureText(kitchen.flash).width + 30;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    rr(ctx, VIEW_W / 2 - w / 2, 726, w, 30, 15); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText(kitchen.flash, VIEW_W / 2, 746);
    ctx.textAlign = 'left';
  }
  if (game.lastServe && now - game.lastServe.at < 2) {
    const age = now - game.lastServe.at;
    const pop = age < 0.25 ? 1 + 0.35 * (1 - age / 0.25) : 1;
    ctx.save();
    ctx.translate(VIEW_W / 2, 470);
    ctx.scale(pop, pop);
    // Dark pill behind the popup so it reads over any station.
    ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center';
    const msg = `+${game.lastServe.points}  ${game.lastServe.name} served!  COMBO x${game.lastServe.combo}`;
    const mw = ctx.measureText(msg).width + 44;
    ctx.fillStyle = 'rgba(20,12,8,0.78)';
    rr(ctx, -mw / 2, -34, mw, 46, 23); ctx.fill();
    ctx.fillStyle = '#8dff6e';
    ctx.fillText(msg, 0, 0);
    ctx.restore();
    ctx.textAlign = 'left';
  }
  // Controls hint lives in the page HTML below the canvas, not drawn here,
  // so it never collides with the flash message or the canvas edge.
  if (screen === 'title') drawOverlay(ctx, 'SIZZLE RUSH', 'The dinner rush is on! Take orders, chop, grill, plate and serve before the timer runs out.', 'Press ENTER or click to start  •  Reach 600 points before the shift ends', '#3e2723');
  if (screen === 'paused') drawOverlay(ctx, 'PAUSED', 'Take a breath, chef.', 'Press P or ENTER to keep cooking', '#3e2723');
  if (screen === 'win') drawOverlay(ctx, 'SHIFT COMPLETE!', `You served ${board.served} dishes and scored ${score} — the crowd goes wild!`, 'Press ENTER to play again', '#2e7d32');
  if (screen === 'over') drawOverlay(ctx, 'SHIFT OVER', game.fails >= MAX_FAILS ? `${game.fails} orders went late — the kitchen closes early.` : `Time ran out at ${score} points (target ${TARGET_SCORE}).`, 'Press ENTER to try again', '#b71c1c');
}

function drawOverlay(ctx, title, line1, line2, color) {
  ctx.fillStyle = 'rgba(20,12,8,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#fffdf5';
  rr(ctx, VIEW_W / 2 - 380, 220, 760, 330, 20); ctx.fill();
  ctx.fillStyle = color;
  ctx.font = 'bold 52px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(title, VIEW_W / 2, 310);
  ctx.fillStyle = '#444'; ctx.font = '20px sans-serif';
  wrapText(ctx, line1, VIEW_W / 2, 360, 680, 28);
  ctx.fillStyle = '#e5484d'; ctx.font = 'bold 20px sans-serif';
  ctx.fillText(line2, VIEW_W / 2, 500);
  ctx.textAlign = 'left';
}

function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lh;
    } else line = test;
  }
  ctx.fillText(line, x, yy);
}
