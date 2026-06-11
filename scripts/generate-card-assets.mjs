import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'cards');

const majors = [
  ['the-fool', '愚者', '0'],
  ['the-magician', '魔術師', 'I'],
  ['the-high-priestess', '女祭司', 'II'],
  ['the-empress', '皇后', 'III'],
  ['the-emperor', '皇帝', 'IV'],
  ['the-hierophant', '教皇', 'V'],
  ['the-lovers', '戀人', 'VI'],
  ['the-chariot', '戰車', 'VII'],
  ['strength', '力量', 'VIII'],
  ['the-hermit', '隱者', 'IX'],
  ['wheel-of-fortune', '命運之輪', 'X'],
  ['justice', '正義', 'XI'],
  ['the-hanged-man', '倒吊人', 'XII'],
  ['death', '死神', 'XIII'],
  ['temperance', '節制', 'XIV'],
  ['the-devil', '惡魔', 'XV'],
  ['the-tower', '高塔', 'XVI'],
  ['the-star', '星星', 'XVII'],
  ['the-moon', '月亮', 'XVIII'],
  ['the-sun', '太陽', 'XIX'],
  ['judgement', '審判', 'XX'],
  ['the-world', '世界', 'XXI'],
];

const suits = [
  ['wands', '權杖', '#b95c3b', '✦'],
  ['cups', '聖杯', '#3b83a6', '◡'],
  ['swords', '寶劍', '#717b96', '◇'],
  ['pentacles', '錢幣', '#8a7a38', '●'],
];

const ranks = [
  [1, '一', 'A'],
  [2, '二', '2'],
  [3, '三', '3'],
  [4, '四', '4'],
  [5, '五', '5'],
  [6, '六', '6'],
  [7, '七', '7'],
  [8, '八', '8'],
  [9, '九', '9'],
  [10, '十', '10'],
  [11, '侍者', 'P'],
  [12, '騎士', 'N'],
  [13, '皇后', 'Q'],
  [14, '國王', 'K'],
];

const slugRank = (n) => {
  if (n === 1) return 'ace';
  if (n === 11) return 'page';
  if (n === 12) return 'knight';
  if (n === 13) return 'queen';
  if (n === 14) return 'king';
  return String(n);
};

const svg = ({ title, mark, accent, symbol }) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="800" viewBox="0 0 500 800" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="bg" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#f8f1df"/>
      <stop offset="55%" stop-color="#f4ebd6"/>
      <stop offset="100%" stop-color="#efe3c5"/>
    </linearGradient>
    <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="${accent}" stop-opacity=".22"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="46%" r="42%">
      <stop offset="0%" stop-color="${accent}" stop-opacity=".22"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#5f4220" flood-opacity=".18"/>
    </filter>
  </defs>

  <rect width="500" height="800" rx="34" fill="#ead9b7"/>
  <rect x="18" y="18" width="464" height="764" rx="28" fill="#201711"/>
  <rect x="34" y="34" width="432" height="732" rx="22" fill="url(#bg)"/>
  <rect x="48" y="48" width="404" height="704" rx="18" fill="none" stroke="#c8a46a" stroke-width="4"/>
  <rect x="62" y="62" width="376" height="676" rx="14" fill="none" stroke="#201711" stroke-width="2.5"/>

  <path d="M86 126 C128 86 189 72 250 72 C311 72 372 86 414 126 C370 110 322 118 289 150 C273 166 227 166 211 150 C178 118 130 110 86 126 Z" fill="url(#sky)"/>
  <path d="M118 126 C158 104 342 104 382 126" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" opacity=".9"/>
  <circle cx="250" cy="126" r="18" fill="#f7f1df" stroke="${accent}" stroke-width="4"/>
  <circle cx="184" cy="132" r="6" fill="${accent}" opacity=".8"/>
  <circle cx="316" cy="132" r="6" fill="${accent}" opacity=".8"/>
  <circle cx="154" cy="144" r="4" fill="#c8a46a"/>
  <circle cx="346" cy="144" r="4" fill="#c8a46a"/>

  <g filter="url(#shadow)">
    <path d="M140 220 C171 194 212 180 250 180 C288 180 329 194 360 220 C390 246 406 281 406 316 C406 392 343 455 250 516 C157 455 94 392 94 316 C94 281 110 246 140 220 Z" fill="url(#halo)" opacity=".86"/>
    <circle cx="250" cy="360" r="118" fill="${accent}" opacity=".09"/>
    <circle cx="250" cy="360" r="86" fill="none" stroke="${accent}" stroke-width="10"/>
    <circle cx="250" cy="360" r="52" fill="#f8f1df" opacity=".72"/>
    <text x="250" y="386" text-anchor="middle" font-family="Georgia, serif" font-size="112" fill="#171612">${symbol}</text>
  </g>

  <path d="M108 594 C156 620 194 614 216 588 C228 574 238 560 250 560 C262 560 272 574 284 588 C306 614 344 620 392 594 C354 646 306 668 250 668 C194 668 146 646 108 594 Z" fill="${accent}" opacity=".86"/>
  <line x1="120" y1="550" x2="380" y2="550" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>

  <text x="88" y="106" font-family="Georgia, serif" font-size="28" fill="${accent}">${mark}</text>
  <text x="412" y="106" text-anchor="end" font-family="Georgia, serif" font-size="28" fill="${accent}">${mark}</text>

  <text x="250" y="700" text-anchor="middle" font-family="'Noto Serif TC', Georgia, serif" font-size="40" font-weight="700" fill="#201711">${title}</text>
  <text x="250" y="736" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="${accent}">${mark}</text>
