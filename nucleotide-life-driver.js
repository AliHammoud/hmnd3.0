/**
 * Nucleotide Life driver — wires sim + renderer into #hero-screen-viz.
 * Owns interval, mouse mapping, resize. Does not own Conway rules.
 */
(function () {
  "use strict";

  const TICK_MS = 150;
  const TARGET_CELL = 11;
  const MIN_COLS = 8;
  const MIN_ROWS = 4;

  function init() {
    if (typeof createNucleotideLife !== "function") return;
    if (typeof createNucleotideLifeRenderer !== "function") return;

    const mount = document.getElementById("hero-screen-viz");
    const screen = mount && mount.closest(".hero__screen");
    const hero = document.getElementById("top");
    if (!mount || !screen) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduceMotion = () => motionQuery.matches;

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    mount.appendChild(canvas);

    const renderer = createNucleotideLifeRenderer(canvas);
    let sim = null;
    let cols = 0;
    let rows = 0;
    let cellW = 1;
    let cellH = 1;
    let timer = null;
    let heroVisible = true;
    let lastPointer = null; // {x,y} client coords, or null

    function measure() {
      // Use untransformed layout size so Ken Burns scale does not desync the canvas.
      const w = Math.max(1, Math.round(mount.clientWidth || mount.offsetWidth));
      const h = Math.max(1, Math.round(mount.clientHeight || mount.offsetHeight));
      if (w < 8 || h < 8) return null;

      const nextCols = Math.max(MIN_COLS, Math.floor(w / TARGET_CELL));
      const nextRows = Math.max(MIN_ROWS, Math.floor(h / TARGET_CELL));

      return {
        w: w,
        h: h,
        cols: nextCols,
        rows: nextRows,
        cellW: w / nextCols,
        cellH: h / nextRows,
        dpr: window.devicePixelRatio || 1,
      };
    }

    function rebuild() {
      const m = measure();
      if (!m) return;

      const sameGrid = sim && cols === m.cols && rows === m.rows;
      cols = m.cols;
      rows = m.rows;
      cellW = m.cellW;
      cellH = m.cellH;
      if (!sameGrid) sim = createNucleotideLife(rows, cols);
      renderer.resize(m.w, m.h, m.dpr);
      renderer.draw(sim.getState());
    }

    function pointerToCell(clientX, clientY) {
      const rect = screen.getBoundingClientRect();
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        return null;
      }
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const col = Math.floor(x / (rect.width / cols));
      const row = Math.floor(y / (rect.height / rows));
      if (col < 0 || col >= cols || row < 0 || row >= rows) return null;
      return { col: col, row: row };
    }

    function applyPointerBias() {
      if (!sim || !lastPointer) {
        if (sim) sim.clearCursorBias();
        return;
      }
      const cell = pointerToCell(lastPointer.x, lastPointer.y);
      if (!cell) {
        sim.clearCursorBias();
        return;
      }
      sim.applyCursorBias(cell.col, cell.row);
    }

    function countAlive(state) {
      let n = 0;
      for (let r = 0; r < state.length; r++) {
        for (let c = 0; c < state[r].length; c++) {
          if (state[r][c].alive) n++;
        }
      }
      return n;
    }

    function step() {
      if (!sim || !heroVisible || reduceMotion()) return;
      applyPointerBias();
      sim.tick();
      let state = sim.getState();
      // Sparse Life often dies out; reseed so the hero panel stays alive.
      if (countAlive(state) === 0) {
        sim = createNucleotideLife(rows, cols);
        applyPointerBias();
        state = sim.getState();
      }
      renderer.draw(state);
    }

    function stopTimer() {
      if (timer != null) {
        clearInterval(timer);
        timer = null;
      }
    }

    function startTimer() {
      stopTimer();
      if (reduceMotion() || !heroVisible) return;
      timer = setInterval(step, TICK_MS);
    }

    function onPointerMove(e) {
      lastPointer = { x: e.clientX, y: e.clientY };
      if (!sim) return;
      const cell = pointerToCell(e.clientX, e.clientY);
      if (cell) sim.applyCursorBias(cell.col, cell.row);
      else sim.clearCursorBias();
    }

    function onPointerLeave() {
      lastPointer = null;
      if (sim) sim.clearCursorBias();
    }

    let resizeRaf = 0;
    function onResize() {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(function () {
        rebuild();
      });
    }

    rebuild();

    if (typeof ResizeObserver === "function") {
      const ro = new ResizeObserver(onResize);
      ro.observe(mount);
    }

    if (hero) {
      const io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            heroVisible = entry.isIntersecting;
            if (heroVisible) startTimer();
            else stopTimer();
          });
        },
        { threshold: 0.05 }
      );
      io.observe(hero);
    }

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", onResize);

    if (typeof motionQuery.addEventListener === "function") {
      motionQuery.addEventListener("change", function () {
        if (reduceMotion()) {
          stopTimer();
          if (sim) renderer.draw(sim.getState());
        } else {
          startTimer();
        }
      });
    }

    if (!reduceMotion()) startTimer();
    else if (sim) renderer.draw(sim.getState());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
