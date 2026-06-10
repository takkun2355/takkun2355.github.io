(function() {
    const header = document.getElementById("header");
    const themeBtn = document.getElementById("themeBtn");
    const langBtn = document.getElementById("langBtn");

    // ヘッダー表示アニメーション
    let ticking = false;
    window.addEventListener("scroll", () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                header.classList.toggle("show", window.scrollY > 250);
                const topBall = document.querySelector(".top-ball");
                if (topBall) {
                    topBall.classList.toggle("visible", window.scrollY > 50);
                }
                ticking = false;
            });
            ticking = true;
        }
    });

    // ハンバーガーメニュー
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
        return [...document.querySelectorAll("h2")];
    }
    function buildMenu() {
        menuInner.innerHTML = "";
        getSections().forEach(sec => {
            const btn = document.createElement("div");
            btn.className = "menu-item";
            btn.textContent = sec.textContent;
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const headerHeight = header.offsetHeight;
                const targetY = sec.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
                window.scrollTo({ top: targetY, behavior: "smooth" });
                closeMenu();
            });
            menuInner.appendChild(btn);
        });
    }
    buildMenu();

    function openMenu() {
        buildMenu();
        menu.classList.add("open");
        menuBtn.classList.add("active");
    }
    function closeMenu() {
        menu.classList.remove("open");
        menuBtn.classList.remove("active");
    }
    menuBtn.addEventListener("click", () => {
        menu.classList.contains("open") ? closeMenu() : openMenu();
    });
    menu.addEventListener("click", (e) => {
        if (!e.target.closest(".menu-item")) closeMenu();
    });

    // トップへ戻るボタン
    const topBtn = document.createElement("div");
    topBtn.className = "top-ball";
    topBtn.innerHTML = "↑";
    topBtn.setAttribute("aria-label", "ページトップへ戻る");
    document.body.appendChild(topBtn);
    topBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // カードのスクロールアニメーション
    const targets = document.querySelectorAll(".card, .project");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    targets.forEach(el => observer.observe(el));

    // ダークモード
    function setTheme(isDark) {
        document.body.classList.toggle("dark", isDark);
        themeBtn.textContent = isDark ? "☀️" : "🌙";
        localStorage.setItem("darkMode", isDark ? "true" : "false");
    }
    setTheme(localStorage.getItem("darkMode") === "true");
    themeBtn.addEventListener("click", () => setTheme(!document.body.classList.contains("dark")));

    // 言語ボタン（準備中）
    langBtn.addEventListener("click", () => alert("言語切り替えは準備中です。DeepLなどで翻訳してみてね。"));

    // ---- できること コードデモ ----
    const tags = document.querySelectorAll(".tags span");
    let currentDemo = null;  // 現在開いているデモのDOM要素
    let currentSkill = null; // どのスキルが開いているか

    // デモコンテナを作る関数
    function createDemoContainer(skill) {
        const container = document.createElement("div");
        container.className = "demo-container open";
        return container;
    }

    // Python用デモの中身
    function buildPythonDemo(container) {
        container.innerHTML = `
            <div class="terminal-area" style="margin-bottom:5px;">$ python main.py</div>
            <div class="code-area" style="min-height:40px;">print("hello Html")</div>
            <div class="terminal-area" id="py-output" style="margin-top:5px;">>> </div>
        `;
        // タイピングアニメーション
        const codeEl = container.querySelector(".code-area");
        const outEl = container.querySelector("#py-output");
        const text = 'print("hello Html")';
        let i = 0;
        codeEl.textContent = "";
        const interval = setInterval(() => {
            codeEl.textContent += text[i++];
            if (i >= text.length) {
                clearInterval(interval);
                // 少し待ってから出力をタイピング
                setTimeout(() => {
                    const msg = "hello Html";
                    let j = 0;
                    outEl.textContent = ">> ";
                    const outInterval = setInterval(() => {
                        outEl.textContent += msg[j++];
                        if (j >= msg.length) {
                            clearInterval(outInterval);
                        }
                    }, 80);
                }, 500);
            }
        }, 60);
    }

    // HTML/CSS/JSデモの中身
    function buildWebDemo(container) {
        container.innerHTML = `
            <div class="tab-bar">
                <button data-tab="html" class="active">HTML</button>
                <button data-tab="css">CSS</button>
                <button data-tab="js">JavaScript</button>
                <button data-tab="preview">Preview</button>
            </div>
            <div class="code-area" id="web-code"></div>
            <div class="preview-area" id="web-preview" style="display:none;"></div>
        `;

        const tabBtns = container.querySelectorAll(".tab-bar button");
        const codeArea = container.querySelector("#web-code");
        const previewArea = container.querySelector("#web-preview");

        const codes = {
            html: `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>AIの考える最強のコード</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Hello HTML</h1>
  <p>Deepseekの考えるコード</p>
  <script src="main.js"></script>
</body>
</html>`,
            css: `/* AIの考える最強のCSS */
body {
  background: #0f0f23;
  color: #00ffcc;
  font-family: monospace;
  margin: 2rem;
}
h1 {
  text-shadow: 0 0 10px #0ff;
}`,
            js: `// AIの考える最強のJavaScript
console.log("hello Html");
document.body.innerHTML += '<p>JSが動いたよ</p>';`
        };

        function typeCode(text, el) {
            el.textContent = "";
            let i = 0;
            const timer = setInterval(() => {
                el.textContent += text[i++];
                if (i >= text.length) clearInterval(timer);
            }, 10);
        }

        function showTab(tab) {
            tabBtns.forEach(b => b.classList.remove("active"));
            container.querySelector(`[data-tab="${tab}"]`).classList.add("active");
            if (tab === "preview") {
                codeArea.style.display = "none";
                previewArea.style.display = "block";
                previewArea.innerHTML = "<h3>Live Preview</h3><p>ここに上のコードが反映される…（イメージ）</p>";
            } else {
                codeArea.style.display = "block";
                previewArea.style.display = "none";
                typeCode(codes[tab], codeArea);
            }
        }

        tabBtns.forEach(btn => {
            btn.addEventListener("click", () => showTab(btn.dataset.tab));
        });

        showTab("html"); // 初期表示
    }

    // スキルタグのクリック処理
    tags.forEach(tag => {
        tag.addEventListener("click", () => {
            const skill = tag.dataset.skill;

            // 同じタグを押したら閉じる
            if (currentSkill === skill && currentDemo) {
                closeDemo();
                return;
            }

            // 別のタグが開いていたら一旦閉じる
            if (currentDemo) {
                closeDemo();
            }

            // 新しいデモを開く
            const demo = createDemoContainer(skill);
            tag.after(demo); // タグの直後に挿入
            if (skill === "python") {
                buildPythonDemo(demo);
            } else {
                // HTML/CSS/JS いずれかで web デモ
                buildWebDemo(demo);
            }

            currentDemo = demo;
            currentSkill = skill;

            // アニメーションのため少し遅延させて高さを出す
            requestAnimationFrame(() => {
                demo.style.maxHeight = demo.scrollHeight + "px";
            });
        });
    });

    function closeDemo() {
        if (!currentDemo) return;
        currentDemo.style.maxHeight = "0";
        currentDemo.style.opacity = "0";
        currentDemo.addEventListener("transitionend", function handler() {
            currentDemo.remove();
            currentDemo.removeEventListener("transitionend", handler);
            currentDemo = null;
            currentSkill = null;
        });
        // すぐに削除されないようクラス外す
        currentDemo.classList.remove("open");
    }

})();