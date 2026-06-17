(function() {
    // ---------- 多言語 ----------
    const translations = {
        ja: {
            hero_title: "Takkun2355のホームページ",
            room1_title: "この場所について",
            room1_body: "ここはTakkun2355のホームページです。<br>ポートフォリオや制作物、リンクなどをまとめています。",
            room3_title: "リンク集",
            room4_title: "ツール"
        },
        en: {
            hero_title: "Takkun2355's Home Page",
            room1_title: "About This Place",
            room1_body: "This is the home page of Takkun2355.<br>Portfolio, works, and links are gathered here.",
            room3_title: "Links",
            room4_title: "Tools"
        }
    };

    let currentLang = localStorage.getItem("lang") || "ja";
    const langBtn = document.getElementById("langBtn");
    const themeBtn = document.getElementById("themeBtn");
    const header = document.getElementById("header");

    function applyLanguage(lang) {
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (translations[lang]?.[key]) {
                el.innerHTML = translations[lang][key];
            }
        });
        if (window.buildMenu) window.buildMenu();
        langBtn.textContent = lang === "ja" ? "EN" : "JA";
    }

    langBtn.addEventListener("click", () => {
        currentLang = currentLang === "ja" ? "en" : "ja";
        localStorage.setItem("lang", currentLang);
        applyLanguage(currentLang);
    });

    // ---------- ヘッダー ----------
    let ticking = false;
    window.addEventListener("scroll", () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                header.classList.toggle("show", window.scrollY > 300);
                ticking = false;
            });
            ticking = true;
        }
    });

    // ---------- ダークモード ----------
    function setTheme(isDark) {
        document.body.classList.toggle("dark", isDark);
        themeBtn.textContent = isDark ? "☀️" : "🌙";
        localStorage.setItem("darkMode", isDark ? "true" : "false");
    }
    setTheme(localStorage.getItem("darkMode") === "true");
    themeBtn.addEventListener("click", () => setTheme(!document.body.classList.contains("dark")));

    // ---------- ハンバーガーメニュー ----------
    const menuBtn = document.createElement("div");
    menuBtn.className = "menu-btn";
    menuBtn.innerHTML = `<span></span><span></span><span></span>`;
    document.querySelector(".header-inner").appendChild(menuBtn);

    const menu = document.createElement("div");
    menu.className = "menu-panel";
    const menuInner = document.createElement("div");
    menuInner.className = "menu-inner";
    menu.appendChild(menuInner);
    document.body.appendChild(menu);

    function getSections() {
        return [...document.querySelectorAll(".room-header h2")];
    }

    window.buildMenu = function() {
        menuInner.innerHTML = "";
        getSections().forEach((sec) => {
            const btn = document.createElement("div");
            btn.className = "menu-item";
            btn.textContent = sec.textContent;
            btn.style.transitionDelay = "0s";
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const room = sec.closest(".room");
                if (room) {
                    room.classList.add("open");
                }
                const headerHeight = header.offsetHeight;
                // メニュー移動量を -30px に変更
                const targetY = sec.getBoundingClientRect().top + window.pageYOffset - headerHeight - 30;
                window.scrollTo({ top: targetY, behavior: "smooth" });
                closeMenu();
            });
            menuInner.appendChild(btn);
        });
    };
    buildMenu();

    function openMenu() {
        buildMenu();
        menu.classList.add("open");
        menuBtn.classList.add("active");
        const items = menuInner.querySelectorAll(".menu-item");
        items.forEach((item, index) => {
            item.style.transitionDelay = `${0.05 + index * 0.05}s`;
        });
    }
    function closeMenu() {
        menu.classList.remove("open");
        menuBtn.classList.remove("active");
        const items = menuInner.querySelectorAll(".menu-item");
        items.forEach(item => {
            item.style.transitionDelay = "0s";
        });
    }
    menuBtn.addEventListener("click", () => {
        menu.classList.contains("open") ? closeMenu() : openMenu();
    });
    menu.addEventListener("click", (e) => {
        if (!e.target.closest(".menu-item")) closeMenu();
    });

    // ---------- 部屋の開閉 ----------
    document.querySelectorAll(".room-header").forEach(roomHeader => {
        roomHeader.addEventListener("click", () => {
            const room = roomHeader.parentElement;
            room.classList.toggle("open");
        });
    });

    // ---------- スクロールアニメーション ----------
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll(".room").forEach(el => observer.observe(el));

    // ---------- 海と波紋 ----------
    function initGeometry() {
        const hero = document.querySelector(".hero");
        const canvas = document.createElement("canvas");
        canvas.id = "geometry-canvas";
        hero.insertBefore(canvas, hero.firstChild);

        const ctx = canvas.getContext("2d");
        let width, height;
        let time = 0;
        let ripples = [];

        function resize() {
            width = hero.offsetWidth;
            height = hero.offsetHeight;
            canvas.width = width;
            canvas.height = height;
        }
        resize();
        window.addEventListener("resize", resize);

        // 左クリック：同じ場所に時間差で波紋
        hero.addEventListener("click", (e) => {
            const rect = hero.getBoundingClientRect();
            const cx = e.clientX - rect.left;
            const cy = e.clientY - rect.top;
            const count = 5;
            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    ripples.push({
                        x: cx,
                        y: cy,
                        radius: 0,
                        maxRadius: 100 + Math.random() * 60,
                        life: 0,
                        maxLife: 2.5 + Math.random() * 1.5
                    });
                }, i * 150);
            }
        });

        // 右クリック：複数のランダム位置に一度に波紋
        hero.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            const rect = hero.getBoundingClientRect();
            const cx = e.clientX - rect.left;
            const cy = e.clientY - rect.top;
            const count = 7;
            for (let i = 0; i < count; i++) {
                const offsetX = (Math.random() - 0.5) * 60;
                const offsetY = (Math.random() - 0.5) * 60;
                ripples.push({
                    x: cx + offsetX,
                    y: cy + offsetY,
                    radius: 0,
                    maxRadius: 100 + Math.random() * 60,
                    life: 0,
                    maxLife: 2.5 + Math.random() * 1.5
                });
            }
        });

        const waveRows = 10;
        const wavePoints = 40;

        function animate() {
            time += 0.016;
            ctx.clearRect(0, 0, width, height);

            const isDark = document.body.classList.contains("dark");
            const waveColor = isDark ? "120, 140, 160" : "180, 200, 230";

            for (let row = 0; row < waveRows; row++) {
                const baseY = (height / (waveRows + 1)) * (row + 1);
                const amplitude = 15 + row * 5;
                const speed = 0.5 + row * 0.2;

                ctx.beginPath();
                for (let i = 0; i <= wavePoints; i++) {
                    const x = (width / wavePoints) * i;
                    const y = baseY + Math.sin(x * 0.008 + time * speed + row) * amplitude
                              + Math.cos(x * 0.015 + time * speed * 0.7) * amplitude * 0.4;
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.strokeStyle = `rgba(${waveColor}, 0.35)`;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            ripples = ripples.filter(rip => {
                rip.life += 0.016;
                if (rip.life >= rip.maxLife) return false;

                const progress = rip.life / rip.maxLife;
                rip.radius = rip.maxRadius * progress;

                const alpha = (1 - progress) * 0.5;

                ctx.beginPath();
                ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(${waveColor}, ${alpha})`;
                ctx.lineWidth = 2;
                ctx.stroke();

                return true;
            });

            requestAnimationFrame(animate);
        }

        animate();
    }
    initGeometry();

    // ---------- 初期化 ----------
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    applyLanguage(currentLang);
})();