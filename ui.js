const game = new Minesweeper();
const STORAGE_KEY = "minesweeper.medium.best.v1";
const board = document.querySelector("#board");
const tiles = [];
const mineLabel = document.querySelector("#mines-left");
const timerLabel = document.querySelector("#timer");
const bestLabel = document.querySelector("#best");
const flagButton = document.querySelector("#flag-mode");
const flagState = document.querySelector("#flag-mode-state");
let flagMode = false;
let elapsedSeconds = 0;
let startedAt = 0;
let interval = null;
let holdTimer = null;
let ignoreClickIndex = null;
let ignoreClickUntil = 0;

function loadBest() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === null) return null;
    const seconds = Number(value);
    return Number.isSafeInteger(seconds) && seconds >= 0 ? seconds : null;
  } catch { return null; }
}
let best = loadBest();

function formatTime(total) {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
}

function updateClock() {
  if (game.status === "playing") {
    elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
  }
  timerLabel.textContent = formatTime(elapsedSeconds);
}
function startClock() {
  startedAt = Date.now();
  elapsedSeconds = 0;
  clearInterval(interval);
  interval = setInterval(updateClock, 200);
  updateClock();
}
function stopClock() {
  if (startedAt) elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
  timerLabel.textContent = formatTime(elapsedSeconds);
  clearInterval(interval);
  interval = null;
}
function saveBest() {
  if (best !== null && elapsedSeconds >= best) return false;
  best = elapsedSeconds;
  try { localStorage.setItem(STORAGE_KEY, String(best)); } catch { /* storage unavailable */ }
  return true;
}

function createBoard() {
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < game.cells.length; i++) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cell";
    cell.dataset.index = String(i);
    cell.setAttribute("aria-label", "Row " + (Math.floor(i / COLS) + 1) + ", column " + (i % COLS + 1) + ": covered");
    tiles.push(cell);
    fragment.append(cell);
  }
  board.replaceChildren(fragment);
}

function render() {
  mineLabel.textContent = String(MINES - game.flagsCount).padStart(3, "0");
  timerLabel.textContent = formatTime(elapsedSeconds);
  bestLabel.textContent = best === null ? "--:--" : formatTime(best);

  for (let i = 0; i < tiles.length; i++) {
    const button = tiles[i];
    const cell = game.cells[i];
    const lost = game.status === "lost";
    const showMine = cell.mine && (cell.revealed || lost);
    const wrongFlag = lost && cell.flagged && !cell.mine;
    let className = "cell";
    let content = "";
    let detail = "covered";
    if (wrongFlag) {
      className += " wrong"; content = "×"; detail = "incorrect flag";
    } else if (showMine) {
      className += " revealed mine"; content = "✹"; detail = "mine";
      if (i === game.explodedIndex) className += " exploded";
    } else if (cell.flagged) {
      className += " flagged"; content = "⚑"; detail = "flagged";
    } else if (cell.revealed) {
      className += " revealed";
      if (cell.adjacent > 0) {
        className += " numbered n" + cell.adjacent;
        content = String(cell.adjacent);
        detail = cell.adjacent + " neighbouring mines";
      } else {
        detail = "empty";
      }
    }
    button.className = className;
    button.textContent = content;
    button.disabled = game.status === "lost" || game.status === "won";
    button.setAttribute("aria-label",
      "Row " + (Math.floor(i / COLS) + 1) + ", column " + (i % COLS + 1) + ": " + detail);
  }
}

function finishIfNecessary() {
  if (game.status !== "won" && game.status !== "lost") return false;
  stopClock();
  return game.status === "won" && saveBest();
}
function reveal(index) {
  const wasStarted = game.started;
  if (!game.reveal(index)) return;
  if (!wasStarted && game.started) startClock();
  finishIfNecessary();
  render();
}
function toggleFlag(index) {
  if (game.toggleFlag(index)) render();
}
function tileFromEvent(event) {
  const tile = event.target.closest(".cell");
  return tile && board.contains(tile) ? tile : null;
}
function cancelHold() {
  clearTimeout(holdTimer);
  holdTimer = null;
}
board.addEventListener("click", event => {
  const tile = tileFromEvent(event);
  if (!tile) return;
  const index = Number(tile.dataset.index);
  if (ignoreClickIndex === index && performance.now() < ignoreClickUntil) {
    ignoreClickIndex = null;
    return;
  }
  ignoreClickIndex = null;
  if (flagMode) toggleFlag(index);
  else reveal(index);
});
board.addEventListener("contextmenu", event => {
  const tile = tileFromEvent(event);
  if (!tile) return;
  event.preventDefault();
  cancelHold();
  toggleFlag(Number(tile.dataset.index));
});
board.addEventListener("pointerdown", event => {
  if (event.pointerType === "mouse") return;
  const tile = tileFromEvent(event);
  if (!tile) return;
  cancelHold();
  const index = Number(tile.dataset.index);
  holdTimer = setTimeout(() => {
    ignoreClickIndex = index;
    ignoreClickUntil = performance.now() + 750;
    toggleFlag(index);
    holdTimer = null;
  }, 480);
});
board.addEventListener("pointerup", cancelHold);
board.addEventListener("pointercancel", cancelHold);
board.addEventListener("pointerleave", cancelHold);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) updateClock();
});
document.querySelector("#restart").addEventListener("click", () => {
  cancelHold();
  clearInterval(interval);
  interval = null;
  elapsedSeconds = 0;
  ignoreClickIndex = null;
  game.reset();
  render();
});
flagButton.addEventListener("click", () => {
  flagMode = !flagMode;
  flagButton.setAttribute("aria-pressed", String(flagMode));
  flagState.textContent = flagMode ? "ON" : "OFF";
});
createBoard();
render();
