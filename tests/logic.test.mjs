import test from "node:test";
import assert from "node:assert/strict";
import { Minesweeper, ROWS, COLS, MINES, TOTAL } from "../logic.mjs";

const make = () => new Minesweeper({ random: () => 0.375 });

test("medium board is always 16x16 with 40 mines and a fresh state", () => {
  const g = make();
  assert.equal(ROWS, 16);
  assert.equal(COLS, 16);
  assert.equal(MINES, 40);
  assert.equal(g.cells.length, TOTAL);
  assert.equal(g.status, "ready");
  assert.equal(g.cells.filter(c => c.mine).length, 0);
});

test("first reveal starts game, places exactly 40 mines, protects the 3x3 area", () => {
  for (const first of [0, 15, 119, 136, 240, 255]) {
    const g = make();
    assert.equal(g.reveal(first), true);
    assert.equal(g.status, "playing");
    assert.equal(g.cells.filter(c => c.mine).length, MINES);
    for (const i of [first, ...g.neighbors(first)]) {
      assert.equal(g.cells[i].mine, false, "first click safe zone");
    }
    assert.equal(g.cells[first].revealed, true);
    assert.equal(g.cells[first].adjacent, 0);
  }
});

test("adjacent numbers are the exact number of neighboring mines", () => {
  const g = make();
  g.reveal(100);
  for (let i = 0; i < TOTAL; i++) {
    if (!g.cells[i].mine) {
      assert.equal(g.cells[i].adjacent, g.neighbors(i).filter(n => g.cells[n].mine).length);
    }
  }
});

test("flags cannot reveal, exceed 40 or be placed on open cells", () => {
  const g = make();
  assert.equal(g.toggleFlag(0), true);
  assert.equal(g.reveal(0), false);
  assert.equal(g.started, false);
  assert.equal(g.toggleFlag(0), true);
  assert.equal(g.flagsCount, 0);
  g.reveal(0);
  assert.equal(g.toggleFlag(0), false);
  const covered = g.cells.map((c, i) => !c.revealed ? i : -1).filter(i => i >= 0);
  for (const i of covered.slice(0, MINES)) assert.equal(g.toggleFlag(i), true);
  assert.equal(g.flagsCount, MINES);
  assert.equal(g.toggleFlag(covered[MINES]), false);
  assert.equal(g.flagsCount, MINES);
  assert.equal(g.toggleFlag(covered[0]), true);
  assert.equal(g.flagsCount, MINES - 1);
});

test("revealing a mine loses and disallows further moves", () => {
  const g = make();
  g.reveal(0);
  const mine = g.cells.findIndex(c => c.mine);
  assert.equal(g.reveal(mine), true);
  assert.equal(g.status, "lost");
  assert.equal(g.explodedIndex, mine);
  assert.equal(g.reveal(255), false);
  assert.equal(g.toggleFlag(255), false);
});

test("clearing every safe square wins and automatically flags all mines", () => {
  const g = make();
  g.reveal(0);
  for (let i = 0; i < TOTAL && g.status === "playing"; i++) {
    if (!g.cells[i].mine) g.reveal(i);
  }
  assert.equal(g.status, "won");
  assert.equal(g.revealedCount, TOTAL - MINES);
  assert.equal(g.flagsCount, MINES);
  assert.equal(g.cells.filter(c => c.mine && c.flagged).length, MINES);
  assert.equal(g.toggleFlag(0), false);
});

test("reset removes old mines and game state", () => {
  const g = make();
  g.reveal(0);
  g.reset();
  assert.equal(g.status, "ready");
  assert.equal(g.started, false);
  assert.equal(g.flagsCount, 0);
  assert.equal(g.revealedCount, 0);
  assert.equal(g.cells.filter(c => c.mine || c.revealed || c.flagged).length, 0);
});

test("input outside the board is safely ignored", () => {
  const g = make();
  assert.equal(g.reveal(-1), false);
  assert.equal(g.toggleFlag(TOTAL), false);
  assert.deepEqual(g.neighbors(-1), []);
  assert.equal(g.status, "ready");
});
