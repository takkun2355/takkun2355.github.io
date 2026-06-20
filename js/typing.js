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
        console.log('Firebase: 匿名認証に成功しました');
    } catch (e) {
        console.error('Firebase 初期化失敗（グローバルランキングは利用できません）', e);
    }

    // --- 半角変換 ---
    function toHalfWidth(str) { return str.replace(/\u3000/g, ' ').replace(/[\uff01-\uff5e]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)); }

    // --- ローマ字マッピング ---
    const baseKanaToRomaji = {
        'あ':['a'],'い':['i','yi'],'う':['u','wu'],'え':['e','ye'],'お':['o'],
        'か':['ka','ca'],'き':['ki'],'く':['ku','cu'],'け':['ke'],'こ':['ko','co'],
        'が':['ga'],'ぎ':['gi'],'ぐ':['gu'],'げ':['ge'],'ご':['go'],
        'さ':['sa'],'し':['shi','si','ci'],'す':['su'],'せ':['se','ce'],'そ':['so'],
        'ざ':['za'],'じ':['ji','zi'],'ず':['zu'],'ぜ':['ze'],'ぞ':['zo'],
        'た':['ta'],'ち':['chi','ti'],'つ':['tsu','tu'],'て':['te'],'と':['to'],
        'だ':['da'],'ぢ':['di'],'づ':['du'],'で':['de'],'ど':['do'],
        'な':['na'],'に':['ni'],'ぬ':['nu'],'ね':['ne'],'の':['no'],
        'は':['ha'],'ひ':['hi'],'ふ':['fu','hu'],'へ':['he'],'ほ':['ho'],
        'ば':['ba'],'び':['bi'],'ぶ':['bu'],'べ':['be'],'ぼ':['bo'],
        'ぱ':['pa'],'ぴ':['pi'],'ぷ':['pu'],'ぺ':['pe'],'ぽ':['po'],
        'ま':['ma'],'み':['mi'],'む':['mu'],'め':['me'],'も':['mo'],
        'や':['ya'],'ゆ':['yu'],'よ':['yo'],
        'ら':['ra'],'り':['ri'],'る':['ru'],'れ':['re'],'ろ':['ro'],
        'わ':['wa'],'を':['wo'],
        'ん':['nn','xn'],
        'ー':['-'], // 長音符はハイフンで入力可能にする
    };
    const smallKanaList = [
        {kana:'ぁ', romas:['xa','la']},{kana:'ぃ', romas:['xi','li']},{kana:'ぅ', romas:['xu','lu']},{kana:'ぇ', romas:['xe','le']},
        {kana:'ぉ', romas:['xo','lo']},{kana:'ヵ', romas:['xka','lka']},{kana:'ヶ', romas:['xke','lke']},{kana:'ゃ', romas:['xya','lya']},
        {kana:'ゅ', romas:['xyu','lyu']},{kana:'ょ', romas:['xyo','lyo']},{kana:'ゎ', romas:['xwa','lwa']},{kana:'っ', romas:['xtu','xtsu','ltu','ltsu']},
    ];
    smallKanaList.forEach(s => baseKanaToRomaji[s.kana] = s.romas);
    const sokuonBase = {
        'っか':['kka'],'っき':['kki'],'っく':['kku'],'っけ':['kke'],'っこ':['kko'],
        'っが':['gga'],'っぎ':['ggi'],'っぐ':['ggu'],'っげ':['gge'],'っご':['ggo'],
        'っさ':['ssa'],'っし':['sshi','ssi'],'っす':['ssu'],'っせ':['sse'],'っそ':['sso'],
        'っざ':['zza'],'っじ':['jji','zzi'],'っず':['zzu'],'っぜ':['zze'],'っぞ':['zzo'],
        'った':['tta'],'っち':['cchi','tti'],'っつ':['ttsu','ttu'],'って':['tte'],'っと':['tto'],
        'っだ':['dda'],'っぢ':['ddi'],'っづ':['ddu'],'っで':['dde'],'っど':['ddo'],
        'っは':['hha'],'っひ':['hhi'],'っふ':['ffu','hhu'],'っへ':['hhe'],'っほ':['hho'],
        'っば':['bba'],'っび':['bbi'],'っぶ':['bbu'],'っべ':['bbe'],'っぼ':['bbo'],
        'っぱ':['ppa'],'っぴ':['ppi'],'っぷ':['ppu'],'っぺ':['ppe'],'っぽ':['ppo'],
        'っま':['mma'],'っみ':['mmi'],'っむ':['mmu'],'っめ':['mme'],'っも':['mmo'],
        'っや':['yya'],'っゆ':['yyu'],'っよ':['yyo'],
        'っら':['rra'],'っり':['rri'],'っる':['rru'],'っれ':['rre'],'っろ':['rro'],
        'っわ':['wwa'],'っを':['wwo'],
    };
    Object.assign(baseKanaToRomaji, sokuonBase);
    const consonants = [
        {c:'k', kana:'か'},{c:'g', kana:'が'},{c:'s', kana:'さ'},{c:'z', kana:'ざ'},{c:'t', kana:'た'},{c:'d', kana:'だ'},
        {c:'n', kana:'な'},{c:'h', kana:'は'},{c:'b', kana:'ば'},{c:'p', kana:'ぱ'},{c:'m', kana:'ま'},{c:'y', kana:'や'},
        {c:'r', kana:'ら'},{c:'w', kana:'わ'},{c:'f', kana:'ふ'},{c:'ch', kana:'ち'},{c:'sh', kana:'し'},{c:'j', kana:'じ'},
    ];
    const smallChars = [
        {char:'ゃ', roma:'ya'},{char:'ぃ', roma:'yi'},{char:'ゅ', roma:'yu'},{char:'ぇ', roma:'ye'},{char:'ょ', roma:'yo'},
        {char:'ぁ', roma:'a'},{char:'ぅ', roma:'u'},{char:'ぉ', roma:'o'},
    ];
    const manual = {
        'っふぁ':['ffa'],'っふぃ':['ffi'],'っふぇ':['ffe'],'っふぉ':['ffo'],
        'ってゃ':['ttha'],'ってぃ':['tthi'],'ってゅ':['tthu'],'ってぇ':['tthe'],'ってょ':['ttho'],
        'っでゃ':['ddha'],'っでぃ':['ddhi'],'っでゅ':['ddhu'],'っでぇ':['ddhe'],'っでょ':['ddho'],
    };
    Object.assign(baseKanaToRomaji, manual);
    consonants.forEach(cons => {
        smallChars.forEach(small => {
            const kana = 'っ' + cons.kana + small.char, roma = cons.c + cons.c + small.roma;
            if (!baseKanaToRomaji[kana]) baseKanaToRomaji[kana] = [roma];
            else if (!baseKanaToRomaji[kana].includes(roma)) baseKanaToRomaji[kana].push(roma);
        });
    });
    smallKanaList.forEach(s => {
        const kana = 'っ' + s.kana, romas = [];
        s.romas.forEach(r => {
            if (r.startsWith('x')) { romas.push('ll' + r.substring(1)); romas.push('xx' + r.substring(1)); }
            else if (r.startsWith('l')) { romas.push('ll' + r.substring(1)); romas.push('xx' + r.substring(1)); }
        });
        if (!baseKanaToRomaji[kana]) baseKanaToRomaji[kana] = [...new Set(romas)];
        else romas.forEach(r => { if (!baseKanaToRomaji[kana].includes(r)) baseKanaToRomaji[kana].push(r); });
    });
    Object.assign(baseKanaToRomaji, {
        'きゃ':['kya'],'きゅ':['kyu'],'きょ':['kyo'],'ぎゃ':['gya'],'ぎゅ':['gyu'],'ぎょ':['gyo'],
        'しゃ':['sha','sya'],'しゅ':['shu','syu'],'しょ':['sho','syo'],'じゃ':['ja','zya'],'じゅ':['ju','zyu'],'じょ':['jo','zyo'],
        'ちゃ':['cha','tya'],'ちゅ':['chu','tyu'],'ちょ':['cho','tyo'],'にゃ':['nya'],'にゅ':['nyu'],'にょ':['nyo'],
        'ひゃ':['hya'],'ひゅ':['hyu'],'ひょ':['hyo'],'びゃ':['bya'],'びゅ':['byu'],'びょ':['byo'],
        'ぴゃ':['pya'],'ぴゅ':['pyu'],'ぴょ':['pyo'],'みゃ':['mya'],'みゅ':['myu'],'みょ':['myo'],
        'りゃ':['rya'],'りゅ':['ryu'],'りょ':['ryo'],'ふぁ':['fa'],'ふぃ':['fi'],'ふぇ':['fe'],'ふぉ':['fo'],
        'てゃ':['tha'],'てぃ':['thi'],'てゅ':['thu'],'てぇ':['the'],'てょ':['tho'],'でゃ':['dha'],'でぃ':['dhi'],'でゅ':['dhu'],'でぇ':['dhe'],'でょ':['dho'],
        'ちぃ':['cyi','chi'],'ぢぃ':['dyi','dhi'],'ちぇ':['che'],'ぢぇ':['je','dhe'],'ひぃ':['hyi','hi'],'びぃ':['byi','bi'],'ぴぃ':['pyi','pi'],
        'ひぇ':['hye'],'びぇ':['bye'],'ぴぇ':['pye'],'にぃ':['nyi'],'にぇ':['nye'],'みぃ':['myi'],'みぇ':['mye'],
        'りぃ':['ryi'],'りぇ':['rye'],'きぃ':['kyi'],'ぎぃ':['gyi'],'ぎぇ':['gye'],'きぇ':['kye'],
        'しぃ':['syi','shi'],'じぃ':['zyi','ji'],'じぇ':['je','zye'],'しぇ':['she'],
        '。':['.','ten',' '],'．':['.','ten',' '],'.':['.','ten',' '],'、':[','],'！':['!'],'？':['?'],
    });
    const kanaToRomaji = baseKanaToRomaji;

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

    function getGlobalVisibility() {
        const val = localStorage.getItem('typing_global_visibility');
        return val === null ? true : val === 'true';
    }
    function setGlobalVisibility(visible) {
        localStorage.setItem('typing_global_visibility', visible);
        els.globalVisibilityCheck.checked = visible;
        els.initialGlobalCheck.checked = visible;
    }

    // ★ データ保存の三重構造
    let _lastSavedEntry = null; // メモリへの最終フォールバック
    async function saveGlobalRanking(entry) {
        _lastSavedEntry = entry; // メモリ保持 (フォールバック3)
        if (!getGlobalVisibility()) return;

        // プライマリ: Firebase に保存
        if (firebaseReady && db) {
            try {
                await addDoc(collection(db, 'rankings'), {
                    displayName: entry.name, country: entry.country || '',
                    score: entry.score, grade: entry.grade, lang: entry.lang,
                    mode: entry.mode, type: entry.type, accuracy: entry.accuracy,
                    kps: entry.kps, wpm: entry.wpm, elapsedSec: entry.elapsedSec,
                    createdAt: serverTimestamp()
                });
                console.log('Firebase にスコアを保存しました');
                return;
            } catch (e) {
                console.error('Firebase 保存エラー', e);
            }
        }

        // セカンダリ: localStorage に別名で保存（復旧用）
        try {
            const backup = JSON.parse(localStorage.getItem('typing_global_backup') || '[]');
            backup.push(entry);
            localStorage.setItem('typing_global_backup', JSON.stringify(backup.slice(-20)));
        } catch (e) {}
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

    // --- 「ん」の動的候補 (三重判定) ---
    function getAcceptedForN(nextToken) {
        // プライマリ: 次の文字で判定
        const restrictPatterns = /^[あいうえおぁぃぅぇぉゃゅょゎなにぬねの]/;
        if (!nextToken || restrictPatterns.test(nextToken)) return ['nn'];

        // セカンダリ: 次の文字のローマ字先頭で再判定
        if (nextToken) {
            const nextRomas = kanaToRomaji[nextToken] || [];
            if (nextRomas.length > 0 && 'aiueo'.includes(nextRomas[0][0])) return ['nn'];
        }

        // フォールバック: 子音なら両方許可
        return ['nn', 'n'];
    }

    // 「ー」の動的候補生成 (三重構造)
    function getAcceptedForChouon(prevToken) {
        // プライマリ: 前の文字の母音を重ねる
        if (prevToken) {
            const prevCandidates = kanaToRomaji[prevToken] || [prevToken];
            const lastChar = prevCandidates[0].slice(-1);
            if ('aiueo'.includes(lastChar)) {
                return [lastChar + lastChar, '-'];
            }
        }
        // セカンダリ: ハイフンだけ
        return ['-'];
    }

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

    const G = {
        mode:'normal', problemType:'word', problemLang:'ja', difficulty:'intermediate', problems:[], currentProblemIndex:0,
        tokens:[], tokenIndex:0, displayChars:[],
        score:0, combo:0, maxCombo:0, totalInputs:0, correctInputs:0, mistakes:0,
        isPlaying:false, startTime:null, endTime:null, infiniteTimer:null, infiniteTimeLimit:4, infiniteTimeLeft:4,
        solvedCount:0, totalProblems:15,
        tokenCandidates:[], tokenMatchStr:'',
        leftLocked: true, completedRomaji: [],
        optShowReading: true, optShowRomaji: true, optUseCharType: false,
        countdownTimer: null, countdownBackupTimer: null, countdownForceTimer: null, // タイマー三重構造
        countdownLeft: 3, isCountingDown: false, countdownPaused: false,
    };

    function resetG(){
        clearInfiniteTimer(); clearCountdownTimer();
        Object.assign(G, {
            tokens:[], tokenIndex:0, score:0, combo:0, maxCombo:0,
            totalInputs:0, correctInputs:0, mistakes:0, isPlaying:false, startTime:null, solvedCount:0,
            tokenCandidates:[], tokenMatchStr:'', leftLocked:true, completedRomaji: [],
            isCountingDown: false, countdownPaused: false, countdownLeft: 3
        });
    }
    function clearInfiniteTimer(){if(G.infiniteTimer){clearInterval(G.infiniteTimer);G.infiniteTimer=null;}}
    function clearCountdownTimer(){
        if(G.countdownTimer){clearInterval(G.countdownTimer);G.countdownTimer=null;}
        if(G.countdownBackupTimer){clearInterval(G.countdownBackupTimer);G.countdownBackupTimer=null;}
        if(G.countdownForceTimer){clearInterval(G.countdownForceTimer);G.countdownForceTimer=null;}
    }

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

    // ★ カウントダウンの三重構造
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

        // プライマリタイマー (100ms 間隔)
        G.countdownTimer = setInterval(() => {
            if (G.countdownPaused) return;
            G.countdownLeft -= 0.1;
            if (G.countdownLeft <= 0) { G.countdownLeft = 0; updateCountdownDisplay(); finishCountdown(); return; }
            updateCountdownDisplay();
        }, 100);

        // バックアップタイマー (1秒間隔で強制同期)
        G.countdownBackupTimer = setInterval(() => {
            if (!G.isCountingDown) return;
            const expectedLeft = 3 - ((Date.now() - (G._countdownStartTime || Date.now())) / 1000);
            if (Math.abs(G.countdownLeft - expectedLeft) > 0.5) {
                G.countdownLeft = Math.max(0, expectedLeft);
                updateCountdownDisplay();
                if (G.countdownLeft <= 0) { G.countdownLeft = 0; finishCountdown(); }
            }
        }, 1000);

        // 強制タイマー (5秒後に強制開始)
        G._countdownStartTime = Date.now();
        G.countdownForceTimer = setTimeout(() => {
            if (G.isCountingDown) {
                finishCountdown();
            }
        }, 5000);
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
            G.tokens = [...prob.display];
        } else {
            G.tokens = [...prob.reading].reduce((acc,ch)=>{
                if('ゃゅょャュョ'.includes(ch) && acc.length>0){ acc[acc.length-1] += ch; }
                else { acc.push(ch); }
                return acc;
            }, []);
        }
        G.tokenIndex=0; G.leftLocked = true; G.completedRomaji = [];
        resetTokenState(); renderAllLines(); updateProgressDisplay();
    }

    function resetTokenState(){
        const token = G.tokens[G.tokenIndex] || '';
        if (token === 'ん' && G.problemLang === 'ja') {
            const nextToken = G.tokenIndex + 1 < G.tokens.length ? G.tokens[G.tokenIndex + 1] : null;
            G.tokenCandidates = getAcceptedForN(nextToken);
        } else if (token === 'ー' && G.problemLang === 'ja') {
            const prevToken = G.tokenIndex > 0 ? G.tokens[G.tokenIndex - 1] : null;
            G.tokenCandidates = getAcceptedForChouon(prevToken);
        } else {
            G.tokenCandidates = kanaToRomaji[token] || [token];
        }
        G.tokenMatchStr = '';
    }

    // ★ 漢字ブロックの三重構造
    function getKanjiBlocks() {
        // プライマリ方式: 連続漢字をグループ化
        const blocks = [];
        const displayChars = G.displayChars;
        const tokens = G.tokens;
        let ti = 0;
        for (let di = 0; di < displayChars.length; di++) {
            if (isKanji(displayChars[di])) {
                let startDi = di;
                let startTi = ti;
                while (di < displayChars.length && isKanji(displayChars[di])) di++;
                let endDi = di - 1;
                let endTi = tokens.length - 1;
                if (di < displayChars.length) {
                    const nextChar = displayChars[di];
                    for (let k = ti; k < tokens.length; k++) {
                        if (tokens[k] === nextChar) { endTi = k - 1; break; }
                    }
                }
                blocks.push({ startDisplayIdx: startDi, endDisplayIdx: endDi, startTokenIdx: startTi, endTokenIdx: endTi });
                ti = endTi + 1;
            } else {
                ti++;
            }
        }

        // セカンダリ: ブロックが空なら1文字ずつ再構築
        if (blocks.length === 0 && displayChars.some(c => isKanji(c))) {
            let ti2 = 0;
            for (let di2 = 0; di2 < displayChars.length; di2++) {
                if (isKanji(displayChars[di2])) {
                    blocks.push({ startDisplayIdx: di2, endDisplayIdx: di2, startTokenIdx: ti2, endTokenIdx: Math.min(ti2, tokens.length-1) });
                    ti2++;
                } else {
                    ti2++;
                }
            }
        }
        return blocks;
    }

    function isKanjiCompleted(block) { return G.tokenIndex > block.endTokenIdx; }

    function renderAllLines(){
        const displayChars = G.displayChars; const tokens = G.tokens;
        const kanjiBlocks = G.problemLang === 'ja' ? getKanjiBlocks() : [];

        let htmlDisplay = '';
        for (let i=0; i<displayChars.length; i++) {
            let cls = 'remaining';
            if (G.problemLang === 'ja') {
                const block = kanjiBlocks.find(b => i >= b.startDisplayIdx && i <= b.endDisplayIdx);
                if (block) {
                    if (isKanjiCompleted(block)) cls = 'correct';
                    else if (G.tokenIndex >= block.startTokenIdx && G.tokenIndex <= block.endTokenIdx) cls = 'current';
                }
            } else {
                if (i < G.tokenIndex) cls = 'correct';
                else if (i === G.tokenIndex) cls = 'current';
            }
            htmlDisplay += `<span class="char ${cls}">${escHtml(displayChars[i])}</span>`;
        }
        els.lineDisplay.innerHTML = htmlDisplay;

        if (G.problemLang === 'ja' && G.optShowReading) {
            let htmlReading = '';
            for (let i=0; i<tokens.length; i++) {
                let cls = (i<G.tokenIndex)?'correct':(i===G.tokenIndex)?'current':'remaining';
                htmlReading += `<span class="char ${cls}">${escHtml(tokens[i])}</span>`;
            }
            els.lineReading.innerHTML = htmlReading;
        } else { els.lineReading.innerHTML = ''; }

        if (G.problemLang === 'ja' && G.optShowRomaji) {
            let htmlRomaji = '';
            for (let i=0; i<tokens.length; i++) {
                const token = tokens[i];
                let roma = (i < G.tokenIndex) ? (G.completedRomaji[i] || (kanaToRomaji[token]?.[0]||token))
                        : (i === G.tokenIndex) ? (G.tokenCandidates[0]||token)
                        : (kanaToRomaji[token]?.[0]||token);
                for (let j=0; j<roma.length; j++) {
                    let cls = 'remaining';
                    if (i < G.tokenIndex) cls = 'correct';
                    else if (i === G.tokenIndex) {
                        if (j < G.tokenMatchStr.length) cls = 'correct';
                        else if (j === G.tokenMatchStr.length) cls = 'current';
                    }
                    htmlRomaji += `<span class="char ${cls}">${escHtml(roma[j])}</span>`;
                }
            }
            els.lineRomaji.innerHTML = htmlRomaji;
        } else { els.lineRomaji.innerHTML = ''; }

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
            if(G.tokenMatchStr.length > 0){
                G.tokenMatchStr = G.tokenMatchStr.slice(0, -1);
                G.tokenCandidates = (kanaToRomaji[G.tokens[G.tokenIndex]]||[]).filter(c=>c.startsWith(G.tokenMatchStr));
                if (G.tokenMatchStr.length === 0 && G.tokens[G.tokenIndex] === 'ん') {
                    const nextToken = G.tokenIndex + 1 < G.tokens.length ? G.tokens[G.tokenIndex + 1] : null;
                    G.tokenCandidates = getAcceptedForN(nextToken);
                }
            }
            updateInputFeedback(); renderAllLines();
            return;
        }
        if(/^[a-zA-Z]$/.test(key)) processCharInput(key.toLowerCase());
    });

    function processCharInput(char){
        if(G.tokenIndex >= G.tokens.length){ advanceToNextProblem(); return; }
        if (G.problemLang === 'ja' && G.tokens[G.tokenIndex] === 'ん' && G.tokenMatchStr === 'n') {
            if (G.tokenCandidates.includes('n')) {
                const nextTokenIdx = G.tokenIndex + 1;
                if (nextTokenIdx < G.tokens.length) {
                    const nextToken = G.tokens[nextTokenIdx];
                    const nextCandidates = kanaToRomaji[nextToken] || [nextToken];
                    const nextFirstChars = new Set(nextCandidates.map(c => c[0]));
                    if (nextFirstChars.has(char)) {
                        G.completedRomaji[G.tokenIndex] = 'n';
                        G.tokenIndex++;
                        resetTokenState();
                        processCharInput(char);
                        return;
                    }
                }
            }
        }

        const token = G.tokens[G.tokenIndex];
        const candidates = G.tokenCandidates;
        const nextChars = new Set(candidates.map(c=>c[G.tokenMatchStr.length]));
        if(nextChars.has(char)){
            G.tokenMatchStr += char;
            G.totalInputs++; G.correctInputs++; G.combo++;
            if(G.combo > G.maxCombo) G.maxCombo = G.combo;
            const comboMult = calcComboMultiplier(G.combo);
            const charMult = getCharTypeMultiplier(G.problems[G.currentProblemIndex].display, G.optUseCharType, G.optShowRomaji, G.optShowReading);
            G.score += 2 * comboMult * charMult;
            G.tokenCandidates = candidates.filter(c=>c.startsWith(G.tokenMatchStr));
            if(G.tokenCandidates.includes(G.tokenMatchStr)){
                if (G.problemLang === 'ja' && token === 'ん' && G.tokenMatchStr === 'n' && G.tokenCandidates.includes('nn')) {
                    // まだ完了しない
                } else {
                    G.completedRomaji[G.tokenIndex] = G.tokenMatchStr;
                    G.tokenIndex++;
                    if(G.tokenIndex < G.tokens.length) resetTokenState();
                    if(G.tokenIndex >= G.tokens.length) advanceToNextProblem();
                }
            }
            els.inputFeedback.textContent = '✅ ' + char;
            els.inputFeedback.style.color = 'var(--correct)';
            setTimeout(()=>{ if(G.isPlaying) els.inputFeedback.style.color='var(--text2)'; }, 300);
            renderAllLines(); updateStatsDisplay();
            if(G.mode==='infinite') resetInfiniteTimer();
        } else {
            G.totalInputs++; G.mistakes++; G.combo = 0;
            G.score = Math.max(0, G.score - 1);
            G.tokenMatchStr = ''; G.tokenCandidates = kanaToRomaji[token] || [token];
            updateStatsDisplay();
            els.inputFeedback.textContent = '❌ ミス！';
            els.inputFeedback.classList.add('error-flash'); els.inputFeedback.style.color = 'var(--error)';
            setTimeout(()=>{ if(G.isPlaying){ els.inputFeedback.classList.remove('error-flash'); els.inputFeedback.style.color='var(--text2)'; } }, 400);
            els.problemFrame.style.transform = 'translateX(-4px)';
            setTimeout(()=>{ els.problemFrame.style.transform = 'translateX(4px)'; }, 80);
            setTimeout(()=>{ els.problemFrame.style.transform = ''; }, 160);
            renderAllLines();
        }
    }

    function updateInputFeedback(){
        els.inputFeedback.textContent = G.tokenMatchStr.length ? '入力中: ' + G.tokenMatchStr : 'ローマ字を入力...';
    }

    // ★ 問題進行の三重構造
    function advanceToNextProblem(){
        // プライマリ: 通常進行
        G.currentProblemIndex++; G.solvedCount++;
        if(G.mode==='normal' && G.currentProblemIndex>=G.totalProblems){ endGame('complete'); return; }

        // セカンダリ: 問題読み込みの安全チェック
        try {
            loadCurrentProblem();
        } catch (e) {
            // フォールバック: 問題を強制追加して再試行
            G.problems.push(...getProblemsForGame(G.problemType, 5, G.problemLang));
            loadCurrentProblem();
        }

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