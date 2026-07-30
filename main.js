/**
 * HMND — main interactions
 * Config: set FORM_ENDPOINT and CALENDLY_URL when ready.
 */
(function () {
  "use strict";

  // —— Config (replace before launch) ——
  const FORM_ENDPOINT = "REPLACE_ME"; // Formspree / Getform URL, or leave REPLACE_ME for mailto fallback
  const CALENDLY_URL = ""; // e.g. https://calendly.com/your-link
  const VISION_FEED_URL = "https://vision.hmnd.design/feed.json";
  const WORK_DATA_URL = "data/work.json";
  const CONTACT_EMAIL = "hello@hmnd.design";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // —— Header floating dock: frosted while scrolled, hidden over cinematic ——
  const header = document.getElementById("site-header");
  const cinematicSections = document.querySelectorAll(".cinematic");

  function isOverCinematic() {
    for (const section of cinematicSections) {
      const next = section.nextElementSibling;
      if (!next) continue;

      const sectionRect = section.getBoundingClientRect();
      const nextRect = next.getBoundingClientRect();

      // Hide from cinematic entry until the following section reaches the top edge
      const cinematicEntered = sectionRect.top < window.innerHeight;
      const nextAtTop = nextRect.top <= 0;

      if (cinematicEntered && !nextAtTop) return true;
    }
    return false;
  }

  function updateHeaderDock() {
    if (!header) return;
    const overCinematic = isOverCinematic();
    header.classList.toggle("is-over-cinematic", overCinematic);
    header.classList.toggle("is-dock-visible", window.scrollY > 0 && !overCinematic);
  }

  updateHeaderDock();
  window.addEventListener("scroll", updateHeaderDock, { passive: true });
  window.addEventListener("resize", updateHeaderDock, { passive: true });

  // —— Cinematic sections: scroll-pinned reveal ——
  const CINEMATIC_STEP_VH = 32;

  function formatProofCount(value) {
    const n = Math.round(value);
    if (n >= 1000) return `$${Math.round(n / 1000)}K`;
    return `$${n.toLocaleString("en-US")}`;
  }

  function updateCinematicCount(line, progress) {
    const end = Number(line.dataset.countEnd);
    if (!Number.isFinite(end)) return;
    line.textContent = formatProofCount(end * progress);
  }

  function getCinematicLineProgress(line, lines, progress) {
    if (line.dataset.revealStart !== undefined || line.dataset.revealEnd !== undefined) {
      const start = parseFloat(line.dataset.revealStart) || 0;
      const end = parseFloat(line.dataset.revealEnd ?? "1");
      const span = Math.max(end - start, 0.001);
      return Math.min(1, Math.max(0, (progress - start) / span));
    }

    const seqLines = [...lines].filter(
      (node) => node.dataset.revealStart === undefined && node.dataset.revealEnd === undefined
    );
    const seqIndex = seqLines.indexOf(line);
    const step = 1 / seqLines.length;
    const start = seqIndex * step;
    return Math.min(1, Math.max(0, (progress - start) / step));
  }

  function initCinematic() {
    if (!cinematicSections.length) return;

    cinematicSections.forEach((section) => {
      const lines = section.querySelectorAll(".cinematic__line");
      if (!lines.length) return;

      if (reduceMotion) {
        section.classList.add("is-complete");
        lines.forEach((line) => {
          line.style.setProperty("--line-progress", "1");
          updateCinematicCount(line, 1);
        });
        return;
      }

      const runwayVh = Math.max(0, lines.length - 1) * CINEMATIC_STEP_VH;
      section.style.setProperty("--cinematic-height", `${100 + runwayVh}vh`);

      function updateSection() {
        const rect = section.getBoundingClientRect();
        const sectionTop = window.scrollY + rect.top;
        const scrollRange = section.offsetHeight - window.innerHeight;

        if (scrollRange <= 0) {
          section.classList.add("is-complete");
          lines.forEach((line) => {
            line.style.setProperty("--line-progress", "1");
            updateCinematicCount(line, 1);
          });
          return;
        }

        const scrolled = window.scrollY - sectionTop;
        const progress = Math.min(1, Math.max(0, scrolled / scrollRange));

        lines.forEach((line) => {
          const local = getCinematicLineProgress(line, lines, progress);
          line.style.setProperty("--line-progress", String(local));
          updateCinematicCount(line, local);
        });

        section.classList.toggle("is-complete", progress >= 0.995);
      }

      updateSection();
      window.addEventListener("scroll", updateSection, { passive: true });
      window.addEventListener("resize", updateSection, { passive: true });
    });
  }

  initCinematic();

  // —— Mobile nav ——
  const toggle = document.getElementById("nav-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", () => {
      const open = mobileNav.hasAttribute("hidden");
      if (open) {
        mobileNav.removeAttribute("hidden");
        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "Close menu");
      } else {
        mobileNav.setAttribute("hidden", "");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      }
    });
    mobileNav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        mobileNav.setAttribute("hidden", "");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // —— Logo scramble (rare, long-tail; text chars only if present) ——
  const logo = document.getElementById("logo");
  const POOL = ["A", "T", "G", "C", "H"];
  let scrambleBusy = false;

  function scrambleLogo() {
    if (!logo || scrambleBusy || reduceMotion) return;
    const chars = logo.querySelectorAll(".logo__char");
    if (chars.length !== 4) return;
    scrambleBusy = true;
    const target = ["H", "M", "N", "D"];
    const start = performance.now();
    const duration = 720;

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      chars.forEach((el, i) => {
        if (t < 0.75) {
          el.textContent = POOL[Math.floor(Math.random() * POOL.length)];
        } else {
          el.textContent = target[i];
        }
      });
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        chars.forEach((el, i) => {
          el.textContent = target[i];
        });
        scrambleBusy = false;
        scheduleScramble();
      }
    }
    requestAnimationFrame(frame);
  }

  function scheduleScramble() {
    if (reduceMotion) return;
    // Long-tail: next fire between ~45s and ~8 minutes; often never in short sessions
    const delay = 45000 + Math.pow(Math.random(), 2) * 435000;
    window.setTimeout(scrambleLogo, delay);
  }

  // First opportunity delayed; not on load (only when text logo chars exist)
  if (!reduceMotion && logo?.querySelectorAll(".logo__char").length === 4) {
    window.setTimeout(scheduleScramble, 20000 + Math.random() * 40000);
  }

  // —— Magnetic CTAs ——
  function bindMagnetic(el) {
    if (!el || reduceMotion) return;
    const strength = 10;
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${(x / rect.width) * strength}px, ${(y / rect.height) * strength}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "translate(0, 0)";
    });
  }
  document.querySelectorAll(".magnetic, .btn-primary").forEach(bindMagnetic);

  // —— Scroll reveal ——
  function initReveal() {
    const nodes = document.querySelectorAll(".reveal");
    if (reduceMotion) {
      nodes.forEach((n) => n.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    nodes.forEach((n, i) => {
      n.style.setProperty("--reveal-delay", `${(i % 6) * 60}ms`);
      io.observe(n);
    });
  }
  initReveal();

  // —— Year counter: animate from current year to target ——
  function initYearCounter() {
    const nodes = document.querySelectorAll("[data-year-end]");
    if (!nodes.length) return;

    function setCurrentYear(el) {
      el.textContent = String(new Date().getFullYear());
    }

    function animateYear(el) {
      const target = Number(el.dataset.yearEnd);
      if (!Number.isFinite(target)) return;

      const startYear = new Date().getFullYear();
      el.textContent = String(startYear);

      if (reduceMotion || target === startYear) {
        el.textContent = String(target);
        return;
      }

      const duration = Math.min(1400, 240 + Math.abs(target - startYear) * 90);
      const t0 = performance.now();

      function frame(now) {
        const t = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const value = Math.round(startYear + (target - startYear) * eased);
        el.textContent = String(value);
        if (t < 1) requestAnimationFrame(frame);
        else el.textContent = String(target);
      }

      requestAnimationFrame(frame);
    }

    nodes.forEach(setCurrentYear);

    if (reduceMotion) {
      nodes.forEach((el) => {
        el.textContent = el.dataset.yearEnd;
      });
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateYear(entry.target);
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.2 }
    );

    nodes.forEach((el) => io.observe(el));
  }
  initYearCounter();

  // —— Local time GMT+3 ——
  const timeEl = document.getElementById("local-time");
  function updateTime() {
    if (!timeEl) return;
    const now = new Date();
    // Fixed GMT+3 (studio locale), independent of browser TZ
    const gmt3 = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const hh = String(gmt3.getUTCHours()).padStart(2, "0");
    const mm = String(gmt3.getUTCMinutes()).padStart(2, "0");
    timeEl.textContent = `${hh}:${mm} GMT+3`;
    timeEl.setAttribute("datetime", now.toISOString());
  }
  updateTime();
  window.setInterval(updateTime, 60000);

  // —— Topic deep-link into form ——
  function applyTopicFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const topic = params.get("topic");
    const stuck = document.getElementById("stuck");
    if (topic && stuck && !stuck.value) {
      stuck.value = topic;
    }
  }
  applyTopicFromUrl();

  document.querySelectorAll("[data-topic]").forEach((el) => {
    el.addEventListener("click", () => {
      const stuck = document.getElementById("stuck");
      const topic = el.getAttribute("data-topic");
      if (stuck && topic) stuck.value = topic;
    });
  });

  // —— Calendly ——
  function initCalendly() {
    const slot = document.getElementById("calendly-slot");
    const cta = document.getElementById("calendly-cta");
    const note = document.getElementById("calendly-note");
    if (!slot || !cta) return;

    const url = (slot.getAttribute("data-calendly-url") || CALENDLY_URL || "").trim();
    if (url) {
      cta.href = url;
      cta.setAttribute("target", "_blank");
      cta.setAttribute("rel", "noopener noreferrer");
      if (note) note.hidden = true;
    } else {
      cta.href = "#contact-form";
      if (note) note.hidden = false;
    }
  }
  initCalendly();

  // —— Lead form ——
  const form = document.getElementById("lead-form");
  const formStatus = document.getElementById("form-status");

  function mailtoFallback(data) {
    const subject = encodeURIComponent(`HMND inquiry — ${data.organization || data.name}`);
    const body = encodeURIComponent(
      [
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        `Organization: ${data.organization}`,
        `Budget: ${data.budget || "n/a"}`,
        "",
        data.message,
      ].join("\n")
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }

  if (form) {
    if (FORM_ENDPOINT && FORM_ENDPOINT !== "REPLACE_ME") {
      form.action = FORM_ENDPOINT;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const data = {
        name: String(fd.get("name") || "").trim(),
        email: String(fd.get("email") || "").trim(),
        organization: String(fd.get("organization") || "").trim(),
        message: String(fd.get("message") || "").trim(),
        budget: String(fd.get("budget") || "").trim(),
      };

      if (!FORM_ENDPOINT || FORM_ENDPOINT === "REPLACE_ME") {
        mailtoFallback(data);
        if (formStatus) formStatus.textContent = "Opening your email client…";
        return;
      }

      try {
        if (formStatus) formStatus.textContent = "Sending…";
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: fd,
        });
        if (!res.ok) throw new Error("submit failed");
        form.reset();
        if (formStatus) formStatus.textContent = "Received. We’ll reply shortly.";
      } catch {
        mailtoFallback(data);
        if (formStatus) formStatus.textContent = "Form endpoint unavailable — opening email instead.";
      }
    });
  }

  // —— Selected Work ——
  async function loadWork() {
    const rail = document.getElementById("work-rail");
    if (!rail) return;
    try {
      const res = await fetch(WORK_DATA_URL);
      if (!res.ok) throw new Error("work fetch failed");
      const items = await res.json();
      rail.innerHTML = "";
      const featured = items.find((i) => i.featured) || items[0];
      const rest = items.filter((i) => i !== featured);

      const renderCase = (item, featuredFlag) => {
        const a = document.createElement("a");
        a.href = `works/${item.id}.html`;
        a.className = `work-case reveal${featuredFlag ? " work-case--featured" : ""}`;
        a.innerHTML = `
          <div>
            <div class="work-case__meta"><span>${escapeHtml(item.sector)}</span><span>${escapeHtml(item.year)}</span></div>
            <h3>${escapeHtml(item.title || item.problem)}</h3>
            <p>${escapeHtml(item.summary || item.problem)}</p>
            <p class="work-case__outcome">${escapeHtml(item.outcome)}</p>
          </div>
          <ul class="work-case__tags">${(item.tags || []).map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
        `;
        return a;
      };

      if (featured) rail.appendChild(renderCase(featured, true));
      rest.slice(0, 2).forEach((item) => rail.appendChild(renderCase(item, false)));

      // observe new reveals
      if (!reduceMotion) {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            });
          },
          { threshold: 0.08 }
        );
        rail.querySelectorAll(".reveal").forEach((n) => io.observe(n));
      } else {
        rail.querySelectorAll(".reveal").forEach((n) => n.classList.add("is-visible"));
      }
    } catch {
      rail.innerHTML = `<p class="vision__error">Selected work will appear here. Add cases in <code>data/work.json</code>.</p>`;
    }
  }

  // —— Vision feed ——
  function daysAgo(dateStr) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return Infinity;
    return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr || "";
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  }

  function truncate(str, n) {
    const s = String(str || "").trim();
    if (s.length <= n) return s;
    return s.slice(0, n - 1).trimEnd() + "…";
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeItems(payload) {
    let items = [];
    if (Array.isArray(payload)) items = payload;
    else if (payload && Array.isArray(payload.items)) items = payload.items;
    else if (payload && Array.isArray(payload.posts)) items = payload.posts;
    else if (payload && Array.isArray(payload.entries)) items = payload.entries;

    return items
      .map((raw, idx) => ({
        id: raw.id || raw.slug || `item-${idx}`,
        title: raw.title || raw.headline || "Untitled",
        date: raw.date || raw.published_at || raw.published || raw.created_at || "",
        excerpt: raw.excerpt || raw.summary || raw.description || "",
        url: raw.url || raw.link || raw.permalink || "https://vision.hmnd.design",
        featured: Boolean(raw.featured),
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
  }

  async function loadVision() {
    const feed = document.getElementById("vision-feed");
    const dot = document.getElementById("vision-dot");
    if (!feed) return;

    try {
      const res = await fetch(VISION_FEED_URL, { mode: "cors" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      const items = normalizeItems(payload);

      if (!items.length) throw new Error("empty feed");

      // Nav new-dot: newest within 7 days
      if (dot) {
        const newest = items[0];
        const show = newest && daysAgo(newest.date) <= 7;
        dot.hidden = !show;
      }

      let featured = items.find((i) => i.featured);
      if (!featured) featured = items[0];
      const others = items.filter((i) => i !== featured);
      const mediums = others.slice(0, 2);
      const smalls = others.slice(2);

      const makeTile = (item, size) => {
        const a = document.createElement("a");
        a.className = `vision-tile vision-tile--${size} reveal`;
        a.href = item.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.innerHTML = `
          <time class="vision-tile__date" datetime="${escapeHtml(item.date)}">${escapeHtml(formatDate(item.date))}</time>
          <h3 class="vision-tile__title">${escapeHtml(item.title)}</h3>
          <p class="vision-tile__excerpt">${escapeHtml(truncate(item.excerpt, size === "featured" ? 160 : 90))}</p>
        `;
        return a;
      };

      feed.innerHTML = "";
      feed.appendChild(makeTile(featured, "featured"));
      mediums.forEach((i) => feed.appendChild(makeTile(i, "medium")));
      smalls.forEach((i) => feed.appendChild(makeTile(i, "small")));

      if (!reduceMotion) {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            });
          },
          { threshold: 0.05 }
        );
        feed.querySelectorAll(".reveal").forEach((n) => io.observe(n));
      } else {
        feed.querySelectorAll(".reveal").forEach((n) => n.classList.add("is-visible"));
      }
    } catch {
      if (dot) dot.hidden = true;
      feed.innerHTML = `
        <div class="vision__error reveal is-visible">
          <p>Vision feed is temporarily unavailable.</p>
          <p><a class="text-link" href="https://vision.hmnd.design" target="_blank" rel="noopener noreferrer">Read Vision →</a></p>
        </div>
      `;
    }
  }

  // —— Hero image: fail visibly if missing ——
  const heroImg = document.querySelector(".hero__img");
  const heroMedia = document.querySelector(".hero__media");
  if (heroImg && heroMedia) {
    if (heroImg.complete && heroImg.naturalWidth === 0) {
      heroMedia.classList.add("is-missing");
    }
    heroImg.addEventListener("error", () => heroMedia.classList.add("is-missing"));
    heroImg.addEventListener("load", () => heroMedia.classList.remove("is-missing"));
  }

  loadWork();
  loadVision();
})();
