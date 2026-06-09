/* UI: tema, menyu, modallar, scroll — render.js-dən sonra */

const themeToggle = document.getElementById("theme-toggle");
const themeLabels = {
    az: { night: "Gündüz rejimi", day: "Gecə rejimi" },
    en: { night: "Light mode", day: "Night mode" },
    tr: { night: "Gündüz modu", day: "Gece modu" },
};

function applyTheme(mode) {
    const isLight = mode === "light";
    document.body.classList.toggle("theme-light", isLight);
    document.body.classList.toggle("light", isLight);
    document.body.classList.toggle("theme-night", !isLight);
    localStorage.setItem("theme", mode);
    const lang = window.currentLang || "az";
    const labels = themeLabels[lang] || themeLabels.az;
    if (themeToggle) {
        themeToggle.setAttribute("aria-label", isLight ? labels.day : labels.night);
    }
    window.dispatchEvent(new CustomEvent("themechange", { detail: { mode } }));
}

applyTheme(localStorage.getItem("theme") || "night");
themeToggle?.addEventListener("click", () => {
    applyTheme(document.body.classList.contains("theme-light") ? "night" : "light");
});

const scrollProgress = document.getElementById("scroll-progress");
const backToTop = document.getElementById("back-to-top");
const SCROLL_SHOW = 320;

function updateScrollProgress() {
    if (!scrollProgress) return;
    const doc = document.documentElement;
    const h = doc.scrollHeight - doc.clientHeight;
    scrollProgress.style.width = h > 0 ? (doc.scrollTop / h) * 100 + "%" : "0%";
}

function updateActiveNav() {
    const offset = getHeaderOffset() + 20;
    let current = "";
    document.querySelectorAll("section[id]").forEach((section) => {
        const top = section.offsetTop - offset;
        if (window.scrollY >= top && window.scrollY < top + section.offsetHeight) {
            current = section.id;
        }
    });
    document.querySelectorAll("#nav-menu a").forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === "#" + current);
    });
}

function onPageScroll() {
    updateScrollProgress();
    backToTop?.classList.toggle("visible", window.scrollY > SCROLL_SHOW);
    updateActiveNav();
}

window.addEventListener("scroll", onPageScroll, { passive: true });

backToTop?.addEventListener("click", () => {
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
});

function getHeaderOffset() {
    return (document.querySelector(".site-header")?.offsetHeight ?? 64) + 8;
}

function smoothScrollTo(target) {
    if (!target) return;
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - getHeaderOffset());
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        window.scrollTo(0, top);
        return;
    }
    const startY = window.scrollY;
    const distance = top - startY;
    const duration = Math.min(850, Math.max(380, Math.abs(distance) * 0.45));
    let startTime = null;
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    function step(now) {
        if (startTime === null) startTime = now;
        const p = Math.min((now - startTime) / duration, 1);
        window.scrollTo(0, startY + distance * ease(p));
        if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function bindAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.replaceWith(anchor.cloneNode(true));
    });
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (e) => {
            const href = anchor.getAttribute("href");
            if (!href || href.length < 2) return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            smoothScrollTo(target);
            history.replaceState?.(null, "", window.location.pathname + window.location.search);
        });
    });
}

const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("nav-menu");
const navOverlay = document.getElementById("nav-overlay");
const langDropdown = document.getElementById("lang-dropdown");
const langToggle = document.getElementById("lang-toggle");
const currentFlag = document.getElementById("current-flag");
const langFlags = { az: "https://flagcdn.com/az.svg", tr: "https://flagcdn.com/tr.svg", en: "https://flagcdn.com/gb.svg" };

function setNavOpen(open) {
    hamburger?.classList.toggle("active", open);
    navMenu?.classList.toggle("show", open);
    navOverlay?.classList.toggle("show", open);
    document.body.classList.toggle("nav-open", open);
    hamburger?.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
        langDropdown?.classList.remove("open");
        langToggle?.setAttribute("aria-expanded", "false");
    }
}

