// --- ローマ字マッピング ---
const baseKanaToRomaji: Record<string, string[]> = {
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
    'ー':['-'],
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
    const kana = 'っ' + s.kana, romas: string[] = [];
    s.romas.forEach(r => {
        if (r.startsWith('x') || r.startsWith('l')) {
            romas.push('ll' + r.substring(1));
            romas.push('xx' + r.substring(1));
        }
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

export const kanaToRomaji = baseKanaToRomaji;

// --- 問題型定義 ---
export interface Problem {
    display: string;
    reading: string;
}

// --- 問題データ（日本語） ---
export const problemData: Record<string, Problem[]> = {
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
        {display:'明日は曇り',reading:'あしたはくもり'},{display:'昨日は雪',reading:'きのうはゆき'},{display:'一昨日は嵐',reading:'おとともあらし'}, //typing.jsの typo: おとといはあらし をそのまま維持
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
    ]
};

export const fallbackEnglishWords = [
    {display:'apple',reading:'apple'},{display:'book',reading:'book'},{display:'cat',reading:'cat'},{display:'dog',reading:'dog'},
    {display:'egg',reading:'egg'},{display:'flower',reading:'flower'},{display:'garden',reading:'garden'},{display:'house',reading:'house'},
    {display:'ice',reading:'ice'},{display:'jungle',reading:'jungle'},{display:'key',reading:'key'},{display:'lion',reading:'lion'},
    {display:'moon',reading:'moon'},{display:'night',reading:'night'},{display:'ocean',reading:'ocean'},{display:'pencil',reading:'pencil'},
    {display:'queen',reading:'queen'},{display:'rain',reading:'rain'},{display:'sun',reading:'sun'},{display:'tree',reading:'tree'},
    {display:'umbrella',reading:'umbrella'},{display:'village',reading:'village'},{display:'water',reading:'water'},{display:'xylophone',reading:'xylophone'},
    {display:'yellow',reading:'yellow'},{display:'zebra',reading:'zebra'}
];

export const countryList = [
    "その他","日本","アメリカ合衆国","イギリス","フランス","ドイツ","イタリア","スペイン","韓国","中国","台湾",
    "オーストラリア","カナダ","ブラジル","インド","ロシア","メキシコ","オランダ","スイス","スウェーデン","ノルウェー",
    "デンマーク","フィンランド","ポルトガル","ギリシャ","トルコ","サウジアラビア","アラブ首長国連邦","インドネシア","タイ","ベトナム","フィリピン",
    "マレーシア","シンガポール","ニュージーランド","南アフリカ","エジプト","アルゼンチン","チリ","コロンビア","ペルー"
];
