import type { Suit, TarotCard } from '../types';

const asset = (id: string) => `${import.meta.env.BASE_URL}cards/${id}.svg`;

type MajorCardSeed = readonly [
  id: string,
  nameZh: string,
  nameEn: string,
  number: number,
  uprightMeaning: string,
  reversedMeaning: string,
  keywords: string[],
];

const majorSeeds: MajorCardSeed[] = [
  ['the-fool', '愚者', 'The Fool', 0, '新的開始、自由、信任直覺', '輕率、逃避現實、準備不足', ['開始', '冒險', '自由']],
  ['the-magician', '魔術師', 'The Magician', 1, '資源到位、主動創造、意志清晰', '操控、分心、能力未整合', ['行動', '創造', '資源']],
  ['the-high-priestess', '女祭司', 'The High Priestess', 2, '直覺、內在知識、保持觀察', '忽略直覺、秘密、情緒封閉', ['直覺', '靜觀', '祕密']],
  ['the-empress', '皇后', 'The Empress', 3, '滋養、豐盛、關係與創造力', '過度依附、停滯、照顧失衡', ['滋養', '豐盛', '創造']],
  ['the-emperor', '皇帝', 'The Emperor', 4, '秩序、界線、穩定掌控', '僵化、控制慾、缺乏彈性', ['秩序', '責任', '界線']],
  ['the-hierophant', '教皇', 'The Hierophant', 5, '傳統、學習、尋求可靠指引', '盲從、規則壓迫、價值衝突', ['學習', '傳統', '指引']],
  ['the-lovers', '戀人', 'The Lovers', 6, '選擇、真誠連結、價值一致', '猶豫、失衡、關係不坦誠', ['選擇', '關係', '價值']],
  ['the-chariot', '戰車', 'The Chariot', 7, '意志、推進、整合衝突', '方向分裂、急躁、控制失準', ['前進', '意志', '勝利']],
  ['strength', '力量', 'Strength', 8, '溫柔的勇氣、自制、韌性', '自我懷疑、壓抑、衝動反應', ['勇氣', '耐心', '韌性']],
  ['the-hermit', '隱者', 'The Hermit', 9, '獨處、內省、尋找真相', '孤立、逃避交流、過度退縮', ['內省', '智慧', '獨處']],
  ['wheel-of-fortune', '命運之輪', 'Wheel of Fortune', 10, '轉機、循環、順勢而行', '抗拒改變、重複舊模式、失控感', ['轉變', '機會', '循環']],
  ['justice', '正義', 'Justice', 11, '公平、因果、清楚判斷', '偏見、責任不明、不公', ['公平', '真相', '責任']],
  ['the-hanged-man', '倒吊人', 'The Hanged Man', 12, '暫停、換位思考、放下執著', '拖延、無謂犧牲、卡住', ['暫停', '看見', '放下']],
  ['death', '死神', 'Death', 13, '結束、轉化、讓舊階段退場', '抗拒結束、停在過去、轉化延遲', ['結束', '轉化', '更新']],
  ['temperance', '節制', 'Temperance', 14, '調和、整合、穩定節奏', '失衡、過量、缺乏耐心', ['平衡', '整合', '節奏']],
  ['the-devil', '惡魔', 'The Devil', 15, '看見束縛、慾望、權力交換', '鬆綁、擺脫依賴、拒絕誘惑', ['束縛', '慾望', '覺察']],
  ['the-tower', '高塔', 'The Tower', 16, '突變、真相揭露、舊結構瓦解', '害怕改變、危機延後、重建困難', ['突變', '揭露', '重建']],
  ['the-star', '星星', 'The Star', 17, '希望、療癒、重新相信未來', '失望、信心不足、理想太遠', ['希望', '療癒', '信任']],
  ['the-moon', '月亮', 'The Moon', 18, '不確定、潛意識、辨認幻象', '迷霧散去、恐懼退潮、真相浮現', ['迷霧', '夢境', '直覺']],
  ['the-sun', '太陽', 'The Sun', 19, '清楚、喜悅、能量回升', '過度樂觀、延遲的成果、曝光焦慮', ['清晰', '活力', '成功']],
  ['judgement', '審判', 'Judgement', 20, '回應召喚、重新評估、覺醒', '自責、逃避回顧、拒絕改變', ['覺醒', '召喚', '更新']],
  ['the-world', '世界', 'The World', 21, '完成、整合、進入新階段', '未竟之事、缺少收尾、停在門口', ['完成', '整合', '旅程']],
];

const majorCards: Array<Omit<TarotCard, 'arcana' | 'suit' | 'image'>> = majorSeeds.map(([id, nameZh, nameEn, number, uprightMeaning, reversedMeaning, keywords]) => ({
  id,
  nameZh,
  nameEn,
  number,
  uprightMeaning,
  reversedMeaning,
  keywords,
}));

