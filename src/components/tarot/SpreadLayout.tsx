import TarotCard from '@/components/tarot/TarotCard';
import type { DrawnCard, SpreadDefinition } from '@/types';

interface SpreadLayoutProps {
  spread: SpreadDefinition;
  drawnCards: DrawnCard[];
  revealedCount: number;
}

export default function SpreadLayout({ drawnCards, revealedCount }: SpreadLayoutProps) {
  if (!drawnCards.length) return null;

  return (
    <div className="spread-layout" role="list" aria-label="牌陣展開">
      {drawnCards.map((draw, i) => {
        const isFaceUp = revealedCount > i;
        return (
          <div key={`${draw.position.id}-${i}`} className="spread-layout__item" role="listitem">
            <TarotCard
              card={draw.card}
              orientation={draw.orientation}
              faceUp={isFaceUp}
              ariaLabel={`${draw.position.label}：${isFaceUp ? `${draw.card.nameZh}（${draw.orientation === 'upright' ? '正位' : '逆位'}）` : '未翻開'}`}
            />
            <p className="spread-layout__label">{draw.position.label}</p>
          </div>
        );
      })}
    </div>
  );
}
