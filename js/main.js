const header = document.getElementById("header");

/* =========================
   HEADER SCROLL
========================= */

let ticking = false;

window.addEventListener("scroll", () => {
    if (!ticking) {
        requestAnimationFrame(() => {
            header.classList.toggle("show", window.scrollY > 250);
            ticking = false;
        });
        ticking = true;
    }
});

/* =========================
   SCROLL ANIMATION
========================= */

const targets = document.querySelectorAll(".card, .project");

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("show");
            observer.unobserve(entry.target); // 無駄監視カット
        }
    });
}, {
    threshold: 0.1
});

targets.forEach(el => observer.observe(el));

/* =========================
   DARK MODE + 保存
========================= */

const themeBtn = document.getElementById("themeBtn");

function setTheme(isDark) {
    document.body.classList.toggle("dark", isDark);
    themeBtn.textContent = isDark ? "☀️" : "🌙";
    localStorage.setItem("darkMode", isDark ? "true" : "false");
}

// 初期化
setTheme(localStorage.getItem("darkMode") === "true");

themeBtn.addEventListener("click", () => {
    const isDark = !document.body.classList.contains("dark");
    setTheme(isDark);
});

/* =========================
   LANGUAGE（現状維持仕様）
   ※UI変更禁止なので機能拡張はしない
========================= */

const langBtn = document.getElementById("langBtn");

let isJP = localStorage.getItem("lang") !== "en";

function setLang(jp) {
    langBtn.textContent = jp ? "JA" : "EN";
    localStorage.setItem("lang", jp ? "jp" : "en");
}

setLang(isJP);

langBtn.addEventListener("click", () => {
    isJP = !isJP;
    setLang(isJP);
});

/* =========================
   LOAD RESET
========================= */

window.addEventListener("load", () => {
    window.scrollTo(0, 0);
});