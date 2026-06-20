<script lang="ts">
    import { onMount, tick } from 'svelte';
    import './typing.css';
    import {
        kanaToRomaji,
        problemData,
        fallbackEnglishWords,
        countryList,
        type Problem
    } from '$lib/typingData';

    // 共通 UI コンポーネントのインポート
    import Button from '$lib/components/ui/Button.svelte';
    import Card from '$lib/components/ui/Card.svelte';
    import Input from '$lib/components/ui/Input.svelte';
    import Select from '$lib/components/ui/Select.svelte';
    import Checkbox from '$lib/components/ui/Checkbox.svelte';
    import Dialog from '$lib/components/ui/Dialog.svelte';
    import Badge from '$lib/components/ui/Badge.svelte';
    import Progress from '$lib/components/ui/Progress.svelte';

    // ========== Firebase 設定 ==========
    const firebaseConfig = {
        apiKey: "AIzaSyC7-n4np2CUI_K6pzz9xg2mJpGjIp-h83M",
        authDomain: "typing-dates-ranking.firebaseapp.com",
        projectId: "typing-dates-ranking",
        storageBucket: "typing-dates-ranking.firebasestorage.app",
        messagingSenderId: "630755755162",
        appId: "1:630755755162:web:7c90be554ea3df51bf4b23",
        measurementId: "G-LZ6B4L5LK6"
    };
    const RECAPTCHA_SITE_KEY = "6LeU4ictAAAAAEub1IVEbbMNQQ6dymhYKw5M9pih";

    let firebaseReady = $state(false);
    let db: any = null;
    let auth: any = null;

    // --- 半角変換 ---
    function toHalfWidth(str: string): string {
        return str.replace(/\u3000/g, ' ').replace(/[\uff01-\uff5e]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
    }

    // --- 問題管理ヘルパー ---
    function getAllProblems(): Problem[] {
        return Object.values(problemData).flat();
    }
    function shuffleArray<T>(arr: T[]): T[] {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    async function fetchEnglishWords(count = 25): Promise<Problem[]> {
        try {
            const resp = await fetch(`https://random-word-api.herokuapp.com/word?number=${count}`);
            const words = await resp.json();
            return words.map((w: string) => ({ display: w, reading: w }));
        } catch (e) {
            return [...fallbackEnglishWords];
        }
    }

    let englishWordPool = $state<Problem[]>([]);
    async function prepareEnglishPool() {
        const apiWords = await fetchEnglishWords(25);
        englishWordPool = shuffleArray([...fallbackEnglishWords, ...apiWords]);
    }

    function getProblemsForGame(type: string, count: number, lang: string): Problem[] {
        if (lang === 'en') {
            const pool = englishWordPool.length >= count ? [...englishWordPool] : [...fallbackEnglishWords];
            return shuffleArray(pool).slice(0, count);
        } else {
            let pool = type === 'random' ? getAllProblems() : (problemData[type] || problemData.word);
            if (pool.length < count) {
                const rep = Math.ceil(count / pool.length);
                pool = Array(rep).fill(pool).flat();
            }
            return shuffleArray(pool).slice(0, count);
        }
    }

    function isKanji(ch: string): boolean {
        const code = ch.charCodeAt(0);
        return (code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3400 && code <= 0x4DBF) || ch === '々';
    }

    function getCharTypeMultiplier(display: string, optUseCharType: boolean, optShowRomaji: boolean, optShowReading: boolean): number {
        if (!optUseCharType) return 1.0;
        if (optShowRomaji) return 1.0;
        if (optShowReading) return 1.15;
        return 1.5;
    }
    function getCharTypeLabel(mult: number): string {
        if (mult >= 1.5) return '高補正';
        if (mult >= 1.15) return '軽補正';
        return '補正なし';
    }

    function calcComboMultiplier(c: number): number {
        return Math.min(1.5, 1 + c * 0.02);
    }
    function calcSpeedMultiplier(kps: number): number {
        if (kps >= 6) return 2.2;
        if (kps >= 5) return 1.8;
        if (kps >= 4) return 1.5;
        if (kps >= 3) return 1.2;
        if (kps >= 2) return 1.0;
        if (kps >= 1) return 0.85;
        return 0.7;
    }
    function calcAccuracyMultiplier(a: number): number {
        if (a >= 1) return 1.3;
        if (a >= 0.98) return 1.15;
        if (a >= 0.95) return 1.05;
        if (a >= 0.9) return 1.0;
        if (a >= 0.8) return 0.85;
        return 0.6;
    }

    interface Grade {
        grade: string;
        css: string;
        label: string;
    }
    function getGrade(finalScore: number, kps: number, accuracy: number, useCharType: boolean): Grade {
        if (!useCharType) {
            if (kps >= 5.0 && accuracy >= 0.95) return { grade: 'OMG', css: 'grade-omg', label: 'OMG!!' };
            if (kps >= 4.5 && accuracy >= 0.95) return { grade: 'Very Great', css: 'grade-vg', label: 'Very Great!' };
            if (kps >= 4.0 && accuracy >= 0.95) return { grade: 'Great', css: 'grade-great', label: 'Great!' };
            if (kps >= 3.0 && accuracy >= 0.90) return { grade: 'Good', css: 'grade-good', label: 'Good' };
            if (kps >= 2.0 && accuracy >= 0.80) return { grade: 'Soso', css: 'grade-soso', label: 'Soso' };
            return { grade: 'Bad', css: 'grade-bad', label: 'Bad...' };
        } else {
            if (finalScore >= 2000) return { grade: 'OMG', css: 'grade-omg', label: 'OMG!!' };
            if (finalScore >= 1200) return { grade: 'Very Great', css: 'grade-vg', label: 'Very Great!' };
            if (finalScore >= 700)  return { grade: 'Great', css: 'grade-great', label: 'Great!' };
            if (finalScore >= 300)  return { grade: 'Good', css: 'grade-good', label: 'Good' };
            if (finalScore >= 100)  return { grade: 'Soso', css: 'grade-soso', label: 'Soso' };
            return { grade: 'Bad', css: 'grade-bad', label: 'Bad...' };
        }
    }

    // --- ランキングデータ構造 ---
    interface RankingEntry {
        name: string;
        country: string;
        score: number;
        grade: string;
        lang: string;
        mode: string;
        type: string;
        accuracy: number;
        kps: number;
        wpm: number;
        elapsedSec: number;
        date: string | null;
    }

    const RK = 'typing_rank_final_v6';
    function loadLocalRankings(): RankingEntry[] {
        if (typeof window === 'undefined') return [];
        try {
            return JSON.parse(localStorage.getItem(RK) || '[]') || [];
        } catch {
            return [];
        }
    }
    function saveLocalRanking(entry: RankingEntry) {
        if (typeof window === 'undefined') return;
        const r = loadLocalRankings();
        r.push(entry);
        r.sort((a, b) => b.score - a.score);
        localStorage.setItem(RK, JSON.stringify(r.slice(0, 50)));
    }
    function clearLocalRankings() {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(RK);
    }
    function filterRankings(r: RankingEntry[], m: string, t: string, l: string): RankingEntry[] {
        return r.filter(x =>
            (m === 'all' || x.mode === m) &&
            (t === 'all' || x.type === t) &&
            (l === 'all' || (x.lang || 'ja') === l)
        );
    }

    let globalVisibility = $state(true);
    function loadGlobalVisibility() {
        if (typeof window === 'undefined') return;
        const val = localStorage.getItem('typing_global_visibility');
        globalVisibility = val === null ? true : val === 'true';
    }
    function setGlobalVisibility(visible: boolean) {
        if (typeof window === 'undefined') return;
        localStorage.setItem('typing_global_visibility', String(visible));
        globalVisibility = visible;
    }

    let _lastSavedEntry: RankingEntry | null = null;
    async function saveGlobalRanking(entry: RankingEntry) {
        _lastSavedEntry = entry;
        if (!globalVisibility) return;

        if (firebaseReady && db) {
            try {
                const firebaseModules = (window as any).__firebaseModules;
                if (firebaseModules) {
                    const { collection, addDoc, serverTimestamp } = firebaseModules;
                    await addDoc(collection(db, 'rankings'), {
                        displayName: entry.name,
                        country: entry.country || '',
                        score: entry.score,
                        grade: entry.grade,
                        lang: entry.lang,
                        mode: entry.mode,
                        type: entry.type,
                        accuracy: entry.accuracy,
                        kps: entry.kps,
                        wpm: entry.wpm,
                        elapsedSec: entry.elapsedSec,
                        createdAt: serverTimestamp()
                    });
                    console.log('Firebase にスコアを保存しました');
                    return;
                }
            } catch (e) {
                console.error('Firebase 保存エラー', e);
            }
        }

        try {
            const backup = JSON.parse(localStorage.getItem('typing_global_backup') || '[]');
            backup.push(entry);
            localStorage.setItem('typing_global_backup', JSON.stringify(backup.slice(-20)));
        } catch (e) {}
    }

    async function loadGlobalRankings(): Promise<RankingEntry[]> {
        if (!firebaseReady || !db) return [];
        try {
            const firebaseModules = (window as any).__firebaseModules;
            if (firebaseModules) {
                const { collection, query, orderBy, limit, getDocs } = firebaseModules;
                const q = query(collection(db, 'rankings'), orderBy('score', 'desc'), limit(50));
                const snapshot = await getDocs(q);
                const results: RankingEntry[] = [];
                snapshot.forEach((doc: any) => {
                    const data = doc.data();
                    results.push({
                        name: data.displayName,
                        country: data.country || '',
                        score: data.score,
                        grade: data.grade,
                        lang: data.lang || 'ja',
                        mode: data.mode,
                        type: data.type,
                        accuracy: data.accuracy,
                        kps: data.kps,
                        wpm: data.wpm,
                        elapsedSec: data.elapsedSec,
                        date: data.createdAt ? data.createdAt.toDate().toISOString() : null
                    });
                });
                return results;
            }
        } catch (e) {}
        return [];
    }

    let userName = $state('');
    let userCountry = $state('');

    function loadUserInfo() {
        if (typeof window === 'undefined') return;
        userName = localStorage.getItem('typing_user_name') || '';
        userCountry = localStorage.getItem('typing_user_country') || '';
    }
    function setUserInfo(name: string, country: string) {
        if (typeof window === 'undefined') return;
        localStorage.setItem('typing_user_name', name);
        localStorage.setItem('typing_user_country', country);
        userName = name;
        userCountry = country;
    }

    // --- 「ん」の動的候補 ---
    function getAcceptedForN(nextToken: string | null): string[] {
        const restrictPatterns = /^[あいうえおぁぃぅぇぉゃゅょゎなにぬねの]/;
        if (!nextToken || restrictPatterns.test(nextToken)) return ['nn'];
        if (nextToken) {
            const nextRomas = kanaToRomaji[nextToken] || [];
            if (nextRomas.length > 0 && 'aiueo'.includes(nextRomas[0][0])) return ['nn'];
        }
        return ['nn', 'n'];
    }

    // --- 「ー」の動的候補 ---
    function getAcceptedForChouon(prevToken: string | null): string[] {
        if (prevToken) {
            const prevCandidates = kanaToRomaji[prevToken] || [prevToken];
            const lastChar = prevCandidates[0].slice(-1);
            if ('aiueo'.includes(lastChar)) {
                return [lastChar + lastChar, '-'];
            }
        }
        return ['-'];
    }

    // --- テーマ設定 ---
    let isDarkMode = $state(true);
    function setTheme(dark: boolean) {
        isDarkMode = dark;
        if (typeof document !== 'undefined') {
            if (dark) {
                document.body.classList.remove('light');
            } else {
                document.body.classList.add('light');
            }
        }
        if (typeof window !== 'undefined') {
            localStorage.setItem('typingDarkMode', dark ? 'true' : 'false');
        }
    }

    // --- トースト管理 ---
    interface ToastItem {
        id: number;
        message: string;
    }
    let toastIdCounter = 0;
    let toasts = $state<ToastItem[]>([]);
    function showToast(message: string, duration = 2200) {
        const id = toastIdCounter++;
        toasts = [...toasts, { id, message }];
        setTimeout(() => {
            toasts = toasts.filter(t => t.id !== id);
        }, duration + 400);
    }

    // --- UIパネル切り替え ---
    type PanelName = 'settings' | 'game' | 'result' | 'ranking' | 'help';
    let currentPanel = $state<PanelName>('settings');

    // --- ゲーム用グローバルステート ---
    let mode = $state('normal');
    let problemType = $state('word');
    let problemLang = $state('ja');
    let difficulty = $state('intermediate');
    let optShowReading = $state(true);
    let optShowRomaji = $state(true);
    let optUseCharType = $state(false);

    let problems = $state<Problem[]>([]);
    let currentProblemIndex = $state(0);
    let tokens = $state<string[]>([]);
    let tokenIndex = $state(0);
    let displayChars = $state<string[]>([]);
    let completedRomaji = $state<string[]>([]);
    let tokenCandidates = $state<string[]>([]);
    let tokenMatchStr = $state('');
    let leftLocked = $state(true);

    let score = $state(0);
    let combo = $state(0);
    let maxCombo = $state(0);
    let totalInputs = $state(0);
    let correctInputs = $state(0);
    let mistakes = $state(0);
    let solvedCount = $state(0);

    let isPlaying = $state(false);
    let startTime = $state<number | null>(null);
    let infiniteTimeLimit = $state(4);
    let infiniteTimeLeft = $state(4);
    let infiniteTimer: any = null;

    let countdownLeft = $state(3);
    let isCountingDown = $state(false);
    let countdownPaused = $state(false);
    let countdownTimer: any = null;
    let countdownBackupTimer: any = null;
    let countdownForceTimer: any = null;
    let _countdownStartTime = 0;

    // --- 結果画面データ ---
    let resultFinalScore = $state(0);
    let resultKPS = $state(0);
    let resultWPM = $state(0);
    let resultAccuracy = $state(0);
    let resultMaxCombo = $state(0);
    let resultCharTypeMult = $state(1.0);
    let resultGradeObj = $state<Grade>({ grade: 'Bad', css: 'grade-bad', label: 'Bad...' });

    // --- ランキング表示用 ---
    let currentRankingTab = $state('local');
    let rankingModeFilter = $state('all');
    let rankingTypeFilter = $state('all');
    let rankingLangFilter = $state('all');
    let displayedRankings = $state<RankingEntry[]>([]);

    // --- モーダル表示用 ---
    let showVisibilitySettings = $state(false);
    let showNamePrompt = $state(false);
    let initialGlobalCheck = $state(true);
    let globalVisibilityCheck = $state(true);
    let userNameInputVal = $state('');
    let userCountrySelectVal = $state('');

    // --- DOM要素の参照 ---
    let problemFrameEl = $state<HTMLDivElement | null>(null);
    let linesContainerEl = $state<HTMLDivElement | null>(null);
    let lineDisplayEl = $state<HTMLDivElement | null>(null);
    let hiddenInputEl = $state<HTMLInputElement | null>(null);

    // --- タイマーリセットヘルパー ---
    function resetG() {
        clearInfiniteTimer();
        clearCountdownTimer();
        tokens = [];
        tokenIndex = 0;
        score = 0;
        combo = 0;
        maxCombo = 0;
        totalInputs = 0;
        correctInputs = 0;
        mistakes = 0;
        isPlaying = false;
        startTime = null;
        solvedCount = 0;
        tokenCandidates = [];
        tokenMatchStr = '';
        leftLocked = true;
        completedRomaji = [];
        isCountingDown = false;
        countdownPaused = false;
        countdownLeft = 3;
    }

    function clearInfiniteTimer() {
        if (infiniteTimer) {
            clearInterval(infiniteTimer);
            infiniteTimer = null;
        }
    }
    function clearCountdownTimer() {
        if (countdownTimer) clearInterval(countdownTimer);
        if (countdownBackupTimer) clearInterval(countdownBackupTimer);
        if (countdownForceTimer) clearTimeout(countdownForceTimer);
        countdownTimer = null;
        countdownBackupTimer = null;
        countdownForceTimer = null;
    }

    function startInfiniteTimer() {
        clearInfiniteTimer();
        infiniteTimeLeft = infiniteTimeLimit;
        if (isPlaying) {
            infiniteTimer = setInterval(() => {
                infiniteTimeLeft -= 0.1;
                if (infiniteTimeLeft <= 0) {
                    endGame('timeout');
                    return;
                }
            }, 100);
        }
    }
    function resetInfiniteTimer() {
        infiniteTimeLeft = infiniteTimeLimit;
    }

    // --- スピード計算（リアルタイム） ---
    let realTimeKPS = $state(0.0);
    let realTimeWPM = $state(0);

    $effect(() => {
        let timer: any;
        if (isPlaying && startTime) {
            timer = setInterval(() => {
                const elapsed = (Date.now() - startTime!) / 1000;
                if (elapsed >= 0.1) {
                    realTimeKPS = correctInputs / elapsed;
                    realTimeWPM = Math.round((correctInputs / 5) / (elapsed / 60));
                }
            }, 200);
        } else {
            realTimeKPS = 0.0;
            realTimeWPM = 0;
        }
        return () => clearInterval(timer);
    });

    // --- カウントダウン処理 ---
    function startCountdown() {
        isCountingDown = true;
        countdownLeft = 3;
        countdownPaused = false;
        currentPanel = 'game';
        clearCountdownTimer();

        // フォーカスをあてる
        setTimeout(() => {
            hiddenInputEl?.focus();
        }, 50);

        // プライマリタイマー
        countdownTimer = setInterval(() => {
            if (countdownPaused) return;
            countdownLeft -= 0.1;
            if (countdownLeft <= 0) {
                countdownLeft = 0;
                finishCountdown();
            }
        }, 100);

        // バックアップタイマー (1秒間隔で同期)
        _countdownStartTime = Date.now();
        countdownBackupTimer = setInterval(() => {
            if (!isCountingDown) return;
            const expectedLeft = 3 - ((Date.now() - _countdownStartTime) / 1000);
            if (Math.abs(countdownLeft - expectedLeft) > 0.5) {
                countdownLeft = Math.max(0, expectedLeft);
                if (countdownLeft <= 0) {
                    countdownLeft = 0;
                    finishCountdown();
                }
            }
        }, 1000);

        // 強制タイマー (5秒後強制開始)
        countdownForceTimer = setTimeout(() => {
            if (isCountingDown) {
                finishCountdown();
            }
        }, 5000);
    }

    function finishCountdown() {
        clearCountdownTimer();
        isCountingDown = false;
        startGameActual();
    }

    function startGame() {
        resetG();
        // 難易度に応じた時間制限
        switch (difficulty) {
            case 'beginner': infiniteTimeLimit = 10; break;
            case 'basic': infiniteTimeLimit = 7; break;
            case 'intermediate': infiniteTimeLimit = 4; break;
            case 'advanced': infiniteTimeLimit = 3; break;
            case 'expert': infiniteTimeLimit = 1.5; break;
            case 'master': infiniteTimeLimit = 0.5; break;
            default: infiniteTimeLimit = 4;
        }
        infiniteTimeLeft = infiniteTimeLimit;
        startCountdown();
    }

    function startGameActual() {
        problems = getProblemsForGame(problemType, mode === 'infinite' ? 999 : 15, problemLang);
        currentProblemIndex = 0;
        solvedCount = 0;
        isPlaying = true;
        startTime = Date.now();
        loadCurrentProblem();
        if (mode === 'infinite') {
            startInfiniteTimer();
        } else {
            clearInfiniteTimer();
        }
    }

    function loadCurrentProblem() {
        if (currentProblemIndex >= problems.length) {
            if (mode === 'normal') {
                endGame('complete');
                return;
            }
            problems = [...problems, ...getProblemsForGame(problemType, 50, problemLang)];
        }
        const prob = problems[currentProblemIndex];
        displayChars = [...prob.display];

        if (problemLang === 'en') {
            tokens = [...prob.display];
        } else {
            tokens = [...prob.reading].reduce((acc: string[], ch: string) => {
                if ('ゃゅょャュョ'.includes(ch) && acc.length > 0) {
                    acc[acc.length - 1] += ch;
                } else {
                    acc.push(ch);
                }
                return acc;
            }, []);
        }
        tokenIndex = 0;
        leftLocked = true;
        completedRomaji = Array(tokens.length).fill('');
        resetTokenState();
    }

    function resetTokenState() {
        const token = tokens[tokenIndex] || '';
        if (token === 'ん' && problemLang === 'ja') {
            const nextToken = tokenIndex + 1 < tokens.length ? tokens[tokenIndex + 1] : null;
            tokenCandidates = getAcceptedForN(nextToken);
        } else if (token === 'ー' && problemLang === 'ja') {
            const prevToken = tokenIndex > 0 ? tokens[tokenIndex - 1] : null;
            tokenCandidates = getAcceptedForChouon(prevToken);
        } else {
            tokenCandidates = kanaToRomaji[token] || [token];
        }
        tokenMatchStr = '';
    }

    // --- 漢字ブロックの算出ロジック ---
    interface KanjiBlock {
        startDisplayIdx: number;
        endDisplayIdx: number;
        startTokenIdx: number;
        endTokenIdx: number;
    }
    function getKanjiBlocks(): KanjiBlock[] {
        const blocks: KanjiBlock[] = [];
        let ti = 0;
        for (let di = 0; di < displayChars.length; di++) {
            if (isKanji(displayChars[di])) {
                const startDi = di;
                const startTi = ti;
                while (di < displayChars.length && isKanji(displayChars[di])) {
                    di++;
                }
                let endDi = di - 1;
                let endTi = tokens.length - 1;
                if (di < displayChars.length) {
                    const nextChar = displayChars[di];
                    for (let k = ti; k < tokens.length; k++) {
                        if (tokens[k] === nextChar) {
                            endTi = k - 1;
                            break;
                        }
                    }
                }
                blocks.push({
                    startDisplayIdx: startDi,
                    endDisplayIdx: endDi,
                    startTokenIdx: startTi,
                    endTokenIdx: endTi
                });
                ti = endTi + 1;
            } else {
                ti++;
            }
        }

        // セカンダリ
        if (blocks.length === 0 && displayChars.some(c => isKanji(c))) {
            let ti2 = 0;
            for (let di2 = 0; di2 < displayChars.length; di2++) {
                if (isKanji(displayChars[di2])) {
                    blocks.push({
                        startDisplayIdx: di2,
                        endDisplayIdx: di2,
                        startTokenIdx: ti2,
                        endTokenIdx: Math.min(ti2, tokens.length - 1)
                    });
                }
                ti2++;
            }
        }
        return blocks;
    }

    // --- リアクティブな文字描画算出 ---
    const displayCharItems = $derived.by(() => {
        const blocks = problemLang === 'ja' ? getKanjiBlocks() : [];
        return displayChars.map((char, i) => {
            let cls = 'remaining';
            if (problemLang === 'ja') {
                const block = blocks.find(b => i >= b.startDisplayIdx && i <= b.endDisplayIdx);
                if (block) {
                    if (tokenIndex > block.endTokenIdx) cls = 'correct';
                    else if (tokenIndex >= block.startTokenIdx && tokenIndex <= block.endTokenIdx) cls = 'current';
                }
            } else {
                if (i < tokenIndex) cls = 'correct';
                else if (i === tokenIndex) cls = 'current';
            }
            return { char, cls };
        });
    });

    const readingCharItems = $derived.by(() => {
        if (problemLang === 'ja' && optShowReading) {
            return tokens.map((token, i) => {
                let cls = (i < tokenIndex) ? 'correct' : (i === tokenIndex) ? 'current' : 'remaining';
                return { token, cls };
            });
        }
        return [];
    });

    const romajiCharItems = $derived.by(() => {
        if (problemLang !== 'ja' || !optShowRomaji) return [];
        const list: { char: string; cls: string }[] = [];
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const roma = (i < tokenIndex)
                ? (completedRomaji[i] || (kanaToRomaji[token]?.[0] || token))
                : (i === tokenIndex)
                    ? (tokenCandidates[0] || token)
                    : (kanaToRomaji[token]?.[0] || token);
            for (let j = 0; j < roma.length; j++) {
                let cls = 'remaining';
                if (i < tokenIndex) {
                    cls = 'correct';
                } else if (i === tokenIndex) {
                    if (j < tokenMatchStr.length) {
                        cls = 'correct';
                    } else if (j === tokenMatchStr.length) {
                        cls = 'current';
                    }
                }
                list.push({ char: roma[j], cls });
            }
        }
        return list;
    });

    // --- 自動スクロール効果 (Svelte 5 Runes 版) ---
    $effect(() => {
        // リアクティブに監視する依存関係
        const _ti = tokenIndex;
        const _pi = currentProblemIndex;
        const _dc = displayChars;

        if (typeof window !== 'undefined' && lineDisplayEl && problemFrameEl && linesContainerEl) {
            tick().then(() => {
                const currentSpan = lineDisplayEl!.querySelector('.char.current') as HTMLElement;
                if (currentSpan) {
                    const frameWidth = problemFrameEl!.clientWidth;
                    const spanLeft = currentSpan.offsetLeft;
                    const spanWidth = currentSpan.offsetWidth;
                    const containerWidth = linesContainerEl!.scrollWidth;

                    if (leftLocked && (spanLeft + spanWidth / 2 > frameWidth / 2)) {
                        leftLocked = false;
                    }
                    let targetX = leftLocked ? 0 : frameWidth / 2 - (spanLeft + spanWidth / 2);
                    if (targetX > 0) targetX = 0;
                    const minX = frameWidth - containerWidth;
                    if (targetX < minX) targetX = minX;
                    linesContainerEl!.style.transform = `translateX(${targetX}px)`;
                } else {
                    linesContainerEl!.style.transform = `translateX(0px)`;
                }
            });
        }
    });

    // --- キーボード入力フィードバックメッセージ ---
    let inputFeedbackText = $state('ここにローマ字を入力してください');
    let inputFeedbackColor = $state('var(--text2)');
    let isFeedbackError = $state(false);
    let problemFrameTransform = $state('');

    function triggerErrorFlash() {
        isFeedbackError = true;
        inputFeedbackColor = 'var(--error)';
        inputFeedbackText = '❌ ミス！';
        setTimeout(() => {
            isFeedbackError = false;
            inputFeedbackColor = 'var(--text2)';
        }, 400);

        // 揺らすアニメーション
        problemFrameTransform = 'translateX(-4px)';
        setTimeout(() => {
            problemFrameTransform = 'translateX(4px)';
        }, 80);
        setTimeout(() => {
            problemFrameTransform = '';
        }, 160);
    }

    function triggerSuccessFeedback(char: string) {
        inputFeedbackText = '✅ ' + char;
        inputFeedbackColor = 'var(--correct)';
        setTimeout(() => {
            if (isPlaying) inputFeedbackColor = 'var(--text2)';
        }, 300);
    }

    // --- キー入力処理 ---
    function handleKeyDown(e: KeyboardEvent) {
        if (!isPlaying) {
            e.preventDefault();
            return;
        }
        if (e.isComposing || e.keyCode === 229) return;
        const rawKey = e.key;
        const key = rawKey.length === 1 ? toHalfWidth(rawKey) : rawKey;
        e.preventDefault();

        if (key.length > 1 && key !== 'Backspace') return;
        if (key === 'Backspace') {
            if (tokenMatchStr.length > 0) {
                tokenMatchStr = tokenMatchStr.slice(0, -1);
                tokenCandidates = (kanaToRomaji[tokens[tokenIndex]] || []).filter(c => c.startsWith(tokenMatchStr));
                if (tokenMatchStr.length === 0 && tokens[tokenIndex] === 'ん') {
                    const nextToken = tokenIndex + 1 < tokens.length ? tokens[tokenIndex + 1] : null;
                    tokenCandidates = getAcceptedForN(nextToken);
                }
            }
            inputFeedbackText = tokenMatchStr.length ? '入力中: ' + tokenMatchStr : 'ローマ字を入力...';
            return;
        }

        if (/^[a-zA-Z]$/.test(key)) {
            processCharInput(key.toLowerCase());
        }
    }

    function processCharInput(char: string) {
        if (tokenIndex >= tokens.length) {
            advanceToNextProblem();
            return;
        }

        // 「ん」の特例判定
        if (problemLang === 'ja' && tokens[tokenIndex] === 'ん' && tokenMatchStr === 'n') {
            if (tokenCandidates.includes('n')) {
                const nextTokenIdx = tokenIndex + 1;
                if (nextTokenIdx < tokens.length) {
                    const nextToken = tokens[nextTokenIdx];
                    const nextCandidates = kanaToRomaji[nextToken] || [nextToken];
                    const nextFirstChars = new Set(nextCandidates.map(c => c[0]));
                    if (nextFirstChars.has(char)) {
                        completedRomaji[tokenIndex] = 'n';
                        tokenIndex++;
                        resetTokenState();
                        processCharInput(char);
                        return;
                    }
                }
            }
        }

        const token = tokens[tokenIndex];
        const candidates = tokenCandidates;
        const nextChars = new Set(candidates.map(c => c[tokenMatchStr.length]));

        if (nextChars.has(char)) {
            tokenMatchStr += char;
            totalInputs++;
            correctInputs++;
            combo++;
            if (combo > maxCombo) maxCombo = combo;

            const comboMult = calcComboMultiplier(combo);
            const charMult = getCharTypeMultiplier(problems[currentProblemIndex].display, optUseCharType, optShowRomaji, optShowReading);
            score += 2 * comboMult * charMult;
            tokenCandidates = candidates.filter(c => c.startsWith(tokenMatchStr));

            if (tokenCandidates.includes(tokenMatchStr)) {
                if (problemLang === 'ja' && token === 'ん' && tokenMatchStr === 'n' && tokenCandidates.includes('nn')) {
                    // nn を待つためにまだ完了しない
                } else {
                    completedRomaji[tokenIndex] = tokenMatchStr;
                    tokenIndex++;
                    if (tokenIndex < tokens.length) resetTokenState();
                    if (tokenIndex >= tokens.length) advanceToNextProblem();
                }
            }
            triggerSuccessFeedback(char);
            if (mode === 'infinite') resetInfiniteTimer();
        } else {
            totalInputs++;
            mistakes++;
            combo = 0;
            score = Math.max(0, score - 1);
            tokenMatchStr = '';
            tokenCandidates = kanaToRomaji[token] || [token];
            triggerErrorFlash();
        }
    }

    function advanceToNextProblem() {
        currentProblemIndex++;
        solvedCount++;
        if (mode === 'normal' && currentProblemIndex >= 15) {
            endGame('complete');
            return;
        }

        try {
            loadCurrentProblem();
        } catch (e) {
            problems = [...problems, ...getProblemsForGame(problemType, 5, problemLang)];
            loadCurrentProblem();
        }

        inputFeedbackText = '🎉 次の問題へ！';
        inputFeedbackColor = 'var(--accent2)';
        setTimeout(() => {
            if (isPlaying) inputFeedbackColor = 'var(--text2)';
        }, 500);

        if (typeof window !== 'undefined' && hiddenInputEl) {
            hiddenInputEl.value = '';
            hiddenInputEl.focus();
        }
    }

    async function endGame(reason: 'timeout' | 'complete') {
        isPlaying = false;
        clearInfiniteTimer();

        const elapsed = startTime ? (Date.now() - startTime) / 1000 : 0;
        const kps = correctInputs / elapsed || 0;
        const wpm = Math.round((correctInputs / 5) / (elapsed / 60)) || 0;
        const accuracy = totalInputs > 0 ? correctInputs / totalInputs : 1;

        resultFinalScore = Math.floor(score * calcSpeedMultiplier(kps) * calcAccuracyMultiplier(accuracy));
        resultGradeObj = getGrade(resultFinalScore, kps, accuracy, optUseCharType);
        resultKPS = kps;
        resultWPM = wpm;
        resultAccuracy = accuracy;
        resultMaxCombo = maxCombo;

        const activeMult = getCharTypeMultiplier(problems[0]?.display || '', optUseCharType, optShowRomaji, optShowReading);
        resultCharTypeMult = activeMult;

        const entry: RankingEntry = {
            name: userName,
            country: userCountry,
            score: resultFinalScore,
            grade: resultGradeObj.grade,
            lang: problemLang,
            mode,
            type: problemType,
            accuracy: Math.round(accuracy * 100),
            kps,
            wpm,
            elapsedSec: elapsed,
            date: new Date().toISOString()
        };

        saveLocalRanking(entry);
        await saveGlobalRanking(entry);

        currentPanel = 'result';
        if (reason === 'timeout') {
            showToast('⏰ 時間切れ！');
        } else {
            showToast('🎯 全問完了！');
        }
    }

    function quitGame() {
        if (isPlaying && totalInputs > 0 && !confirm('中断しますか？')) return;
        clearInfiniteTimer();
        resetG();
        currentPanel = 'settings';
    }

    // --- ランキング描画＆フィルタ処理 ---
    async function updateRankingDisplay() {
        let list: RankingEntry[] = [];
        if (currentRankingTab === 'local') {
            list = loadLocalRankings();
        } else {
            list = await loadGlobalRankings();
        }
        displayedRankings = filterRankings(list, rankingModeFilter, rankingTypeFilter, rankingLangFilter);
    }

    function clickRankingTab(tab: string) {
        currentRankingTab = tab;
        updateRankingDisplay();
    }

    function handleClearRanking() {
        if (confirm('ローカルランキングを削除しますか？（グローバルは削除されません）')) {
            clearLocalRankings();
            updateRankingDisplay();
            showToast('🗑 ローカルランキングをクリアしました');
        }
    }

    // --- モーダル制御 ---
    function openUserInfoBtnClick() {
        loadUserInfo();
        if (!userName || !userCountry) {
            initialGlobalCheck = globalVisibility;
            showNamePrompt = true;
        } else {
            globalVisibilityCheck = globalVisibility;
            showVisibilitySettings = true;
        }
    }

    function saveVisibilityClick() {
        setGlobalVisibility(globalVisibilityCheck);
        showVisibilitySettings = false;
        showToast('表示設定を保存しました');
    }

    function confirmNameClick() {
        const name = userNameInputVal.trim();
        const country = userCountrySelectVal;
        if (!name) {
            showToast('名前を入力してください');
            return;
        }
        if (!country) {
            showToast('国を選択してください');
            return;
        }
        setUserInfo(name, country);
        setGlobalVisibility(initialGlobalCheck);
        showNamePrompt = false;
        showToast('設定を保存しました！');
    }

    // --- フォーカス外れ対応 ---
    function handleInputBlur() {
        if (isCountingDown) {
            countdownPaused = true;
            return;
        }
        if (isPlaying) {
            setTimeout(() => {
                if (isPlaying && typeof document !== 'undefined' && document.activeElement !== hiddenInputEl) {
                    hiddenInputEl?.focus();
                }
            }, 50);
        }
    }
    function handleInputFocus() {
        if (isCountingDown) {
            countdownPaused = false;
        }
    }
    function handleGamePanelClick() {
        if (isPlaying || isCountingDown) {
            hiddenInputEl?.focus();
        }
    }

    // --- マウント時初期化 ---
    onMount(() => {
        loadUserInfo();
        loadGlobalVisibility();
        // ダークモード初期化
        const savedDark = localStorage.getItem('typingDarkMode');
        if (savedDark === null) {
            setTheme(true);
        } else {
            setTheme(savedDark === 'true');
        }

        // Firebase ロード
        const firebaseModules = (window as any).__firebaseModules;
        if (firebaseModules) {
            try {
                const { initializeApp, getFirestore, getAuth, signInAnonymously, initializeAppCheck, ReCaptchaV3Provider } = firebaseModules;
                const app = initializeApp(firebaseConfig);
                initializeAppCheck(app, {
                    provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
                    isTokenAutoRefreshEnabled: true
                });
                db = getFirestore(app);
                auth = getAuth(app);
                signInAnonymously(auth).then(() => {
                    firebaseReady = true;
                    console.log('Firebase: 匿名認証に成功しました');
                }).catch((e: any) => {
                    console.error('Firebase 初期化失敗（グローバルランキングは利用できません）', e);
                });
            } catch (e) {
                console.error('Firebase 初期化失敗（グローバルランキングは利用できません）', e);
            }
        }

        if (!userName || !userCountry) {
            initialGlobalCheck = globalVisibility;
            showNamePrompt = true;
        }

        prepareEnglishPool();

        // ページを閉じる際などの安全措置
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isPlaying) {
                quitGame();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
            clearInfiniteTimer();
            clearCountdownTimer();
        };
    });
