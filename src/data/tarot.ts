import type { Suit, TarotCard } from '../types';

const asset = (id: string, ext = 'jpg') => `${import.meta.env.BASE_URL}cards/${id}.${ext}`;

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

const majorDetails: Record<string, Pick<TarotCard, 'visualDescription' | 'cardMessage' | 'generalInterpretation'>> = {
  'the-fool': {
    visualDescription: '旅人站在崖邊，手持小包袱，腳步輕盈地朝未知前進，身旁的小狗像是提醒也像是陪伴。',
    cardMessage: '新的路已經打開，但它要求你帶著信任前進，同時看清腳下的邊界。',
    generalInterpretation: '一般抽到愚者，常表示一段新開始、一次冒險或尚未被定義的可能。它鼓勵你放下過度計算，但也提醒準備不足會讓自由變成衝動。',
  },
  'the-magician': {
    visualDescription: '魔術師站在桌前，四元素工具齊備，一手指天一手指地，把意志帶進現實。',
    cardMessage: '你不是完全沒有資源，關鍵在於是否願意主動整合手上的條件。',
    generalInterpretation: '一般抽到魔術師，代表行動力、創造力與資源到位。它常提醒人把想法轉成實作，也要避免只停留在表演、話術或分心之中。',
  },
  'the-high-priestess': {
    visualDescription: '女祭司坐在兩根柱子之間，手持卷軸，身後帷幕遮住尚未揭露的知識。',
    cardMessage: '答案暫時不必急著說出口，先聽見直覺與沉默裡的訊息。',
    generalInterpretation: '一般抽到女祭司，常表示直覺、觀察、秘密與內在智慧。它提醒你暫停外求，辨認尚未明朗的資訊與自己的真實感受。',
  },
  'the-empress': {
    visualDescription: '皇后坐在豐盛自然之中，周圍有穀物、河流與柔軟的生命力。',
    cardMessage: '真正的成長需要滋養，不只是努力，也需要允許事物自然成熟。',
    generalInterpretation: '一般抽到皇后，象徵創造、照顧、關係與豐盛。它常帶來柔軟的擴張，也提醒過度照顧或依附會讓能量失衡。',
  },
  'the-emperor': {
    visualDescription: '皇帝坐在堅硬寶座上，姿態穩定，周圍山石象徵秩序、權威與界線。',
    cardMessage: '混亂需要被整理，現在要建立規則、承擔責任並守住界線。',
    generalInterpretation: '一般抽到皇帝，代表結構、穩定、掌控與責任。它提醒你用成熟方式管理局面，但不要讓保護變成僵化控制。',
  },
  'the-hierophant': {
    visualDescription: '教皇在聖殿中舉手祝福，兩位追隨者在前方聆聽，象徵傳承與制度。',
    cardMessage: '尋找可信任的指引，並確認你遵循的價值是否仍然適合自己。',
    generalInterpretation: '一般抽到教皇，常與學習、傳統、承諾、制度或師長有關。它支持穩定的路徑，也提醒不要盲從不再適合的規則。',
  },
  'the-lovers': {
    visualDescription: '兩人站在天使之下，彼此坦露而相望，背景象徵誘惑、選擇與祝福。',
    cardMessage: '真正的選擇來自價值一致，而不是只追求眼前吸引。',
    generalInterpretation: '一般抽到戀人，代表關係、吸引、合作與重大選擇。它提醒你誠實面對心意，也看清選擇背後的責任。',
  },
  'the-chariot': {
    visualDescription: '戰車駕馭者站在車上，兩股力量向不同方向拉動，卻被意志統合前進。',
    cardMessage: '你需要把分散的力量收束成方向，靠意志推動事情越過阻力。',
    generalInterpretation: '一般抽到戰車，象徵推進、勝利、自律與目標感。它常表示可以前進，但必須先整合內外衝突。',
  },
  strength: {
    visualDescription: '女子溫柔地安撫獅子，不靠壓制，而是以穩定、耐心與信任化解野性。',
    cardMessage: '真正的力量不是硬碰硬，而是在情緒升起時仍能保持溫柔而堅定。',
    generalInterpretation: '一般抽到力量，表示勇氣、自制、耐心與韌性。它提醒你用柔軟方式面對困難，也避免壓抑或否認自己的本能。',
  },
  'the-hermit': {
    visualDescription: '隱者提燈站在高處，獨自照亮前方一小段路，四周安靜而寒冷。',
    cardMessage: '先從外界聲音退後一步，你需要自己的燈，而不是更多雜訊。',
    generalInterpretation: '一般抽到隱者，常表示內省、獨處、尋找真相與成熟智慧。它支持暫停與沉澱，也提醒不要把退避變成孤立。',
  },
  'wheel-of-fortune': {
    visualDescription: '巨大的命運之輪轉動，四方符號環繞，暗示生命週期與不可完全掌控的變化。',
    cardMessage: '局勢正在轉動，與其抓緊舊位置，不如看懂節奏並順勢調整。',
    generalInterpretation: '一般抽到命運之輪，代表轉機、循環、機會與變動。它提醒事情不會永遠停在同一處，也要看見反覆出現的模式。',
  },
  justice: {
    visualDescription: '正義手持天秤與劍，端坐在柱間，象徵衡量、真相與清楚判斷。',
    cardMessage: '現在需要公平地看待事實，承認因果，也承擔自己的選擇。',
    generalInterpretation: '一般抽到正義，常與決策、契約、責任、公平和真相有關。它要求清楚、誠實與可被檢驗的判斷。',
  },
  'the-hanged-man': {
    visualDescription: '倒吊人倒掛在樹上，神情平靜，像是自願暫停以換取新的視角。',
    cardMessage: '卡住不一定是失敗，也可能是提醒你換一個角度看待問題。',
    generalInterpretation: '一般抽到倒吊人，表示暫停、等待、放下執著與換位思考。它提醒不要用舊方法硬推，也要分辨必要犧牲與無謂拖延。',
  },
  death: {
    visualDescription: '死神騎馬前行，旗幟揚起，舊事物倒下，遠方仍有太陽升起。',
    cardMessage: '某個階段需要結束，讓退場發生，新生命才有空間進來。',
    generalInterpretation: '一般抽到死神，多半不是字面死亡，而是結束、轉化、斷捨離與更新。它提醒你放下已經完成使命的形式。',
  },
  temperance: {
    visualDescription: '天使在兩個杯子間倒水，一腳在水中一腳在陸地，象徵調和與流動。',
    cardMessage: '答案不在極端之中，而在持續調整比例、節奏與彼此的關係。',
    generalInterpretation: '一般抽到節制，代表平衡、整合、療癒與耐心。它提醒你放慢速度，把看似衝突的元素調成可長久的狀態。',
  },
  'the-devil': {
    visualDescription: '惡魔高踞其上，兩人被鬆鬆的鎖鏈牽住，暗示慾望、恐懼與自願的束縛。',
    cardMessage: '先看見你被什麼吸引或困住，鬆綁通常從承認開始。',
    generalInterpretation: '一般抽到惡魔，常指依賴、誘惑、控制、慾望或權力交換。它不是單純壞牌，而是提醒你辨認不自由的來源。',
  },
  'the-tower': {
    visualDescription: '高塔被閃電擊中，人們從塔上墜落，舊有結構在突變中瓦解。',
    cardMessage: '無法支撐真相的結構會被拆開，震動之後才有重建的可能。',
    generalInterpretation: '一般抽到高塔，表示突發變化、真相揭露、衝擊與重建。它提醒你正視不穩固之處，不要再用舊牆遮掩裂縫。',
  },
  'the-star': {
    visualDescription: '女子在星空下將水倒入池中與土地上，遠方星辰安靜照耀。',
    cardMessage: '經過動盪之後，仍有溫柔的希望在恢復你的信任。',
    generalInterpretation: '一般抽到星星，象徵療癒、願景、希望與重新相信未來。它提醒你照顧脆弱處，也讓理想慢慢回到現實。',
  },
  'the-moon': {
    visualDescription: '月光照在兩座塔與蜿蜒小徑上，狗與狼對月呼應，水中生物浮現。',
    cardMessage: '迷霧尚未散去，先辨認恐懼、投射與真正的直覺有何不同。',
    generalInterpretation: '一般抽到月亮，代表不確定、夢境、潛意識、曖昧與幻象。它提醒你不要急著下結論，先讓隱藏情緒浮上來。',
  },
  'the-sun': {
    visualDescription: '孩子在白馬上迎向太陽，花牆後光芒明亮，畫面充滿生命力。',
    cardMessage: '事情需要被照亮，坦率、清楚與真實表達會帶來力量。',
    generalInterpretation: '一般抽到太陽，象徵喜悅、成功、清晰、活力與被看見。它鼓勵真誠展現，也提醒過度樂觀時仍要看見細節。',
  },
  judgement: {
    visualDescription: '天使吹響號角，人們從棺中起身回應召喚，象徵覺醒與重新評估。',
    cardMessage: '過去正在呼喚你重新理解它，這次可以用更成熟的方式回應。',
    generalInterpretation: '一般抽到審判，代表覺醒、回顧、召喚、清算與更新。它提醒你從舊經驗中復甦，而不是被自責困住。',
  },
  'the-world': {
    visualDescription: '舞者在花環中完成旅程，四方象徵守護著完整、圓滿與新的門檻。',
    cardMessage: '一個循環正在收束，請承認你已整合的經驗，並準備走向新階段。',
    generalInterpretation: '一般抽到世界，表示完成、圓滿、整合、旅行或階段轉換。它提醒你收尾與慶祝，也別忽略尚未完成的小細節。',
  },
};