const suits: Record<Exclude<Suit, null>, { zh: string; en: string; theme: string; block: string; advice: string; keywords: string[] }> = {
  wands: {
    zh: '權杖',
    en: 'Wands',
    theme: '熱情、行動力與創造衝動',
    block: '能量分散、急躁或缺乏持續力',
    advice: '把動機化成具體步驟',
    keywords: ['行動', '熱情', '創造'],
  },
  cups: {
    zh: '聖杯',
    en: 'Cups',
    theme: '情感、關係與內在需求',
    block: '感受混亂、依賴或逃避真心',
    advice: '先辨認真正的情緒需求',
    keywords: ['情感', '關係', '直覺'],
  },
  swords: {
    zh: '寶劍',
    en: 'Swords',
    theme: '思考、溝通與判斷',
    block: '過度分析、衝突或語言傷人',
    advice: '用清楚事實切開問題',
    keywords: ['思考', '溝通', '判斷'],
  },
  pentacles: {
    zh: '錢幣',
    en: 'Pentacles',
    theme: '現實資源、工作與身體安全感',
    block: '進展緩慢、資源焦慮或過度保守',
    advice: '回到可衡量的現實安排',
    keywords: ['資源', '工作', '穩定'],
  },
};

const ranks = [
  { n: 1, zh: '一', en: 'Ace', upright: '種子正在出現，適合開啟新的可能。', reversed: '起步受阻，動機或資源還需要整理。', keys: ['起點', '機會'] },
  { n: 2, zh: '二', en: 'Two', upright: '需要協調兩股力量，做出更清楚的選擇。', reversed: '猶豫拉扯加劇，暫時難以整合。', keys: ['選擇', '平衡'] },
  { n: 3, zh: '三', en: 'Three', upright: '事情開始成形，合作與擴展帶來進展。', reversed: '合作不順或期待落差，需重整共識。', keys: ['合作', '成形'] },
  { n: 4, zh: '四', en: 'Four', upright: '結構趨於穩定，但也要留意是否過於固定。', reversed: '安全感不穩，原本的架構需要調整。', keys: ['穩定', '基礎'] },
  { n: 5, zh: '五', en: 'Five', upright: '衝突或變動正在推動你看見問題核心。', reversed: '消耗逐漸減少，但仍需避免重複爭執。', keys: ['衝突', '變動'] },
  { n: 6, zh: '六', en: 'Six', upright: '支持回流，局勢有機會走向修復與前進。', reversed: '停在舊模式裡，難以真正接受支持。', keys: ['修復', '支持'] },
  { n: 7, zh: '七', en: 'Seven', upright: '需要策略、辨識與主動守住立場。', reversed: '防衛過高或判斷失準，容易把力氣用錯。', keys: ['策略', '辨識'] },
  { n: 8, zh: '八', en: 'Eight', upright: '速度加快，專注投入會帶來明顯推進。', reversed: '節奏卡住或太急，需重新安排優先順序。', keys: ['速度', '專注'] },
  { n: 9, zh: '九', en: 'Nine', upright: '已累積不少經驗，現在考驗的是耐力與信任。', reversed: '疲憊感升高，可能需要休息而不是硬撐。', keys: ['累積', '耐力'] },
  { n: 10, zh: '十', en: 'Ten', upright: '一個階段達到高峰，也帶來責任與收尾。', reversed: '負擔過重或收尾困難，應減少不必要承擔。', keys: ['高峰', '收尾'] },
  { n: 11, zh: '侍者', en: 'Page', upright: '以學習者姿態接近問題，新訊息會打開方向。', reversed: '經驗不足或訊息混亂，先求證再行動。', keys: ['學習', '訊息'] },
  { n: 12, zh: '騎士', en: 'Knight', upright: '行動意願強，適合帶著目標往前試。', reversed: '衝太快或方向不穩，行動前要校準。', keys: ['推進', '目標'] },
  { n: 13, zh: '皇后', en: 'Queen', upright: '成熟地承接此主題，讓感受與判斷更細膩。', reversed: '照顧失衡或界線模糊，先把自己放回中心。', keys: ['成熟', '承接'] },
  { n: 14, zh: '國王', en: 'King', upright: '掌握主導權，以穩定與責任管理局面。', reversed: '權威失衡或過度控制，需要更透明的界線。', keys: ['主導', '責任'] },
];

const slugRank = (n: number) => {
  if (n === 1) return 'ace';
  if (n === 11) return 'page';
  if (n === 12) return 'knight';
  if (n === 13) return 'queen';
  if (n === 14) return 'king';
  return String(n);
};

const minorCards = Object.entries(suits).flatMap(([suitKey, suit]) =>
  ranks.map((rank) => {
    const id = `${slugRank(rank.n)}-of-${suitKey}`;
    return {
      id,
      nameZh: `${suit.zh}${rank.zh}`,
      nameEn: `${rank.en} of ${suit.en}`,
      arcana: 'minor' as const,
      suit: suitKey as Suit,
      number: rank.n,
      image: asset(id),
      uprightMeaning: `${rank.upright} 這張牌的核心落在${suit.theme}。`,
      reversedMeaning: `${rank.reversed} 常見阻力是${suit.block}。`,
      keywords: [...rank.keys, ...suit.keywords],
    };
  }),
);

export const TAROT_DECK: TarotCard[] = [
  ...majorCards.map((card) => ({
    ...card,
    arcana: 'major' as const,
    suit: null,
    image: asset(card.id),
  })),
  ...minorCards,
];

export const cardBackImage = asset('card-back');