</svg>`;

const back = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="800" viewBox="0 0 500 800" role="img" aria-label="塔羅牌背">
  <defs>
    <linearGradient id="backBg" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#1a2133"/>
      <stop offset="100%" stop-color="#121722"/>
    </linearGradient>
    <radialGradient id="backHalo" cx="50%" cy="50%" r="44%">
      <stop offset="0%" stop-color="#7f5fb2" stop-opacity=".25"/>
      <stop offset="100%" stop-color="#7f5fb2" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="500" height="800" rx="34" fill="#ead9b7"/>
  <rect x="18" y="18" width="464" height="764" rx="28" fill="#171612"/>
  <rect x="34" y="34" width="432" height="732" rx="22" fill="url(#backBg)"/>
  <rect x="50" y="50" width="400" height="700" rx="18" fill="none" stroke="#d5b76f" stroke-width="4"/>
  <rect x="66" y="66" width="368" height="668" rx="14" fill="none" stroke="#f4ecd7" stroke-opacity=".22" stroke-width="2"/>
  <circle cx="250" cy="400" r="156" fill="url(#backHalo)"/>
  <path d="M118 142 C160 104 212 84 250 84 C288 84 340 104 382 142" fill="none" stroke="#d5b76f" stroke-width="5" stroke-linecap="round"/>
  <circle cx="250" cy="142" r="20" fill="none" stroke="#f4ecd7" stroke-width="4"/>
  <circle cx="186" cy="150" r="6" fill="#d5b76f"/>
  <circle cx="314" cy="150" r="6" fill="#d5b76f"/>
  <path d="M250 204 L290 308 L402 308 L314 372 L348 478 L250 410 L152 478 L186 372 L98 308 L210 308 Z" fill="none" stroke="#d5b76f" stroke-width="10" stroke-linejoin="round"/>
  <circle cx="250" cy="400" r="116" fill="none" stroke="#f4ecd7" stroke-width="8"/>
  <circle cx="250" cy="400" r="76" fill="none" stroke="#d5b76f" stroke-width="4"/>
  <text x="250" y="434" text-anchor="middle" font-family="Georgia, serif" font-size="98" fill="#f4ecd7">✦</text>
  <path d="M110 586 C156 614 194 608 216 582 C228 568 238 554 250 554 C262 554 272 568 284 582 C306 608 344 614 390 586 C352 638 304 660 250 660 C196 660 148 638 110 586 Z" fill="#d5b76f" opacity=".9"/>
</svg>`;

mkdirSync(outDir, { recursive: true });

for (const [id, title, mark] of majors) {
  writeFileSync(join(outDir, `${id}.svg`), svg({ title, mark, accent: '#7f5fb2', symbol: '✦' }));
}

for (const [suitId, suitZh, accent, symbol] of suits) {
  for (const [number, rankZh, mark] of ranks) {
    writeFileSync(
      join(outDir, `${slugRank(number)}-of-${suitId}.svg`),
      svg({ title: `${suitZh}${rankZh}`, mark, accent, symbol }),
    );
  }
}

writeFileSync(join(outDir, 'card-back.svg'), back);
