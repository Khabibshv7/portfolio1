/* ========== Theme (Night / Light) ========== */
const themeToggle = document.getElementById("theme-toggle");
const themeLabels = {
    az: { night: "Gündüz rejimi", day: "Gecə rejimi", badge: "Portfolio 2026" },
    en: { night: "Light mode", day: "Night mode", badge: "Portfolio 2026" },
    tr: { night: "Gündüz modu", day: "Gece modu", badge: "Portfolio 2026" },
};

function applyTheme(mode) {
    const isLight = mode === "light";
    document.body.classList.toggle("theme-light", isLight);
    document.body.classList.toggle("light", isLight);
    document.body.classList.toggle("theme-night", !isLight);
    localStorage.setItem("theme", mode);
    if (themeToggle) {
        const lang = localStorage.getItem("lang") || "az";
        const labels = themeLabels[lang] || themeLabels.az;
        themeToggle.setAttribute("aria-label", isLight ? labels.day : labels.night);
        themeToggle.setAttribute("title", isLight ? labels.day : labels.night);
    }
    window.dispatchEvent(new CustomEvent("themechange", { detail: { mode } }));
}

const savedTheme = localStorage.getItem("theme") || "night";
applyTheme(savedTheme);

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const next = document.body.classList.contains("theme-light") ? "night" : "light";
        applyTheme(next);
    });
}

/* ========== Scroll progress ========== */
const scrollProgress = document.getElementById("scroll-progress");
function updateScrollProgress() {
    if (!scrollProgress) return;
    const doc = document.documentElement;
    const scrolled = doc.scrollTop;
    const height = doc.scrollHeight - doc.clientHeight;
    scrollProgress.style.width = height > 0 ? (scrolled / height) * 100 + "%" : "0%";
}
const backToTop = document.getElementById("back-to-top");
const SCROLL_SHOW = 320;

function onPageScroll() {
    updateScrollProgress();
    if (backToTop) {
        backToTop.classList.toggle("visible", window.scrollY > SCROLL_SHOW);
    }
    if (typeof updateActiveNav === "function") updateActiveNav();
}

window.addEventListener("scroll", onPageScroll, { passive: true });
onPageScroll();

if (backToTop) {
    backToTop.addEventListener("click", () => {
        const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
    });
}

/* ========== Cursor glow ========== */
const cursorGlow = document.getElementById("cursor-glow");
if (cursorGlow && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let glowX = 0;
    let glowY = 0;
    let targetX = 0;
    let targetY = 0;
    document.addEventListener("mousemove", (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
    });
    function animateGlow() {
        glowX += (targetX - glowX) * 0.12;
        glowY += (targetY - glowY) * 0.12;
        cursorGlow.style.left = glowX + "px";
        cursorGlow.style.top = glowY + "px";
        requestAnimationFrame(animateGlow);
    }
    animateGlow();
}

/* ========== Particle canvas ========== */
(function initParticles() {
    const canvas = document.getElementById("fx-canvas");
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    let particles = [];
    let w = 0;
    let h = 0;
    let accent = "#00d4ff";
    let linkAlpha = 0.12;
    let dotAlpha = 0.55;

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
                const dx = p.x - q.x;
                const dy = p.y - q.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
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

    function hexToRgba(hex, a) {
        const n = parseInt(hex.slice(1), 16);
        const r = (n >> 16) & 255;
        const g = (n >> 8) & 255;
        const b = n & 255;
        return `rgba(${r},${g},${b},${a})`;
    }

    resize();
    window.addEventListener("resize", resize);
    draw();
})();

/* ========== Card tilt ========== */
document.querySelectorAll(".card, .timeline-item").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `perspective(600px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`;
    });
    el.addEventListener("mouseleave", () => {
        el.style.transform = "";
    });
});

/* ========== Burger menu ========== */
const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("nav-menu");
const navOverlay = document.getElementById("nav-overlay");

function setNavOpen(open) {
    if (!hamburger || !navMenu) return;
    hamburger.classList.toggle("active", open);
    navMenu.classList.toggle("show", open);
    navOverlay?.classList.toggle("show", open);
    document.body.classList.toggle("nav-open", open);
    hamburger.setAttribute("aria-expanded", open ? "true" : "false");
    hamburger.setAttribute("aria-label", open ? "Menyunu bağla" : "Menyunu aç");
    if (open) {
        langDropdown?.classList.remove("open");
        langToggle?.setAttribute("aria-expanded", "false");
    }
}

function closeNav() {
    setNavOpen(false);
}

