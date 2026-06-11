import type { SpreadId } from '@/types';

/** 牌陣就地簡介：一句「適合問什麼」（§5.1）。 */
export const SPREAD_BLURB: Record<SpreadId, string> = {
  'one-card-guidance': '想要一句今日方向',
  'three-card-guidance': '快速看一件事：狀況 → 阻礙 → 建議',
  'five-card-depth': '全面剖析一個問題',
  'relationship-guidance': '感情、人際關係',
  'career-guidance': '職涯、工作選擇',
  'choice-ab': '在兩個選項間做決定',
};

/** idle 首頁牌陣的顯示順序（預設五張深入指引置於易見處）。 */
export const SPREAD_ORDER: SpreadId[] = [
  'five-card-depth',
  'one-card-guidance',
  'three-card-guidance',
  'relationship-guidance',
  'career-guidance',
  'choice-ab',
];

/** 引導式推薦：使用者選的類型 → 自動套用的牌陣（§5.1）。 */
export type GuidedOption = {
  label: string;
  hint: string;
  spreadId: SpreadId;
};

export const GUIDED_OPTIONS: GuidedOption[] = [
  { label: '今日訊號', hint: '一張快速指引', spreadId: 'one-card-guidance' },
  { label: '眼前局勢', hint: '三張快速指引', spreadId: 'three-card-guidance' },
  { label: '全貌展開', hint: '五張深入指引', spreadId: 'five-card-depth' },
  { label: '關係暗流', hint: '關係牌陣', spreadId: 'relationship-guidance' },
  { label: '路口抉擇', hint: '工作 / 事業牌陣', spreadId: 'career-guidance' },
  { label: '命運分岔', hint: '選擇 A/B', spreadId: 'choice-ab' },
];