hamburger?.addEventListener("click", () => setNavOpen(!navMenu?.classList.contains("show")));
navOverlay?.addEventListener("click", () => setNavOpen(false));
window.addEventListener("resize", () => {
    if (window.innerWidth > 900) setNavOpen(false);
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navMenu?.classList.contains("show")) setNavOpen(false);
});

langToggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (navMenu?.classList.contains("show")) setNavOpen(false);
    const open = langDropdown.classList.toggle("open");
    langToggle.setAttribute("aria-expanded", open ? "true" : "false");
});
document.addEventListener("click", (e) => {
    if (langDropdown && !langDropdown.contains(e.target)) {
        langDropdown.classList.remove("open");
        langToggle?.setAttribute("aria-expanded", "false");
    }
});

document.querySelectorAll(".lang-option").forEach((btn) => {
    btn.addEventListener("click", () => {
        const lang = btn.getAttribute("data-lang");
        localStorage.setItem("lang", lang);
        document.querySelectorAll(".lang-option").forEach((b) => b.classList.toggle("active", b === btn));
        if (currentFlag) {
            currentFlag.src = langFlags[lang];
            currentFlag.alt = lang.toUpperCase();
        }
        applyUiLanguage(lang);
        bindModals();
        bindCardTilt();
        bindFadeIn();
        bindAnchors();
        document.querySelectorAll("#nav-menu a").forEach((link) => {
            link.addEventListener("click", () => setNavOpen(false));
        });
    });
});

