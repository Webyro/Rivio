(() => {
  "use strict";

  const header = document.querySelector("[data-header]");
  const nav = document.querySelector("[data-nav]");
  const navToggle = document.querySelector("[data-nav-toggle]");

  const setHeaderState = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  const closeNavigation = () => {
    if (!nav || !navToggle) return;
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.querySelector(".sr-only").textContent = "Navigation öffnen";
  };

  navToggle?.addEventListener("click", () => {
    const willOpen = navToggle.getAttribute("aria-expanded") !== "true";
    nav?.classList.toggle("is-open", willOpen);
    navToggle.setAttribute("aria-expanded", String(willOpen));
    navToggle.querySelector(".sr-only").textContent = willOpen ? "Navigation schließen" : "Navigation öffnen";
  });

  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeNavigation));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNavigation();
  });
  window.addEventListener("scroll", setHeaderState, { passive: true });
  setHeaderState();

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealItems = document.querySelectorAll(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  const contactForm = document.querySelector("[data-contact-form]");
  contactForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = contactForm.querySelector("[data-form-status]");
    if (status) status.textContent = "TODO: Backend des Kontaktformulars anbinden – aktuell wurden keine Daten übertragen.";
  });

  const canvas = document.querySelector("[data-network-canvas]");
  if (!canvas || reducedMotion) return;
  const context = canvas.getContext("2d");
  if (!context) return;

  let width = 0;
  let height = 0;
  let points = [];
  const pointCount = window.innerWidth < 700 ? 28 : 52;

  const resizeCanvas = () => {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    points = Array.from({ length: pointCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      radius: Math.random() * 1.2 + 0.5
    }));
  };

  const drawNetwork = () => {
    context.clearRect(0, 0, width, height);
    points.forEach((point) => {
      point.x += point.vx;
      point.y += point.vy;
      if (point.x < 0 || point.x > width) point.vx *= -1;
      if (point.y < 0 || point.y > height) point.vy *= -1;
    });

    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const distance = Math.hypot(dx, dy);
        if (distance >= 135) continue;
        context.beginPath();
        context.moveTo(points[i].x, points[i].y);
        context.lineTo(points[j].x, points[j].y);
        context.strokeStyle = `rgba(90, 139, 255, ${(1 - distance / 135) * 0.24})`;
        context.lineWidth = 0.5;
        context.stroke();
      }
    }

    points.forEach((point) => {
      context.beginPath();
      context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      context.fillStyle = "rgba(112, 157, 255, 0.58)";
      context.fill();
    });
    window.requestAnimationFrame(drawNetwork);
  };

  window.addEventListener("resize", resizeCanvas, { passive: true });
  resizeCanvas();
  drawNetwork();
})();
