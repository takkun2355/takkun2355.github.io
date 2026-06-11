// generate-dashboard.js
// Node.js 18+ で動作（fetch がグローバルで使えます）
const fs = require("fs");

const USERNAME = "Takkun2355";
const BIRTHDAY = new Date(2011, 8, 24); // 9月24日（月は0始まり）
const DISCORD_ID = "985151399207788615";

// テーマカラー（HTMLモックのCSSを再現）
const COLORS = {
  bg: "#0d1117",
  card: "#161b22",
  border: "#30363d",
  text: "#ffffff",
  secondary: "#8b949e",
  accent: "#58a6ff",
};

// 年齢を計算（○歳○ヶ月○日）
function getAgeString() {
  const now = new Date();
  let years = now.getFullYear() - BIRTHDAY.getFullYear();
  let months = now.getMonth() - BIRTHDAY.getMonth();
  let days = now.getDate() - BIRTHDAY.getDate();
  if (days < 0) {
    months--;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return `${years}歳 ${months}ヶ月 ${days}日`;
}

// GitHub APIからデータ取得（レート制限に注意。必要ならトークンを使う）
async function fetchGitHubData() {
  const [userRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${USERNAME}`),
    fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100`),
  ]);
  const user = await userRes.json();
  const repos = await reposRes.json();

  // 言語の集計
  const langCount = {};
  repos.forEach((repo) => {
    if (repo.language) {
      langCount[repo.language] = (langCount[repo.language] || 0) + 1;
    }
  });
  const languages = Object.entries(langCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const totalLang = languages.reduce((sum, [, c]) => sum + c, 0);

  return {
    avatarUrl: user.avatar_url,
    name: user.name || USERNAME,
    bio: user.bio || "Discord Bot Developer",
    followers: user.followers,
    publicRepos: user.public_repos,
    languages,
    totalLang,
  };
}

// SVG生成
async function generateDashboardSVG() {
  const data = await fetchGitHubData();
  const age = getAgeString();

  // 外部サービス画像URL
  const discordPresenceUrl = `https://lanyard.cnrad.dev/api/${DISCORD_ID}?animated=false&showDisplayName=true`;
  const trophyUrl = `https://github-profile-trophy.vercel.app/?username=${USERNAME}&theme=tokyonight&row=1&column=6`;
  const summaryUrl = `https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=${USERNAME}&theme=tokyonight`;
  const visitorsUrl = `https://komarev.com/ghpvc/?username=${USERNAME}&style=flat-square`;

  // 言語バー生成
  let langY = 50;
  const langBars = data.languages.map(([name, count]) => {
    const percent = ((count / data.totalLang) * 100).toFixed(1);
    const barWidth = Math.max((count / data.totalLang) * 230, 2); // 最小幅
    langY += 28;
    return `
      <text x="20" y="${langY}" fill="${COLORS.secondary}" font-size="12">${name}</text>
      <rect x="100" y="${langY - 11}" width="${barWidth}" height="12" rx="6" fill="${COLORS.accent}" />
      <text x="${105 + barWidth}" y="${langY}" fill="${COLORS.text}" font-size="11">${percent}%</text>`;
  }).join("");

  // 全体のSVG
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="650" viewBox="0 0 900 650">
  <defs>
    <clipPath id="avatarClip"><circle cx="120" cy="80" r="70"/></clipPath>
    <clipPath id="cardClip1"><rect x="0" y="0" width="540" height="600" rx="18"/></clipPath>
    <clipPath id="cardClip2"><rect x="0" y="0" width="305" height="160" rx="18"/></clipPath>
    <clipPath id="cardClip3"><rect x="0" y="0" width="305" height="100" rx="18"/></clipPath>
    <clipPath id="cardClip4"><rect x="0" y="0" width="305" height="160" rx="18"/></clipPath>
    <clipPath id="cardClip5"><rect x="0" y="0" width="305" height="150" rx="18"/></clipPath>
  </defs>

  <!-- 背景 -->
  <rect width="100%" height="100%" fill="${COLORS.bg}" />

  <!-- ========== 左：プロフィールカード ========== -->
  <g transform="translate(15, 15)">
    <rect width="550" height="620" rx="18" fill="${COLORS.card}" stroke="${COLORS.border}" stroke-width="1" />

    <!-- アバター -->
    <image href="${data.avatarUrl}" x="50" y="20" width="140" height="140" clip-path="url(#avatarClip)" />

    <!-- 名前など -->
    <text x="120" y="190" text-anchor="middle" fill="${COLORS.text}" font-size="28" font-weight="bold">${data.name}</text>
    <text x="120" y="215" text-anchor="middle" fill="${COLORS.secondary}" font-size="18">UNKOMAN</text>
    <text x="120" y="240" text-anchor="middle" fill="${COLORS.secondary}" font-size="14">${data.bio}</text>

    <!-- 年齢 -->
    <text x="120" y="275" text-anchor="middle" fill="${COLORS.accent}" font-size="16" font-weight="bold">🎂 ${age}</text>

    <!-- Discordプレゼンス（外部SVG） -->
    <image href="${discordPresenceUrl}" x="20" y="300" width="510" height="160" />

    <!-- 訪問者カウンター（右下） -->
    <image href="${visitorsUrl}" x="400" y="580" width="120" height="25" />
    <text x="400" y="575" fill="${COLORS.secondary}" font-size="11">Visitors:</text>
  </g>

  <!-- ========== 右カラム ========== -->
  <!-- Top Languages -->
  <g transform="translate(580, 15)">
    <rect width="305" height="160" rx="18" fill="${COLORS.card}" stroke="${COLORS.border}" stroke-width="1" />
    <text x="20" y="30" fill="${COLORS.text}" font-size="16" font-weight="bold">Top Languages</text>
    ${langBars}
  </g>

  <!-- GitHub Stats -->
  <g transform="translate(580, 190)">
    <rect width="305" height="100" rx="18" fill="${COLORS.card}" stroke="${COLORS.border}" stroke-width="1" />
    <text x="20" y="30" fill="${COLORS.text}" font-size="16" font-weight="bold">GitHub Stats</text>
    <text x="30" y="60" fill="${COLORS.accent}" font-size="18">📦 ${data.publicRepos}</text>
    <text x="130" y="60" fill="${COLORS.accent}" font-size="18">👥 ${data.followers}</text>
    <text x="30" y="80" fill="${COLORS.secondary}" font-size="11">Public Repos</text>
    <text x="130" y="80" fill="${COLORS.secondary}" font-size="11">Followers</text>
  </g>

  <!-- Trophy（外部SVG） -->
  <g transform="translate(580, 305)">
    <rect width="305" height="160" rx="18" fill="${COLORS.card}" stroke="${COLORS.border}" stroke-width="1" />
    <text x="20" y="25" fill="${COLORS.text}" font-size="16" font-weight="bold">🏆 Trophy</text>
    <image href="${trophyUrl}" x="10" y="35" width="285" height="115" />
  </g>

  <!-- Profile Summary（外部SVG） -->
  <g transform="translate(580, 480)">
    <rect width="305" height="150" rx="18" fill="${COLORS.card}" stroke="${COLORS.border}" stroke-width="1" />
    <text x="20" y="25" fill="${COLORS.text}" font-size="16" font-weight="bold">📊 Summary</text>
    <image href="${summaryUrl}" x="10" y="35" width="285" height="105" />
  </g>
</svg>`;
}

// 実行
(async () => {
  const svg = await generateDashboardSVG();
  fs.writeFileSync("dashboard.svg", svg, "utf8");
  console.log("dashboard.svg を生成しました");
})().catch(console.error);