import { useState } from "react";
import { Info } from "lucide-react";
import BottomSheet from "@/components/ui/BottomSheet";
import { getSpreadById } from "@/logic/spread";
import { GUIDED_OPTIONS, SPREAD_BLURB } from "@/logic/spreadMeta";
import type { SpreadId } from "@/types";

interface SpreadPickerProps {
  selectedId: SpreadId;
  onChange: (id: SpreadId) => void;
  disabled?: boolean;
}

export default function SpreadPicker({
  selectedId,
  onChange,
  disabled,
}: SpreadPickerProps) {
  const [infoId, setInfoId] = useState<SpreadId | null>(null);
  const selectedSpread = getSpreadById(selectedId);
  const selectedIntent = GUIDED_OPTIONS.find(
    (option) => option.spreadId === selectedId,
  );
  const infoSpread = infoId ? getSpreadById(infoId) : null;

  return (
    <>
      <div className="spread-picker">
        <div className="spread-intent">
          <p className="spread-picker__label">你想尋覓什麼？</p>
          <div
            className="spread-intent__grid"
            role="radiogroup"
            aria-label="選擇問題類型"
          >
            {GUIDED_OPTIONS.map((opt) => {
              const isSelected = selectedId === opt.spreadId;
              return (
                <button
                  key={opt.spreadId}
                  type="button"
                  className={`spread-intent__option${isSelected ? " is-selected" : ""}`}
                  role="radio"
                  aria-checked={isSelected}
                  disabled={disabled}
                  onClick={() => onChange(opt.spreadId)}
                >
                  <span className="spread-intent__label">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="spread-recommendation" aria-label="建議牌陣">
          <div className="spread-recommendation__text">
            <span className="spread-recommendation__eyebrow">建議</span>
            <span className="spread-recommendation__name">
              {selectedSpread.label} · {selectedSpread.positions.length} 張
            </span>
            <span className="spread-recommendation__blurb">
              {SPREAD_BLURB[selectedId]}
            </span>
            <span className="spread-recommendation__context">
              {selectedIntent
                ? `如果你想問「${selectedIntent.label}」，這組牌會更容易幫你抓到重點。`
                : selectedSpread.description}
            </span>
          </div>
          <button
            type="button"
            className="spread-recommendation__info"
            onClick={() => setInfoId(selectedId)}
          >
            <Info size={15} aria-hidden />
            牌位說明
          </button>
        </div>
      </div>

      <BottomSheet
        open={infoSpread !== null}
        onClose={() => setInfoId(null)}
        title={infoSpread?.label ?? ""}
      >
        {infoSpread && (
          <div className="spread-info">
            <p className="spread-info__desc">{infoSpread.description}</p>
            <div className="spread-info__positions">
              <p className="spread-info__section-label">牌位</p>
              {infoSpread.positions.map((pos, i) => (
                <div key={pos.id} className="spread-info__position">
                  <span className="spread-info__pos-num">{i + 1}</span>
                  <span className="spread-info__pos-label">{pos.label}</span>
                  <span className="spread-info__pos-prompt">{pos.prompt}</span>
                </div>
              ))}
            </div>
            <div className="spread-info__examples">
              <p className="spread-info__section-label">範例問題</p>
              {infoSpread.exampleQuestions.map((q) => (
                <p key={q} className="spread-info__example">
                  「{q}」
                </p>
              ))}
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