const majorCards: Array<Omit<TarotCard, 'arcana' | 'suit' | 'image'>> = majorSeeds.map(([id, nameZh, nameEn, number, uprightMeaning, reversedMeaning, keywords]) => ({
  id,
  nameZh,
  nameEn,
  number,
  uprightMeaning,
  reversedMeaning,
  ...majorDetails[id],
  keywords,
}));

const suits: Record<Exclude<Suit, null>, { zh: string; en: string; symbol: string; theme: string; block: string; advice: string; scene: string; keywords: string[] }> = {
  wands: {
    zh: '權杖',
    en: 'Wands',
    symbol: '火',
    theme: '熱情、行動力與創造衝動',
    block: '能量分散、急躁或缺乏持續力',
    advice: '把動機化成具體步驟',
    scene: '權杖象徵火元素，畫面多以木杖、火光、旅途或行動姿態呈現，像是一股正在尋找出口的生命力。',
    keywords: ['行動', '熱情', '創造'],
  },
  cups: {
    zh: '聖杯',
    en: 'Cups',
    symbol: '水',
    theme: '情感、關係與內在需求',
    block: '感受混亂、依賴或逃避真心',
    advice: '先辨認真正的情緒需求',
    scene: '聖杯象徵水元素，畫面多以杯、河流、湖面或人物互動呈現，像是情緒與關係在心中流動。',
    keywords: ['情感', '關係', '直覺'],
  },
  swords: {
    zh: '寶劍',
    en: 'Swords',
    symbol: '風',
    theme: '思考、溝通與判斷',
    block: '過度分析、衝突或語言傷人',
    advice: '用清楚事實切開問題',
    scene: '寶劍象徵風元素，畫面多以劍、天空、緊繃姿態或對峙場景呈現，像是思想正在切分真相。',
    keywords: ['思考', '溝通', '判斷'],
  },
  pentacles: {
    zh: '錢幣',
    en: 'Pentacles',
    symbol: '土',
    theme: '現實資源、工作與身體安全感',
    block: '進展緩慢、資源焦慮或過度保守',
    advice: '回到可衡量的現實安排',
    scene: '錢幣象徵土元素，畫面多以硬幣、花園、勞作或物質場景呈現，像是現實世界中可累積的成果。',
    keywords: ['資源', '工作', '穩定'],
  },
};

