// Medium is the only difficulty. Keeping the rules separate makes them easy to test.
export const ROWS = 16;
export const COLS = 16;
export const MINES = 40;
export const TOTAL = ROWS * COLS;

export class Minesweeper {
  constructor({ random = Math.random } = {}) {
    this.random = random;
    this.reset();
  }

  reset() {
    this.cells = Array.from({ length: TOTAL }, () => ({
      mine: false, adjacent: 0, revealed: false, flagged: false
    }));
    this.started = false;
    this.status = "ready";
    this.flagsCount = 0;
    this.revealedCount = 0;
    this.explodedIndex = null;
  }

  valid(index) { return Number.isInteger(index) && index >= 0 && index < TOTAL; }

  neighbors(index) {
    if (!this.valid(index)) return [];
    const row = Math.floor(index / COLS);
    const col = index % COLS;
    const found = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const r = row + dy;
        const c = col + dx;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) found.push(r * COLS + c);
      }
    }
    return found;
  }

  placeMines(firstIndex) {
    // The entire 3×3 region around the first reveal is safe.
    const excluded = new Set([firstIndex, ...this.neighbors(firstIndex)]);
    const available = Array.from({ length: TOTAL }, (_, i) => i)
      .filter(i => !excluded.has(i));
    for (let i = 0; i < MINES; i++) {
      const j = i + Math.floor(this.random() * (available.length - i));
      [available[i], available[j]] = [available[j], available[i]];
      this.cells[available[i]].mine = true;
    }
    for (let i = 0; i < TOTAL; i++) {
      if (!this.cells[i].mine) {
        this.cells[i].adjacent = this.neighbors(i)
          .filter(n => this.cells[n].mine).length;
      }
    }
  }

  toggleFlag(index) {
    if (!this.valid(index) || this.status === "won" || this.status === "lost") return false;
    const cell = this.cells[index];
    if (cell.revealed || (!cell.flagged && this.flagsCount >= MINES)) return false;
    cell.flagged = !cell.flagged;
    this.flagsCount += cell.flagged ? 1 : -1;
    return true;
  }

  reveal(index) {
    if (!this.valid(index) || this.status === "won" || this.status === "lost") return false;
    const cell = this.cells[index];
    if (cell.flagged) return false;

    if (cell.revealed) {
      // Chord: clicking a revealed number opens its unflagged neighbours if
      // exactly that many neighbours are flagged. Wrong flags can cause a loss.
      if (cell.adjacent === 0) return false;
      const around = this.neighbors(index);
      if (around.filter(n => this.cells[n].flagged).length !== cell.adjacent) return false;
      this.expand(around);
    } else {
      if (!this.started) {
        this.placeMines(index);
        this.started = true;
        this.status = "playing";
      }
      this.expand([index]);
    }

    if (this.status === "playing" && this.revealedCount === TOTAL - MINES) {
      this.status = "won";
      for (const mine of this.cells) {
        if (mine.mine) mine.flagged = true;
      }
      this.flagsCount = MINES;
    }
    return true;
  }

  expand(start) {
    const queue = [...start];
    for (let head = 0; head < queue.length; head++) {
      const index = queue[head];
      const cell = this.cells[index];
      if (cell.revealed || cell.flagged) continue;
      cell.revealed = true;
      if (cell.mine) {
        this.explodedIndex = index;
        this.status = "lost";
        return;
      }
      this.revealedCount++;
      if (cell.adjacent === 0) queue.push(...this.neighbors(index));
    }
  }
}
