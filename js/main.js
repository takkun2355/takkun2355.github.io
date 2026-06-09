const header = document.getElementById("header");

window.addEventListener("scroll", () => {
    if (window.scrollY > 250) {
        header.classList.add("show");
    } else {
        header.classList.remove("show");
    }
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

/* dark mode */
const themeBtn = document.getElementById("themeBtn");

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    themeBtn.textContent =
        document.body.classList.contains("dark") ? "☀️" : "🌙";
});

/* language (簡易) */
const langBtn = document.getElementById("langBtn");

let isJP = true;

langBtn.addEventListener("click", () => {
    isJP = !isJP;
    langBtn.textContent = isJP ? "JA" : "EN";
});
