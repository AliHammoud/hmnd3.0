/**
 * HMND — interactions v3.0
 * Config: set FORM_ENDPOINT and CALENDLY_URL before launch.
 */
(function () {
  "use strict";

  // —— Config ——
  const FORM_ENDPOINT = "REPLACE_ME"; // Formspree / Getform URL. Leave REPLACE_ME for mailto fallback.
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

  function setStatus(msg) {
    if (formStatus) formStatus.textContent = msg;
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
    const hasEndpoint = FORM_ENDPOINT && FORM_ENDPOINT !== "REPLACE_ME";
    if (hasEndpoint) form.action = FORM_ENDPOINT;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        setStatus("A few fields still need attention.");
        return;
      }

      const fd = new FormData(form);
      if (String(fd.get("_gotcha") || "").trim()) return; // honeypot

      const data = {
        name: String(fd.get("name") || "").trim(),
        email: String(fd.get("email") || "").trim(),
        organization: String(fd.get("organization") || "").trim(),
        message: String(fd.get("message") || "").trim(),
        budget: String(fd.get("budget") || "").trim(),
      };

      if (!hasEndpoint) {
        mailtoFallback(data);
        setStatus("Opening your email client…");
        return;
      }

      try {
        setStatus("Sending…");
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: fd,
        });
        if (!res.ok) throw new Error("submit failed");
        form.reset();
        setStatus("Received. We reply within two working days.");
      } catch {
        mailtoFallback(data);
        setStatus("Endpoint unavailable — opening email instead.");
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