/* ========== Animasiyalı # keçidlər ========== */
function getHeaderOffset() {
    const header = document.querySelector(".site-header");
    return (header?.offsetHeight ?? 64) + 8;
}

function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function smoothScrollTo(target) {
    if (!target) return;
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - getHeaderOffset());

    if (prefersReducedMotion()) {
        window.scrollTo(0, top);
        return;
    }

    const startY = window.scrollY;
    const distance = top - startY;
    const duration = Math.min(850, Math.max(380, Math.abs(distance) * 0.45));
    let startTime = null;

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function step(now) {
        if (startTime === null) startTime = now;
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        window.scrollTo(0, startY + distance * easeInOutCubic(progress));
        if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}

function handleAnchorClick(e) {
    const anchor = e.currentTarget;
    const href = anchor.getAttribute("href");
    if (!href || !href.startsWith("#") || href.length < 2) return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    smoothScrollTo(target);

    if (history.replaceState) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
    }
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", handleAnchorClick);
});

if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
        setNavOpen(!navMenu.classList.contains("show"));
    });
    navOverlay?.addEventListener("click", closeNav);
    document.querySelectorAll("#nav-menu a").forEach((link) => {
        link.addEventListener("click", () => {
            closeNav();
        });
    });
    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) closeNav();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && navMenu.classList.contains("show")) closeNav();
    });
}

/* ========== Language dropdown ========== */
const langDropdown = document.getElementById("lang-dropdown");
const langToggle = document.getElementById("lang-toggle");
const currentFlag = document.getElementById("current-flag");
const langFlags = {
    az: "https://flagcdn.com/az.svg",
    tr: "https://flagcdn.com/tr.svg",
    en: "https://flagcdn.com/gb.svg",
};

function setActiveLang(lang) {
    document.querySelectorAll(".lang-option").forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
    });
    if (currentFlag) {
        currentFlag.src = langFlags[lang] || langFlags.az;
        currentFlag.alt = lang.toUpperCase();
    }
}

let currentLang = localStorage.getItem("lang") || "az";
setActiveLang(currentLang);

if (langToggle && langDropdown) {
    langToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        if (navMenu?.classList.contains("show")) closeNav();
        const open = langDropdown.classList.toggle("open");
        langToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", (e) => {
        if (!langDropdown.contains(e.target)) {
            langDropdown.classList.remove("open");
            langToggle.setAttribute("aria-expanded", "false");
        }
    });
}

