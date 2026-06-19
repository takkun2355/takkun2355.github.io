(function() {
    // ──────────────────────────────────────
    // 多言語データ
    // ──────────────────────────────────────
    const translations = {
        ja: {
            page_title: "GitHub Pages Repo Finder",
            header_title: "Repo Finder",
            main_title: "GitHub Pages Repo Finder",
            main_subtitle: "GitHub PagesのURLから元リポジトリを特定",
            input_label: "🔍 URLを入力",
            input_placeholder: "https://username.github.io または独自ドメイン",
            search_btn: "検索",
            loading_default: "解析中...",
            error_default: "エラー",
            footer_text: "GitHub API使用 · 認証なしは<strong>60リクエスト/時</strong>の制限あり",
            error_no_input: "URLを入力してください。",
            error_invalid_url: "有効なURL形式で入力してください（例: https://username.github.io）。",
            error_parse_failed: "URLの解析に失敗しました。",
            error_proxy: "CORSプロキシ経由でのHTML取得に失敗しました。",
            error_empty_html: "ページのコンテンツが空か短すぎます。動的サイトの可能性があります。",
            error_not_found: "指定されたURLからGitHubリポジトリを見つけることができませんでした。",
            error_no_candidates: "このページからGitHubリポジトリの候補を見つけられませんでした。",
            error_rate_limit: "API制限中でスクレイピングにも失敗しました。",
            error_api_failed: "API通信に失敗: ",
            info_multiple: "件の候補が見つかりました。最も可能性の高いリポジトリを先頭に表示しています。",
            info_fallback: "⚠️ API制限中のため、一部情報はスクレイピングによる推定です。",
            badge_best: "★ 最有力候補",
            badge_candidate: "候補",
            badge_fallback: "推定",
            desc_none: "説明なし",
            updated_unknown: "不明",
            btn_github: "GitHubで開く",
            btn_copy: "URLコピー",
            btn_json: "JSON",
            toast_copied: "✅ URLをコピーしました",
            toast_json: "📥 JSONをダウンロードしました",
            toast_json_fail: "⚠️ エクスポートに失敗しました",
        },
        en: {
            page_title: "GitHub Pages Repo Finder",
            header_title: "Repo Finder",
            main_title: "GitHub Pages Repo Finder",
            main_subtitle: "Find original repository from GitHub Pages URL",
            input_label: "🔍 Enter URL",
            input_placeholder: "https://username.github.io or custom domain",
            search_btn: "Search",
            loading_default: "Analyzing...",
            error_default: "Error",
            footer_text: "Uses GitHub API · Unauthenticated limit: <strong>60 req/hour</strong>",
            error_no_input: "Please enter a URL.",
            error_invalid_url: "Enter a valid URL (e.g., https://username.github.io).",
            error_parse_failed: "Failed to parse URL.",
            error_proxy: "Failed to fetch HTML via CORS proxy.",
            error_empty_html: "Page content is empty or too short. May be a dynamic site.",
            error_not_found: "Could not find a GitHub repository from the given URL.",
            error_no_candidates: "No GitHub repository candidates found on this page.",
            error_rate_limit: "API rate limit reached and scraping also failed.",
            error_api_failed: "API communication failed: ",
            info_multiple: " candidates found. Most likely repo shown first.",
            info_fallback: "⚠️ API rate limited. Some data is estimated via scraping.",
            badge_best: "★ Best Match",
            badge_candidate: "Candidate",
            badge_fallback: "Estimated",
            desc_none: "No description",
            updated_unknown: "Unknown",
            btn_github: "Open in GitHub",
            btn_copy: "Copy URL",
            btn_json: "JSON",
            toast_copied: "✅ URL copied",
            toast_json: "📥 JSON downloaded",
            toast_json_fail: "⚠️ Export failed",
        }
    };

    let currentLang = localStorage.getItem("lang") || "ja";

    function t(key) {
        return translations[currentLang]?.[key] || translations.ja[key] || key;
    }

    function applyLanguage() {
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            el.innerHTML = t(key);
        });
        document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
            const key = el.getAttribute("data-i18n-placeholder");
            el.placeholder = t(key);
        });
        const searchBtn = document.getElementById("searchBtn");
        if (searchBtn) searchBtn.textContent = t("search_btn");
    }

    // ──────────────────────────────────────
    // DOM参照
    // ──────────────────────────────────────
    const urlInput = document.getElementById('urlInput');
    const searchBtn = document.getElementById('searchBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    const loadingDetail = document.getElementById('loadingDetail');
    const errorBox = document.getElementById('errorBox');
    const errorTitle = document.getElementById('errorTitle');
    const errorDetail = document.getElementById('errorDetail');
    const infoBox = document.getElementById('infoBox');
    const infoText = document.getElementById('infoText');
    const resultsContainer = document.getElementById('resultsContainer');
    const toast = document.getElementById('toast');
    const topInfoTime = document.getElementById('topInfoTime');
    const topInfoApi = document.getElementById('topInfoApi');
    const langBtn = document.getElementById('langBtn');
    const themeBtn = document.getElementById('themeBtn');
    const topBall = document.getElementById('topBall');

    let toastTimer = null;
    let isRateLimited = false;

    // ──────────────────────────────────────
    // 言語切替
    // ──────────────────────────────────────
    langBtn.addEventListener("click", () => {
        currentLang = currentLang === "ja" ? "en" : "ja";
        localStorage.setItem("lang", currentLang);
        applyLanguage();
        langBtn.textContent = currentLang === "ja" ? "EN" : "JA";
    });
    applyLanguage();
    langBtn.textContent = currentLang === "ja" ? "EN" : "JA";

    // ──────────────────────────────────────
    // テーマ切替
    // ──────────────────────────────────────
    function setTheme(isDark) {
        if (isDark) {
            document.body.classList.remove("light");
        } else {
            document.body.classList.add("light");
        }
        themeBtn.textContent = isDark ? "☀️" : "🌙";
        localStorage.setItem("darkMode", isDark ? "true" : "false");
    }
    const savedDark = localStorage.getItem("darkMode");
    if (savedDark === null) {
        setTheme(true);
    } else {
        setTheme(savedDark === "true");
    }
    themeBtn.addEventListener("click", () => {
        const isDark = !document.body.classList.contains("light");
        setTheme(!isDark);
    });

    // ──────────────────────────────────────
    // トップへ戻るボタン表示制御
    // ──────────────────────────────────────
    function updateTopBallVisibility() {
        if (window.scrollY <= 80) {
            topBall.classList.remove("visible");
        } else {
            topBall.classList.add("visible");
        }
    }
    window.addEventListener("scroll", () => {
        requestAnimationFrame(updateTopBallVisibility);
    });
    topBall.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // ──────────────────────────────────────
    // 時計更新
    // ──────────────────────────────────────
    function updateClock() {
        const now = new Date();
        topInfoTime.textContent = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    updateClock();
    setInterval(updateClock, 1000);

    // ──────────────────────────────────────
    // トースト通知
    // ──────────────────────────────────────
    function showToast(message) {
        if (toastTimer) clearTimeout(toastTimer);
        toast.textContent = message;
        toast.classList.add('show');
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
    }

    // ──────────────────────────────────────
    // レート制限表示（左上バー）
    // ──────────────────────────────────────
    function updateRateLimitDisplay(remaining, limit, resetTime) {
        if (remaining === null || limit === null) {
            topInfoApi.textContent = 'API: --/-- (--:--)';
            topInfoApi.className = 'top-info-api';
            return;
        }
        const resetDate = resetTime ? new Date(resetTime * 1000) : null;
        const resetStr = resetDate ? resetDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '--:--';
        topInfoApi.textContent = `API: ${remaining}/${limit} (${resetStr})`;
        if (remaining === 0) {
            topInfoApi.className = 'top-info-api danger';
            isRateLimited = true;
        } else if (remaining <= 5) {
            topInfoApi.className = 'top-info-api danger';
        } else if (remaining <= 15) {
            topInfoApi.className = 'top-info-api warning';
        } else {
            topInfoApi.className = 'top-info-api';
        }
    }

    function extractRateLimit(response) {
        const remaining = response.headers.get('X-RateLimit-Remaining');
        const limit = response.headers.get('X-RateLimit-Limit');
        const reset = response.headers.get('X-RateLimit-Reset');
        return {
            remaining: remaining ? parseInt(remaining) : null,
            limit: limit ? parseInt(limit) : null,
            reset: reset ? parseInt(reset) : null,
        };
    }

    async function fetchInitialRateLimit() {
        try {
            const response = await fetch('https://api.github.com/rate_limit', {
                headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'GitHubPagesFinder/1.0' },
            });
            if (response.ok) {
                const data = await response.json();
                updateRateLimitDisplay(data.resources.core.remaining, data.resources.core.limit, data.resources.core.reset);
            } else {
                updateRateLimitDisplay(null, null, null);
            }
        } catch (e) {
            updateRateLimitDisplay(null, null, null);
        }
    }
    fetchInitialRateLimit();

    // ──────────────────────────────────────
    // GitHub API
    // ──────────────────────────────────────
    async function callGitHubAPI(owner, repo) {
        if (isRateLimited) throw new Error('RATE_LIMIT_EXCEEDED');
        const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
        const response = await fetch(url, {
            headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'GitHubPagesFinder/1.0' },
        });
        const rateInfo = extractRateLimit(response);
        updateRateLimitDisplay(rateInfo.remaining, rateInfo.limit, rateInfo.reset);
        if (response.status === 404) return { exists: false, rateInfo };
        if (response.status === 403 && rateInfo.remaining !== null && rateInfo.remaining <= 0) {
            isRateLimited = true;
            throw new Error('RATE_LIMIT_EXCEEDED');
        }
        if (!response.ok) throw new Error(`API_ERROR:${response.status}`);
        const data = await response.json();
        return {
            exists: true,
            data: {
                full_name: data.full_name,
                description: data.description || '',
                stargazers_count: data.stargazers_count,
                forks_count: data.forks_count,
                updated_at: data.updated_at,
                html_url: data.html_url,
                language: data.language,
                topics: data.topics || [],
                default_branch: data.default_branch,
            },
            rateInfo,
        };
    }

    function parseGithubIoURL(urlStr) {
        const regex = /^https?:\/\/([a-zA-Z0-9][a-zA-Z0-9-]*)\.github\.io(?:\/([a-zA-Z0-9._-]+))?\/?.*$/;
        const match = urlStr.match(regex);
        if (!match) return null;
        const owner = match[1].toLowerCase();
        let repo = match[2] || null;
        if (!repo || repo === '') repo = `${owner}.github.io`;
        return { owner, repo };
    }

    async function fetchHTMLViaProxy(targetUrl) {
        const proxies = [
            `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
        ];
        for (const proxyUrl of proxies) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);
                const response = await fetch(proxyUrl, {
                    signal: controller.signal,
                    headers: { 'User-Agent': 'GitHubPagesFinder/1.0' },
                });
                clearTimeout(timeoutId);
                if (response.ok) return await response.text();
            } catch (e) { continue; }
        }
        throw new Error('PROXY_FAILED');
    }

    async function scrapeGitHubRepo(owner, repo) {
        const html = await fetchHTMLViaProxy(`https://github.com/${owner}/${repo}`);
        const starMatch = html.match(/(\d[\d,]*)\s*stars/);
        const stars = starMatch ? parseInt(starMatch[1].replace(/,/g, '')) : 0;
        const forkMatch = html.match(/(\d[\d,]*)\s*forks/);
        const forks = forkMatch ? parseInt(forkMatch[1].replace(/,/g, '')) : 0;
        const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
        const description = descMatch ? descMatch[1].trim() : '';
        const langMatch = html.match(/<span[^>]+class="[^"]*Progress-item[^"]*"[^>]*>([^<]+)<\/span>/);
        const language = langMatch ? langMatch[1].trim() : null;
        const timeMatch = html.match(/datetime="([^"]+)"/);
        const updated_at = timeMatch ? timeMatch[1] : new Date().toISOString();
        return {
            full_name: `${owner}/${repo}`,
            description,
            stargazers_count: stars,
            forks_count: forks,
            updated_at,
            html_url: `https://github.com/${owner}/${repo}`,
            language,
            _fallback: true
        };
    }

    function extractRepoFromMeta(html) {
        const match = html.match(/<meta[^>]+name=["']github:repository["'][^>]+content=["']([^"']+)["']/i)
                   || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']github:repository["']/i);
        if (match) {
            const [owner, repo] = match[1].split('/');
            return { owner: owner.toLowerCase(), repo: repo.toLowerCase() };
        }
        return null;
    }

    function extractRepoCandidates(html, pageUrl) {
        const candidates = new Map();
        const githubRepoRegex = /github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/g;
        let ghMatch;
        while ((ghMatch = githubRepoRegex.exec(html)) !== null) {
            const owner = ghMatch[1].toLowerCase();
            const repo = ghMatch[2].toLowerCase();
            if (['features','topics','marketplace','pricing','docs','blog','about','contact','sponsors','codespaces','copilot','settings','notifications','explore','issues','pull','security','account','organizations','new','import','trending','collections','events'].includes(owner)) continue;
            if (['site','pages','github-pages','readme','license','contributing','code-of-conduct','changelog'].includes(repo)) continue;
            const key = `${owner}/${repo}`;
            if (!candidates.has(key)) candidates.set(key, { owner, repo, source: 'link', priority: 10 });
        }
        const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
        if (canonicalMatch) {
            const parsed = parseGithubIoURL(canonicalMatch[1]);
            if (parsed) {
                const key = `${parsed.owner}/${parsed.repo}`;
                if (!candidates.has(key)) candidates.set(key, { owner: parsed.owner, repo: parsed.repo, source: 'canonical', priority: 30 });
                else { const ex = candidates.get(key); ex.priority = Math.max(ex.priority, 30); ex.source = 'canonical'; }
            }
        }
        if (/jekyll|github/i.test(html)) for (const [key, cand] of candidates) cand.priority += 5;
        if (/github pages|github-pages|Built with GitHub Pages/i.test(html)) for (const [key, cand] of candidates) cand.priority += 3;
        const candidateList = Array.from(candidates.values());
        candidateList.sort((a, b) => b.priority - a.priority);
        return candidateList.slice(0, 10);
    }

    async function rankCandidates(candidates) {
        const results = [];
        for (const cand of candidates) {
            try {
                const apiResult = await callGitHubAPI(cand.owner, cand.repo);
                if (apiResult.exists) results.push({ ...cand, data: apiResult.data, score: 0 });
            } catch (e) {
                if (e.message === 'RATE_LIMIT_EXCEEDED') throw e;
                continue;
            }
        }
        for (const r of results) {
            let score = r.priority || 0;
            score += (r.data.stargazers_count || 0) * 0.5;
            score += (r.data.forks_count || 0) * 0.2;
            if (r.data.updated_at) {
                const days = (new Date() - new Date(r.data.updated_at)) / (1000*60*60*24);
                if (days < 30) score += 20;
                else if (days < 180) score += 10;
                else if (days < 365) score += 5;
            }
            if (r.data.description && /pages|github\.io|website|site|ブログ|blog|ポートフォリオ|portfolio/i.test(r.data.description)) score += 8;
            r.score = score;
        }
        results.sort((a, b) => b.score - a.score);
        return results;
    }

    function displayResults(rankedResults, isGithubIo, fallbackMode = false) {
        resultsContainer.innerHTML = '';
        infoBox.style.display = 'none';
        errorBox.classList.remove('visible');
        if (rankedResults.length === 0) {
            showError(t('error_not_found'), '');
            return;
        }
        if (rankedResults.length > 1) {
            infoBox.style.display = 'flex';
            infoText.textContent = rankedResults.length + t('info_multiple');
        }
        if (fallbackMode) {
            infoBox.style.display = 'flex';
            infoText.textContent = t('info_fallback');
        }
        rankedResults.forEach((result, index) => {
            const isBest = index === 0;
            const card = document.createElement('div');
            card.className = 'result-card visible';
            card.style.animationDelay = `${index * 0.08}s`;
            const data = result.data;
            const updatedDate = data.updated_at ? new Date(data.updated_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' }) : t('updated_unknown');
            const fallbackBadge = data._fallback ? `<span class="badge badge-fallback">${t('badge_fallback')}</span>` : '';
            card.innerHTML = `
                <div class="repo-header">
                  <svg class="repo-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 010-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 11-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/></svg>
                  <span class="repo-name">${escapeHTML(data.full_name)}</span>
                  ${isBest ? `<span class="badge badge-best">${t('badge_best')}</span>` : `<span class="badge badge-candidate">${t('badge_candidate')} ${index + 1}</span>`}
                  ${fallbackBadge}
                </div>
                <div class="repo-body">
                  <p class="repo-desc${data.description ? '' : ' empty'}">${data.description ? escapeHTML(data.description) : t('desc_none')}</p>
                  <div class="stats-row">
                    <div class="stat-item"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.751.751 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg> <span class="stat-value">${data.stargazers_count.toLocaleString()}</span> stars</div>
                    <div class="stat-item"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878a2.25 2.25 0 10-1.5 0zM3.75 3.5a.75.75 0 100-1.5.75.75 0 000 1.5zm8.5 0a.75.75 0 100-1.5.75.75 0 000 1.5z"/></svg> <span class="stat-value">${data.forks_count.toLocaleString()}</span> forks</div>
                    <div class="stat-item"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 110 16A8 8 0 018 0zm0 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zm.75 3a.75.75 0 01.75.75V8h2.75a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75v-4.5A.75.75 0 018.75 4.5z"/></svg> ${t('updated_unknown') !== '不明' ? 'Updated' : '更新'}: ${updatedDate}</div>
                    ${data.language ? `<div class="stat-item"><span class="language-dot"></span> ${escapeHTML(data.language)}</div>` : ''}
                  </div>
                  <div class="action-row">
                    <a href="${escapeHTML(data.html_url)}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">${t('btn_github')}</a>
                    <button class="btn btn-secondary btn-sm copy-url-btn" data-url="${escapeHTML(data.html_url)}">${t('btn_copy')}</button>
                    <button class="btn btn-secondary btn-sm export-json-btn" data-json='${escapeHTML(JSON.stringify(data))}'>${t('btn_json')}</button>
                  </div>
                </div>
            `;
            resultsContainer.appendChild(card);
        });
        resultsContainer.querySelectorAll('.copy-url-btn').forEach(btn => {
            btn.addEventListener('click', () => copyToClipboard(btn.getAttribute('data-url')));
        });
        resultsContainer.querySelectorAll('.export-json-btn').forEach(btn => {
            btn.addEventListener('click', () => exportJSON(btn.getAttribute('data-json')));
        });
    }

    function showError(title, detail) {
        errorBox.classList.add('visible');
        errorTitle.textContent = title || t('error_default');
        errorDetail.textContent = detail || '';
        resultsContainer.innerHTML = '';
        infoBox.style.display = 'none';
    }
    function hideError() { errorBox.classList.remove('visible'); }
    function showLoading(text, detail = '') {
        loadingOverlay.classList.add('active');
        loadingText.textContent = text || t('loading_default');
        loadingDetail.textContent = detail;
        hideError();
        resultsContainer.innerHTML = '';
        infoBox.style.display = 'none';
    }
    function hideLoading() { loadingOverlay.classList.remove('active'); }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    function isValidURL(str) {
        try { const url = new URL(str); return url.protocol === 'http:' || url.protocol === 'https:'; } catch { return false; }
    }
    function normalizeURL(str) {
        if (!str.startsWith('http://') && !str.startsWith('https://')) str = 'https://' + str;
        return str;
    }
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            showToast(t('toast_copied'));
        } catch {
            const ta = document.createElement('textarea');
            ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
            document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
            showToast(t('toast_copied'));
        }
    }
    function exportJSON(jsonStr) {
        try {
            const data = JSON.parse(jsonStr);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `repo-info-${data.full_name?.replace('/', '-') || 'export'}.json`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast(t('toast_json'));
        } catch (e) { showToast(t('toast_json_fail')); }
    }

    async function handleSearch() {
        const rawInput = urlInput.value.trim();
        if (!rawInput) { showError(t('error_no_input')); return; }
        const normalizedURL = normalizeURL(rawInput);
        if (!isValidURL(normalizedURL)) { showError(t('error_invalid_url')); return; }

        hideError();
        resultsContainer.innerHTML = '';
        infoBox.style.display = 'none';

        let urlObj;
        try { urlObj = new URL(normalizedURL); } catch { showError(t('error_parse_failed')); return; }
        const hostname = urlObj.hostname.toLowerCase();

        let html = null;
        let htmlFetchFailed = false;
        try {
            showLoading(t('loading_default'), `${hostname} から情報を取得しています`);
            html = await fetchHTMLViaProxy(normalizedURL);
        } catch (e) {
            htmlFetchFailed = true;
        }

        if (html && !htmlFetchFailed && html.length >= 50) {
            const metaRepo = extractRepoFromMeta(html);
            if (metaRepo) {
                showLoading(t('loading_default'), `${metaRepo.owner}/${metaRepo.repo} を解析`);
                try {
                    const scrapedData = await scrapeGitHubRepo(metaRepo.owner, metaRepo.repo);
                    hideLoading();
                    displayResults([{ owner: metaRepo.owner, repo: metaRepo.repo, source: 'meta-tag (非API)', priority: 100, data: scrapedData, score: 80 }], false, true);
                    return;
                } catch (scrapeError) {}
            }
        }

        if (hostname.endsWith('.github.io')) {
            const parsed = parseGithubIoURL(normalizedURL);
            if (!parsed) { hideLoading(); showError(t('error_parse_failed')); return; }
            showLoading(t('loading_default'), `${parsed.owner}/${parsed.repo} を確認`);
            try {
                const apiResult = await callGitHubAPI(parsed.owner, parsed.repo);
                if (apiResult.exists) {
                    hideLoading();
                    displayResults([{ owner: parsed.owner, repo: parsed.repo, source: 'github.io (API)', priority: 100, data: apiResult.data, score: 1000 }], true);
                    return;
                } else {
                    hideLoading();
                    showError(t('error_not_found'));
                    return;
                }
            } catch (apiError) {
                if (apiError.message === 'RATE_LIMIT_EXCEEDED') {
                    try {
                        const scrapedData = await scrapeGitHubRepo(parsed.owner, parsed.repo);
                        hideLoading();
                        displayResults([{ owner: parsed.owner, repo: parsed.repo, source: 'github.io (非API)', priority: 100, data: scrapedData, score: 50 }], true, true);
                    } catch { hideLoading(); showError(t('error_rate_limit')); }
                    return;
                } else {
                    hideLoading();
                    showError(t('error_api_failed') + apiError.message);
                    return;
                }
            }
        }

        if (!html || htmlFetchFailed || html.length < 50) {
            hideLoading();
            showError(t('error_proxy'));
            return;
        }

        showLoading(t('loading_default'), '候補を探索中...');
        const candidates = extractRepoCandidates(html, normalizedURL);
        if (candidates.length === 0) {
            hideLoading();
            showError(t('error_no_candidates'));
            return;
        }

        try {
            const ranked = await rankCandidates(candidates);
            hideLoading();
            if (ranked.length === 0) showError(t('error_not_found'));
            else displayResults(ranked, false);
        } catch (e) {
            if (e.message === 'RATE_LIMIT_EXCEEDED') {
                const topCandidates = candidates.slice(0, 3);
                const fallbackResults = [];
                for (const cand of topCandidates) {
                    try { const s = await scrapeGitHubRepo(cand.owner, cand.repo); fallbackResults.push({ ...cand, data: s, score: cand.priority }); } catch {}
                }
                hideLoading();
                if (fallbackResults.length > 0) { fallbackResults.sort((a,b)=>b.score-a.score); displayResults(fallbackResults, false, true); }
                else showError(t('error_rate_limit'));
            } else {
                hideLoading();
                showError(t('error_api_failed') + e.message);
            }
        }
    }

    searchBtn.addEventListener('click', handleSearch);
    urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } });
    urlInput.focus();
})();