import { useMemo } from 'react';
import type { DrawnCard, Orientation, SpreadDefinition, TarotCard } from '../types';

type RitualPhase = 'idle' | 'focusing' | 'choosing' | 'revealing' | 'reading' | 'done';

interface ChoiceSlot {
  id: string;
  card: TarotCard;
  orientation: Orientation;
}

interface TarotTableSceneProps {
  phase: RitualPhase;
  choiceSlots: ChoiceSlot[];
  selectedIds: string[];
  drawnCards: DrawnCard[];
  revealedCount: number;
  selectedSpread: SpreadDefinition;
  cardBackImage: string;
  onChooseCard: (slotId: string) => void;
}

function getStatusText(phase: RitualPhase, selectedSpread: SpreadDefinition, selectedCount: number) {
  if (phase === 'idle') return '抽取命運之牌';
  if (phase === 'focusing') return '讓問題在燭光中沉澱';
  if (phase === 'choosing') return `從桌面牌堆中選擇 ${selectedSpread.positions.length} 張牌 ${selectedCount}/${selectedSpread.positions.length}`;
  if (phase === 'revealing') return '牌面展開';
  if (phase === 'reading') return '正在解讀牌面';
  return `${selectedSpread.label} 已完成`;
}

export default function TarotTableScene({
  phase,
  choiceSlots,
  selectedIds,
  drawnCards,
  revealedCount,
  selectedSpread,
  cardBackImage,
  onChooseCard,
}: TarotTableSceneProps) {
  const selectedSlots = useMemo(
    () =>
      selectedIds
        .map((id) => choiceSlots.find((slot) => slot.id === id))
        .filter((slot): slot is ChoiceSlot => Boolean(slot)),
    [choiceSlots, selectedIds],
  );

  const tableCards = drawnCards.length
    ? drawnCards
    : selectedSlots.map((slot, index) => ({
        card: slot.card,
        orientation: slot.orientation,
        position: selectedSpread.positions[index],
      }));
  const statusText = getStatusText(phase, selectedSpread, selectedIds.length);
  const canChoose = phase === 'choosing' && selectedIds.length < selectedSpread.positions.length;

  return (
    <section className={`tarot-table-scene tarot-table-scene-2d phase-${phase}`} aria-label="2D燭光塔羅桌">
      <div className="table-candle left" aria-hidden="true">
        <span />
      </div>
      <div className="table-candle right" aria-hidden="true">
        <span />
      </div>
      <div className="table-cloth" aria-hidden="true" />

      <div className="scene-status" aria-live="polite">{statusText}</div>

      {phase === 'idle' ? (
        <div className="idle-table" aria-hidden="true">
          <div className="idle-deck">
            <img src={cardBackImage} alt="" />
            <img src={cardBackImage} alt="" />
            <img src={cardBackImage} alt="" />
          </div>
        </div>
      ) : null}

      {phase === 'focusing' ? (
        <div className="focus-portal">
          <span className="breath-ring" aria-hidden="true" />
          <span className="breath-ring delayed" aria-hidden="true" />
          <img src={cardBackImage} alt="" />
        </div>
      ) : null}

      {phase === 'choosing' ? (
        <div className="choice-scene">
          <div className="choice-heading">
            <p>點選牌背，依序放入牌位</p>
            <span>{selectedIds.length}/{selectedSpread.positions.length}</span>
          </div>
          <div className="card-choice-grid" aria-label="可選牌背">
            {choiceSlots.map((slot, index) => {
              const selectedOrder = selectedIds.indexOf(slot.id);
              const isSelected = selectedOrder >= 0;

              return (
                <button
                  className={`fan-card${isSelected ? ' is-selected' : ''}`}
                  key={slot.id}
                  type="button"
                  onClick={() => onChooseCard(slot.id)}
                  disabled={isSelected || !canChoose}
                  aria-label={isSelected ? `第 ${selectedOrder + 1} 張已選` : `選擇第 ${index + 1} 張牌`}
                >
                  <img src={cardBackImage} alt="" />
                  {isSelected ? <span>{selectedOrder + 1}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className={`table-slots slots-${selectedSpread.positions.length}`} aria-label="牌位區">
        {selectedSpread.positions.map((position, index) => {
          const draw = tableCards[index];
          const isRevealed = phase === 'done' || phase === 'reading' || (phase === 'revealing' && revealedCount > index);

          return (
            <article className={`table-slot${draw ? ' has-card' : ''}${isRevealed ? ' is-revealed' : ''}`} key={position.id}>
              <div className="slot-card" aria-hidden={!draw}>
                {draw ? (
                  <div className="slot-card-inner">
                    <div className="slot-face slot-back">
                      <img src={cardBackImage} alt="" />
                    </div>
                    <div className="slot-face slot-front">
                      <img
                        className={draw.orientation === 'reversed' ? 'card-visual reversed' : 'card-visual'}
                        src={draw.card.image}
                        alt=""
                      />
                    </div>
                  </div>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className="slot-copy">
                <p>{index + 1}. {position.label}</p>
                <strong>{draw && isRevealed ? draw.card.nameZh : draw ? '已選定' : '等待選牌'}</strong>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