const translations = {
    az: {
        "back-to-top": "Yuxarı qalx",
        "preview-cv": "CV-yə bax",
"cv-preview-title": "CV-yə baxış",
"close": "Bağla",
        "all-skills": "Bütün Bacarıqlar",
        more: "Daha çox",
        present: "Bu gün",
        "nav-home": "Ana Səhifə",
        "nav-profession": "Təcrübə",
        "nav-education": "Təhsil",
        "nav-projects": "Layihələr",
        "nav-skills": "Bacarıqlar",
        "nav-certificates": "Sertifikatlar",
        "nav-contact": "Əlaqə",
        "hero-name": "Həbib Şahverdiyev",
        "hero-title": "İT Biznes Analitik",
        "hero-intro": "İT Biznes Analitik | ERP Sistemləri | Sistem Administrator",
        "download-cv": "CV Yüklə",
        "hire-me": " Linkedin",
        send: "Göndər",
        "experience-title": "Peşəkar Təcrübə",
        present: "Bu gün",
        "prosys-title": "PROSYS MMC",
        "prosys-desc": "İT Biznes Analitik",
        "mazarina-title": "Mazarina Trade Company MMC",
        "mazarina-desc": "ERP & Biznes Analitik",
        "azedunet-title": "AzEduNet MMC",
        "azedunet-desc": "İKT Mütəxəssisi",
        "sabah-title": "Azərbaycan Texniki Universiteti (SABAH)",
        "sabah-desc": "Magistr – Kibertəhlükəsizlik təhsili alıram (2024 – indiyə kimi)",
        "bdu-title": "Bakı Dövlət Universiteti",
        "bdu-desc": "Bakalavr – Kompüter Elmləri (2021 – 2024)",
        "ca-title": "Code Academy",
        "ca-desc": "Sistem Administratorluğu təhsili (2022 – 2023)",
        "projects-title": "Layihələr",
        "hrmpro-title": "HRMpro",
        "hrmpro-desc": "HR modulları üçün biznes tələblər",
        "logo-title": "LOGO Tiger 3 ERP",
        "logo-desc": "ERP tətbiqi və verilənlər bazası dəstəyi",
        "yandex-title": "Admin Panel",
        "yandex-desc": "İstifadəçi və qrupların idarəsi",
        "skills-title": "Bacarıqlar",
        "skill-1": "ERP (LOGO Tiger 3)",
        "skill-2": "SQL Fundamentals",
        "skill-3": "Windows Server / Ubuntu / RHEL",
        "skill-4": "Cybersecurity & Networking",
        "skill-5": "Jira, ClickUP, TMSpro",
        "skill-6": "Active Directory",
        "skill-7": "Docker, Virtualization",
        "skill-8": "Business Process Modeling",
        "skill-9": "Balsamiq Wireframes",
        "certificates-title": "Sertifikatlar",
        "cert1-title": "Şəbəkələr və Şəbəkə Təhlükəsizliyi",
        "cert1-desc": "Şəbəkələr və Şəbəkə Təhlükəsizliyi",
        "cert2-title": "CompTIA A+",
        "cert2-desc": "Sistem Administratorluğu üzrə CompTIA A+",
        "cert3-title": "Təhlükəsizlik risklərini idarə edin",
        "cert3-desc": "Təhlükəsizlik risklərini idarə edin",
        "cert4-title": "DevOps-a griş",
        "cert4-desc": "DevOps-a giriş",
        "contact-title": "Əlaqə",
        "placeholder-name": "Adınız",
        "placeholder-email": "Email",
        "placeholder-message": "Mesajınız",
    },
    en: {
        "back-to-top": "Back to top",
        "preview-cv": "View CV",
"cv-preview-title": "CV Preview",
"close": "Close",
        "all-skills": "All Skills",
        more: "More",
        present: "Present",
        "nav-home": "Home",
        "nav-profession": "Experience",
        "nav-education": "Education",
        "nav-projects": "Projects",
        "nav-skills": "Skills",
        "nav-certificates": "Certificates",
        "nav-contact": "Contact",
        "hero-name": "Khabib Shahverdiyev",
        "hero-title": "IT Business Analyst",
        "hero-intro": "IT Business Analyst | ERP Systems | System Administrator",
        "download-cv": "Download CV",
        "hire-me": " Linkedin",
        send: "Send",
        "experience-title": "Professional Experience",
        present: "Present",
        "prosys-title": "PROSYS LLC",
        "prosys-desc": "IT Business Analyst",
        "mazarina-title": "Mazarina Trade Company LLC",
        "mazarina-desc": "ERP & Business Analyst",
        "azedunet-title": "AzEduNet LLC",
        "azedunet-desc": "IT Specialist",
        "sabah-title": "Azerbaijan Technical University (SABAH)",
        "sabah-desc": "Master – Cybersecurity education (2024 – present)",
        "bdu-title": "Baku State University",
        "bdu-desc": "Bachelor – Computer Science (2021 – 2024)",
        "ca-title": "Code Academy",
        "ca-desc": "System Administration training (2022 – 2023)",
        "projects-title": "Projects",
        "hrmpro-title": "HRMpro",
        "hrmpro-desc": "Business requirements for HR modules",
        "logo-title": "LOGO Tiger 3 ERP",
        "logo-desc": "ERP application and database support",
        "yandex-title": "Admin Panel",
        "yandex-desc": "User and group management",
        "skills-title": "Skills",
        "skill-1": "ERP (LOGO Tiger 3)",
        "skill-2": "SQL Fundamentals",
        "skill-3": "Windows Server / Ubuntu / RHEL",
        "skill-4": "Cybersecurity & Networking",
        "skill-5": "Jira, ClickUP, TMSpro",
        "skill-6": "Active Directory",
        "skill-7": "Docker, Virtualization",
        "skill-8": "Business Process Modeling",
        "skill-9": "Balsamiq Wireframes",
        "certificates-title": "Certificates",
        "cert1-title": "Networks & Network Security",
        "cert1-desc": "Networks & Network Security",
        "cert2-title": "CompTIA A+",
        "cert2-desc": "CompTIA A+ in System Administration",
        "cert3-title": "Manage Security Risks",
        "cert3-desc": "Manage Security Risks",
        "cert4-title": "Introduction to DevOps",
        "cert4-desc": "Introduction to DevOps",
        "contact-title": "Contact",
        "placeholder-name": "Your Name",
        "placeholder-email": "Email",
        "placeholder-message": "Your Message",
    },
    tr: {
        "back-to-top": "Yukarı çık",
        "preview-cv": "CV'yi görüntüle",
"cv-preview-title": "CV Önizleme",
"close": "Kapat",
        "all-skills": "Tüm Yetenekler",
        more: "Daha fazla",
        present: "Bu gün",
        "nav-home": "Ana Sayfa",
        "nav-profession": "Deneyim",
        "nav-education": "Eğitim",
        "nav-projects": "Projeler",
        "nav-skills": "Yetenekler",
        "nav-certificates": "Sertifikalar",
        "nav-contact": "İletişim",
        "hero-name": "Həbib Şahverdiyev",
        "hero-title": "BT İş Analisti",
        "hero-intro": "BT İş Analisti | ERP Sistemleri | Sistem Yöneticisi",
        "download-cv": "CV İndir",
        "hire-me": " Linkedin",
        send: "Gönder",
        "experience-title": "Profesyonel Deneyim",
        present: "Bu gün",
        "prosys-title": "PROSYS MMC",
        "prosys-desc": "BT İş Analisti",
        "mazarina-title": "Mazarina Trade Company MMC",
        "mazarina-desc": "ERP & İş Analisti",
        "azedunet-title": "AzEduNet MMC",
        "azedunet-desc": "BT Uzmanı",
        "sabah-title": "Azerbaycan Teknik Üniversitesi (SABAH)",
        "sabah-desc": "Yüksek Lisans – Siber Güvenlik (2024 – devam ediyor)",
        "bdu-title": "Bakü Devlet Üniversitesi",
        "bdu-desc": "Lisans – Bilgisayar Bilimleri (2021 – 2024)",
        "ca-title": "Code Academy",
        "ca-desc": "Sistem Yönetimi eğitimi (2022 – 2023)",
        "projects-title": "Projeler",
        "hrmpro-title": "HRMpro",
        "hrmpro-desc": "İK modülleri için iş gereksinimleri",
        "logo-title": "LOGO Tiger 3 ERP",
        "logo-desc": "ERP uygulaması ve veritabanı desteği",
        "yandex-title": "Admin Panel",
        "yandex-desc": "Kullanıcı ve grup yönetimi",
        "skills-title": "Yetenekler",
        "skill-1": "ERP (LOGO Tiger 3)",
        "skill-2": "SQL Fundamentals",
        "skill-3": "Windows Server / Ubuntu / RHEL",
        "skill-4": "Siber Güvenlik & Ağ Yönetimi",
        "skill-5": "Jira, ClickUP, TMSpro",
        "skill-6": "Active Directory",
        "skill-7": "Docker, Sanallaştırma",
        "skill-8": "İş Süreci Modelleme",
        "skill-9": "Balsamiq Wireframes",
        "certificates-title": "Sertifikalar",
        "cert1-title": "Ağlar ve Ağ Güvenliği",
        "cert1-desc": "Ağlar ve Ağ Güvenliği",
        "cert4-title": "CompTIA A+",
        "cert4-desc": "Sistem Yönetimi üzerine CompTIA A+",
        "cert3-title": "Güvenlik Risklerini Yönet",
        "cert3-desc": "Güvenlik Risklerini Yönet",
        "cert2-title": "DevOps'a Giriş",
        "cert2-desc": "DevOps'a giriş",
        "contact-title": "İletişim",
        "placeholder-name": "Adınız",
        "placeholder-email": "E-posta",
        "placeholder-message": "Mesajınız",
    },
};
function applyTranslations(e) {
    document.querySelectorAll("[data-translate]").forEach((i) => {
        const t = i.getAttribute("data-translate");
        translations[e][t] && (i.textContent = translations[e][t]);
    }),
        document.querySelectorAll("[data-translate-placeholder]").forEach((i) => {
            const t = i.getAttribute("data-translate-placeholder");
            translations[e][t] && (i.placeholder = translations[e][t]);
        });
    document.querySelectorAll("[data-translate-aria]").forEach((el) => {
        const key = el.getAttribute("data-translate-aria");
        if (translations[e][key]) {
            el.setAttribute("aria-label", translations[e][key]);
            el.setAttribute("title", translations[e][key]);
        }
    });
    if (themeToggle) {
        const labels = themeLabels[e] || themeLabels.az;
        const isLight = document.body.classList.contains("theme-light");
        themeToggle.setAttribute("aria-label", isLight ? labels.day : labels.night);
    }
}
function selectLanguage(lang) {
    currentLang = lang;
    applyTranslations(lang);
    localStorage.setItem("lang", lang);
    setActiveLang(lang);
    langDropdown?.classList.remove("open");
    langToggle?.setAttribute("aria-expanded", "false");
}

