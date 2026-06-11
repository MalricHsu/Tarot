export type Arcana = 'major' | 'minor';

export type Suit = 'wands' | 'cups' | 'swords' | 'pentacles' | null;

export type Orientation = 'upright' | 'reversed';

export type SpreadId =
  | 'one-card-guidance'
  | 'three-card-guidance'
  | 'five-card-depth'
  | 'relationship-guidance'
  | 'career-guidance'
  | 'choice-ab';

export type SpreadPositionId =
  | 'guidance'
  | 'situation'
  | 'obstacle'
  | 'advice'
  | 'current'
  | 'root'
  | 'challenge'
  | 'resource'
  | 'nextStep'
  | 'self'
  | 'other'
  | 'connection'
  | 'need'
  | 'careerCurrent'
  | 'careerStrength'
  | 'careerChallenge'
  | 'careerOpportunity'
  | 'optionA'
  | 'optionB'
  | 'choiceCore';

export interface TarotCard {
  id: string;
  nameZh: string;
  nameEn: string;
  arcana: Arcana;
  suit: Suit;
  number: number;
  image: string;
  uprightMeaning: string;
  reversedMeaning: string;
  visualDescription: string;
  cardMessage: string;
  generalInterpretation: string;
  keywords: string[];
}

export interface DrawnCard {
  card: TarotCard;
  orientation: Orientation;
  position: SpreadPosition;
}

export interface SpreadPosition {
  id: SpreadPositionId;
  label: string;
  prompt: string;
}

export interface SpreadDefinition {
  id: SpreadId;
  label: string;
  description: string;
  positions: SpreadPosition[];
  exampleQuestions: string[];
}

export interface ReadingResult {
  cards: DrawnCard[];
  interpretations: string[];
  summary: string;
  actions: string[];
}

export interface ReadingHistoryItem {
  id: string;
  createdAt: string;
  question: string;
  spreadId: SpreadId;
  spreadLabel: string;
  reading: ReadingResult;
  clarification: string;
  isFavorite: boolean;
  source: 'question' | 'daily';
}

export interface DailyCardRecord {
  date: string;
  historyItem: ReadingHistoryItem;
  revealed: boolean;
}
