import { TypingText } from '@mogamoga1024/typing-jp';

(async function() {
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

    let firebaseReady = false, db, auth;
    try {
        const { initializeApp, getFirestore, collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, getAuth, signInAnonymously, initializeAppCheck, ReCaptchaV3Provider } = window.__firebaseModules;
        const app = initializeApp(firebaseConfig);
        initializeAppCheck(app, { provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY), isTokenAutoRefreshEnabled: true });
        db = getFirestore(app); auth = getAuth(app);
        await signInAnonymously(auth);
        firebaseReady = true;
        console.log('Firebase ready');
    } catch (e) { console.warn('Firebase init failed, global ranking unavailable', e); }

    // --- 半角変換 ---
    function toHalfWidth(str) { return str.replace(/\u3000/g, ' ').replace(/[\uff01-\uff5e]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)); }

    // --- 問題データ（日本語） ---
    const problemData = {
        word: [
            {display:'猫',reading:'ねこ'},{display:'犬',reading:'いぬ'},{display:'空',reading:'そら'},{display:'海',reading:'うみ'},
            {display:'山',reading:'やま'},{display:'花',reading:'はな'},{display:'星',reading:'ほし'},{display:'雨',reading:'あめ'},
            {display:'雪',reading:'ゆき'},{display:'風',reading:'かぜ'},{display:'太陽',reading:'たいよう'},{display:'月',reading:'つき'},
            {display:'川',reading:'かわ'},{display:'森',reading:'もり'},{display:'林檎',reading:'りんご'},{display:'葡萄',reading:'ぶどう'},
            {display:'苺',reading:'いちご'},{display:'西瓜',reading:'すいか'},{display:'桃',reading:'もも'},{display:'桜',reading:'さくら'},
            {display:'机',reading:'つくえ'},{display:'椅子',reading:'いす'},{display:'鉛筆',reading:'えんぴつ'},{display:'消しゴム',reading:'けしごむ'},
            {display:'時計',reading:'とけい'},{display:'眼鏡',reading:'めがね'},{display:'財布',reading:'さいふ'},{display:'鍵',reading:'かぎ'},
            {display:'電話',reading:'でんわ'},{display:'手紙',reading:'てがみ'},{display:'音楽',reading:'おんがく'},{display:'映画',reading:'えいが'},
            {display:'辞書',reading:'じしょ'},{display:'新聞',reading:'しんぶん'},{display:'雑誌',reading:'ざっし'},{display:'写真',reading:'しゃしん'},
            {display:'食事',reading:'しょくじ'},{display:'朝日',reading:'あさひ'},{display:'夕日',reading:'ゆうひ'},{display:'地平線',reading:'ちへいせん'},
            {display:'湖',reading:'みずうみ'},{display:'空気',reading:'くうき'},{display:'水',reading:'みず'},{display:'火',reading:'ひ'},
            {display:'石',reading:'いし'},{display:'金',reading:'きん'},{display:'銀',reading:'ぎん'},{display:'銅',reading:'どう'},
            {display:'鉄',reading:'てつ'},{display:'紙',reading:'かみ'},{display:'箱',reading:'はこ'},
        ],
        short: [
            {display:'おはよう',reading:'おはよう'},{display:'ありがとう',reading:'ありがとう'},{display:'さようなら',reading:'さようなら'},
            {display:'こんにちは',reading:'こんにちは'},{display:'すみません',reading:'すみません'},{display:'お元気ですか',reading:'おげんきですか'},
            {display:'良い天気',reading:'よいてんき'},{display:'美味しい料理',reading:'おいしいりょうり'},{display:'楽しい時間',reading:'たのしいじかん'},
            {display:'静かな場所',reading:'しずかなばしょ'},{display:'新しい本',reading:'あたらしいほん'},{display:'青い空',reading:'あおいそら'},
            {display:'広い世界',reading:'ひろいせかい'},{display:'強い気持ち',reading:'つよいきもち'},{display:'優しい人',reading:'やさしいひと'},
            {display:'早い車',reading:'はやいくるま'},{display:'甘い菓子',reading:'あまいかし'},{display:'冷たい水',reading:'つめたいみず'},
            {display:'白い雲',reading:'しろいくも'},{display:'楽な仕事',reading:'らくなしごと'},{display:'遅い時間',reading:'おそいじかん'},
            {display:'高い山',reading:'たかいやま'},{display:'安い店',reading:'やすいみせ'},{display:'難しい問題',reading:'むずかしいもんだい'},
            {display:'嬉しい知らせ',reading:'うれしいしらせ'},{display:'悲しい話',reading:'かなしいはなし'},{display:'眠い朝',reading:'ねむいあさ'},
            {display:'重い荷物',reading:'おもいにもつ'},{display:'軽い服',reading:'かるいふく'},{display:'明るい部屋',reading:'あかるいへや'},
            {display:'暗い夜',reading:'くらいよる'},{display:'美味しい水',reading:'おいしいみず'},{display:'赤い花',reading:'あかいはな'},
            {display:'黒い髪',reading:'くろいかみ'},{display:'白い歯',reading:'しろいは'},{display:'黄色い帽子',reading:'きいろいぼうし'},
            {display:'緑の葉',reading:'みどりのは'},{display:'紫の花',reading:'むらさきのはな'},{display:'金の指輪',reading:'きんのゆびわ'},
            {display:'銀の匙',reading:'ぎんのさじ'},{display:'鉄の扉',reading:'てつのとびら'},{display:'紙の飛行機',reading:'かみのひこうき'},
            {display:'箱の中',reading:'はこのなか'},{display:'外は雨',reading:'そとはあめ'},{display:'今日は晴れ',reading:'きょうははれ'},
            {display:'明日は曇り',reading:'あしたはくもり'},{display:'昨日は雪',reading:'きのうはゆき'},{display:'一昨日は嵐',reading:'おとといはあらし'},
        ],
        sentence: [
            {display:'私は毎日勉強を頑張っています。',reading:'わたしはまいにちべんきょうをがんばっています。'},
            {display:'今日はとても良い天気ですね。',reading:'きょうはとてもよいてんきですね。'},
            {display:'彼は速く走ることができます。',reading:'かれははやくはしることができます。'},
            {display:'この映画は本当に面白かった。',reading:'このえいがはほんとうにおもしろかった。'},
            {display:'明日は友達と遊びに行きます。',reading:'あしたはともだちとあそびにいきます。'},
            {display:'美味しいご飯を食べたいです。',reading:'おいしいごはんをたべたいです。'},
            {display:'静かな夜に星を見上げる。',reading:'しずかなよるにほしをみあげる。'},
            {display:'日本の四季は美しい。',reading:'にほんのしきはうつくしい。'},
            {display:'毎朝早く起きて散歩する。',reading:'まいあさはやくおきてさんぽする。'},
            {display:'読書は心の栄養です。',reading:'どくしょはこころのえいようです。'},
            {display:'彼女はとても親切な人です。',reading:'かのじょはとてもしんせつなひとです。'},
            {display:'週末は家族と過ごします。',reading:'しゅうまつはかぞくとすごします。'},
            {display:'新しい趣味を見つけたい。',reading:'あたらしいしゅみをみつけたい。'},
            {display:'駅まで歩いて十分かかります。',reading:'えきまであるいてじゅっぷんかかります。'},
            {display:'昨日は遅くまで仕事をした。',reading:'きのうはおそくまでしごとをした。'},
            {display:'毎週金曜日に図書館へ行く。',reading:'まいしゅうきんようびにとしょかんへいく。'},
            {display:'この町は歴史が古いです。',reading:'このまちはれきしがふるいです。'},
            {display:'空港までバスで行けます。',reading:'くうこうまでばすでいけます。'},
            {display:'今日は何を食べようかな。',reading:'きょうはなにをたべようかな。'},
            {display:'明日の天気は晴れでしょう。',reading:'あしたのてんきははれでしょう。'},
            {display:'コーヒーを飲みながら本を読む。',reading:'こーひーをのみながらほんをよむ。'},
            {display:'冬になると雪が降ります。',reading:'ふゆになるとゆきがふります。'},
            {display:'犬が公園を走っている。',reading:'いぬがこうえんをはしっている。'},
            {display:'駅前の店で買い物をした。',reading:'えきまえのみせでかいものをした。'},
            {display:'健康のために野菜を食べる。',reading:'けんこうのためにやさいをたべる。'},
            {display:'友達から手紙が届いた。',reading:'ともだちからてがみがとどいた。'},
            {display:'今夜は満月がきれいです。',reading:'こんやはまんげつがきれいです。'},
            {display:'この道をまっすぐ行ってください。',reading:'このみちをまっすぐいってください。'},
            {display:'来月、旅行に行く予定です。',reading:'らいげつ、りょこうにいくよていです。'},
            {display:'毎日練習すれば上手になる。',reading:'まいにちれんしゅうすればじょうずになる。'},
        ],
        long: [
            {display:'昔々あるところにお爺さんとお婆さんが住んでいました。',reading:'むかしむかしあるところにおじいさんとおばあさんがすんでいました。'},
            {display:'春が来ると桜の花が咲き乱れ、人々は公園でお花見を楽しみます。',reading:'はるがくるとさくらのはながさきみだれ、ひとびとはこうえんでおはなみをたのしみます。'},
            {display:'技術の進歩は日々加速しており、私たちの生活は大きく変化しています。',reading:'ぎじゅつのしんぽはひびかそくしており、わたしたちのせいかつはおおきくへんかしています。'},
            {display:'健康のために毎日運動することは非常に大切です。',reading:'けんこうのためにまいにちうんどうすることはひじょうにたいせつです。'},
            {display:'インターネットの普及により世界中の情報に簡単にアクセスできるようになった。',reading:'いんたーねっとのふきゅうによりせかいじゅうのじょうほうにかんたんにあくせすできるようになった。'},
            {display:'彼は長年の努力が実を結び、ついに夢を叶えることができた。',reading:'かれはながねんのどりょくがみをむすび、ついにゆめをかなえることができた。'},
            {display:'この小説は深い洞察と美しい文体で多くの読者を魅了している。',reading:'このしょうせつはふかいどうさつとうつくしいぶんたいでおおくのどくしゃをみりょうしている。'},
            {display:'環境問題は私たち一人一人が真剣に考えなければならない課題です。',reading:'かんきょうもんだいはわたしたちひとりひとりがしんけんにかんがえなければならないかだいです。'},
            {display:'朝早く起きて散歩をすると、一日がとても気持ちよく始まります。',reading:'あさはやくおきてさんぽをすると、いちにちがとてもきもちよくはじまります。'},
            {display:'外国語を学ぶことは、その国の文化を理解する第一歩だと思います。',reading:'がいこくごをまなぶことは、そのくにのぶんかをりかいするだいいっぽだとおもいます。'},
            {display:'人間は失敗から多くのことを学び成長していく生き物です。',reading:'にんげんはしっぱいからおおくのことをまなびせいちょうしていくいきものです。'},
            {display:'美しい景色を見ると心が洗われるような気持ちになります。',reading:'うつくしいけしきをみるとこころがあらわれるようなきもちになります。'},
            {display:'ボランティア活動を通じて地域社会に貢献することができます。',reading:'ぼらんてぃあかつどうをつうじてちいきしゃかいにこうけんすることができます。'},
            {display:'読書の習慣を身につけると人生がより豊かになります。',reading:'どくしょのしゅうかんをみにつけるとじんせいがよりゆたかになります。'},
            {display:'異文化を理解することは国際社会で不可欠なスキルです。',reading:'いぶんかをりかいすることはこくさいしゃかいでふかけつなすきるです。'},
            {display:'自然災害に備えて日頃から準備しておくことが重要です。',reading:'しぜんさいがいにそなえてひごろからじゅんびしておくことがじゅうようです。'},
            {display:'感謝の気持ちを忘れずに生きていきたいものです。',reading:'かんしゃのきもちをわすれずにいきていきたいものです。'},
            {display:'時間を有効に使うことは現代社会を生き抜くための鍵です。',reading:'じかんをゆうこうにつかうことはげんだいしゃかいをいきぬくためのかぎです。'},
            {display:'新しいことに挑戦する勇気を持ち続けたいと思います。',reading:'あたらしいことにちょうせんするゆうきをもちつづけたいとおもいます。'},
            {display:'友人との楽しい思い出は一生の宝物です。',reading:'ゆうじんとのたのしいおもいではいっしょうのたからものです。'},
        ],
    };

    function getAllProblems(){ return Object.values(problemData).flat(); }
    function shuffleArray(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }

    const fallbackEnglishWords = [
        {display:'apple',reading:'apple'},{display:'book',reading:'book'},{display:'cat',reading:'cat'},{display:'dog',reading:'dog'},
        {display:'egg',reading:'egg'},{display:'flower',reading:'flower'},{display:'garden',reading:'garden'},{display:'house',reading:'house'},
        {display:'ice',reading:'ice'},{display:'jungle',reading:'jungle'},{display:'key',reading:'key'},{display:'lion',reading:'lion'},
        {display:'moon',reading:'moon'},{display:'night',reading:'night'},{display:'ocean',reading:'ocean'},{display:'pencil',reading:'pencil'},
        {display:'queen',reading:'queen'},{display:'rain',reading:'rain'},{display:'sun',reading:'sun'},{display:'tree',reading:'tree'},
        {display:'umbrella',reading:'umbrella'},{display:'village',reading:'village'},{display:'water',reading:'water'},{display:'xylophone',reading:'xylophone'},
        {display:'yellow',reading:'yellow'},{display:'zebra',reading:'zebra'}
    ];

    async function fetchEnglishWords(count = 25) {
        try {
            const resp = await fetch(`https://random-word-api.herokuapp.com/word?number=${count}`);
            const words = await resp.json();
            return words.map(w => ({display:w, reading:w}));
        } catch (e) { return [...fallbackEnglishWords]; }
    }

    let englishWordPool = [];
    async function prepareEnglishPool() {
        const apiWords = await fetchEnglishWords(25);
        englishWordPool = shuffleArray([...fallbackEnglishWords, ...apiWords]);
    }

    function getProblemsForGame(type, count, lang) {
        if (lang === 'en') {
            const pool = englishWordPool.length >= count ? [...englishWordPool] : [...fallbackEnglishWords];
            return shuffleArray(pool).slice(0, count);
        } else {
            let pool = type === 'random' ? getAllProblems() : (problemData[type] || problemData.word);
            if (pool.length < count) { const rep = Math.ceil(count / pool.length); pool = Array(rep).fill(pool).flat(); }
            return shuffleArray(pool).slice(0, count);
        }
    }

    function isKanji(ch){ const code=ch.charCodeAt(0); return (code>=0x4E00&&code<=0x9FFF)||(code>=0x3400&&code<=0x4DBF)||ch==='々'; }
    function getCharTypeMultiplier(display, optUseCharType, optShowRomaji, optShowReading) {
        if (!optUseCharType) return 1.0;
        if (optShowRomaji) return 1.0;
        if (optShowReading) return 1.15;
        return 1.5;
    }
    function getCharTypeLabel(mult) { if (mult >= 1.5) return '高補正'; if (mult >= 1.15) return '軽補正'; return '補正なし'; }

    function calcComboMultiplier(c){ return Math.min(1.5, 1+c*0.02); }
    function calcSpeedMultiplier(kps){ if(kps>=6)return 2.2; if(kps>=5)return 1.8; if(kps>=4)return 1.5; if(kps>=3)return 1.2; if(kps>=2)return 1.0; if(kps>=1)return 0.85; return 0.7; }
    function calcAccuracyMultiplier(a){ if(a>=1)return 1.3; if(a>=0.98)return 1.15; if(a>=0.95)return 1.05; if(a>=0.9)return 1.0; if(a>=0.8)return 0.85; return 0.6; }

    function getGrade(finalScore, kps, accuracy, useCharType) {
        if (!useCharType) {
            if (kps >= 5.0 && accuracy >= 0.95) return {grade:'OMG',css:'grade-omg',label:'OMG!!'};
            if (kps >= 4.5 && accuracy >= 0.95) return {grade:'Very Great',css:'grade-vg',label:'Very Great!'};
            if (kps >= 4.0 && accuracy >= 0.95) return {grade:'Great',css:'grade-great',label:'Great!'};
            if (kps >= 3.0 && accuracy >= 0.90) return {grade:'Good',css:'grade-good',label:'Good'};
            if (kps >= 2.0 && accuracy >= 0.80) return {grade:'Soso',css:'grade-soso',label:'Soso'};
            return {grade:'Bad',css:'grade-bad',label:'Bad...'};
        } else {
            if (finalScore >= 2000) return {grade:'OMG',css:'grade-omg',label:'OMG!!'};
            if (finalScore >= 1200) return {grade:'Very Great',css:'grade-vg',label:'Very Great!'};
            if (finalScore >= 700)  return {grade:'Great',css:'grade-great',label:'Great!'};
            if (finalScore >= 300)  return {grade:'Good',css:'grade-good',label:'Good'};
            if (finalScore >= 100)  return {grade:'Soso',css:'grade-soso',label:'Soso'};
            return {grade:'Bad',css:'grade-bad',label:'Bad...'};
        }
    }

    const RK='typing_rank_final_v6';
    function loadLocalRankings(){try{return JSON.parse(localStorage.getItem(RK))||[];}catch{return[];}}
    function saveLocalRanking(entry){
        const r=loadLocalRankings();
        r.push(entry); r.sort((a,b)=>b.score-a.score);
        localStorage.setItem(RK,JSON.stringify(r.slice(0,50)));
    }
    function clearLocalRankings(){localStorage.removeItem(RK);}
    function filterRankings(r, m, t, l){
        return r.filter(x=>
            (m==='all'||x.mode===m) &&
            (t==='all'||x.type===t) &&
            (l==='all'||(x.lang||'ja')===l)
        );
    }

    function getGlobalVisibility() { const val = localStorage.getItem('typing_global_visibility'); return val === null ? true : val === 'true'; }
    function setGlobalVisibility(visible) {
        localStorage.setItem('typing_global_visibility', visible);
        els.globalVisibilityCheck.checked = visible;
        els.initialGlobalCheck.checked = visible;
    }

    async function saveGlobalRanking(entry) {
        if (!firebaseReady || !db) return;
        if (!getGlobalVisibility()) return;
        try {
            await addDoc(collection(db, 'rankings'), {
                displayName: entry.name, country: entry.country || '',
                score: entry.score, grade: entry.grade, lang: entry.lang,
                mode: entry.mode, type: entry.type, accuracy: entry.accuracy,
                kps: entry.kps, wpm: entry.wpm, elapsedSec: entry.elapsedSec,
                createdAt: serverTimestamp()
            });
        } catch (e) { console.warn('Firebase save error', e); }
    }

    async function loadGlobalRankings() {
        if (!firebaseReady || !db) return [];
        try {
            const q = query(collection(db, 'rankings'), orderBy('score', 'desc'), limit(50));
            const snapshot = await getDocs(q);
            const results = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                results.push({
                    name: data.displayName, country: data.country || '',
                    score: data.score, grade: data.grade, lang: data.lang || 'ja',
                    mode: data.mode, type: data.type, accuracy: data.accuracy,
                    kps: data.kps, wpm: data.wpm, elapsedSec: data.elapsedSec,
                    date: data.createdAt ? data.createdAt.toDate().toISOString() : null
                });
            });
            return results;
        } catch (e) { return []; }
    }

    function getUserInfo() {
        const name = localStorage.getItem('typing_user_name') || '';
        const country = localStorage.getItem('typing_user_country') || '';
        return { name, country };
    }
    function setUserInfo(name, country) {
        localStorage.setItem('typing_user_name', name);
        localStorage.setItem('typing_user_country', country);
        updateHeaderUserInfo();
    }
    function updateHeaderUserInfo() {
        const { name, country } = getUserInfo();
        if (name && country) {
            els.headerUserInfoText.textContent = `${name} (${country})`;
        } else {
            els.headerUserInfoText.textContent = '未設定';
        }
    }

    // --- DOM要素 ---
    const $=s=>document.querySelector(s);
    const els = {
        settingsPanel:$('#settingsPanel'), gamePanel:$('#gamePanel'), resultPanel:$('#resultPanel'), rankingPanel:$('#rankingPanel'),
        helpPanel:$('#helpPanel'),
        lineDisplay:$('#lineDisplay'), lineReading:$('#lineReading'), lineRomaji:$('#lineRomaji'),
        linesContainer:$('#linesContainer'), problemFrame:$('#problemFrame'),
        countdownOverlay:$('#countdownOverlay'), countdownNumber:$('#countdownNumber'),
        inputFeedback:$('#inputFeedback'), hiddenInput:$('#hiddenInput'),
        timerBarWrap:$('#timerBarWrap'), timerBarFill:$('#timerBarFill'), timerText:$('#timerText'), speedIndicators:$('#speedIndicators'),
        scoreValue:$('#scoreValue'), comboValue:$('#comboValue'), accuracyValue:$('#accuracyValue'), progressValue:$('#progressValue'),
        gradeDisplay:$('#gradeDisplay'), resultScore:$('#resultScore'), resultKPS:$('#resultKPS'), resultWPM:$('#resultWPM'),
        resultAccuracy:$('#resultAccuracy'), resultMaxCombo:$('#resultMaxCombo'), resultCharType:$('#resultCharType'),
        rankingBody:$('#rankingBody'), rankingModeFilter:$('#rankingModeFilter'), rankingTypeFilter:$('#rankingTypeFilter'), rankingLangFilter:$('#rankingLangFilter'),
        modeSelect:$('#modeSelect'), langSelect:$('#langSelect'), typeSelect:$('#typeSelect'), difficultySelect:$('#difficultySelect'), difficultyGroup:$('#difficultyGroup'),
        showReading:$('#showReading'), showRomaji:$('#showRomaji'), useCharType:$('#useCharType'),
        startBtn:$('#startBtn'), quitBtn:$('#quitBtn'), retryBtn:$('#retryBtn'), backToSettingsBtn:$('#backToSettingsBtn'),
        rankingBtn:$('#rankingBtn'), closeRankingBtn:$('#closeRankingBtn'), clearRankingBtn:$('#clearRankingBtn'),
        rankingTabLocal:$('#rankingTabLocal'), rankingTabGlobal:$('#rankingTabGlobal'), rankingTitle:$('#rankingTitle'),
        toastContainer:$('#toastContainer'), themeBtn:$('#themeBtn'), helpBtn:$('#helpBtn'), closeHelpBtn:$('#closeHelpBtn'),
        headerUserInfoBtn:$('#headerUserInfoBtn'), headerUserInfoText:$('#headerUserInfoText'),
        visibilitySettingsOverlay:$('#visibilitySettingsOverlay'), globalVisibilityCheck:$('#globalVisibilityCheck'),
        saveVisibilityBtn:$('#saveVisibilityBtn'), closeVisibilityBtn:$('#closeVisibilityBtn'),
        namePromptOverlay:$('#namePromptOverlay'), userNameInput:$('#userNameInput'), userCountrySelect:$('#userCountrySelect'),
        confirmNameBtn:$('#confirmNameBtn'), initialGlobalCheck:$('#initialGlobalCheck'),
    };

    const countryList = [
        "その他","日本","アメリカ合衆国","イギリス","フランス","ドイツ","イタリア","スペイン","韓国","中国","台湾",
        "オーストラリア","カナダ","ブラジル","インド","ロシア","メキシコ","オランダ","スイス","スウェーデン","ノルウェー",
        "デンマーク","フィンランド","ポルトガル","ギリシャ","トルコ","サウジアラビア","アラブ首長国連邦","インドネシア","タイ","ベトナム","フィリピン",
        "マレーシア","シンガポール","ニュージーランド","南アフリカ","エジプト","アルゼンチン","チリ","コロンビア","ペルー"
    ];
    countryList.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c; opt.textContent = c;
        els.userCountrySelect.appendChild(opt);
    });

    function setTheme(isDark) {
        if (isDark) { document.body.classList.remove('light'); } else { document.body.classList.add('light'); }
        els.themeBtn.textContent = isDark ? '🌙' : '☀️';
        localStorage.setItem('typingDarkMode', isDark ? 'true' : 'false');
    }
    const savedDark = localStorage.getItem('typingDarkMode');
    if (savedDark === null) { setTheme(true); } else { setTheme(savedDark === 'true'); }
    els.themeBtn.addEventListener('click', () => { const isDark = !document.body.classList.contains('light'); setTheme(!isDark); });

    function toast(m,d=2200){const e=document.createElement('div');e.className='toast';e.textContent=m;els.toastContainer.appendChild(e);setTimeout(()=>e.remove(),d+400);}
    function showPanel(panelName){
        ['settingsPanel','gamePanel','resultPanel','rankingPanel','helpPanel'].forEach(k => { els[k].classList.add('hidden'); });
        if(panelName) els[panelName].classList.remove('hidden');
    }

    // ========== ライブラリ利用 ==========
    const G = {
        mode:'normal', problemType:'word', problemLang:'ja', difficulty:'intermediate',
        problems:[], currentProblemIndex:0,
        typingText: null,
        displayChars: [],
        readingToDisplayMap: [],
        score:0, combo:0, maxCombo:0, totalInputs:0, correctInputs:0, mistakes:0,
        isPlaying:false, startTime:null, endTime:null,
        infiniteTimer:null, infiniteTimeLimit:4, infiniteTimeLeft:4,
        solvedCount:0, totalProblems:15,
        leftLocked: true,
        optShowReading: true, optShowRomaji: true, optUseCharType: false,
        countdownTimer: null, countdownLeft: 3, isCountingDown: false, countdownPaused: false,
        lastRomajiMatch: '',
    };

    function resetG(){
        clearInfiniteTimer(); clearCountdownTimer();
        Object.assign(G, {
            typingText: null, displayChars:[], readingToDisplayMap:[],
            score:0, combo:0, maxCombo:0, totalInputs:0, correctInputs:0, mistakes:0,
            isPlaying:false, startTime:null, solvedCount:0, leftLocked:true,
            isCountingDown: false, countdownPaused: false, countdownLeft: 3
        });
    }
    function clearInfiniteTimer(){if(G.infiniteTimer){clearInterval(G.infiniteTimer);G.infiniteTimer=null;}}
    function clearCountdownTimer(){if(G.countdownTimer){clearInterval(G.countdownTimer);G.countdownTimer=null;}}

    function startInfiniteTimer(){
        clearInfiniteTimer(); G.infiniteTimeLeft=G.infiniteTimeLimit; updateTimerDisplay();
        els.timerBarWrap.classList.remove('hidden'); els.timerBarFill.style.width='100%';
        G.infiniteTimer=setInterval(()=>{
            G.infiniteTimeLeft-=0.1;
            if(G.infiniteTimeLeft<=0){endGame('timeout');return;}
            updateTimerDisplay(); const r=G.infiniteTimeLeft/G.infiniteTimeLimit; els.timerBarFill.style.width=(r*100)+'%';
            els.timerBarFill.classList.toggle('urgent',r<0.25); els.timerText.classList.toggle('urgent',r<0.25);
            updateSpeedIndicators();
        },100);
    }
    function resetInfiniteTimer(){G.infiniteTimeLeft=G.infiniteTimeLimit;updateTimerDisplay();els.timerBarFill.style.width='100%';}
    function updateTimerDisplay(){if(G.mode==='infinite')els.timerText.textContent=Math.max(0,G.infiniteTimeLeft).toFixed(1)+'s';else els.timerText.textContent='';}
    function updateSpeedIndicators(){
        if(!G.isPlaying||!G.startTime){els.speedIndicators.textContent='';return;}
        const elapsed=(Date.now()-G.startTime)/1000;if(elapsed<0.1)return;
        const kps=G.correctInputs/elapsed,wpm=Math.round((G.correctInputs/5)/(elapsed/60));
        els.speedIndicators.textContent=`${kps.toFixed(1)}打鍵/秒 | ${wpm} WPM`;
    }

    function startCountdown() {
        G.isCountingDown = true; G.countdownLeft = 3; G.countdownPaused = false;
        showPanel('gamePanel');
        els.problemFrame.classList.add('hidden'); els.inputFeedback.classList.add('hidden');
        els.timerBarWrap.classList.add('hidden'); els.timerText.textContent = '';
        els.lineDisplay.innerHTML = ''; els.lineReading.innerHTML = ''; els.lineRomaji.innerHTML = '';
        els.countdownOverlay.style.display = 'flex';
        els.countdownNumber.textContent = Math.ceil(G.countdownLeft);
        els.hiddenInput.focus();
        clearCountdownTimer();
        G.countdownTimer = setInterval(() => {
            if (G.countdownPaused) return;
            G.countdownLeft -= 0.1;
            if (G.countdownLeft <= 0) { G.countdownLeft = 0; updateCountdownDisplay(); finishCountdown(); return; }
            updateCountdownDisplay();
        }, 100);
    }
    function updateCountdownDisplay() {
        const sec = Math.ceil(G.countdownLeft);
        els.countdownNumber.textContent = sec;
        if (sec !== Math.ceil(G.countdownLeft + 0.1)) {
            els.countdownNumber.style.animation = 'none';
            void els.countdownNumber.offsetWidth;
            els.countdownNumber.style.animation = 'countPulse 0.8s ease-in-out';
        }
    }
    function finishCountdown() {
        clearCountdownTimer(); G.isCountingDown = false;
        els.countdownOverlay.style.display = 'none';
        els.problemFrame.classList.remove('hidden'); els.inputFeedback.classList.remove('hidden');
        startGameActual();
    }

    function startGameActual() {
        G.problems = getProblemsForGame(G.problemType, G.mode==='infinite' ? 999 : G.totalProblems, G.problemLang);
        G.currentProblemIndex=0; G.solvedCount=0;
        G.isPlaying=true; G.startTime=Date.now();
        if (G.problemLang === 'en') {
            els.lineReading.classList.add('hidden'); els.lineRomaji.classList.add('hidden');
        } else {
            if (G.optShowReading) els.lineReading.classList.remove('hidden'); else els.lineReading.classList.add('hidden');
            if (G.optShowRomaji) els.lineRomaji.classList.remove('hidden'); else els.lineRomaji.classList.add('hidden');
        }
        loadCurrentProblem(); updateStatsDisplay();
        els.hiddenInput.value=''; els.hiddenInput.focus(); els.inputFeedback.textContent='ここにローマ字を入力してください';
        if(G.mode==='infinite') { startInfiniteTimer(); }
        else { clearInfiniteTimer(); els.timerBarWrap.classList.add('hidden'); els.timerText.textContent=''; }
    }

    function startGame(){
        resetG();
        G.mode=els.modeSelect.value; G.problemType=els.typeSelect.value; G.problemLang=els.langSelect.value;
        G.difficulty=els.difficultySelect.value; G.totalProblems=15;
        G.optShowReading = els.showReading.checked;
        G.optShowRomaji = els.showRomaji.checked;
        G.optUseCharType = els.useCharType.checked;
        switch(G.difficulty){
            case'beginner': G.infiniteTimeLimit=10; break;
            case'basic': G.infiniteTimeLimit=7; break;
            case'intermediate': G.infiniteTimeLimit=4; break;
            case'advanced': G.infiniteTimeLimit=3; break;
            case'expert': G.infiniteTimeLimit=1.5; break;
            case'master': G.infiniteTimeLimit=0.5; break;
            default: G.infiniteTimeLimit=4;
        }
        G.infiniteTimeLeft = G.infiniteTimeLimit;
        startCountdown();
    }

    function loadCurrentProblem(){
        if(G.currentProblemIndex>=G.problems.length){
            if(G.mode==='normal'){endGame('complete');return;}
            G.problems.push(...getProblemsForGame(G.problemType, 50, G.problemLang));
        }
        const prob=G.problems[G.currentProblemIndex];
        G.displayChars=[...prob.display];

        if (G.problemLang === 'en') {
            G.typingText = null;
            G.tokens = [...prob.display];
            G.readingToDisplayMap = G.tokens.map((_,i) => i);
        } else {
            G.typingText = new TypingText(prob.reading, {
                inputType: 'romaji',
                autoCorrect: true,
                ignoreCase: false
            });
            G.readingToDisplayMap = buildReadingToDisplayMap(prob.display, prob.reading);
        }
        G.leftLocked = true;
        G.lastRomajiMatch = '';
        renderAllLines();
        updateProgressDisplay();
    }

    function buildReadingToDisplayMap(display, reading) {
        const map = [];
        const displayChars = [...display];
        const readingChars = [...reading];
        let di = 0, ri = 0;
        while (ri < readingChars.length) {
            if (di < displayChars.length && isKanji(displayChars[di])) {
                while (di < displayChars.length && isKanji(displayChars[di])) {
                    map[ri] = di;
                    ri++;
                }
            } else {
                map[ri] = di;
                ri++;
                di++;
            }
        }
        return map;
    }

    function renderAllLines(){
        const displayChars = G.displayChars;
        if (G.typingText) {
            const rawStates = G.typingText.getState();
            const displayStates = new Array(displayChars.length).fill('remaining');
            for (let i = 0; i < rawStates.length; i++) {
                const di = G.readingToDisplayMap[i];
                if (di !== undefined) {
                    const s = rawStates[i].state;
                    if (s === 'correct') displayStates[di] = 'correct';
                    else if (s === 'current' && displayStates[di] !== 'correct') displayStates[di] = 'current';
                }
            }
            let htmlDisplay = '';
            for (let i = 0; i < displayChars.length; i++) {
                htmlDisplay += `<span class="char ${displayStates[i]}">${escHtml(displayChars[i])}</span>`;
            }
            els.lineDisplay.innerHTML = htmlDisplay;

            if (G.optShowReading) {
                let htmlReading = '';
                for (let i = 0; i < rawStates.length; i++) {
                    const cls = rawStates[i].state;
                    htmlReading += `<span class="char ${cls}">${escHtml(rawStates[i].char)}</span>`;
                }
                els.lineReading.innerHTML = htmlReading;
            } else { els.lineReading.innerHTML = ''; }

            if (G.optShowRomaji) {
                els.lineRomaji.innerHTML = G.lastRomajiMatch ? `ローマ字: ${G.lastRomajiMatch}` : '';
            } else { els.lineRomaji.innerHTML = ''; }
        } else {
            // 英語モードの簡易表示
            let htmlDisplay = '';
            for (let i = 0; i < displayChars.length; i++) {
                let cls = 'remaining';
                if (i < G.tokenIndex) cls = 'correct';
                else if (i === G.tokenIndex) cls = 'current';
                htmlDisplay += `<span class="char ${cls}">${escHtml(displayChars[i])}</span>`;
            }
            els.lineDisplay.innerHTML = htmlDisplay;
            els.lineReading.innerHTML = '';
            els.lineRomaji.innerHTML = '';
        }

        const currentSpan = els.lineDisplay.querySelector('.char.current');
        if (currentSpan) {
            const frameWidth = els.problemFrame.clientWidth;
            const spanLeft = currentSpan.offsetLeft, spanWidth = currentSpan.offsetWidth;
            const containerWidth = els.linesContainer.scrollWidth;
            if (G.leftLocked && (spanLeft + spanWidth/2 > frameWidth/2)) G.leftLocked = false;
            let targetX = G.leftLocked ? 0 : frameWidth/2 - (spanLeft + spanWidth/2);
            if (targetX > 0) targetX = 0;
            const minX = frameWidth - containerWidth;
            if (targetX < minX) targetX = minX;
            els.linesContainer.style.transform = `translateX(${targetX}px)`;
        }
    }

    function escHtml(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}

    function updateProgressDisplay(){
        if(G.mode==='normal') els.progressValue.textContent=`${G.currentProblemIndex+1}/${G.totalProblems}`;
        else els.progressValue.textContent=`∞ (${G.solvedCount}問)`;
    }

    function updateStatsDisplay(){
        els.scoreValue.textContent=Math.floor(G.score);
        els.comboValue.textContent=G.combo;
        const acc=G.totalInputs>0?Math.round((G.correctInputs/G.totalInputs)*100):100;
        els.accuracyValue.textContent=acc+'%';
        updateProgressDisplay(); updateSpeedIndicators();
    }

    els.hiddenInput.addEventListener('blur', () => {
        if (G.isCountingDown) { G.countdownPaused = true; return; }
        if (G.isPlaying) setTimeout(() => { if (G.isPlaying && document.activeElement !== els.hiddenInput) els.hiddenInput.focus(); }, 50);
    });
    els.hiddenInput.addEventListener('focus', () => { if (G.isCountingDown) G.countdownPaused = false; });
    els.gamePanel.addEventListener('click', () => { if (G.isPlaying || G.isCountingDown) els.hiddenInput.focus(); });
    els.hiddenInput.addEventListener('input', function() { this.value = ''; });

    els.hiddenInput.addEventListener('keydown', function(e){
        if(!G.isPlaying){ e.preventDefault(); return; }
        if(e.isComposing || e.keyCode===229) return;
        let rawKey = e.key;
        const key = rawKey.length === 1 ? toHalfWidth(rawKey) : rawKey;
        e.preventDefault();
        if(key.length > 1 && key !== 'Backspace') return;
        if(key === 'Backspace'){
            if (G.typingText) {
                // ライブラリはバックスペース非対応のため、ここでは何もしない
                // 必要に応じて自前で状態を戻す処理を追加可能
            }
            return;
        }
        if(/^[a-zA-Z]$/.test(key)){
            if (G.typingText) {
                const result = G.typingText.input(key);
                if (result.isCorrect) {
                    G.totalInputs++; G.correctInputs++; G.combo++;
                    if(G.combo > G.maxCombo) G.maxCombo = G.combo;
                    const comboMult = calcComboMultiplier(G.combo);
                    const charMult = getCharTypeMultiplier(G.problems[G.currentProblemIndex].display, G.optUseCharType, G.optShowRomaji, G.optShowReading);
                    G.score += 2 * comboMult * charMult;
                    G.lastRomajiMatch = result.matched || '';
                    if (result.isComplete) advanceToNextProblem();
                    els.inputFeedback.textContent = '✅ ' + key;
                    els.inputFeedback.style.color = 'var(--correct)';
                    setTimeout(()=>{ if(G.isPlaying) els.inputFeedback.style.color='var(--text2)'; }, 300);
                } else {
                    G.totalInputs++; G.mistakes++; G.combo = 0;
                    G.score = Math.max(0, G.score - 1);
                    G.lastRomajiMatch = '';
                    els.inputFeedback.textContent = '❌ ミス！';
                    els.inputFeedback.classList.add('error-flash');
                    els.inputFeedback.style.color = 'var(--error)';
                    setTimeout(()=>{ if(G.isPlaying){ els.inputFeedback.classList.remove('error-flash'); els.inputFeedback.style.color='var(--text2)'; } }, 400);
                }
                updateStatsDisplay();
                renderAllLines();
                if(G.mode==='infinite') resetInfiniteTimer();
            } else {
                // 英語モード
                processCharInputEn(key);
            }
        }
    });

    function processCharInputEn(char){
        if(G.tokenIndex >= G.tokens.length){ advanceToNextProblem(); return; }
        const token = G.tokens[G.tokenIndex];
        if (char === token[G.tokenMatchStr ? G.tokenMatchStr.length : 0]) {
            G.tokenMatchStr += char;
            G.totalInputs++; G.correctInputs++; G.combo++;
            if(G.combo > G.maxCombo) G.maxCombo = G.combo;
            const comboMult = calcComboMultiplier(G.combo);
            const charMult = getCharTypeMultiplier(G.problems[G.currentProblemIndex].display, G.optUseCharType, G.optShowRomaji, G.optShowReading);
            G.score += 2 * comboMult * charMult;
            if (G.tokenMatchStr === token) {
                G.completedRomaji[G.tokenIndex] = token;
                G.tokenIndex++;
                G.tokenMatchStr = '';
                if (G.tokenIndex >= G.tokens.length) advanceToNextProblem();
            }
            els.inputFeedback.textContent = '✅ ' + char;
            els.inputFeedback.style.color = 'var(--correct)';
            setTimeout(()=>{ if(G.isPlaying) els.inputFeedback.style.color='var(--text2)'; }, 300);
        } else {
            G.totalInputs++; G.mistakes++; G.combo = 0;
            G.score = Math.max(0, G.score - 1);
            G.tokenMatchStr = '';
            els.inputFeedback.textContent = '❌ ミス！';
            els.inputFeedback.classList.add('error-flash');
            els.inputFeedback.style.color = 'var(--error)';
            setTimeout(()=>{ if(G.isPlaying){ els.inputFeedback.classList.remove('error-flash'); els.inputFeedback.style.color='var(--text2)'; } }, 400);
        }
        updateStatsDisplay();
        renderAllLines();
        if(G.mode==='infinite') resetInfiniteTimer();
    }

    function advanceToNextProblem(){
        G.currentProblemIndex++; G.solvedCount++;
        if(G.mode==='normal' && G.currentProblemIndex>=G.totalProblems){ endGame('complete'); return; }
        loadCurrentProblem();
        els.inputFeedback.textContent = '🎉 次の問題へ！'; els.inputFeedback.style.color = 'var(--accent2)';
        setTimeout(()=>{ if(G.isPlaying) els.inputFeedback.style.color='var(--text2)'; }, 500);
        els.hiddenInput.value = ''; els.hiddenInput.focus();
    }

    async function endGame(reason){
        G.isPlaying = false; clearInfiniteTimer();
        els.timerBarWrap.classList.add('hidden'); els.timerText.textContent='';
        const elapsed = (Date.now()-G.startTime)/1000;
        const kps = G.correctInputs/elapsed || 0;
        const wpm = Math.round((G.correctInputs/5)/(elapsed/60)) || 0;
        const accuracy = G.totalInputs>0 ? G.correctInputs/G.totalInputs : 1;
        const finalScore = Math.floor(G.score * calcSpeedMultiplier(kps) * calcAccuracyMultiplier(accuracy));
        const grade = getGrade(finalScore, kps, accuracy, G.optUseCharType);
        els.gradeDisplay.textContent = grade.label; els.gradeDisplay.className = 'grade-display '+grade.css;
        els.resultScore.textContent = finalScore; els.resultKPS.textContent = kps.toFixed(1); els.resultWPM.textContent = wpm;
        els.resultAccuracy.textContent = Math.round(accuracy*100)+'%'; els.resultMaxCombo.textContent = G.maxCombo;
        const activeMult = getCharTypeMultiplier(G.problems[0]?.display||'', G.optUseCharType, G.optShowRomaji, G.optShowReading);
        els.resultCharType.textContent = G.optUseCharType ? getCharTypeLabel(activeMult) : '補正なし';

        const user = getUserInfo();
        const entry = {
            name: user.name, country: user.country,
            score: finalScore, grade: grade.grade,
            lang: G.problemLang, mode: G.mode, type: G.problemType,
            accuracy: Math.round(accuracy*100), kps, wpm, elapsedSec: elapsed,
            date: new Date().toISOString()
        };
        saveLocalRanking(entry);
        await saveGlobalRanking(entry);

        showPanel('resultPanel');
        if(reason==='timeout') toast('⏰ 時間切れ！'); else toast('🎯 全問完了！');
    }

    function quitGame(){
        if(G.isPlaying && G.totalInputs>0 && !confirm('中断しますか？')) return;
        clearInfiniteTimer(); resetG(); showPanel('settingsPanel');
    }

    let currentRankingTab = 'local';
    async function renderRankingTable(tab = currentRankingTab) {
        currentRankingTab = tab;
        let rankings = [];
        if (tab === 'local') {
            rankings = loadLocalRankings();
            els.rankingTitle.textContent = '🏆 ローカルランキング';
            els.rankingTabLocal.classList.add('active'); els.rankingTabGlobal.classList.remove('active');
        } else {
            els.rankingTabLocal.classList.remove('active'); els.rankingTabGlobal.classList.add('active');
            els.rankingTitle.textContent = '🌐 グローバルランキング';
            rankings = await loadGlobalRankings();
        }
        const modeFilter = els.rankingModeFilter.value;
        const typeFilter = els.rankingTypeFilter.value;
        const langFilter = els.rankingLangFilter ? els.rankingLangFilter.value : 'all';
        const filtered = filterRankings(rankings, modeFilter, typeFilter, langFilter);
        if(filtered.length===0){
            els.rankingBody.innerHTML = `<tr><td colspan="11" class="empty-message">データがありません</td></tr>`;
            return;
        }
        els.rankingBody.innerHTML = filtered.slice(0,10).map((r,i)=>{
            const rank=i+1;
            const rc=rank===1?'rank-1':rank===2?'rank-2':rank===3?'rank-3':'rank-other';
            const grade = getGrade(r.score, r.kps||0, r.accuracy/100, false);
            const langLabel = (r.lang==='en')?'🇬🇧 英語':'🇯🇵 日本語';
            return `<tr>
                <td><span class="rank-badge ${rc}">${rank}</span></td>
                <td>${escapeHtml(r.name||'')}</td>
                <td>${escapeHtml(r.country||'')}</td>
                <td><strong>${r.score}</strong></td>
                <td><span class="${grade.css}">${r.grade||grade.grade}</span></td>
                <td>${langLabel}</td>
                <td>${r.mode==='infinite'?'無限':'通常'}</td>
                <td>${{word:'単語',short:'短文',sentence:'文',long:'長文',random:'ランダム'}[r.type]||r.type}</td>
                <td>${r.accuracy}%</td><td>${r.wpm||'-'}</td>
                <td>${r.date?new Date(r.date).toLocaleString('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'-'}</td>
            </tr>`;
        }).join('');
    }

    function escapeHtml(str) { const div = document.createElement('div'); div.textContent = str || ''; return div.innerHTML; }

    els.rankingBtn.addEventListener('click', ()=>{ showPanel('rankingPanel'); renderRankingTable('local'); });
    els.closeRankingBtn.addEventListener('click', ()=> showPanel('settingsPanel'));
    els.clearRankingBtn.addEventListener('click', ()=>{
        if(confirm('ローカルランキングを削除しますか？（グローバルは削除されません）')){
            clearLocalRankings(); renderRankingTable('local');
            toast('🗑 ローカルランキングをクリアしました');
        }
    });
    els.rankingModeFilter.addEventListener('change', ()=> renderRankingTable(currentRankingTab));
    els.rankingTypeFilter.addEventListener('change', ()=> renderRankingTable(currentRankingTab));
    if (els.rankingLangFilter) els.rankingLangFilter.addEventListener('change', ()=> renderRankingTable(currentRankingTab));
    els.rankingTabLocal.addEventListener('click', () => renderRankingTable('local'));
    els.rankingTabGlobal.addEventListener('click', () => renderRankingTable('global'));

    els.headerUserInfoBtn.addEventListener('click', () => {
        const { name, country } = getUserInfo();
        if (!name || !country) {
            els.initialGlobalCheck.checked = getGlobalVisibility();
            els.namePromptOverlay.classList.remove('hidden');
        } else {
            els.globalVisibilityCheck.checked = getGlobalVisibility();
            els.visibilitySettingsOverlay.classList.remove('hidden');
        }
    });
    els.closeVisibilityBtn.addEventListener('click', () => { els.visibilitySettingsOverlay.classList.add('hidden'); });
    els.saveVisibilityBtn.addEventListener('click', () => {
        setGlobalVisibility(els.globalVisibilityCheck.checked);
        els.visibilitySettingsOverlay.classList.add('hidden');
        toast('表示設定を保存しました');
    });

    function checkUserInfo() {
        const { name, country } = getUserInfo();
        if (!name || !country) {
            els.initialGlobalCheck.checked = getGlobalVisibility();
            els.namePromptOverlay.classList.remove('hidden');
        } else {
            els.namePromptOverlay.classList.add('hidden');
            updateHeaderUserInfo();
        }
    }
    els.confirmNameBtn.addEventListener('click', () => {
        const name = els.userNameInput.value.trim();
        const country = els.userCountrySelect.value;
        if (!name) { toast('名前を入力してください'); return; }
        if (!country) { toast('国を選択してください'); return; }
        setUserInfo(name, country);
        setGlobalVisibility(els.initialGlobalCheck.checked);
        els.namePromptOverlay.classList.add('hidden');
        updateHeaderUserInfo();
        toast('設定を保存しました！');
    });

    els.modeSelect.addEventListener('change', ()=>{
        if (els.modeSelect.value === 'infinite') { els.difficultyGroup.classList.remove('hidden'); }
        else { els.difficultyGroup.classList.add('hidden'); }
    });
    els.startBtn.addEventListener('click', startGame);
    els.quitBtn.addEventListener('click', quitGame);
    els.retryBtn.addEventListener('click', startGame);
    els.backToSettingsBtn.addEventListener('click', ()=>{ showPanel('settingsPanel'); });
    els.helpBtn.addEventListener('click', () => { showPanel('helpPanel'); });
    els.closeHelpBtn.addEventListener('click', () => { showPanel('settingsPanel'); });
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && G.isPlaying) quitGame(); });

    async function init(){
        updateHeaderUserInfo();
        checkUserInfo();
        await prepareEnglishPool();
        showPanel('settingsPanel');
        els.difficultyGroup.classList.add('hidden');
        els.countdownOverlay.style.display = 'none';
        els.rankingTabLocal.classList.add('active');
        els.rankingTabGlobal.classList.remove('active');
    }
    init();
})();