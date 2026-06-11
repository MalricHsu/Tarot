import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(repoRoot, 'public', 'cards');
const tmpDir = join(repoRoot, 'tmp', 'rws-import');

const majorFiles = [
  ['the-fool', 'RWS Tarot 00 Fool.jpg'],
  ['the-magician', 'RWS Tarot 01 Magician.jpg'],
  ['the-high-priestess', 'RWS Tarot 02 High Priestess.jpg'],
  ['the-empress', 'RWS Tarot 03 Empress.jpg'],
  ['the-emperor', 'RWS Tarot 04 Emperor.jpg'],
  ['the-hierophant', 'RWS Tarot 05 Hierophant.jpg'],
  ['the-lovers', 'RWS Tarot 06 Lovers.jpg'],
  ['the-chariot', 'RWS Tarot 07 Chariot.jpg'],
  ['strength', 'RWS Tarot 08 Strength.jpg'],
  ['the-hermit', 'RWS Tarot 09 Hermit.jpg'],
  ['wheel-of-fortune', 'RWS Tarot 10 Wheel of Fortune.jpg'],
  ['justice', 'RWS Tarot 11 Justice.jpg'],
  ['the-hanged-man', 'RWS Tarot 12 Hanged Man.jpg'],
  ['death', 'RWS Tarot 13 Death.jpg'],
  ['temperance', 'RWS Tarot 14 Temperance.jpg'],
  ['the-devil', 'RWS Tarot 15 Devil.jpg'],
  ['the-tower', 'RWS Tarot 16 Tower.jpg'],
  ['the-star', 'RWS Tarot 17 Star.jpg'],
  ['the-moon', 'RWS Tarot 18 Moon.jpg'],
  ['the-sun', 'RWS Tarot 19 Sun.jpg'],
  ['judgement', 'RWS Tarot 20 Judgement.jpg'],
  ['the-world', 'RWS Tarot 21 World.jpg'],
];

const suitPrefixes = {
  wands: 'Wands',
  cups: 'Cups',
  swords: 'Swords',
  pentacles: 'Pents',
};

const rankSlug = (n) => {
  if (n === 1) return 'ace';
  if (n === 11) return 'page';
  if (n === 12) return 'knight';
  if (n === 13) return 'queen';
  if (n === 14) return 'king';
  return String(n);
};

const minorFiles = Object.entries(suitPrefixes).flatMap(([suit, prefix]) =>
  Array.from({ length: 14 }, (_, idx) => {
    const n = idx + 1;
    return [`${rankSlug(n)}-of-${suit}`, `${prefix}${String(n).padStart(2, '0')}.jpg`];
  }),
);

const manifest = [...majorFiles, ...minorFiles];

const redirectUrl = (title) =>
  `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(title)}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const downloadWithRetry = async (title, attempts = 5) => {
  let waitMs = 1200;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const res = await fetch(redirectUrl(title), {
      headers: {
        'user-agent': 'zhujian-tarot/1.0 asset refresh',
      },
    });

    if (res.ok) {
      return res;
    }

    if (res.status !== 429 && res.status < 500) {
      throw new Error(`Failed to download ${title}: ${res.status} ${res.statusText}`);
    }

    if (attempt === attempts) {
      throw new Error(`Failed to download ${title}: ${res.status} ${res.statusText}`);
    }

    process.stdout.write(`Rate limited on ${title}, retrying in ${waitMs}ms...\n`);
    await sleep(waitMs);
    waitMs *= 2;
  }

  throw new Error(`Failed to download ${title}`);
};

mkdirSync(outDir, { recursive: true });
rmSync(tmpDir, { recursive: true, force: true });
mkdirSync(tmpDir, { recursive: true });

for (const [id, remoteTitle] of manifest) {
  const sourcePath = join(tmpDir, `${id}-source.jpg`);
  const outPath = join(outDir, `${id}.jpg`);

  process.stdout.write(`Downloading ${id}...\n`);
  const res = await downloadWithRetry(remoteTitle);

  const arrayBuffer = await res.arrayBuffer();
  writeFileSync(sourcePath, Buffer.from(arrayBuffer));

  const sips = spawnSync(
    'sips',
    ['-s', 'format', 'jpeg', '-s', 'formatOptions', '72', '-Z', '960', sourcePath, '--out', outPath],
    { stdio: 'pipe' },
  );

  if (sips.status !== 0) {
    throw new Error(`sips failed for ${id}: ${sips.stderr.toString() || sips.stdout.toString()}`);
  }

  await sleep(350);
}

process.stdout.write(`Done. Downloaded ${manifest.length} Rider-Waite-Smith card images to public/cards.\n`);
