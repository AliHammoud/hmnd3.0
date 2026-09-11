/**
 * Nucleotide Game-of-Life — pure state simulation.
 * No rendering, no DOM, no timers. Caller owns those.
 */
(function (global) {
  "use strict";

  const BASE_POOL = ["A", "T", "C", "G"];
  const RARE_POOL = ["R", "Y", "S", "W", "K", "M", "B", "D", "H", "V", "N"];
  const HMND = ["H", "M", "N", "D"];

  const DEFAULTS = {
    seedRate: 0.05,
    rareChance: 0.05,
    maxLocked: 1,
    lockDuration: 40,
    biasRadius: 4.5,
    biasPeak: 0.15,
    biasLineBoost: 1.5,
  };

  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function cellKey(col, row) {
    return col + "," + row;
  }

  function createNucleotideLife(rows, cols, options) {
    const opts = Object.assign({}, DEFAULTS, options || {});
    const grid = [];
    /** @type {{row:number,col:number,remaining:number}[]} */
    let locks = [];
    /** @type {Map<string, number>} */
    let spawnBoost = new Map();

    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push({ alive: false, char: null, locked: false });
      }
      grid.push(row);
    }

    // Sparse random seed
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() < opts.seedRate) {
          grid[r][c].alive = true;
          grid[r][c].char = pick(BASE_POOL);
        }
      }
    }

    function countAliveNeighbors(r, c) {
      let n = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const rr = r + dr;
          const cc = c + dc;
          if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
          if (grid[rr][cc].alive) n++;
        }
      }
      return n;
    }

    function collectNeighborChars(r, c) {
      const chars = [];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const rr = r + dr;
          const cc = c + dc;
          if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
          const cell = grid[rr][cc];
          if (cell.alive && cell.char) chars.push(cell.char);
        }
      }
      return chars;
    }

    function birthChar(r, c) {
      if (Math.random() < opts.rareChance) return pick(RARE_POOL);
      const neighborChars = collectNeighborChars(r, c);
      if (neighborChars.length) return pick(neighborChars);
      return pick(BASE_POOL);
    }

    function countHorizontalAliveNeighbors(r, c) {
      let n = 0;
      if (c > 0 && grid[r][c - 1].alive) n++;
      if (c < cols - 1 && grid[r][c + 1].alive) n++;
      return n;
    }

    function releaseLock(lock) {
      for (let i = 0; i < 4; i++) {
        const cell = grid[lock.row][lock.col + i];
        cell.locked = false;
        cell.alive = true;
        cell.char = pick(BASE_POOL);
      }
    }

    function releaseLocksOverlapping(col, row) {
      const radius = opts.biasRadius;
      const remaining = [];
      for (let i = 0; i < locks.length; i++) {
        const lock = locks[i];
        let hit = false;
        for (let k = 0; k < 4; k++) {
          const dc = lock.col + k - col;
          const dr = lock.row - row;
          if (Math.sqrt(dc * dc + dr * dr) <= radius) {
            hit = true;
            break;
          }
        }
        if (hit) releaseLock(lock);
        else remaining.push(lock);
      }
      locks = remaining;
    }

    function captureHMND() {
      if (locks.length >= opts.maxLocked) return;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c <= cols - 4; c++) {
          let ok = true;
          for (let k = 0; k < 4; k++) {
            const cell = grid[r][c + k];
            if (!cell.alive || cell.locked) {
              ok = false;
              break;
            }
          }
          if (!ok) continue;

          for (let k = 0; k < 4; k++) {
            const cell = grid[r][c + k];
            cell.alive = true;
            cell.locked = true;
            cell.char = HMND[k];
          }
          locks.push({ row: r, col: c, remaining: opts.lockDuration });
          return;
        }
      }
    }

    function tickLockTimers() {
      const remaining = [];
      for (let i = 0; i < locks.length; i++) {
        const lock = locks[i];
        lock.remaining -= 1;
        if (lock.remaining <= 0) releaseLock(lock);
        else remaining.push(lock);
      }
      locks = remaining;
    }

    function tick() {
      // Decrement lock timers first so a just-released block can be re-evaluated
      tickLockTimers();

      const next = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
          const cur = grid[r][c];

          if (cur.locked) {
            row.push({ alive: true, char: cur.char, locked: true });
            continue;
          }

          const neighbors = countAliveNeighbors(r, c);
          let alive = false;

          if (cur.alive) {
            alive = neighbors === 2 || neighbors === 3;
          } else {
            const boost = spawnBoost.get(cellKey(c, r));
            const boostBirth = typeof boost === "number" && Math.random() < boost;
            alive = neighbors === 3 || boostBirth;
          }

          if (alive) {
            if (cur.alive) {
              row.push({ alive: true, char: cur.char, locked: false });
            } else {
              row.push({ alive: true, char: birthChar(r, c), locked: false });
            }
          } else {
            row.push({ alive: false, char: null, locked: false });
          }
        }
        next.push(row);
      }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          grid[r][c] = next[r][c];
        }
      }

      // Re-mark locked cells from lock registry (defensive after copy)
      for (let i = 0; i < locks.length; i++) {
        const lock = locks[i];
        for (let k = 0; k < 4; k++) {
          const cell = grid[lock.row][lock.col + k];
          cell.alive = true;
          cell.locked = true;
          cell.char = HMND[k];
        }
      }

      spawnBoost = new Map();
      captureHMND();
    }

    function applyCursorBias(col, row) {
      col = Math.round(col);
      row = Math.round(row);
      releaseLocksOverlapping(col, row);

      const nextBoost = new Map();
      const radius = opts.biasRadius;
      const peak = opts.biasPeak;
      const r0 = Math.max(0, Math.floor(row - radius));
      const r1 = Math.min(rows - 1, Math.ceil(row + radius));
      const c0 = Math.max(0, Math.floor(col - radius));
      const c1 = Math.min(cols - 1, Math.ceil(col + radius));

      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          if (grid[r][c].alive) continue;
          const dc = c - col;
          const dr = r - row;
          const dist = Math.sqrt(dc * dc + dr * dr);
          if (dist > radius) continue;
          let p = peak * (1 - dist / radius);
          const horiz = countHorizontalAliveNeighbors(r, c);
          if (horiz === 1 || horiz === 2) p *= opts.biasLineBoost;
          if (p > 0) nextBoost.set(cellKey(c, r), Math.min(1, p));
        }
      }
      spawnBoost = nextBoost;
    }

    function clearCursorBias() {
      spawnBoost = new Map();
    }

    function getState() {
      const out = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c];
          row.push({ alive: cell.alive, char: cell.char, locked: cell.locked });
        }
        out.push(row);
      }
      return out;
    }

    return {
      tick: tick,
      applyCursorBias: applyCursorBias,
      clearCursorBias: clearCursorBias,
      getState: getState,
      rows: rows,
      cols: cols,
    };
  }

  global.createNucleotideLife = createNucleotideLife;
})(typeof globalThis !== "undefined" ? globalThis : window);