document.querySelectorAll(".lang-option").forEach((btn) => {
    btn.addEventListener("click", () => selectLanguage(btn.getAttribute("data-lang")));
});

applyTranslations(currentLang);
const observer = new IntersectionObserver(
    (e) => {
        e.forEach((e) => {
            e.isIntersecting && e.target.classList.add("show");
        });
    },
    { threshold: 0.2 }
);
document.querySelectorAll(".fade-in").forEach((e) => observer.observe(e));
const sections = document.querySelectorAll("section"),
    navLinks = document.querySelectorAll("nav a");

function updateActiveNav() {
    const offset = getHeaderOffset() + 20;
    let current = "";
    sections.forEach((section) => {
        const top = section.offsetTop - offset;
        const height = section.offsetHeight;
        if (window.scrollY >= top && window.scrollY < top + height) {
            current = section.getAttribute("id");
        }
    });
    navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === "#" + current);
    });
}

updateActiveNav();
const projects = {
    prosys: {
        title: "PROSYS MMC",
        desc: {
            az: "İT Biznes Analitik – HRMpro layihəsində insan resurslarının idarə olunması və əməkhaqqı modullarına dair biznes tələblərin toplanması və funksional sənədlərin hazırlanması. Layihədə işçi məlumat bazası, təlim və inkişaf planları, həmçinin işçi qiymətləndirmə modulları tətbiq olunub. Avtomatlaşdırılmış hesabatlar və analitik alətlər qərarverməni dəstəkləyir.",
            en: "IT Business Analyst – In the HRMpro project, business requirements for human resource management and payroll modules were gathered, and functional documents were prepared. The project includes employee databases, training and development plans, as well as performance evaluation modules. Automated reports and analytical tools support decision-making.",
            tr: "BT İş Analisti – HRMpro projesinde insan kaynaklarının yönetimi ve maaş modüllerine dair iş gereksinimleri toplandı ve fonksiyonel belgeler hazırlandı. Projede çalışan veri tabanları, eğitim ve gelişim planları ile performans değerlendirme modülleri uygulanmıştır. Otomatik raporlar ve analitik araçlar karar vermeyi destekler.",
        },
        img: "https://via.placeholder.com/600x300?text=PROSYS",
        link: "https://www.prosys.az/",
    },
    mazarina: {
        title: "Mazarina Trade Company LLC",
        desc: {
            az: "ERP & Biznes Analitik – LOGO Tiger 3 ERP sistemi tətbiq edilmiş, istifadəçi idarəetməsi, verilənlər bazası dəstəyi və texniki problemlərin həlli təmin olunmuşdur. Şirkət daxilində proqramların test edilməsi və yoxlanış sonrası hesabatın verilməsi həyata keçirilib. Funksional və texniki spesifikasiyalar hazırlanıb.",
            en: "ERP & Business Analyst – The LOGO Tiger 3 ERP system was implemented, including user management, database support, and resolution of technical issues. Internal software testing and post-verification reporting were performed. Functional and technical specifications were prepared.",
            tr: "ERP & İş Analisti – LOGO Tiger 3 ERP sistemi uygulanmış, kullanıcı yönetimi, veri tabanı desteği ve teknik sorunların çözümü sağlanmıştır. Şirket içindeki yazılımların test edilmesi ve doğrulama sonrası raporlama yapılmıştır. Fonksiyonel ve teknik spesifikasyonlar hazırlanmıştır.",
        },
        img: "https://via.placeholder.com/600x300?text=Mazarina",
        link: "https://mazarina.az/",
    },
    azedunet: {
        title: "AzEduNet LLC",
        desc: {
            az: "İKT Mütəxəssisi – Şəbəkə dayanmasının qarşısını almaq üçün STP və düzgün VLAN konfiqurasiyası ilə switch loop problemləri aradan qaldırılıb. DVR/NVR cihazları qurulub və IP kameralarla inteqrasiya olunaraq yaddaş istifadəsi optimallaşdırılıb.",
            en: "ICT Specialist – To prevent network downtime, switch loop issues were resolved using STP and correct VLAN configuration. DVR/NVR devices were set up and integrated with IP cameras to optimize storage usage.",
            tr: "BT Uzmanı – Ağ kesintilerini önlemek amacıyla switch döngü sorunları STP ve doğru VLAN konfigürasyonu kullanılarak giderildi. DVR/NVR cihazları kuruldu ve IP kameralarla entegrasyon sağlanarak depolama kullanımı optimize edildi.",
        },
        img: "https://via.placeholder.com/600x300?text=AzEduNet",
        link: "https://azedunet.az/az/",
    },
    sabah: {
        title: "Azərbaycan Texniki Universiteti (SABAH)",
        desc: {
            az: "Magistr – Kibertəhlükəsizlik üzrə təhsil alıram (2024 – indiyə kimi). Şəbəkə və məlumat təhlükəsizliyi sahəsində praktiki biliklər qazandım. Fərdi və qrup layihələrində real problemlərə həllər hazırladım. Test və analiz işlərini müxtəlif alətlərlə apardım.",
            en: "Master's – Studying Cybersecurity (2024 – present) at Azerbaijan Technical University. Gained practical knowledge in network and information security. Developed solutions for real problems in individual and group projects. Conducted testing and analysis using various tools.",
            tr: "Yüksek Lisans – Azerbaycan Teknik Üniversitesinde Siber Güvenlik eğitimi alıyorum (2024 – günümüze). Ağ ve bilgi güvenliği alanında pratik bilgiler edindim. Bireysel ve grup projelerinde gerçek sorunlara çözümler geliştirdim. Test ve analizleri çeşitli araçlarla gerçekleştirdim.",
        },
        img: "https://via.placeholder.com/600x300?text=AzTU+SABAH",
        link: "https://aztu.edu.az/az",
    },
    bdu: {
        title: "Bakı Dövlət Universiteti",
        desc: {
            az: "Bakalavr – Kompüter Elmləri (2021 – 2024). Proqramlaşdırma və proqram təminatı inkişafı sahəsində praktiki biliklər əldə etmişəm. Fərdi və qrup layihələrində real proqramlaşdırma problemlərini həll etmişəm. Müxtəlif alət və dillərlə layihələr hazırlamışam.",
            en: "Bachelor – Computer Science (2021 – 2024) at Baku State University. Gained practical knowledge in programming and software development. Solved real programming problems in individual and group projects. Developed projects using various tools and languages.",
            tr: "Lisans – Bilgisayar Bilimleri (2021 – 2024) Bakü Devlet Üniversitesi'nde. Programlama ve yazılım geliştirme alanında pratik bilgiler edindim. Bireysel ve grup projelerinde gerçek programlama sorunlarını çözdüm. Çeşitli araçlar ve dillerle projeler geliştirdim.",
        },
        img: "https://via.placeholder.com/600x300?text=BDU",
        link: "http://www.bdu.az/az",
    },
    ca: {
        title: "Code Academy",
        desc: {
            az: "System Administration təhsili (2022 – 2023). Server və şəbəkə idarəçiliyi sahəsində praktiki biliklər qazandım. Fərdi və qrup layihələrində real sistem problemlərini həll etdim. Müxtəlif əməliyyat sistemləri və alətlərlə idarəetmə və monitorinq işləri apardım.",
            en: "Studied System Administration (2022 – 2023) at Code Academy. Gained practical knowledge in server and network management. Solved real system problems in individual and group projects. Conducted administration and monitoring tasks using various operating systems and tools.",
            tr: "Sistem Yönetimi eğitimi (2022 – 2023) Code Academy'de. Sunucu ve ağ yönetimi alanında pratik bilgiler edindim. Bireysel ve grup projelerinde gerçek sistem sorunlarını çözdüm. Çeşitli işletim sistemleri ve araçlarla yönetim ve izleme çalışmaları yaptım.",
        },
        img: "https://via.placeholder.com/600x300?text=Code+Academy",
        link: "https://code.edu.az/",
    },
    hrmpro: {
        title: "HRMpro",
        desc: {
            az: "HRM layihəsi işçilərin qeydiyyatı, əmək haqqı hesablanması və performans izlənməsini sadələşdirir. İşçi məlumat bazası, təlim və inkişaf planları, işçi qiymətləndirmə modulları tətbiq olunur. Avtomatlaşdırılmış hesabatlar və analitik alətlər qərarverməni dəstəkləyir.",
            en: "The HRM project simplifies employee registration, payroll calculation, and performance tracking. Includes employee database, training and development plans, and performance evaluation modules. Automated reports and analytical tools support decision-making.",
            tr: "HRM projesi çalışan kaydı, maaş hesaplama ve performans takibini kolaylaştırır. Çalışan veri tabanı, eğitim ve gelişim planları ve performans değerlendirme modülleri uygulanır. Otomatik raporlar ve analitik araçlar karar vermeyi destekler.",
        },
        img: "https://via.placeholder.com/600x300?text=HRMpro",
        link: "https://www.prosys.az/",
    },
    logo: {
        title: "LOGO Tiger 3 ERP",
        desc: {
            az: "Logo Tiger 3 ERP şirkətlərin maliyyə, satış və anbar işlərini bir yerdə idarə etməyə imkan verir. Faktura və qaimə işləri avtomatlaşdırılıb, stok və hesabatlar rahat izlənir. ERP modulları real vaxt məlumat verir və qərar verməyi asanlaşdırır.",
            en: "Logo Tiger 3 ERP allows companies to manage finance, sales, and warehouse operations together. Invoice and billing processes are automated, and stock and reports are easy to track. ERP modules provide real-time information to facilitate decision-making.",
            tr: "Logo Tiger 3 ERP, şirketlerin finans, satış ve depo işlemlerini birlikte yönetmesine olanak tanır. Fatura ve belge işleri otomatikleştirilmiş, stok ve raporlar kolayca izlenir. ERP modülleri gerçek zamanlı bilgi sağlar ve karar vermeyi kolaylaştırır.",
        },
        img: "https://via.placeholder.com/600x300?text=LOGO+ERP",
        link: "https://www.logo.com.tr/en/product/logo-tiger-3-enterprise",
    },
    yandex: {
        title: "İnkişaf etmiş Admin Paneli",
        desc: {
            az: "Bu Admin Paneli layihəsi istifadəçi və qrupların idarəsini asanlaşdırır. Panel LocalStorage ilə işləyir, məlumatları CSV/JSON formatında ixrac-import etməyə imkan verir. Axtarış, filtr, sıralama və səhifələmə tam avtomatlaşdırılıb. Bloklama, aktivləşdirmə, redaktə və şifrə idarəsi funksiyaları mövcuddur.",
            en: "This Advanced Admin Panel project simplifies user and group management. The panel works with LocalStorage, allows CSV/JSON import-export. Searching, filtering, sorting, and pagination are fully automated. Includes blocking, activation, editing, and password management functions.",
            tr: "Bu Gelişmiş Admin Paneli projesi kullanıcı ve grup yönetimini kolaylaştırır. Panel LocalStorage ile çalışır, CSV/JSON formatında veri alıp verebilir. Arama, filtreleme, sıralama ve sayfalama tamamen otomatikleştirilmiştir. Engelleme, etkinleştirme, düzenleme ve şifre yönetimi işlevlerini içerir.",
        },
        img: "https://via.placeholder.com/600x300.png/a59090/000000?Text=600x300",
        icon: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Yandex_logo.svg",
        link: "https://yandex.az/",
    },
};

