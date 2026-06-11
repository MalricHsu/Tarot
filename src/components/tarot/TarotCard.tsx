import type { Orientation, TarotCard as TarotCardData } from '@/types';

type TarotCardProps = {
  /** 牌資料；未提供時只顯示牌背。 */
  card?: TarotCardData | null;
  orientation?: Orientation;
  /** 是否翻到正面（3D 翻轉）。 */
  faceUp?: boolean;
  /** 選牌時的上浮 + 金光態。 */
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
};

export default function TarotCard({
  card,
  orientation = 'upright',
  faceUp = false,
  selected = false,
  onClick,
  className,
  ariaLabel,
}: TarotCardProps) {
  const reversed = orientation === 'reversed';
  const label =
    ariaLabel ??
    (card && faceUp ? `${card.nameZh}（${reversed ? '逆位' : '正位'}）` : '蓋著的塔羅牌');

  const classes = [
    'tarot-card',
    faceUp ? 'is-face-up' : '',
    selected ? 'is-selected' : '',
    onClick ? 'tarot-card--interactive' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <span className="tarot-card__inner">
      <span className="tarot-card__back" aria-hidden />
      <span className="tarot-card__face">
        {card ? (
          <>
            {reversed ? (
              <span className="tarot-card__rev-badge" aria-hidden>
                逆
              </span>
            ) : null}
            <img
              className={`tarot-card__img${reversed ? ' tarot-card__img--reversed' : ''}`}
              src={card.image}
              alt={card.nameZh}
              loading="lazy"
            />
          </>
        ) : null}
      </span>
    </span>
  );

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick} aria-label={label} aria-pressed={selected}>
        {content}
      </button>
    );
  }

  return (
    <div className={classes} role="img" aria-label={label}>
      {content}
    </div>
  );
}
