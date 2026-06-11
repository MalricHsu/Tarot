import { TAROT_DECK } from '../data/tarot';
import type { DailyCardRecord, DrawnCard, Orientation, ReadingHistoryItem, ReadingResult, SpreadId } from '../types';
import { buildInterpretation, getSpreadById } from './spread';

const HISTORY_KEY = 'tarot.readingHistory.v1';
const DAILY_CARD_KEY = 'tarot.dailyCard.v1';
const USER_SEED_KEY = 'tarot.userSeed.v1';
const MAX_NON_FAVORITE_HISTORY = 50;

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function getStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isReadingResult(value: unknown): value is ReadingResult {
  if (!isRecord(value)) return false;
  return (
    Array.isArray(value.cards) &&
    Array.isArray(value.interpretations) &&
    typeof value.summary === 'string' &&
    Array.isArray(value.actions) &&
    value.actions.every((item) => typeof item === 'string')
  );
}

function isHistoryItem(value: unknown): value is ReadingHistoryItem {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.question === 'string' &&
    typeof value.spreadId === 'string' &&
    typeof value.spreadLabel === 'string' &&
    isReadingResult(value.reading) &&
    typeof value.clarification === 'string' &&
    typeof value.isFavorite === 'boolean' &&
    (value.source === 'question' || value.source === 'daily')
  );
}

function readJson(storage: StorageLike, key: string): unknown {
  const raw = storage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    storage.removeItem(key);
    return null;
  }
}

function saveJson(storage: StorageLike, key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private mode or full quota. The app should continue.
  }
}

function createUserSeed(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `seed-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function getUserSeed(storage: StorageLike | null = getStorage()): string {
  if (!storage) return 'server-default';

  const existing = storage.getItem(USER_SEED_KEY);
  if (existing) return existing;

  const seed = createUserSeed();
  try {
    storage.setItem(USER_SEED_KEY, seed);
  } catch {
    // Storage can be unavailable in private mode or full quota. The app should continue.
  }

  return seed;
}

export function loadReadingHistory(storage: StorageLike | null = getStorage()): ReadingHistoryItem[] {
  if (!storage) return [];

  const parsed = readJson(storage, HISTORY_KEY);
  if (!Array.isArray(parsed)) return [];

  return parsed.filter(isHistoryItem);
}

export function trimReadingHistory(items: ReadingHistoryItem[]): ReadingHistoryItem[] {
  const seen = new Set<string>();
  const unique = items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  const favorites = unique.filter((item) => item.isFavorite);
  const regular = unique.filter((item) => !item.isFavorite).slice(0, MAX_NON_FAVORITE_HISTORY);

  return [...favorites, ...regular].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function saveReadingHistory(items: ReadingHistoryItem[], storage: StorageLike | null = getStorage()): void {
  if (!storage) return;
  saveJson(storage, HISTORY_KEY, trimReadingHistory(items));
}

export function upsertReadingHistoryItem(
  item: ReadingHistoryItem,
  storage: StorageLike | null = getStorage(),
): ReadingHistoryItem[] {
  const current = loadReadingHistory(storage);
  const next = trimReadingHistory([item, ...current.filter((entry) => entry.id !== item.id)]);
  saveReadingHistory(next, storage);
  return next;
}

export function updateReadingHistoryItem(
  id: string,
  update: (item: ReadingHistoryItem) => ReadingHistoryItem,
  storage: StorageLike | null = getStorage(),
): ReadingHistoryItem[] {
  const next = loadReadingHistory(storage).map((item) => (item.id === id ? update(item) : item));
  saveReadingHistory(next, storage);
  return next;
}

export function deleteReadingHistoryItem(id: string, storage: StorageLike | null = getStorage()): ReadingHistoryItem[] {
  const next = loadReadingHistory(storage).filter((item) => item.id !== id);
  saveReadingHistory(next, storage);
  return next;
}

export function clearReadingHistory(storage: StorageLike | null = getStorage()): ReadingHistoryItem[] {
  if (!storage) return [];
  saveJson(storage, HISTORY_KEY, []);
  return [];
}

export function createReadingHistoryItem(params: {
  question: string;
  spreadId: SpreadId;
  spreadLabel: string;
  reading: ReadingResult;
  clarification?: string;
  isFavorite?: boolean;
  source?: ReadingHistoryItem['source'];
  createdAt?: string;
  id?: string;
}): ReadingHistoryItem {
  return {
    id: params.id ?? `reading-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: params.createdAt ?? new Date().toISOString(),
    question: params.question,
    spreadId: params.spreadId,
    spreadLabel: params.spreadLabel,
    reading: params.reading,
    clarification: params.clarification ?? '',
    isFavorite: params.isFavorite ?? false,
    source: params.source ?? 'question',
  };
}

export function getTaipeiDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function drawDailyCard(dateKey: string, userSeed = getUserSeed()): DrawnCard {
  const spread = getSpreadById('one-card-guidance');
  const hash = hashString(`${dateKey}:${userSeed}`);
  const card = TAROT_DECK[hash % TAROT_DECK.length];
  const orientation: Orientation = Math.floor(hash / TAROT_DECK.length) % 2 === 0 ? 'upright' : 'reversed';

  return {
    card,
    orientation,
    position: spread.positions[0],
  };
}

function isDailyRecord(value: unknown): value is DailyCardRecord {
  if (!isRecord(value)) return false;
  return typeof value.date === 'string' && isHistoryItem(value.historyItem);
}

export function getDailyCardRecord(
  dateKey = getTaipeiDateKey(),
  storage: StorageLike | null = getStorage(),
): DailyCardRecord {
  const spread = getSpreadById('one-card-guidance');
  const existing = storage ? readJson(storage, DAILY_CARD_KEY) : null;

  if (isDailyRecord(existing) && existing.date === dateKey) {
    return existing;
  }

  const userSeed = getUserSeed(storage);
  const reading = buildInterpretation('今日指引', [drawDailyCard(dateKey, userSeed)], spread);
  const historyItem = createReadingHistoryItem({
    id: `daily-${dateKey}`,
    createdAt: new Date().toISOString(),
    question: '今日指引',
    spreadId: spread.id,
    spreadLabel: spread.label,
    reading,
    source: 'daily',
  });
  const record = { date: dateKey, historyItem };

  if (storage) {
    saveJson(storage, DAILY_CARD_KEY, record);
    upsertReadingHistoryItem(historyItem, storage);
  }

  return record;
}

export function updateDailyCardRecord(
  item: ReadingHistoryItem,
  storage: StorageLike | null = getStorage(),
): void {
  if (!storage || item.source !== 'daily') return;
  saveJson(storage, DAILY_CARD_KEY, { date: item.id.replace(/^daily-/, ''), historyItem: item });
}
