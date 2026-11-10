// Website behavior: menu, photo spaces, motion, lightbox, filters.
// You do not need to edit this file.
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) document.documentElement.classList.add("motion");

  // ---- Photo-space view: add ?slots to any page address ----
  const showSlots = new URLSearchParams(location.search).has("slots");
  if (showSlots) {
    document.body.classList.add("show-slots");
    const b = document.createElement("div");
    b.className = "slots-banner";
    b.textContent = "Photo-space view: each dashed box shows the file name to upload.";
    document.body.appendChild(b);
  }

  // ---- Phone menu ----
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // ---- Header shadow after scrolling ----
  const header = document.querySelector(".site-header");
  const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // ---- Photos: show only the ones that exist ----
  function watch(img, box) {
    box.dataset.file = img.getAttribute("src");
    const ok = () => { box.classList.add("loaded"); box.classList.remove("missing"); box.dispatchEvent(new CustomEvent("photo:loaded", { bubbles: true })); };
    const bad = () => { box.classList.add("missing"); };
    if (img.complete && img.naturalWidth > 0) ok();
    else if (img.complete) bad();
    img.addEventListener("load", ok);
    img.addEventListener("error", bad);
  }
  document.querySelectorAll(".photo img").forEach((img) => watch(img, img.closest(".photo")));
  const avatar = document.querySelector(".avatar img");
  if (avatar) watch(avatar, avatar.closest(".avatar"));

  // ---- Scroll reveal with gentle stagger ----
  document.querySelectorAll("[data-stagger]").forEach((group) => {
    [...group.children].forEach((el, i) => { el.setAttribute("data-reveal", ""); el.style.setProperty("--d", `${Math.min(i, 8) * 70}ms`); });
  });
  const revealables = document.querySelectorAll("[data-reveal]");
  if (!reduce && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add("is-visible"));
  }

  // ---- Numbers that count up ----
  const counters = document.querySelectorAll("[data-count]");
  const finish = (el) => { el.textContent = Number(el.dataset.count).toLocaleString() + (el.dataset.suffix || ""); };
  if (!reduce && "IntersectionObserver" in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        co.unobserve(e.target);
        const el = e.target, end = Number(el.dataset.count), start = performance.now(), dur = 1400;
        const step = (t) => {
          const p = Math.min(1, (t - start) / dur), eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(end * eased).toLocaleString() + (p === 1 ? (el.dataset.suffix || "") : "");
          if (p < 1) requestAnimationFrame(step);
        };
        el.textContent = "0";
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => co.observe(el));
  } else {
    counters.forEach(finish);
  }

  // ---- The moving dot on the loop ----
  const loop = document.querySelector("svg.loop");
  if (loop && reduce && loop.pauseAnimations) loop.pauseAnimations();

  // ---- Home photo carousel ----
  const stripSection = document.querySelector(".strip-section");
  if (stripSection) {
    const strip = stripSection.querySelector(".strip");
    let timer = null, paused = false;
    const loaded = () => strip.querySelectorAll(".photo.loaded");
    const stepSize = () => { const f = loaded()[0]; return f ? f.getBoundingClientRect().width + 14 : 300; };
    const next = () => {
      if (strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 4) strip.scrollTo({ left: 0, behavior: reduce ? "auto" : "smooth" });
      else strip.scrollBy({ left: stepSize(), behavior: reduce ? "auto" : "smooth" });
    };
    const prev = () => strip.scrollBy({ left: -stepSize(), behavior: reduce ? "auto" : "smooth" });
    const start = () => { if (!reduce && !timer && loaded().length > 1) timer = setInterval(() => { if (!paused) next(); }, 4500); };
    stripSection.addEventListener("photo:loaded", () => { stripSection.hidden = false; start(); });
    if (strip.querySelector(".photo.loaded")) { stripSection.hidden = false; start(); }
    ["mouseenter", "focusin", "touchstart"].forEach((ev) => stripSection.addEventListener(ev, () => { paused = true; }, { passive: true }));
    ["mouseleave", "focusout"].forEach((ev) => stripSection.addEventListener(ev, () => { paused = false; }));
    const n = stripSection.querySelector("[data-next]"), p = stripSection.querySelector("[data-prev]");
    if (n) n.addEventListener("click", next);
    if (p) p.addEventListener("click", prev);
  }

  // ---- Lightbox: click any photo to enlarge ----
  let lastFocus = null;
  function openLightbox(img) {
    lastFocus = document.activeElement;
    const box = img.closest(".photo");
    const cap = box.querySelector("figcaption");
    const lb = document.createElement("div");
    lb.className = "lightbox"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", "Enlarged photo");
    lb.innerHTML = '<button class="close" type="button">Close</button><figure><img alt=""><figcaption></figcaption></figure>';
    lb.querySelector("img").src = img.currentSrc || img.src;
    lb.querySelector("img").alt = img.alt;
    lb.querySelector("figcaption").textContent = cap ? cap.textContent : img.alt;
    document.body.appendChild(lb);
    requestAnimationFrame(() => lb.classList.add("open"));
    const close = () => { lb.classList.remove("open"); setTimeout(() => lb.remove(), 250); document.removeEventListener("keydown", onKey); if (lastFocus) lastFocus.focus(); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target.classList.contains("close")) close(); });
    document.addEventListener("keydown", onKey);
    lb.querySelector(".close").focus();
  }
  document.addEventListener("click", (e) => {
    const img = e.target.closest(".photo.loaded img");
    if (img && !img.closest(".lightbox")) openLightbox(img);
  });
  document.querySelectorAll(".photo img").forEach((img) => {
    img.setAttribute("tabindex", "0");
    img.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && img.closest(".photo.loaded")) { e.preventDefault(); openLightbox(img); } });
  });

  // ---- Filters (publications and highlights pages) ----
  document.querySelectorAll(".filters").forEach((bar) => {
    const buttons = bar.querySelectorAll("button");
    const items = document.querySelectorAll(bar.dataset.target);
    buttons.forEach((btn) => btn.addEventListener("click", () => {
      const show = btn.dataset.show;
      buttons.forEach((b) => b.setAttribute("aria-pressed", b === btn ? "true" : "false"));
      items.forEach((it) => {
        const match = show === "all" || it.dataset.type === show;
        it.hidden = !match;
        if (match && !reduce) { it.classList.remove("fade-in"); void it.offsetWidth; it.classList.add("fade-in"); }
      });
    }));
  });

  // ---- Current year in the footer ----
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
