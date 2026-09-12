/**
 * HMND — interactions v3.0
 * Config: set FORM_ENDPOINT (Forminit form ID) and CALENDLY_URL before launch.
 */
(function () {
  "use strict";

  // —— Config ——
  const FORM_ENDPOINT = "https://forminit.com/f/ozloprvsf7j";
  const FORM_SUCCESS_URL = "https://hmnd.design/talk_soon";
  const CALENDLY_URL = ""; // e.g. https://calendly.com/your-link — empty hides the "Book directly" row.
  const VISION_FEED_URL = "https://vision.hmnd.design/feed.json";
  const CONTACT_EMAIL = "hello@hmnd.design";

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduceMotion = () => motionQuery.matches;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // —— Reveal (single observer, reusable for injected content) ——
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
  );

  function observeReveals(root = document) {
    const nodes = $$(".reveal", root);
    if (reduceMotion()) {
      nodes.forEach((n) => n.classList.add("is-visible"));
      return;
    }
    nodes.forEach((n) => {
      // Anything already in view on load shows immediately (hero, page heads)
      const r = n.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9 && r.bottom > 0) {
        requestAnimationFrame(() => n.classList.add("is-visible"));
      } else {
        revealObserver.observe(n);
      }
    });
  }

  observeReveals();

  // —— Count-up ——
  function formatCount(value, prefix) {
    return `${prefix}${Math.round(value).toLocaleString("en-US")}`;
  }

  function animateCount(el) {
    const end = Number(el.dataset.count);
    const prefix = el.dataset.prefix || "";
    if (!Number.isFinite(end)) return;

    if (reduceMotion()) {
      el.textContent = formatCount(end, prefix);
      return;
    }

    const duration = 1600;
    const t0 = performance.now();

    function frame(now) {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = formatCount(end * eased, prefix);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.4 }
  );

  $$("[data-count]").forEach((el) => countObserver.observe(el));

  // —— Lights on (sections with [data-lights] go dark → lit once, on entry) ——
  const lightsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-lit");
        lightsObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.28 }
  );

  $$("[data-lights]").forEach((el) => {
    if (reduceMotion()) el.classList.add("is-lit");
    else lightsObserver.observe(el);
  });

  // —— Intermezzo: HMND as a degenerate sequence (72 readings) ——
  (function initSequence() {
    const root = $("#sequence");
    if (!root) return;
    const fig = $("#sequence-fig");
    const letters = $$(".intermezzo__letter", root);
    if (!letters.length) return;

    const CODES = {
      H: ["A", "C", "T"],
      M: ["A", "C"],
      N: ["A", "C", "G", "T"],
      D: ["A", "G", "T"],
    };
    const TOTAL = 72;
    const SCRAMBLE_MS = [55, 70, 85, 100];
    const RECOMBINE_AFTER = 2000;

    function readingNumber(state) {
      let n = 0;
      let stride = TOTAL;
      state.forEach((s) => {
        stride /= s.bases.length;
        n += s.index * stride;
      });
      return n + 1;
    }

    function setFig(text) {
      if (fig) fig.textContent = text;
    }

    if (reduceMotion()) {
      letters.forEach((el) => {
        el.textContent = el.dataset.code;
      });
      setFig("Fig. 02a — HMND · 72 readings");
      return;
    }

    const state = letters.map((el, i) => ({
      el,
      code: el.dataset.code,
      bases: CODES[el.dataset.code] || ["N"],
      index: 0,
      held: false,
      timer: 0,
      period: SCRAMBLE_MS[i] ?? 80,
    }));

    state.forEach((s) => {
      s.el.textContent = s.bases[s.index];
    });
    setFig(`Fig. 02a — ${readingNumber(state)} of 72 readings`);

    function updateFig() {
      setFig(`Fig. 02a — ${readingNumber(state)} of 72 readings`);
    }

    let running = false;
    let recombined = false;
    let recombineTimer = 0;

    function step(s) {
      s.timer = window.setTimeout(() => {
        if (running && !s.held) {
          s.index = (s.index + 1) % s.bases.length;
          s.el.textContent = s.bases[s.index];
          updateFig();
        }
        if (running) step(s);
        else s.timer = 0;
      }, s.period);
    }

    function start() {
      if (running || recombined) return;
      running = true;
      state.forEach((s) => {
        if (!s.timer) step(s);
      });
    }

    function stop() {
      running = false;
      state.forEach((s) => {
        window.clearTimeout(s.timer);
        s.timer = 0;
      });
    }

    function recombine() {
      if (recombined) return;
      recombined = true;
      stop();
      state.forEach((s, i) => {
        window.setTimeout(() => {
          s.el.textContent = s.code;
        }, i * 40);
      });
      setFig("Fig. 02a — HMND · 72 readings");
    }

    function reset() {
      window.clearTimeout(recombineTimer);
      recombineTimer = 0;
      recombined = false;
      stop();
      state.forEach((s) => {
        s.index = 0;
        s.el.textContent = s.bases[0];
        release(s);
      });
      updateFig();
    }

    function hold(s) {
      s.held = true;
      s.el.classList.add("is-held");
    }

    function release(s) {
      s.held = false;
      s.el.classList.remove("is-held");
    }

    state.forEach((s) => {
      s.el.addEventListener("pointerenter", () => hold(s));
      s.el.addEventListener("pointerleave", () => release(s));
      s.el.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse") return;
        hold(s);
      });
      s.el.addEventListener("pointerup", (e) => {
        if (e.pointerType === "mouse") return;
        release(s);
      });
      s.el.addEventListener("pointercancel", () => release(s));
    });

    const vis = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            reset();
            return;
          }
          start();
          if (!recombineTimer && !recombined) {
            recombineTimer = window.setTimeout(recombine, RECOMBINE_AFTER);
          }
        });
      },
      { threshold: 0.2 }
    );
    vis.observe(root);

    motionQuery.addEventListener?.("change", () => {
      if (!reduceMotion()) return;
      reset();
      recombined = true;
      state.forEach((s) => {
        s.el.textContent = s.code;
      });
      setFig("Fig. 02a — HMND · 72 readings");
    });
  })();

  // —— Principal portrait: hover / press swap ——
  (function initPrincipalPortrait() {
    const portrait = $(".principal__portrait");
    if (!portrait) return;

    const press = () => portrait.classList.add("is-pressed");
    const release = () => portrait.classList.remove("is-pressed");

    portrait.addEventListener("pointerdown", press);
    portrait.addEventListener("pointerup", release);
    portrait.addEventListener("pointercancel", release);
    portrait.addEventListener("pointerleave", release);
  })();

  // —— Mobile nav ——
  const toggle = $("#nav-toggle");
  const mobileNav = $("#mobile-nav");

  function setNav(open) {
    if (!toggle || !mobileNav) return;
    mobileNav.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("nav-open", open);
  }

  if (toggle && mobileNav) {
    toggle.addEventListener("click", () => setNav(mobileNav.hidden));
    $$("a", mobileNav).forEach((a) => a.addEventListener("click", () => setNav(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !mobileNav.hidden) {
        setNav(false);
        toggle.focus();
      }
    });
  }

  // —— Local time (GMT+3, fixed studio offset) ——
  const timeTargets = $$("#local-time, #local-time-header");
  function updateTime() {
    if (!timeTargets.length) return;
    const now = new Date();
    const gmt3 = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const hh = String(gmt3.getUTCHours()).padStart(2, "0");
    const mm = String(gmt3.getUTCMinutes()).padStart(2, "0");
    timeTargets.forEach((el) => {
      el.textContent = `${hh}:${mm}`;
      if (el.tagName === "TIME") el.setAttribute("datetime", now.toISOString());
    });
  }
  updateTime();
  window.setInterval(updateTime, 30000);

  const yearEl = $("#copyright-year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // —— Topic deep-link into form ——
  (function applyTopicFromUrl() {
    const topic = new URLSearchParams(window.location.search).get("topic");
    const stuck = $("#stuck");
    if (topic && stuck && !stuck.value) stuck.value = topic;
  })();

  // —— Calendly: only show the row if a URL exists ——
  (function initCalendly() {
    const row = $("#calendly-row");
    const cta = $("#calendly-cta");
    if (!row || !cta) return;
    const url = (cta.getAttribute("data-calendly-url") || CALENDLY_URL || "").trim();
    if (!url) {
      row.hidden = true;
      return;
    }
    cta.href = url;
    cta.target = "_blank";
    cta.rel = "noopener noreferrer";
    row.hidden = false;
  })();

  // —— Lead form ——
  const form = $("#lead-form");
  const formStatus = $("#form-status");
  const ZONES = window.HMND_TLDS;

  function setStatus(msg) {
    if (formStatus) formStatus.textContent = msg;
  }

  function emailProblem(value) {
    const email = String(value || "").trim();
    if (!email) return "We’ll need an email to reply to.";
    if (email.length > 254) return "That address is longer than email allows.";

    const at = email.indexOf("@");
    if (at < 1) return "An email without an @ is just a username.";
    if (email.indexOf("@", at + 1) !== -1) return "One @. That’s the deal.";

    const local = email.slice(0, at);
    const domain = email.slice(at + 1);
    if (
      !local ||
      local.startsWith(".") ||
      local.endsWith(".") ||
      local.includes("..") ||
      !/^[A-Za-z0-9._%+\-]+$/.test(local)
    ) {
      return "The part before the @ isn’t an address we can send to.";
    }
    if (!domain.includes(".")) return "A domain needs a name and a zone. Like company.com.";

    let host;
    try {
      host = new URL(`http://${domain}`).hostname;
    } catch {
      return "That domain isn’t shaped like one.";
    }
    if (!host || host.includes("..") || host.startsWith(".") || host.endsWith(".")) {
      return "That domain isn’t shaped like one.";
    }

    const labels = host.split(".");
    if (labels.length < 2) return "A domain needs a name and a zone. Like company.com.";

    const zone = labels[labels.length - 1];
    const typedZone = domain.split(".").pop() || zone;
    if (!ZONES || !ZONES.has(zone)) {
      const shown = typedZone.length > 24 ? `${typedZone.slice(0, 21)}…` : typedZone;
      return `We haven’t heard of a .${shown} zone.`;
    }

    const nameLabels = labels.slice(0, -1);
    const labelOk = (label) =>
      /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label) || /^[A-Za-z0-9]$/.test(label);
    if (nameLabels.some((label) => !labelOk(label))) {
      return "That domain isn’t shaped like one.";
    }
    return "";
  }

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
    const hasEndpoint =
      Boolean(FORM_ENDPOINT) &&
      FORM_ENDPOINT.startsWith("https://") &&
      !FORM_ENDPOINT.includes("YOUR_FORM_ID");
    if (hasEndpoint) form.action = FORM_ENDPOINT;

    const emailEl = $("#email", form);
    if (emailEl) {
      emailEl.addEventListener("input", () => {
        emailEl.setCustomValidity(emailProblem(emailEl.value));
      });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const emailIssue = emailEl ? emailProblem(emailEl.value) : "";
      if (emailEl) emailEl.setCustomValidity(emailIssue);

      if (!form.checkValidity()) {
        form.reportValidity();
        setStatus(emailIssue || "A few fields still need attention.");
        return;
      }

      const fd = new FormData(form);
      if (String(fd.get("_gotcha") || "").trim()) return; // honeypot
      fd.delete("_gotcha");

      const data = {
        name: String(fd.get("fi-sender-fullName") || "").trim(),
        email: String(fd.get("fi-sender-email") || "").trim(),
        organization: String(fd.get("fi-sender-company") || "").trim(),
        message: String(fd.get("fi-text-message") || "").trim(),
        budget: String(fd.get("fi-select-budget") || "").trim(),
      };

      if (!hasEndpoint) {
        mailtoFallback(data);
        setStatus("Opening your email client…");
        return;
      }

      // file:// pages cannot fetch other origins. POST the form as a navigation instead.
      const canFetch = location.protocol === "http:" || location.protocol === "https:";
      if (!canFetch) {
        const honey = form.querySelector('[name="_gotcha"]');
        if (honey) honey.disabled = true;
        if (!data.budget) {
          const budget = form.querySelector('[name="fi-select-budget"]');
          if (budget) budget.disabled = true;
        }
        setStatus("Sending…");
        form.submit();
        return;
      }

      if (!data.budget) fd.delete("fi-select-budget");

      try {
        setStatus("Sending…");
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: fd,
        });
        const payload = await res.json().catch(() => ({}));
        if (res.status === 429) {
          setStatus("Too many attempts. Wait a few seconds and try again.");
          return;
        }
        if (!res.ok || payload.success === false) {
          throw new Error(payload.message || "submit failed");
        }
        window.location.assign(FORM_SUCCESS_URL);
      } catch {
        setStatus("Couldn’t send. Try again, or email hello@hmnd.design.");
      }
    });
  }

  // —— Vision feed ——
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function daysAgo(dateStr) {
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? Infinity : (Date.now() - d.getTime()) / 86400000;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr || "";
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(d);
  }

  function truncate(str, n) {
    const s = String(str || "").trim();
    return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…";
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
      .slice(0, 7);
  }

  async function loadVision() {
    const feed = $("#vision-feed");
    const section = $("#vision");
    const dot = $("#vision-dot");
    if (!feed) return;

    try {
      const res = await fetch(VISION_FEED_URL, { mode: "cors" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const items = normalizeItems(await res.json());
      if (!items.length) throw new Error("empty feed");

      if (dot) dot.hidden = !(items[0] && daysAgo(items[0].date) <= 7);

      const featured = items.find((i) => i.featured) || items[0];
      const others = items.filter((i) => i !== featured);

      const tile = (item, size) => {
        const a = document.createElement("a");
        a.className = `vision-tile vision-tile--${size} reveal`;
        a.href = item.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.innerHTML = `
          <time class="vision-tile__date mono" datetime="${escapeHtml(item.date)}">${escapeHtml(formatDate(item.date))}</time>
          <h3 class="vision-tile__title">${escapeHtml(item.title)}</h3>
          <p class="vision-tile__excerpt">${escapeHtml(truncate(item.excerpt, size === "featured" ? 180 : 90))}</p>
        `;
        return a;
      };

      feed.innerHTML = "";
      feed.appendChild(tile(featured, "featured"));
      others.slice(0, 2).forEach((i) => feed.appendChild(tile(i, "medium")));
      others.slice(2, 6).forEach((i) => feed.appendChild(tile(i, "small")));
      observeReveals(feed);
    } catch {
      // A marketing page should not display an outage. Remove the section quietly.
      if (dot) dot.hidden = true;
      if (section) section.hidden = true;
      const navVision = $$('a[href="#vision"]');
      navVision.forEach((a) => (a.hidden = true));
    }
  }

  loadVision();

  // —— Motion preference can change mid-session ——
  motionQuery.addEventListener?.("change", () => {
    if (reduceMotion()) $$(".reveal").forEach((n) => n.classList.add("is-visible"));
  });
})();