const modal = document.getElementById("project-modal"),
    modalTitle = document.getElementById("modal-title"),
    modalDesc = document.getElementById("modal-desc"),
    modalImg = document.getElementById("modal-img"),
    modalLink = document.getElementById("modal-link");
document.querySelectorAll(".project-card").forEach((e) => {
        e.addEventListener("click", () => {
            const i = e.getAttribute("data-project"),
                t = projects[i];
            (modalTitle.textContent = t.title[currentLang] || t.title.az),
                (modalDesc.textContent = t.desc[currentLang] || t.desc.az),
                (modalTitle.textContent = t.title),
                (modalImg.src = t.img),
                (modalLink.href = t.link),
                (modal.style.display = "flex"),
                document.body.classList.add("modal-open");
        });
    }),
    modal.querySelector(".close-btn").addEventListener("click", () => {
        (modal.style.display = "none"), document.body.classList.remove("modal-open");
    }),
    window.addEventListener("click", (e) => {
        e.target === modal && ((modal.style.display = "none"), document.body.classList.remove("modal-open"));
    });
const skillsModal = document.getElementById("skills-modal");
document.getElementById("more-skills").addEventListener("click", () => {
    (skillsModal.style.display = "flex"), document.body.classList.add("modal-open");
});
const certificates = {
        cert1: {
            title: {
                az: "Şəbəkələr və Şəbəkə Təhlükəsizliyi",
                en: "Networks & Network Security",
                tr: "Ağlar ve Ağ Güvenliği",
            },
            img: "img/Network.jpeg",
            desc: {
                az: "Şəbəkələr və Şəbəkə Təhlükəsizliyi.",
                en: "Networks & Network Security.",
                tr: "Ağlar ve Ağ Güvenliği.",
            },
        },
        cert2: {
            title: { az: "CompTIA A+", en: "CompTIA A+", tr: "CompTIA A+" },
            img: "img/certificate.png",
            desc: {
                az: "Sistem Administratorluğu üzrə CompTIA A+.",
                en: "CompTIA A+ in System Administration.",
                tr: "Sistem Yönetimi üzerine CompTIA A+.",
            },
        },
        cert3: {
            title: {
                az: "Təhlükəsizlik risklərini idarə edin",
                en: "Manage Security Risks",
                tr: "Güvenlik Risklerini Yönetin",
            },
            img: "img/risk.jpeg",
            desc: {
                az: "Təhlükəsizlik risklərini idarə edin.",
                en: "Manage security risks effectively.",
                tr: "Güvenlik risklerini etkili bir şekilde yönetin.",
            },
        },
        cert4: {
            title: { az: "DevOps-a giriş", en: "Introduction to DevOps", tr: "DevOps'a Giriş" },
            img: "img/devops.jpeg",
            desc: { az: "DevOps-a giriş.", en: "Introduction to DevOps.", tr: "DevOps'a giriş." },
        },
    },
    certCards = document.querySelectorAll("#cert-cards .cert-card"),
    moreCertsBtn = document.getElementById("more-certs"),
    certModal = document.getElementById("cert-modal"),
    certTitle = document.getElementById("cert-title"),
    certImg = document.getElementById("cert-img"),
    certDesc = document.getElementById("cert-desc");
