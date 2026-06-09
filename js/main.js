const header = document.getElementById("header");

window.addEventListener("scroll", () => {

    if (window.scrollY > 250) {
        header.classList.add("show");
    }
    else {
        header.classList.remove("show");
    }

});

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

const themeBtn = document.getElementById("themeBtn");

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    themeBtn.textContent =
        document.body.classList.contains("dark") ? "☀️" : "🌙";
});

const langBtn = document.getElementById("langBtn");

let isJP = true;

langBtn.addEventListener("click", () => {
    isJP = !isJP;

    langBtn.textContent = isJP ? "JA" : "EN";

    document.querySelector("h2").textContent =
        isJP ? "プロフィール" : "Profile";
});