const ranks = [
  { n: 1, zh: '一', en: 'Ace', form: '單一象徵物像種子般被高舉，代表一股剛誕生、還未展開的純粹力量。', upright: '種子正在出現，適合開啟新的可能。', reversed: '起步受阻，動機或資源還需要整理。', keys: ['起點', '機會'] },
  { n: 2, zh: '二', en: 'Two', form: '兩個象徵物彼此呼應或拉扯，畫面重點在選擇、對照與平衡。', upright: '需要協調兩股力量，做出更清楚的選擇。', reversed: '猶豫拉扯加劇，暫時難以整合。', keys: ['選擇', '平衡'] },
  { n: 3, zh: '三', en: 'Three', form: '三股力量開始形成結構，常帶出合作、初步成果與向外擴張的畫面。', upright: '事情開始成形，合作與擴展帶來進展。', reversed: '合作不順或期待落差，需重整共識。', keys: ['合作', '成形'] },
  { n: 4, zh: '四', en: 'Four', form: '四個象徵物構成穩固邊界，畫面像一個可依靠但也可能固定的基礎。', upright: '結構趨於穩定，但也要留意是否過於固定。', reversed: '安全感不穩，原本的架構需要調整。', keys: ['穩定', '基礎'] },
  { n: 5, zh: '五', en: 'Five', form: '五的畫面帶有摩擦、缺口或變動，像是穩定結構被迫面對挑戰。', upright: '衝突或變動正在推動你看見問題核心。', reversed: '消耗逐漸減少，但仍需避免重複爭執。', keys: ['衝突', '變動'] },
  { n: 6, zh: '六', en: 'Six', form: '六的畫面通常帶回流、互助或重新排列，像是在變動後尋找修復。', upright: '支持回流，局勢有機會走向修復與前進。', reversed: '停在舊模式裡，難以真正接受支持。', keys: ['修復', '支持'] },
  { n: 7, zh: '七', en: 'Seven', form: '七的畫面有測試、辨識或防守感，像是需要在不確定中保有策略。', upright: '需要策略、辨識與主動守住立場。', reversed: '防衛過高或判斷失準，容易把力氣用錯。', keys: ['策略', '辨識'] },
  { n: 8, zh: '八', en: 'Eight', form: '八的畫面呈現節奏、重複或快速推進，像是能量被集中到具體流程。', upright: '速度加快，專注投入會帶來明顯推進。', reversed: '節奏卡住或太急，需重新安排優先順序。', keys: ['速度', '專注'] },
  { n: 9, zh: '九', en: 'Nine', form: '九的畫面帶著累積後的臨界點，像是成果、疲憊與最後考驗同時出現。', upright: '已累積不少經驗，現在考驗的是耐力與信任。', reversed: '疲憊感升高，可能需要休息而不是硬撐。', keys: ['累積', '耐力'] },
  { n: 10, zh: '十', en: 'Ten', form: '十的畫面呈現一個階段的滿溢或終點，帶著完成、責任與收尾感。', upright: '一個階段達到高峰，也帶來責任與收尾。', reversed: '負擔過重或收尾困難，應減少不必要承擔。', keys: ['高峰', '收尾'] },
  { n: 11, zh: '侍者', en: 'Page', form: '侍者手持花色象徵物，像初學者凝視新訊息，帶著好奇與尚未成熟的可能。', upright: '以學習者姿態接近問題，新訊息會打開方向。', reversed: '經驗不足或訊息混亂，先求證再行動。', keys: ['學習', '訊息'] },
  { n: 12, zh: '騎士', en: 'Knight', form: '騎士騎馬前行，花色能量被推向行動，畫面重點在速度、方向與衝勁。', upright: '行動意願強，適合帶著目標往前試。', reversed: '衝太快或方向不穩，行動前要校準。', keys: ['推進', '目標'] },
  { n: 13, zh: '皇后', en: 'Queen', form: '皇后端坐並掌握花色力量，畫面呈現成熟接納、內在感受與細膩管理。', upright: '成熟地承接此主題，讓感受與判斷更細膩。', reversed: '照顧失衡或界線模糊，先把自己放回中心。', keys: ['成熟', '承接'] },
  { n: 14, zh: '國王', en: 'King', form: '國王坐在寶座上掌管花色領域，畫面重點在主導、責任與穩定運用力量。', upright: '掌握主導權，以穩定與責任管理局面。', reversed: '權威失衡或過度控制，需要更透明的界線。', keys: ['主導', '責任'] },
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
      visualDescription: `${rank.form}${suit.scene}`,
      cardMessage: `${suit.zh}${rank.zh}在說：把注意力放回${suit.theme}，並${suit.advice}。`,
      generalInterpretation: `一般抽到${suit.zh}${rank.zh}，常表示${rank.keys.join('、')}正在透過${suit.symbol}元素的${suit.theme}顯現。正位時，${rank.upright}逆位時，${rank.reversed}`,
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

export const cardBackImage = asset('card-back', 'png');