function openCert(e) {
    const i = certificates[e];
    (certTitle.textContent = i.title[currentLang] || i.title.az),
        (certImg.src = i.img),
        (certDesc.textContent = i.desc[currentLang] || i.desc.az),
        certDesc.setAttribute("data-current-cert", e),
        (certModal.style.display = "flex"),
        document.body.classList.add("modal-open");
}
certCards.forEach((e, i) => {
    i > 1 && (e.style.display = "none");
}),
    certCards.length > 2 && (moreCertsBtn.style.display = "inline-block"),
    document.querySelectorAll("#cert-cards .cert-card").forEach((e, i) => {
        i < 2 && e.addEventListener("click", () => openCert(e.getAttribute("data-cert")));
    }),
    moreCertsBtn.addEventListener("click", () => {
        document.querySelectorAll("#cert-cards .cert-card").forEach((e, i) => {
            i > 1 &&
                ((e.style.display = "block"), e.addEventListener("click", () => openCert(e.getAttribute("data-cert"))));
        }),
            (moreCertsBtn.style.display = "none");
    }),
    document.querySelectorAll(".close-btn").forEach((e) => {
        e.addEventListener("click", () => {
            (e.parentElement.parentElement.style.display = "none"), document.body.classList.remove("modal-open");
        });
    }),
    window.addEventListener("click", (e) => {
        e.target.classList.contains("modal") &&
            ((e.target.style.display = "none"), document.body.classList.remove("modal-open"));
    }),
    window.addEventListener("keydown", (e) => {
        "Escape" === e.key &&
            (document.querySelectorAll(".modal").forEach((e) => (e.style.display = "none")),
            document.body.classList.remove("modal-open"));
    });
