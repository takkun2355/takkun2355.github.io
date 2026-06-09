const header = document.getElementById("header");

/* header show */
window.addEventListener("scroll", () => {
    header.classList.toggle("show", window.scrollY > 250);
});

/* scroll animation */
const targets = document.querySelectorAll(".card, .project");

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("show");
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
    localStorage.setItem("darkMode", isDark);
}

// 初期化
setTheme(localStorage.getItem("darkMode") === "true");

themeBtn.addEventListener("click", () => {
    const isDark = !document.body.classList.contains("dark");
    setTheme(isDark);
});

/* =========================
   LANGUAGE + 保存
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
   SCROLL RESET
========================= */

window.addEventListener("load", () => {
    window.scrollTo(0, 0);
});