</script>

<svelte:head>
    <title>タイピングテスト</title>
</svelte:head>

<!-- 固定ヘッダー -->
<header id="header">
    <div class="header-inner">
        <button onclick={() => { if (!isPlaying) currentPanel = 'settings'; }} class="header-logo-link" style="background:none; border:none; padding:0; text-align:left; cursor:pointer;">
            <svg class="header-avatar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <path d="M7 7h10M7 12h10M7 17h6" />
            </svg>
            <span class="header-title">タイピングテスト</span>
        </button>
        <div class="header-controls">
            <Button onclick={openUserInfoBtnClick} variant="plain" class="header-user-btn" title="表示設定">
                <span>{userName && userCountry ? `${userName} (${userCountry})` : '未設定'}</span>
            </Button>
            <Button onclick={() => { if (!isPlaying) currentPanel = 'help'; }} variant="plain" title="ヘルプ">❓</Button>
            <Button onclick={() => setTheme(!isDarkMode)} variant="plain" title="テーマ切替">
                {isDarkMode ? '🌙' : '☀️'}
            </Button>
        </div>
    </div>
</header>

<div class="app-container">
    <header class="header">
        <h1>⌨️ タイピングテスト</h1>
        <p class="subtitle">速度・正確性・認知負荷の評価</p>
    </header>

    <!-- 設定パネル -->
    {#if currentPanel === 'settings'}
        <Card variant="panel" tag="section" id="settingsPanel">
            <h2 class="panel-title">⚙️ 設定</h2>
            <div class="settings-grid">
                <div class="setting-group">
                    <label for="modeSelect">モード</label>
                    <Select id="modeSelect" bind:value={mode} title="モード選択">
                        <option value="normal">通常（15問固定）</option>
                        <option value="infinite">無限（連続出題＋時間リセット）</option>
                    </Select>
                    <div class="setting-group" class:hidden={mode !== 'infinite'} id="difficultyGroup">
                        <label for="difficultySelect">難易度</label>
                        <Select id="difficultySelect" bind:value={difficulty} title="難易度選択">
                            <option value="beginner">入門（10秒）</option>
                            <option value="basic">初級（7秒）</option>
                            <option value="intermediate">中級（4秒）</option>
                            <option value="advanced">準上級（3秒）</option>
                            <option value="expert">上級（1.5秒）</option>
                            <option value="master">最上級（0.5秒）</option>
                        </Select>
                    </div>
                </div>
                <div class="setting-group">
                    <label for="typeSelect">問題形式</label>
                    <Select id="typeSelect" bind:value={problemType} title="問題形式選択">
                        <option value="word">単語</option>
                        <option value="short">短文</option>
                        <option value="sentence">文</option>
                        <option value="long">長文</option>
                        <option value="random">ランダム</option>
                    </Select>
                    <div class="setting-group">
                        <label for="langSelect">問題言語</label>
                        <Select id="langSelect" bind:value={problemLang} title="問題言語選択">
                            <option value="ja">日本語</option>
                            <option value="en">英語</option>
                        </Select>
                    </div>
                </div>
            </div>
            <div class="options-row">
                <Checkbox bind:checked={optShowReading} label="読み仮名を表示" />
                <Checkbox bind:checked={optShowRomaji} label="ローマ字を表示" />
                <Checkbox bind:checked={optUseCharType} label="文字種補正を有効にする" />
            </div>

            <Card variant="notice" tag="div">
                <h3>⚠ 注意事項</h3>
                <ul>
                    <li>全角では認識されないので<strong>半角</strong>にしてください。</li>
                    <li>問題言語は入力文などに関するものであり、サイト全体の言語ではありません。</li>
                    <li>サイト全体の言語は日本語から変更することができません。</li>
                    <li>キーボードが無ければ利用することができません。（テストできなかった）</li>
                    <li>スコア計算や遊び方についてはヘルプをご利用ください。</li>
                </ul>
            </Card>
            <header class="header">
                <p class="notice-start">フォーカス時、<strong>3秒後</strong>に開始されます。</p>
            </header>
            <div class="btn-row">
                <Button variant="primary" onclick={startGame}>▶ スタート</Button>
                <Button variant="secondary" onclick={() => { currentPanel = 'ranking'; updateRankingDisplay(); }}>🏆 ランキング</Button>
            </div>
        </Card>
    {/if}

    <!-- ゲームパネル -->
    {#if currentPanel === 'game'}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <Card variant="panel" tag="section" id="gamePanel" onclick={handleGamePanelClick}>
            <div class="typing-area">
                <div class="problem-frame" bind:this={problemFrameEl} style="transform: {problemFrameTransform}; transition: transform 0.15s ease-out;">
                    <div class="lines-container" bind:this={linesContainerEl} class:hidden={isCountingDown}>
                        <div class="line line-display" bind:this={lineDisplayEl}>
                            {#each displayCharItems as item}
                                <span class="char {item.cls}">{item.char}</span>
                            {/each}
                        </div>
                        <div class="line line-reading" class:hidden={problemLang === 'en' || !optShowReading}>
                            {#each readingCharItems as item}
                                <span class="char {item.cls}">{item.token}</span>
                            {/each}
                        </div>
                        <div class="line line-romaji" class:hidden={problemLang === 'en' || !optShowRomaji}>
                            {#each romajiCharItems as item}
                                <span class="char {item.cls}">{item.char}</span>
                            {/each}
                        </div>
                    </div>
                </div>

                {#if isCountingDown}
                    <div class="countdown-overlay" id="countdownOverlay" style="display: flex;">
                        <div class="countdown-number" id="countdownNumber">
                            {Math.ceil(countdownLeft)}
                        </div>
                    </div>
                {/if}

                <div class="input-feedback" style="color: {inputFeedbackColor}" class:error-flash={isFeedbackError}>
                    {inputFeedbackText}
                </div>

                <input
                    type="text"
                    class="hidden-input"
                    bind:this={hiddenInputEl}
                    onkeydown={handleKeyDown}
                    onblur={handleInputBlur}
                    onfocus={handleInputFocus}
                    oninput={(e) => { (e.target as HTMLInputElement).value = ''; }}
                    title="タイピング入力エリア"
                    autocomplete="off"
                    autocorrect="off"
                    spellcheck="false"
                >

                <div class="timer-section">
                    <Progress
                        value={infiniteTimeLeft}
                        max={infiniteTimeLimit}
                        urgent={infiniteTimeLeft / infiniteTimeLimit < 0.25}
                        class={mode !== 'infinite' || isCountingDown ? 'hidden' : ''}
                    />
                    <div class="timer-info">
                        <span class="timer-text" class:urgent={infiniteTimeLeft / infiniteTimeLimit < 0.25}>
                            {mode === 'infinite' && !isCountingDown ? Math.max(0, infiniteTimeLeft).toFixed(1) + 's' : ''}
                        </span>
                        <span class="speed-indicators">
                            {isPlaying && startTime ? `${realTimeKPS.toFixed(1)}打鍵/秒 | ${realTimeWPM} WPM` : ''}
                        </span>
                    </div>
                </div>
            </div>
            <div class="stats-row">
                <Card variant="stat">
                    <div class="stat-value">{Math.floor(score)}</div>
                    <div class="stat-label">スコア</div>
                </Card>
                <Card variant="stat">
                    <div class="stat-value">{combo}</div>
                    <div class="stat-label">コンボ</div>
                </Card>
                <Card variant="stat">
                    <div class="stat-value">
                        {totalInputs > 0 ? Math.round((correctInputs / totalInputs) * 100) : 100}%
                    </div>
                    <div class="stat-label">正確率</div>
                </Card>
                <Card variant="stat">
                    <div class="stat-value">
                        {#if mode === 'normal'}
                            {currentProblemIndex + 1}/15
                        {:else}
                            ∞ ({solvedCount}問)
                        {/if}
                    </div>
                    <div class="stat-label">進捗</div>
                </Card>
            </div>
            <div class="btn-row">
                <Button variant="secondary" size="sm" onclick={quitGame}>✕ 中断</Button>
            </div>
        </Card>
    {/if}

    <!-- 結果パネル -->
    {#if currentPanel === 'result'}
        <Card variant="panel" tag="section" id="resultPanel">
            <div class="grade-display {resultGradeObj.css}">{resultGradeObj.label}</div>
            <div class="result-details">
                <Card variant="stat-highlight">
                    <div class="stat-value">{resultFinalScore}</div>
                    <div class="stat-label">最終スコア</div>
                </Card>
                <Card variant="stat">
                    <div class="stat-value">{resultKPS.toFixed(1)}</div>
                    <div class="stat-label">打鍵/秒</div>
                </Card>
                <Card variant="stat">
                    <div class="stat-value">{resultWPM}</div>
                    <div class="stat-label">WPM</div>
                </Card>
                <Card variant="stat">
                    <div class="stat-value">{Math.round(resultAccuracy * 100)}%</div>
                    <div class="stat-label">正確率</div>
                </Card>
                <Card variant="stat">
                    <div class="stat-value">{resultMaxCombo}</div>
                    <div class="stat-label">最大コンボ</div>
                </Card>
                <Card variant="stat">
                    <div class="stat-value">
                        {optUseCharType ? getCharTypeLabel(resultCharTypeMult) : '補正なし'}
                    </div>
                    <div class="stat-label">文字種補正</div>
                </Card>
            </div>
            <div class="btn-row">
                <Button variant="primary" onclick={startGame}>🔄 リトライ</Button>
                <Button variant="secondary" onclick={() => { currentPanel = 'settings'; }}>⚙️ 設定に戻る</Button>
            </div>
        </Card>
    {/if}

    <!-- ランキングパネル -->
    {#if currentPanel === 'ranking'}
        <section class="panel" id="rankingPanel">
            <h2 class="panel-title">
                {currentRankingTab === 'local' ? '🏆 ローカルランキング' : '🌐 グローバルランキング'}
            </h2>
            <div class="ranking-tabs">
                <button class="btn btn-secondary btn-sm" class:active={currentRankingTab === 'local'} onclick={() => clickRankingTab('local')}>ローカル</button>
                <button class="btn btn-secondary btn-sm" class:active={currentRankingTab === 'global'} onclick={() => clickRankingTab('global')}>グローバル</button>
            </div>
            <div class="ranking-filters">
                <select id="rankingModeFilter" bind:value={rankingModeFilter} onchange={updateRankingDisplay} title="モード絞り込み">
                    <option value="all">全モード</option>
                    <option value="normal">通常</option>
                    <option value="infinite">無限</option>
                </select>
                <select id="rankingTypeFilter" bind:value={rankingTypeFilter} onchange={updateRankingDisplay} title="問題形式絞り込み">
                    <option value="all">全形式</option>
                    <option value="word">単語</option>
                    <option value="short">短文</option>
                    <option value="sentence">文</option>
                    <option value="long">長文</option>
                    <option value="random">ランダム</option>
                </select>
                <select id="rankingLangFilter" bind:value={rankingLangFilter} onchange={updateRankingDisplay} title="言語絞り込み">
                    <option value="all">全言語</option>
                    <option value="ja">日本語</option>
                    <option value="en">英語</option>
                </select>
                <button class="btn btn-secondary btn-sm" onclick={handleClearRanking}>🗑 クリア</button>
            </div>
            <div class="ranking-table-wrap">
                <table class="ranking-table">
                    <thead>
                        <tr>
                            <th>順位</th>
                            <th>名前</th>
                            <th>国</th>
                            <th>スコア</th>
                            <th>評価</th>
                            <th>言語</th>
                            <th>モード</th>
                            <th>形式</th>
                            <th>正確率</th>
                            <th>WPM</th>
                            <th>日時</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#if displayedRankings.length === 0}
                            <tr>
                                <td colspan="11" class="empty-message">データがありません</td>
                            </tr>
                        {:else}
                            {#each displayedRankings.slice(0, 10) as r, i}
                                {@const rank = i + 1}
                                {@const rc = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other'}
                                {@const grade = getGrade(r.score, r.kps || 0, r.accuracy / 100, false)}
                                {@const langLabel = r.lang === 'en' ? '🇬🇧 英語' : '🇯🇵 日本語'}
                                <tr>
                                    <td><span class="rank-badge {rc}">{rank}</span></td>
                                    <td>{r.name}</td>
                                    <td>{r.country}</td>
                                    <td><strong>{r.score}</strong></td>
                                    <td><span class={grade.css}>{r.grade || grade.grade}</span></td>
                                    <td>{langLabel}</td>
                                    <td>{r.mode === 'infinite' ? '無限' : '通常'}</td>
                                    <td>
                                        {r.type === 'word' ? '単語' : r.type === 'short' ? '短文' : r.type === 'sentence' ? '文' : r.type === 'long' ? '長文' : r.type === 'random' ? 'ランダム' : r.type}
                                    </td>
                                    <td>{r.accuracy}%</td>
                                    <td>{r.wpm || '-'}</td>
                                    <td>
                                        {r.date ? new Date(r.date).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </td>
                                </tr>
                            {/each}
                        {/if}
                    </tbody>
                </table>
            </div>
            <p class="ranking-note">※ グローバルランキングはFirebase経由で動作しています。</p>
            <div class="btn-row">
                <button class="btn btn-secondary" onclick={() => { currentPanel = 'settings'; }}>閉じる</button>
            </div>
        </section>
    {/if}

    <!-- ヘルプパネル -->
    {#if currentPanel === 'help'}
        <section class="panel" id="helpPanel">
            <h2 class="panel-title">❓ ヘルプ</h2>
            <div class="help-section">
                <h3>🎮 遊び方</h3>
                <ul>
                    <li>表示された問題文を、ローマ字でタイピングします。</li>
                    <li>IME（日本語入力）を<strong>オフ</strong>にして、半角英数で直接入力してください。</li>
                    <li>カウントダウン後、問題の先頭から順にタイピングが始まります。</li>
                    <li>通常モードでは15問を解答、無限モードでは時間切れまで連続出題されます。</li>
                </ul>
            </div>
            <div class="help-section">
                <h3>⌨️ 句読点・特殊文字の入力</h3>
                <ul>
                    <li>「<strong>。</strong>」は <strong>ten</strong> と入力します（ピリオド「.」では入力できません）</li>
                    <li>「<strong>、</strong>」は <strong>,</strong>（カンマ）</li>
                    <li>「<strong>！</strong>」は <strong>!</strong></li>
                    <li>「<strong>？</strong>」は <strong>?</strong></li>
                    <li>小さい文字（ぁ・ゃ・っ など）は <strong>l</strong> または <strong>x</strong> を前に付けます（例：<strong>la</strong> → ぁ、<strong>lya</strong> → ゃ、<strong>ltu</strong> → っ）</li>
                    <li>促音「っ」は子音を重ねても入力できます（例：<strong>kka</strong> → っか）</li>
                </ul>
            </div>
            <div class="help-section">
                <h3>📊 文字種補正について</h3>
                <ul>
                    <li>チェックボックス「文字種補正を有効にする」が<strong>ON</strong>の場合、問題の文字構成に応じてスコアに補正が掛かります。</li>
                    <li><strong>ローマ字表示ON</strong>：補正なし（1.0倍）</li>
                    <li><strong>読み仮名のみ表示</strong>：軽補正（1.15倍）</li>
                    <li><strong>両方非表示</strong>：高補正（1.5倍）</li>
                    <li>補正が高いほど、同じ入力でも高スコアを得られます。</li>
                </ul>
            </div>
            <div class="help-section">
                <h3>🧮 スコア計算方法</h3>
                <ul>
                    <li><strong>基本加算</strong>：正しい1打鍵ごとに +2点 × コンボ倍率 × 文字種補正</li>
                    <li><strong>コンボ倍率</strong>：連続正解数に応じて上昇（最大1.5倍、25コンボで到達）</li>
                    <li><strong>ミス</strong>：-1点、コンボは0にリセット</li>
                    <li><strong>終了時補正</strong>：入力速度（打鍵/秒）と正確率に応じた倍率を<strong>生スコアに乗算</strong></li>
                    <li>速度倍率：2.0打鍵/秒で1.0倍、5.0打鍵/秒で1.8倍、6.0打鍵/秒以上で2.2倍</li>
                    <li>正確率倍率：90%以上で1.0倍、100%で1.3倍</li>
                    <li>全条件達成最高倍率：<strong>6.435倍</strong></li>
                </ul>
            </div>
            <div class="help-section">
                <h3>🏅 評価の判定</h3>
                <ul>
                    <li><strong>補正OFF時</strong>：速度と正確率で評価が決まります（5打/秒＆95%以上でOMG!!）</li>
                    <li><strong>補正ON時</strong>：最終スコアによって6段階で評価されます</li>
                    <li>OMG!! / Very Great! / Great! / Good / Soso / Bad... の順に高評価</li>
                    <li>同じ打鍵でも、正確率が高いほど高評価を得やすくなります。</li>
                </ul>
            </div>
            <div class="btn-row">
                <button class="btn btn-secondary" onclick={() => { currentPanel = 'settings'; }}>閉じる</button>
            </div>
        </section>
    {/if}
</div>

<!-- グローバル表示設定モーダル -->
{#if showVisibilitySettings}
    <div class="modal-overlay" id="visibilitySettingsOverlay">
        <div class="modal">
            <h2>表示設定</h2>
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" bind:checked={globalVisibilityCheck}> グローバルランキングにスコアを表示する
                </label>
            </div>
            <p class="modal-note">オフにすると、あなたのスコアはローカルにのみ保存され、世界中には公開されません。</p>
            <div class="btn-row">
                <button class="btn btn-primary" onclick={saveVisibilityClick}>保存</button>
                <button class="btn btn-secondary" onclick={() => { showVisibilitySettings = false; }}>閉じる</button>
            </div>
        </div>
    </div>
{/if}

<!-- 初回設定モーダル -->
{#if showNamePrompt}
    <div class="modal-overlay" id="namePromptOverlay">
        <div class="modal">
            <h2>はじめまして！</h2>
            <p>タイピングテストを始める前に、お名前と国を教えてください。</p>
            <p class="modal-note">※ 一度設定すると変更できません。</p>
            <div class="modal-form">
                <div class="form-group">
                    <label for="userNameInput">お名前</label>
                    <input type="text" id="userNameInput" bind:value={userNameInputVal} placeholder="名前を入力" maxlength="20">
                </div>
                <div class="form-group">
                    <label for="userCountrySelect">国 / 地域</label>
                    <select id="userCountrySelect" bind:value={userCountrySelectVal}>
                        <option value="">選択してください</option>
                        {#each countryList as c}
                            <option value={c}>{c}</option>
                        {/each}
                    </select>
                </div>
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" bind:checked={initialGlobalCheck}> グローバルランキングにスコアを表示する
                    </label>
                </div>
                <button class="btn btn-primary" onclick={confirmNameClick}>決定</button>
            </div>
        </div>
    </div>
{/if}

<!-- トースト -->
<div id="toastContainer">
    {#each toasts as t (t.id)}
        <div class="toast">{t.message}</div>
    {/each}
</div>