const cvBtn = document.getElementById("download-cv");
cvBtn.addEventListener("click", () => {
    console.log("CV download clicked!");
});
const searchInput = document.getElementById("search-projects");
if (searchInput) {
    searchInput.addEventListener("input", () => {
        const e = searchInput.value.toLowerCase();
        document.querySelectorAll("#project-cards .project-card").forEach((i) => {
            const t = i.textContent.toLowerCase(),
                a = i.getAttribute("data-tags") || "";
            t.includes(e) || a.includes(e) ? (i.style.display = "block") : (i.style.display = "none");
        });
    });
}


// ========== CV Preview Modal ==========
const cvModal = document.getElementById('cv-modal');
const previewCvBtn = document.getElementById('preview-cv-btn');
const cvIframe = document.getElementById('cv-iframe');
const closeModalBtn = document.querySelector('.close-modal-btn');

// CV faylının yolunu təyin edin
const cvPath = 'Həbib - İT Biznes Analitik.pdf';

// Preview düyməsinə klik
if (previewCvBtn) {
  previewCvBtn.addEventListener('click', () => {
    cvIframe.src = cvPath;  // PDF-i yüklə
    cvModal.style.display = 'flex';
    document.body.classList.add('modal-open');
  });
}

// Bağlama düyməsi
if (closeModalBtn) {
  closeModalBtn.addEventListener('click', () => {
    cvModal.style.display = 'none';
    document.body.classList.remove('modal-open');
    cvIframe.src = '';  // Yaddaşı boşalt
  });
}

// Modalın xaricinə kliklə bağlama
window.addEventListener('click', (e) => {
  if (e.target === cvModal) {
    cvModal.style.display = 'none';
    document.body.classList.remove('modal-open');
    cvIframe.src = '';
  }
});

// Escape düyməsi ilə bağlama
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && cvModal.style.display === 'flex') {
    cvModal.style.display = 'none';
    document.body.classList.remove('modal-open');
    cvIframe.src = '';
  }
});