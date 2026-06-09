/** Portfolio məzmununu yükləyir və DOM-a render edir */
window.portfolioContent = null;
window.currentLang = localStorage.getItem("lang") || "az";

function t(obj, lang = window.currentLang) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    return obj[lang] || obj.az || obj.en || "";
}

function ui(key, lang = window.currentLang) {
    const c = window.portfolioContent;
    if (!c?.ui?.[lang]) return key;
    return c.ui[lang][key] ?? c.ui.az?.[key] ?? key;
}

// function formatPeriod(period, lang) {
//     if (!period) return "";
//     const present = ui("present", lang);
//     return period.replace(/\bpresent\b/gi, `<span data-ui="present">${present}</span>`);
// }
function formatPeriod(period, lang = window.currentLang) {
    if (!period) return "";

    if (typeof period === "object") {
        return period[lang] || period.az || period.en || "";
    }

    const present = ui("present", lang);
    return period.replace(/\bpresent\b/gi, `<span data-ui="present">${present}</span>`);
}
async function fetchContent() {
    const isFile = window.location.protocol === "file:";
    const apiUrl = new URL("api/content", window.location.href).href;
    const jsonUrl = new URL("data/content.json", window.location.href).href;

    if (!isFile) {
        try {
            const res = await fetch(apiUrl, { cache: "no-store" });
            if (res.ok) return await res.json();
            console.warn("API status:", res.status);
        } catch (err) {
            console.warn("API fetch failed:", err);
        }
    }

    const res = await fetch(jsonUrl, { cache: "no-store" });
    if (!res.ok) {
        throw new Error(
            isFile
                ? "Faylı birbaşa açmayın. Terminaldə: npm start — sonra http://localhost:8080"
                : `Məzmun yüklənmədi (${res.status}). Server işləyir? npm start`
        );
    }
    return res.json();
}

