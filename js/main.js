(function() {
    // ---------- 多言語対応 ----------
    const translations = {
        ja: {
            trans: "ja",
            alias: "別名: unkoman",
            hero_desc: "Discord Bot・Webツール開発",
            profile_title: "プロフィール",
            profile_body: "私はunkoman!!（スタレでくそ笑った）<br><br>主にDiscord BotやPython系ツールを作っています。<br><br>思いついたものを作るのが好きです。<br><br>VCにいることもありますが、あまり喋りません。",
            activity_title: "活動内容",
            activity_body: "Discord BotやWebツールを個人で開発しています。<br>小規模な実験プロジェクトが中心です。",
            skills_title: "できること",
            web: "Web開発",
            copy: "コピペ技術",
            games_title: "ゲーム",
            interests_title: "現在の興味",
            interest1: "Discord Bot Cogs",
            interest2: "AI活用",
            interest3: "VC",
            interest4: "VALORANT",
            interest5: "音楽（ボカロ等）",
            projects_title: "プロジェクト",
            project1_desc: "オフライン漫画ビューア",
            project2_desc: "Discord向けBot",
            project3_desc: "身内向けDiscord Bot",
            links_title: "リンク"
        },
        en: {
            trans: "en",
            alias: "Alias: unkoman",
            hero_desc: "Discord Bot & Web Tool Development",
            profile_title: "Profile",
            profile_body: "I'm unkoman!! (laughed hard in Star Rail)<br><br>I mainly make Discord bots and Python tools.<br><br>I like to build whatever comes to mind.<br><br>Sometimes I'm in VC but I don't talk much.",
            activity_title: "Activities",
            activity_body: "I develop Discord bots and web tools as a hobby.<br>Mostly small experimental projects.",
            skills_title: "Skills",
            web: "Web develop",
            copy: "copy and paste",
            games_title: "Games",
            interests_title: "Current Interests",
            interest1: "Discord Bot Cogs",
            interest2: "AI Utilization",
            interest3: "VC",
            interest4: "VALORANT",
            interest5: "Music (Vocaloid etc.)",
            projects_title: "Projects",
            project1_desc: "Offline Manga Viewer",
            project2_desc: "Discord Bot",
            project3_desc: "Private Discord Bot",
            links_title: "Links"
        }
    };

    let currentLang = localStorage.getItem("lang") || "ja";
    const langBtn = document.getElementById("langBtn");
    const themeBtn = document.getElementById("themeBtn");
    const header = document.getElementById("header");

    function applyLanguage(lang) {
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (translations[lang] && translations[lang][key]) {
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

    // ---------- ヘッダー表示 ----------
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
        return [...document.querySelectorAll("h2")];
    }

    window.buildMenu = function() {
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
    };
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

    // ---------- トップへ戻るボタン ----------
    const topBtn = document.createElement("div");
    topBtn.className = "top-ball";
    topBtn.innerHTML = "↑";
    topBtn.setAttribute("aria-label", "トップへ戻る");
    document.body.appendChild(topBtn);
    topBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // ---------- スクロールアニメーション ----------
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

    // ---------- ダークモード ----------
    function setTheme(isDark) {
        document.body.classList.toggle("dark", isDark);
        themeBtn.textContent = isDark ? "☀️" : "🌙";
        localStorage.setItem("darkMode", isDark ? "true" : "false");
    }
    setTheme(localStorage.getItem("darkMode") === "true");
    themeBtn.addEventListener("click", () => setTheme(!document.body.classList.contains("dark")));

    // ---------- スキルデモ ----------
    const tags = document.querySelectorAll(".tags span");
    let currentDemo = null;
    let currentSkill = null;
    let demoTimers = [];

    function addTimer(id) {
        demoTimers.push(id);
    }

    function removeDemo() {
        demoTimers.forEach(id => {
            clearInterval(id);
            clearTimeout(id);
        });
        demoTimers = [];
        if (currentDemo) {
            currentDemo.remove();
            currentDemo = null;
            currentSkill = null;
        }
    }

    function createDemoContainer() {
        const container = document.createElement("div");
        container.className = "demo-container open";
        return container;
    }

    // タイピングアニメーション共通（要素ごとに前のタイマーを自動停止）
    function typeCode(text, el) {
        // 既存のタイピングを止める
        if (el._typingTimer) {
            clearInterval(el._typingTimer);
            el._typingTimer = null;
        }
        el.textContent = "";
        let i = 0;
        const timer = setInterval(() => {
            el.textContent += text[i++];
            if (i >= text.length) {
                clearInterval(timer);
                el._typingTimer = null;
            }
        }, 10);
        el._typingTimer = timer;
        addTimer(timer);
    }

    // Python デモ
    function buildPythonDemo(container) {
        container.innerHTML = `
            <div class="terminal-area" style="margin-bottom:5px;">$ python main.py</div>
            <div class="code-area" id="py-code">print("hello Html")</div>
            <div class="terminal-area" id="py-output" style="margin-top:5px;">>> </div>
        `;
        const codeEl = container.querySelector("#py-code");
        const outEl = container.querySelector("#py-output");
        const text = 'print("hello Html")';
        codeEl.textContent = "";
        let i = 0;
        const interval = setInterval(() => {
            codeEl.textContent += text[i++];
            if (i >= text.length) {
                clearInterval(interval);
                const timeoutId = setTimeout(() => {
                    const msg = "hello Html";
                    let j = 0;
                    outEl.textContent = ">> ";
                    const outInterval = setInterval(() => {
                        outEl.textContent += msg[j++];
                        if (j >= msg.length) {
                            clearInterval(outInterval);
                        }
                    }, 80);
                    addTimer(outInterval);
                }, 500);
                addTimer(timeoutId);
            }
        }, 60);
        addTimer(interval);
    }

    // HTML/CSS 専用デモ（タブ：HTML, CSS, Preview）
    function buildHtmlCssDemo(container) {
        container.innerHTML = `
            <div class="tab-bar">
                <button data-tab="html" class="active">HTML</button>
                <button data-tab="css">CSS</button>
                <button data-tab="preview">Preview</button>
            </div>
            <div class="code-area" id="htmlcss-code"></div>
            <iframe class="preview-frame" id="htmlcss-preview" style="display:none;"></iframe>
        `;
        const codeArea = container.querySelector("#htmlcss-code");
        const previewFrame = container.querySelector("#htmlcss-preview");
        const tabBtns = container.querySelectorAll(".tab-bar button");

        const htmlCode = `<h1>htmlが送る、美しいフォント</h1>
<p>プログラムのかみ合いが創る、美しいUI。</p>`;
        const cssCode = `/* 背景はダーク、文字はグラデーション */
body {
  margin: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #0f0f1a;
  color: #fff;
  font-family: 'Segoe UI', 'Yu Gothic', sans-serif;
}
h1 {
  font-size: 2.5rem;
  background: linear-gradient(135deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shine 3s ease-in-out infinite alternate;
}
@keyframes shine {
  0% { filter: drop-shadow(0 0 10px #ff6b6b); }
  100% { filter: drop-shadow(0 0 20px #4d96ff); }
}
p {
  margin-top: 1rem;
  font-size: 1.2rem;
  color: #ccc;
  letter-spacing: 0.1em;
}`;

        function showTab(tab) {
            tabBtns.forEach(b => b.classList.remove("active"));
            container.querySelector(`[data-tab="${tab}"]`).classList.add("active");
            if (tab === "preview") {
                codeArea.style.display = "none";
                previewFrame.style.display = "block";
                const doc = `<html><head><style>${cssCode}</style></head><body>${htmlCode}</body></html>`;
                previewFrame.srcdoc = doc;
            } else {
                codeArea.style.display = "block";
                previewFrame.style.display = "none";
                if (tab === "html") typeCode(htmlCode, codeArea);
                if (tab === "css") typeCode(cssCode, codeArea);
            }
        }

        tabBtns.forEach(btn => {
            btn.addEventListener("click", () => showTab(btn.dataset.tab));
        });
        showTab("html");
    }

    // JavaScript デモ
    function buildJsDemo(container) {
        container.innerHTML = `
            <div class="code-area" id="js-code"></div>
            <div class="terminal-area" id="js-console" style="margin-top:10px;">> </div>
        `;
        const codeArea = container.querySelector("#js-code");
        const consoleEl = container.querySelector("#js-console");
        const jsCode = `console.log("hello Html");
document.body.style.background = "#111";
document.body.innerHTML += "<p style='color:lime'>JSが動いたよ</p>";`;

        codeArea.textContent = "";
        let i = 0;
        const timer = setInterval(() => {
            codeArea.textContent += jsCode[i++];
            if (i >= jsCode.length) clearInterval(timer);
        }, 15);
        addTimer(timer);

        const timeoutId = setTimeout(() => {
            let msg = "hello Html";
            let j = 0;
            consoleEl.textContent = "> ";
            const conTimer = setInterval(() => {
                consoleEl.textContent += msg[j++];
                if (j >= msg.length) clearInterval(conTimer);
            }, 80);
            addTimer(conTimer);
        }, 2000);
        addTimer(timeoutId);
    }

    // Discord Bot デモ
    function buildDiscordDemo(container) {
        container.innerHTML = `
            <div class="code-area" id="discord-code">// Discord Bot サンプル (Python)</div>
            <div class="terminal-area" id="discord-out" style="margin-top:10px;">Bot起動中...</div>
        `;
        const codeArea = container.querySelector("#discord-code");
        const outEl = container.querySelector("#discord-out");
        const code = `@bot.command()
async def ping(ctx):
    await ctx.send("Pong!")`;
        codeArea.textContent = "";
        let i = 0;
        const timer = setInterval(() => {
            codeArea.textContent += code[i++];
            if (i >= code.length) clearInterval(timer);
        }, 40);
        addTimer(timer);

        const timeoutId = setTimeout(() => {
            outEl.textContent = "> Pong! (オンライン)";
        }, 1500);
        addTimer(timeoutId);
    }

    // Web開発 デモ
    function buildWebDemo(container) {
        container.innerHTML = `
            <div class="tab-bar">
                <button data-tab="html" class="active">HTML</button>
                <button data-tab="css">CSS</button>
                <button data-tab="js">JS</button>
                <button data-tab="preview">Preview</button>
            </div>
            <div class="code-area" id="web-code"></div>
            <iframe class="preview-frame" id="web-preview" style="display:none;"></iframe>
        `;
        const codeArea = container.querySelector("#web-code");
        const previewFrame = container.querySelector("#web-preview");
        const tabBtns = container.querySelectorAll(".tab-bar button");

        const codes = {
            html: `<!DOCTYPE HTML>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css">
</head>
<body>
<h1>緑色に光るフォント</h1>
<button id="magic">クリック！！</button>
<p id="output"></p>
<script src="main.js"></script>
</body>
</html>`,
            css: `/* ミニマルだけど、光るボタン */
body {
  background: #0a0a0a;
  color: #fff;
  text-align: center;
  padding-top: 80px;
  font-family: 'Courier New', monospace;
}

h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #0ff;
  text-shadow: 0 0 15px #0ff;
}

button {
  background: #1e1e1e;
  border: 2px solid #0ff;
  color: #0ff;
  padding: 12px 28px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: 0.3s;
  border-radius: 50px;
  letter-spacing: 0.1em;
}

button:hover {
  background: #0ff;
  color: #000;
  box-shadow: 0 0 20px #0ff;
}

#output {
  margin-top: 1.5rem;
  font-size: 1.1rem;
  opacity: 0;
  transition: opacity 0.5s;
}

#output.show {
  opacity: 1;
}`,
            js: `// ボタンで魔法が起きる
document.getElementById('magic').addEventListener('click', () => {
  const out = document.getElementById('output');
  out.textContent = 'watashi ha unkoman!!';
  out.classList.add('show');
  console.log('魔法が発動したよ');
});`
        };

        function showTab(tab) {
            tabBtns.forEach(b => b.classList.remove("active"));
            container.querySelector(`[data-tab="${tab}"]`).classList.add("active");
            if (tab === "preview") {
                codeArea.style.display = "none";
                previewFrame.style.display = "block";
                const doc = `<html><head><style>${codes.css}</style></head><body>${codes.html}<script>${codes.js}<\/script></body></html>`;
                previewFrame.srcdoc = doc;
            } else {
                codeArea.style.display = "block";
                previewFrame.style.display = "none";
                typeCode(codes[tab], codeArea);  // 自動で古いタイマー停止
            }
        }

        tabBtns.forEach(btn => {
            btn.addEventListener("click", () => showTab(btn.dataset.tab));
        });
        showTab("html");
    }

    // コピペ技術 デモ
    function buildCopyDemo(container) {
        container.innerHTML = `
            <div class="code-area" style="min-height:100px;">// 便利スニペット集
function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
}</div>
            <p style="margin-top:10px; font-size:0.9em; color:#666;">クリックしてコードをコピーしてみてね</p>
        `;
        const codeArea = container.querySelector(".code-area");
        codeArea.style.cursor = "pointer";
        codeArea.addEventListener("click", () => {
            navigator.clipboard.writeText(codeArea.textContent).then(() => {
                alert("コピーしました！");
            });
        });
    }

    // スキル→デモビルダー マッピング
    const demoBuilders = {
        python: buildPythonDemo,
        html: buildHtmlCssDemo,
        javascript: buildJsDemo,
        discordbot: buildDiscordDemo,
        web: buildWebDemo,
        copy: buildCopyDemo
    };

    tags.forEach(tag => {
        tag.addEventListener("click", () => {
            const skill = tag.dataset.skill;

            if (currentSkill === skill) {
                removeDemo();
                return;
            }

            removeDemo();

            const container = createDemoContainer();
            tag.after(container);

            const builder = demoBuilders[skill] || buildWebDemo;
            builder(container);

            currentDemo = container;
            currentSkill = skill;

            requestAnimationFrame(() => {
                container.style.maxHeight = "800px";
            });
        });
    });

    applyLanguage(currentLang);
})();