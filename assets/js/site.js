// One Tap Tower — website behaviour. No libraries: the nav, a little parallax, golden motes rising through the
// sky, sections that rise in as they scroll into view, tap-to-cheer hero cards, and the deletion request form.
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- nav: solid once the page scrolls, a menu button on phones -------------------------------------------------
  const nav = document.querySelector(".nav");
  if (nav) {
    const solid = () => nav.classList.toggle("solid", window.scrollY > 24);
    solid();
    window.addEventListener("scroll", solid, { passive: true });
    const toggle = nav.querySelector(".nav-toggle");
    if (toggle) {
      toggle.addEventListener("click", () => {
        const open = nav.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
      });
      nav.querySelectorAll(".nav-links a").forEach(a => a.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }));
    }
  }

  // ---- parallax: the sky drifts slower than the page, the climb leans toward the pointer --------------------------
  const sky = document.querySelector(".hero .hero-sky, .page-hero .hero-sky");
  const clouds = document.querySelector(".clouds");
  const climb = document.querySelector(".climb");
  if (!reduceMotion) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (sky) sky.style.translate = `0 ${y * 0.32}px`;
        if (clouds) clouds.style.translate = `0 ${y * 0.18}px`;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    if (climb && window.matchMedia("(pointer: fine)").matches) {
      window.addEventListener("pointermove", e => {
        const dx = e.clientX / window.innerWidth - 0.5;
        const dy = e.clientY / window.innerHeight - 0.5;
        climb.style.translate = `${dx * -18}px ${dy * -12}px`;
      }, { passive: true });
    }
  }

  // ---- golden motes rising through the hero sky -----------------------------------------------------------------
  const canvas = document.querySelector("canvas.motes");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = 1, motes = [];
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(70, (w * h) / 22000));
      motes = Array.from({ length: count }, () => spawn(true));
    };
    const spawn = (anywhere) => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      r: 0.8 + Math.random() * 2.4,
      vy: 0.15 + Math.random() * 0.45,
      sway: Math.random() * Math.PI * 2,
      warm: Math.random() < 0.7,
    });
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(50, now - last) / 16.67; last = now;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        m.y -= m.vy * dt; m.sway += 0.02 * dt;
        const x = m.x + Math.sin(m.sway) * 8;
        if (m.y < -10) { motes[i] = spawn(false); continue; }
        const a = Math.min(1, m.y / (h * 0.35)) * 0.85;
        const g = ctx.createRadialGradient(x, m.y, 0, x, m.y, m.r * 4);
        g.addColorStop(0, m.warm ? `rgba(255,236,170,${a})` : `rgba(255,255,255,${a})`);
        g.addColorStop(1, "rgba(255,220,140,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, m.y, m.r * 4, 0, Math.PI * 2); ctx.fill();
      }
      if (!document.hidden) requestAnimationFrame(frame);
    };
    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) { last = performance.now(); requestAnimationFrame(frame); } });
    requestAnimationFrame(frame);
  }

  // ---- sections rise in as they scroll into view ---------------------------------------------------------------
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add("in"));
  }

  // ---- hero cards: hover cheers on desktop; on a phone a tap does (and another tap puts them back) ----------------
  document.querySelectorAll(".hero-card").forEach(card => {
    card.addEventListener("click", () => {
      const was = card.classList.contains("active");
      document.querySelectorAll(".hero-card.active").forEach(c => c.classList.remove("active"));
      if (!was) card.classList.add("active");
    });
    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); card.click(); }
    });
  });

  // ---- the year in the footer ---------------------------------------------------------------------------------
  document.querySelectorAll("[data-year]").forEach(el => { el.textContent = String(new Date().getFullYear()); });

  // ---- account deletion request: builds an e-mail to the developer ---------------------------------------------
  const form = document.querySelector("#delete-form");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const to = form.dataset.email;
      const code = form.querySelector("#friend-code").value.trim();
      const nick = form.querySelector("#nickname").value.trim();
      const country = form.querySelector("#country").value.trim();
      const notes = form.querySelector("#notes").value.trim();
      const subject = "One Tap Tower — account deletion request";
      const body = [
        "Hello,",
        "",
        "Please delete my One Tap Tower account and all of its data.",
        "",
        `Friend code (Name#1234): ${code || "(not given)"}`,
        `Nickname: ${nick || "(not given)"}`,
        `Country: ${country || "(not given)"}`,
        notes ? `Anything else: ${notes}` : "",
        "",
        "Thank you.",
      ].filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n");
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const sent = form.querySelector(".sent");
      if (sent) sent.hidden = false;
    });
  }
})();
