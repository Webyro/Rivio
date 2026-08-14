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
  if (contactForm) {
    const endpoint = contactForm.dataset.contactEndpoint;
    const status = contactForm.querySelector("[data-form-status]");
    const submitButton = contactForm.querySelector("[data-submit-button]");
    const submitLabel = contactForm.querySelector("[data-submit-label]");
    let isSubmitting = false;

    const setFormStatus = (message, state = "") => {
      if (!status) return;
      status.textContent = message;
      if (state) status.dataset.state = state;
      else delete status.dataset.state;
    };

    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (isSubmitting) return;

      if (!endpoint) {
        setFormStatus("Das Kontaktformular ist derzeit nicht verfügbar. Bitte schreiben Sie uns an team@rivio-solutions.de.", "error");
        return;
      }

      if (!contactForm.reportValidity()) return;

      const formData = new FormData(contactForm);
      const payload = {
        name: String(formData.get("name") || ""),
        email: String(formData.get("email") || ""),
        company: String(formData.get("company") || ""),
        phone: String(formData.get("phone") || ""),
        message: String(formData.get("message") || ""),
        website: String(formData.get("website") || "")
      };

      isSubmitting = true;
      contactForm.setAttribute("aria-busy", "true");
      if (submitButton) submitButton.disabled = true;
      if (submitLabel) submitLabel.textContent = "Wird gesendet …";
      setFormStatus("Ihre Anfrage wird sicher übermittelt …", "loading");

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 60000);

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          mode: "cors",
          credentials: "omit",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        let responseBody = {};
        try {
          responseBody = await response.json();
        } catch {
          responseBody = {};
        }

        if (!response.ok || responseBody.ok === false) {
          const message = response.status === 400
            ? "Bitte prüfen Sie Ihre Angaben und versuchen Sie es erneut."
            : "Die Anfrage konnte nicht übermittelt werden. Bitte versuchen Sie es später erneut.";
          throw new Error(message);
        }

        contactForm.reset();
        setFormStatus("Vielen Dank! Ihre Anfrage wurde erfolgreich übermittelt.", "success");
      } catch (error) {
        const message = error?.name === "AbortError"
          ? "Die Übermittlung hat zu lange gedauert. Bitte versuchen Sie es erneut."
          : error?.message || "Die Anfrage konnte nicht übermittelt werden. Bitte versuchen Sie es erneut.";
        setFormStatus(message, "error");
      } finally {
        window.clearTimeout(timeoutId);
        isSubmitting = false;
        contactForm.removeAttribute("aria-busy");
        if (submitButton) submitButton.disabled = false;
        if (submitLabel) submitLabel.textContent = "Anfrage senden";
      }
    });
  }

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
