export type Arcana = 'major' | 'minor';

export type Suit = 'wands' | 'cups' | 'swords' | 'pentacles' | null;

export type Orientation = 'upright' | 'reversed';

export type SpreadPositionId = 'situation' | 'obstacle' | 'advice';

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

export interface ReadingResult {
  cards: DrawnCard[];
  interpretations: string[];
  summary: string;
}