function initParticles() {
    const canvas = document.getElementById("fx-canvas");
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    let particles = [],
        w = 0,
        h = 0,
        accent = "#00d4ff",
        linkAlpha = 0.12,
        dotAlpha = 0.55;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
        const count = Math.min(90, Math.floor((w * h) / 14000));
        particles = Array.from({ length: count }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            r: Math.random() * 1.8 + 0.4,
        }));
    }
    function hexToRgba(hex, a) {
        const n = parseInt(hex.slice(1), 16);
        return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    }
    function onThemeChange(e) {
        const light = e?.detail?.mode === "light" || document.body.classList.contains("theme-light");
        accent = light ? "#0066cc" : "#00d4ff";
        linkAlpha = light ? 0.08 : 0.12;
        dotAlpha = light ? 0.4 : 0.55;
    }
    window.addEventListener("themechange", onThemeChange);
    onThemeChange();
    function draw() {
        ctx.clearRect(0, 0, w, h);
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > w) p.vx *= -1;
            if (p.y < 0 || p.y > h) p.vy *= -1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = hexToRgba(accent, dotAlpha);
            ctx.fill();
            for (let j = i + 1; j < particles.length; j++) {
                const q = particles[j];
                const dist = Math.hypot(p.x - q.x, p.y - q.y);
                if (dist < 120) {
                    ctx.strokeStyle = hexToRgba(accent, linkAlpha * (1 - dist / 120));
                    ctx.lineWidth = 0.6;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(q.x, q.y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(draw);
    }
    resize();
    window.addEventListener("resize", resize);
    draw();
}

const cursorGlow = document.getElementById("cursor-glow");
if (cursorGlow && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let gx = 0,
        gy = 0,
        tx = 0,
        ty = 0;
    document.addEventListener("mousemove", (e) => {
        tx = e.clientX;
        ty = e.clientY;
    });
    (function loop() {
        gx += (tx - gx) * 0.12;
        gy += (ty - gy) * 0.12;
        cursorGlow.style.left = gx + "px";
        cursorGlow.style.top = gy + "px";
        requestAnimationFrame(loop);
    })();
}

function bindCardTilt() {
    document.querySelectorAll(".card, .timeline-item").forEach((el) => {
        el.onmousemove = (e) => {
            const r = el.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            el.style.transform = `perspective(600px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`;
        };
        el.onmouseleave = () => {
            el.style.transform = "";
        };
    });
}

let fadeObserver;
function bindFadeIn() {
    if (fadeObserver) fadeObserver.disconnect();
    fadeObserver = new IntersectionObserver(
        (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("show")),
        { threshold: 0.2 }
    );
    document.querySelectorAll(".fade-in").forEach((el) => fadeObserver.observe(el));
}

function bindModals() {
    const modal = document.getElementById("project-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalDesc = document.getElementById("modal-desc");
    const modalImg = document.getElementById("modal-img");
    const modalLink = document.getElementById("modal-link");

    document.querySelectorAll(".project-card").forEach((card) => {
        card.onclick = () => {
            const id = card.getAttribute("data-project");
            const p = window.projectsMap?.[id];
            if (!p) return;
            modalTitle.textContent = p.title;
            modalDesc.textContent = p.desc;
            modalImg.src = p.img;
            modalLink.href = p.link;
            modal.style.display = "flex";
            document.body.classList.add("modal-open");
        };
    });

    document.getElementById("more-skills").onclick = () => {
        document.getElementById("skills-modal").style.display = "flex";
        document.body.classList.add("modal-open");
    };

    const certModal = document.getElementById("cert-modal");
    const openCert = (id) => {
        const c = window.certsMap?.[id];
        if (!c) return;
        document.getElementById("cert-title").textContent = c.title;
        document.getElementById("cert-img").src = c.img;
        document.getElementById("cert-desc").textContent = c.desc;
        certModal.style.display = "flex";
        document.body.classList.add("modal-open");
    };

    const cards = [...document.querySelectorAll("#cert-cards .cert-card")];
    const featured = cards.filter((c) => c.dataset.featured === "1");
    const initial = (featured.length ? featured : cards).slice(0, 2);
    cards.forEach((c) => (c.style.display = "none"));
    initial.forEach((c) => {
        c.style.display = "block";
        c.onclick = () => openCert(c.getAttribute("data-cert"));
    });
    const moreBtn = document.getElementById("more-certs");
    if (cards.length > 2) moreBtn.style.display = "inline-block";
    else moreBtn.style.display = "none";
    moreBtn.onclick = () => {
        cards.forEach((c) => {
            c.style.display = "block";
            c.onclick = () => openCert(c.getAttribute("data-cert"));
        });
        moreBtn.style.display = "none";
    };

    document.querySelectorAll(".close-btn").forEach((btn) => {
        btn.onclick = () => {
            btn.closest(".modal").style.display = "none";
            document.body.classList.remove("modal-open");
        };
    });
    window.onclick = (e) => {
        if (e.target.classList?.contains("modal")) {
            e.target.style.display = "none";
            document.body.classList.remove("modal-open");
        }
    };
    document.onkeydown = (e) => {
        if (e.key === "Escape") {
            document.querySelectorAll(".modal").forEach((m) => (m.style.display = "none"));
            document.body.classList.remove("modal-open");
        }
    };
}

function initInteractiveFeatures() {
    bindAnchors();
    document.querySelectorAll("#nav-menu a").forEach((link) => {
        link.addEventListener("click", () => setNavOpen(false));
    });
    bindModals();
    bindCardTilt();
    bindFadeIn();
    updateActiveNav();
}
 document.getElementById("contact-form")?.addEventListener("submit", (e) => {
     e.preventDefault();
     const f = e.target;
     const email = window.portfolioContent?.settings?.contactEmail || "";
     const body = `Ad: ${f.name.value}\nEmail: ${f.email.value}\n\n${f.message.value}`;
     window.open(
  `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${encodeURIComponent("Portfolio əlaqə")}&body=${encodeURIComponent(body)}`,
  "_blank"

);
 });
document.getElementById("contact-form")?.addEventListener("submit", (e) => {
    e.preventDefault();

    const f = e.target;
    const email = window.portfolioContent?.settings?.contactEmail;

    if (!email) {
        alert("Əlaqə emaili tapılmadı");
        return;
    }

    const body =
        `Ad: ${f.name.value}\n` +
        `Email: ${f.email.value}\n\n` +
        `${f.message.value}`;

    window.open(
        `mailto:${email}?subject=${encodeURIComponent("Portfolio əlaqə")}&body=${encodeURIComponent(body)}`,
        "_self"
    );
});
(async function init() {
    try {
        await window.renderPortfolio();
        initInteractiveFeatures();
        onPageScroll();
        initParticles();
    } catch (_) {
        /* renderPortfolio shows load-error banner */
    }
})();
