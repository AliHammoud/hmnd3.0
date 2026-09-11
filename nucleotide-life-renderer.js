/**
 * Nucleotide Life renderer — state → canvas pixels.
 * No simulation, no timers, no layout ownership.
 */
(function (global) {
  "use strict";

  const BASE = { A: 1, T: 1, C: 1, G: 1 };
  const LOCKED = { H: 1, M: 1, N: 1, D: 1 };

  function readToken(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function createNucleotideLifeRenderer(canvas) {
    const ctx = canvas.getContext("2d");
    let cssW = 0;
    let cssH = 0;
    let dpr = 1;
    let colors = {
      base: "#f2f2ee",
      rare: "#9a9a94",
      locked: "#8dff6a",
      empty: "#2a2a27",
    };

    function refreshColors() {
      colors = {
        base: readToken("--color-text", "#f2f2ee"),
        rare: readToken("--color-text-muted", "#9a9a94"),
        locked: readToken("--color-accent", "#8dff6a"),
        empty: "#2a2a27",
      };
    }

    function resize(cssWidth, cssHeight, devicePixelRatio) {
      cssW = Math.max(1, cssWidth);
      cssH = Math.max(1, cssHeight);
      dpr = Math.max(1, devicePixelRatio || 1);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      // Let CSS fill the mount; Ken Burns scales the parent together.
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      refreshColors();
    }

    function colorFor(cell) {
      if (!cell.char) return colors.base;
      if (cell.locked || LOCKED[cell.char]) return colors.locked;
      if (BASE[cell.char]) return colors.base;
      return colors.rare;
    }

    function draw(state) {
      if (!state || !state.length || !state[0].length) return;
      const rows = state.length;
      const cols = state[0].length;
      const cellW = cssW / cols;
      const cellH = cssH / rows;
      const fontSize = Math.max(6, Math.min(cellW, cellH) * 0.78);

      ctx.clearRect(0, 0, cssW, cssH);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "500 " + fontSize + "px 'IBM Plex Mono', ui-monospace, monospace";

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = state[r][c];
          const x = c * cellW + cellW * 0.5;
          const y = r * cellH + cellH * 0.52;
          if (!cell.alive || !cell.char) {
            ctx.fillStyle = colors.empty;
            ctx.fillText("•", x, y);
            continue;
          }
          ctx.fillStyle = colorFor(cell);
          ctx.fillText(cell.char, x, y);
        }
      }
    }

    refreshColors();

    return {
      draw: draw,
      resize: resize,
    };
  }

  global.createNucleotideLifeRenderer = createNucleotideLifeRenderer;
})(typeof globalThis !== "undefined" ? globalThis : window);