function sortVisible(items) {
    return [...items].filter((i) => i.visible !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function renderNav() {
    const ul = document.querySelector("#nav-menu ul");
    if (!ul || !window.portfolioContent) return;
    const nav = sortVisible(window.portfolioContent.nav || []);
    ul.innerHTML = nav
        .map(
            (item, i) =>
                `<li><a href="#${item.sectionId}" data-nav="${item.sectionId}"${i === 0 ? ' class="active"' : ""}>${t(item.label)}</a></li>`
        )
        .join("");
    (window.portfolioContent.customSections || []).forEach((sec) => {
        const inNav = nav.some((n) => n.sectionId === sec.id);
        if (!inNav && sec.visible !== false) {
            ul.innerHTML += `<li><a href="#${sec.id}">${t(sec.title)}</a></li>`;
        }
    });
}

function renderHero() {
    const c = window.portfolioContent;
    if (!c?.hero?.enabled) return;
    const wrap = document.getElementById("hero-inner");
    if (!wrap) return;
    const s = c.settings;
    const stats = sortVisible(c.stats || [])
        .map((st) => `<div class="stat-item"><strong>${st.value}</strong><span>${t(st.label)}</span></div>`)
        .join("");
    const img = s.profileImage
        ? `<img class="hero-photo" src="${s.profileImage}" alt="${t(c.hero.name)}" loading="lazy">`
        : "";
    const badge = s.openToWork
        ? `<p class="hero-badge open-badge"><span class="pulse-dot"></span> <span data-ui="open-to-work">${ui("open-to-work")}</span></p>`
         : `<p></p>`;
    const linkedin = (c.social || []).find((x) => x.id === "linkedin") || { url: "https://www.linkedin.com/in/khabib-shahverdiyev-1b36852b5" };

    wrap.innerHTML = `
    <div class="hero-layout fade-in">
      ${img}
      <div class="hero-text">
        ${badge}
        <h1 class="hero-glitch">${t(c.hero.name)}</h1>
        <h2 class="hero-gradient">${t(c.hero.title)}</h2>
        <p>${t(c.hero.intro)}</p>
        ${stats ? `<div class="hero-stats">${stats}</div>` : ""}
        <div class="hero-btns">
          <a href="${s.cvFile || "#"}" download class="btn primary" data-ui="download-cv">${ui("download-cv")}</a>
          <a href="${linkedin.url}" class="btn secondary" target="_blank" rel="noopener"><i class="${linkedin.icon || "fab fa-linkedin"}"></i> ${ui("hire-me")}</a>
        </div>
      </div>
    </div>`;
}

function renderExperience() {
    const el = document.getElementById("experience-list");
    if (!el) return;
    const items = sortVisible(window.portfolioContent.experience || []);
    el.innerHTML = items
        .map(
            (item) => `
    <div class="timeline-item ${item.side || "left"} fade-in project-card" data-project="${item.id}" data-tags="${item.tags || ""}">
      <i class="${item.icon || "fa-solid fa-briefcase"}"></i>
      <h3>${t(item.title)}</h3>
      <span>${formatPeriod(item.period)}</span>
      <p>${t(item.shortDesc)}</p>
    </div>`
        )
        .join("");
}

function renderEducation() {
    const el = document.getElementById("education-list");
    if (!el) return;
    const items = sortVisible(window.portfolioContent.education || []);
    el.innerHTML = items
        .map(
            (item) => `
    <article class="card fade-in project-card" data-project="${item.id}" data-tags="${item.tags || ""}">
      <i class="${item.icon || "fa-solid fa-graduation-cap"}"></i>
      <h3>${t(item.title)}</h3>
      <span>${formatPeriod(item.period)}</span>
      <p>${t(item.shortDesc)}</p>
    </article>`
        )
        .join("");
}

function renderProjects() {
    const el = document.getElementById("project-cards");
    if (!el) return;
    const items = sortVisible(window.portfolioContent.projects || []);
    el.innerHTML = items
        .map(
            (item) => `
    <article class="card fade-in project-card" data-project="${item.id}" data-tags="${item.tags || ""}">
      <i class="${item.icon || "fa-solid fa-folder"}"></i>
      <h3>${t(item.title)}</h3>
      <p>${t(item.shortDesc)}</p>
    </article>`
        )
        .join("");
}

function renderSkills() {
    const grid = document.getElementById("skills-grid");
    const list = document.getElementById("skills-list");
    const skills = window.portfolioContent.skills;
    if (!skills) return;
    const items = sortVisible(skills.items || []);
    const featured = items.slice(0, skills.featuredCount ?? 5);
    if (grid) grid.innerHTML = featured.map((s) => `<span>${t(s.text)}</span>`).join("");
    if (list) list.innerHTML = items.map((s) => `<li>${t(s.text)}</li>`).join("");
}

function renderCertificates() {
    const el = document.getElementById("cert-cards");
    if (!el) return;
    const items = sortVisible(window.portfolioContent.certificates || []);
    el.innerHTML = items
        .map(
            (item) => `
    <article class="card fade-in cert-card" data-cert="${item.id}" data-tags="${item.tags || ""}" data-featured="${item.featured ? "1" : "0"}">
      <i class="fa-solid fa-certificate"></i>
      <h3>${t(item.title)}</h3>
    </article>`
        )
        .join("");
}

function renderCustomSections() {
    const wrap = document.getElementById("custom-sections");
    if (!wrap) return;
    const sections = sortVisible(window.portfolioContent.customSections || []);
    wrap.innerHTML = sections
        .map(
            (sec) => `
    <section id="${sec.id}" class="section custom-section">
      <h2>${t(sec.title)}</h2>
      <div class="custom-body cards">${(sec.items || [])
          .map(
              (it) => `
        <article class="card fade-in">
          ${it.icon ? `<i class="${it.icon}"></i>` : ""}
          <h3>${t(it.title)}</h3>
          <p>${t(it.body)}</p>
        </article>`
          )
          .join("")}</div>
    </section>`
        )
        .join("");
}

function renderSectionTitles() {
    const map = {
        experience: "experience-title",
        education: "education-title",
        projects: "projects-title",
        skills: "skills-title",
        certificates: "certificates-title",
        contact: "contact-title",
    };
    Object.entries(map).forEach(([id, key]) => {
        const h = document.querySelector(`#${id} .section-title`);
        if (h) h.textContent = ui(key);
    });
    const skillsModalTitle = document.querySelector("#skills-modal h3");
    if (skillsModalTitle) skillsModalTitle.textContent = ui("all-skills");
    document.querySelectorAll("[data-ui]").forEach((el) => {
        const key = el.getAttribute("data-ui");
        if (ui(key)) el.textContent = ui(key);
    });
    document.querySelectorAll("[data-ui-placeholder]").forEach((el) => {
        const key = el.getAttribute("data-ui-placeholder");
        if (ui(key)) el.placeholder = ui(key);
    });
    const backTop = document.getElementById("back-to-top");
    if (backTop && ui("back-to-top")) {
        backTop.setAttribute("aria-label", ui("back-to-top"));
        backTop.setAttribute("title", ui("back-to-top"));
    }
}

function renderFooter() {
    const foot = document.getElementById("footer-inner");
    if (!foot) return;
    const s = window.portfolioContent.settings;
    const social = (window.portfolioContent.social || [])
        .map(
            (x) =>
                `<a href="${x.url}" target="_blank" rel="noopener" aria-label="${t(x.label)}"><i class="${x.icon}"></i></a>`
        )
        .join("");
    foot.innerHTML = `<p>© <span id="year"></span> ${s.footerName || ""}</p><div class="footer-social">${social}</div>`;
    const y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
}

function renderMeta() {
    const c = window.portfolioContent;
    const lang = window.currentLang;
    document.title = t(c.meta?.title, lang) || "Portfolio";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.content = t(c.meta?.description, lang);
    const logo = document.querySelector(".logo");
    if (logo) logo.textContent = c.settings?.logo || "H/S";
}

function buildProjectsMap() {
    const map = {};
    [...(window.portfolioContent.experience || []), ...(window.portfolioContent.education || []), ...(window.portfolioContent.projects || [])].forEach(
        (item) => {
            map[item.id] = {
                title: t(item.modalTitle || item.title),
                desc: t(item.modalDesc || item.shortDesc),
                img: item.modalImg || "",
                link: item.modalLink || "#",
            };
        }
    );
    window.projectsMap = map;
}

function buildCertsMap() {
    const map = {};
    (window.portfolioContent.certificates || []).forEach((item) => {
        map[item.id] = { title: t(item.title), desc: t(item.desc), img: item.img || "" };
    });
    window.certsMap = map;
}

function applyUiLanguage(lang) {
    window.currentLang = lang;
    renderMeta();
    renderNav();
    renderHero();
    renderSectionTitles();
    renderExperience();
    renderEducation();
    renderProjects();
    renderSkills();
    renderCertificates();
    renderCustomSections();
    renderFooter();
    buildProjectsMap();
    buildCertsMap();
    document.querySelectorAll('form.glass [name="email"]').forEach((inp) => {
        const email = window.portfolioContent.settings?.contactEmail;
        if (email && inp.closest("form")) inp.closest("form").action = `mailto:${email}`;
    });
}

function showLoadError(message) {
    let box = document.getElementById("load-error");
    if (!box) {
        box = document.createElement("div");
        box.id = "load-error";
        box.className = "load-error";
        document.body.prepend(box);
    }
    box.hidden = false;
    box.innerHTML = `<strong>Məzmun yüklənmədi</strong><p>${message}</p><p>Terminal: <code>npm start</code> → <a href="http://localhost:8080">http://localhost:8080</a></p>`;
}

window.renderPortfolio = async function () {
    try {
        window.portfolioContent = await fetchContent();
        document.getElementById("load-error")?.remove();
        applyUiLanguage(window.currentLang);
        return window.portfolioContent;
    } catch (err) {
        console.error(err);
        showLoadError(err.message || "Naməlum xəta");
        throw err;
    }
};
