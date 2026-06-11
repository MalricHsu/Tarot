import TarotCard from '@/components/tarot/TarotCard';
import type { ChoiceSlot, FAN_SIZE as _FAN_SIZE } from '@/hooks/useRitual';

// Re-exported so consumers don't need to import from useRitual
export const FAN_SPREAD_DEG = 70;

interface CardFanProps {
  slots: ChoiceSlot[];
  selectedIds: string[];
  onChoose: (slotId: string) => void;
}

export default function CardFan({ slots, selectedIds, onChoose }: CardFanProps) {
  const total = slots.length;

  return (
    <div className="card-fan" aria-label="選牌區">
      {slots.map((slot, i) => {
        const frac = total > 1 ? i / (total - 1) : 0.5;
        const angle = (frac - 0.5) * FAN_SPREAD_DEG;
        const isSelected = selectedIds.includes(slot.id);
        // Center cards appear on top
        const centerIndex = Math.floor(total / 2);
        const zIndex = total - Math.abs(i - centerIndex);

        return (
          <div
            key={slot.id}
            className={`card-fan__arc${isSelected ? ' is-selected' : ''}`}
            style={{
              left: `calc(${frac * 100}% - ${frac * 72}px)`,
              transform: `rotate(${angle}deg)`,
              zIndex,
            }}
          >
            <TarotCard
              card={slot.card}
              orientation={slot.orientation}
              faceUp={false}
              selected={isSelected}
              onClick={() => onChoose(slot.id)}
              ariaLabel={`牌 ${i + 1}${isSelected ? '（已選）' : ''}`}
            />
          </div>
        );
      })}
    </div>
  );
}
