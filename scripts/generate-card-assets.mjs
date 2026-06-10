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
  <rect width="500" height="800" rx="34" fill="#f4ecd7"/>
  <rect x="22" y="22" width="456" height="756" rx="24" fill="#171612"/>
  <rect x="42" y="42" width="416" height="716" rx="18" fill="#f7f1df"/>
  <path d="M78 126 C136 72 219 78 250 135 C282 78 365 72 422 126 C373 111 315 126 283 172 C267 195 234 195 218 172 C185 126 127 111 78 126Z" fill="${accent}" opacity=".9"/>
  <circle cx="250" cy="352" r="122" fill="${accent}" opacity=".16"/>
  <circle cx="250" cy="352" r="82" fill="none" stroke="${accent}" stroke-width="12"/>
  <text x="250" y="378" text-anchor="middle" font-family="Georgia, serif" font-size="118" fill="#171612">${symbol}</text>
  <line x1="102" y1="560" x2="398" y2="560" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>
  <text x="250" y="625" text-anchor="middle" font-family="'Noto Sans TC', system-ui, sans-serif" font-size="42" font-weight="800" fill="#171612">${title}</text>
  <text x="250" y="690" text-anchor="middle" font-family="Georgia, serif" font-size="38" fill="${accent}">${mark}</text>
</svg>`;

const back = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="800" viewBox="0 0 500 800" role="img" aria-label="塔羅牌背">
  <rect width="500" height="800" rx="34" fill="#121614"/>
  <rect x="26" y="26" width="448" height="748" rx="24" fill="#21332c" stroke="#d5b76f" stroke-width="12"/>
  <path d="M250 128 L303 292 L475 292 L336 392 L389 556 L250 455 L111 556 L164 392 L25 292 L197 292 Z" fill="none" stroke="#d5b76f" stroke-width="14" stroke-linejoin="round"/>
  <circle cx="250" cy="400" r="106" fill="none" stroke="#f4ecd7" stroke-width="8"/>
  <text x="250" y="430" text-anchor="middle" font-family="Georgia, serif" font-size="96" fill="#f4ecd7">✦</text>
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
