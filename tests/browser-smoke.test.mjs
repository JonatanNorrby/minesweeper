import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

test("deployed script builds the board and a tile click actually reveals it", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const source = await readFile(new URL("../game.js", import.meta.url), "utf8");
  assert.match(html, /<script src="\.\/game\.js\?v=[^"]+" defer><\/script>/);
  assert.doesNotMatch(source, /^\s*import\s/m, "standalone script must not rely on another browser module");
  assert.doesNotMatch(source, /statusTitle|statusDetail|statusSymbol/, "the removed status banner must not be accessed");

  class Element {
    constructor() {
      this.children = [];
      this.listeners = new Map();
      this.dataset = {};
      this.className = "";
      this.textContent = "";
      this.attributes = {};
      this.disabled = false;
    }
    setAttribute(name, value) { this.attributes[name] = value; }
    addEventListener(type, fn) { this.listeners.set(type, fn); }
    append(child) { this.children.push(child); }
    replaceChildren(fragment) { this.children = [...fragment.children]; }
    contains(child) { return this.children.includes(child); }
    closest(selector) { return selector === ".cell" && this.className.split(" ").includes("cell") ? this : null; }
    dispatch(type, event = {}) {
      const listener = this.listeners.get(type);
      assert.ok(listener, "missing event listener for " + type);
      return listener(event);
    }
  }

  const ids = ["#board", "#mines-left", "#timer", "#best", "#flag-mode", "#flag-mode-state", "#restart"];
  const elements = Object.fromEntries(ids.map(id => [id, new Element()]));
  const saved = new Map();
  const document = {
    querySelector(selector) { return elements[selector] ?? null; },
    createElement() { return new Element(); },
    createDocumentFragment() { return new Element(); },
    addEventListener() {},
    hidden: false
  };
  const context = vm.createContext({
    document,
    localStorage: {
      getItem(key) { return saved.get(key) ?? null; },
      setItem(key, value) { saved.set(key, value); }
    },
    setInterval() { return 1; },
    clearInterval() {},
    performance: { now() { return 100; } }
  });
  vm.runInContext(source, context, { filename: "game.js" });
  const board = elements["#board"];
  assert.equal(board.children.length, 256);
  assert.equal(elements["#mines-left"].textContent, "040");
  const first = board.children[0];
  assert.equal(first.className, "cell");
  board.dispatch("click", { target: first });
  assert.equal(vm.runInContext("game.started", context), true);
  assert.ok(board.children.some(tile => tile.className.includes("revealed")), "a clicked tile must visually reveal");
  assert.equal(vm.runInContext("game.cells.filter(c => c.mine).length", context), 40);

  const covered = board.children.find(tile => tile.className === "cell");
  board.dispatch("contextmenu", { target: covered, preventDefault() {} });
  assert.equal(covered.textContent, "⚑");
  assert.equal(elements["#mines-left"].textContent, "039");
  elements["#restart"].dispatch("click");
  assert.equal(vm.runInContext("game.started", context), false);
  assert.equal(board.children.filter(tile => tile.className.includes("revealed")).length, 0);
  assert.equal(elements["#mines-left"].textContent, "040");
});
