import { useState } from "react";
import BottomSheet from "@/components/ui/BottomSheet";
import { GUIDED_OPTIONS } from "@/logic/spreadMeta";
import type { SpreadId } from "@/types";

interface GuidedRecommendProps {
  onSelect: (id: SpreadId) => void;
  disabled?: boolean;
}

export default function GuidedRecommend({
  onSelect,
  disabled,
}: GuidedRecommendProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="guided-entry"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        不知道選哪個？
      </button>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="你想尋覓什麼？"
      >
        <div className="guided-options">
          {GUIDED_OPTIONS.map((opt) => (
            <button
              key={opt.spreadId}
              type="button"
              className="guided-option"
              onClick={() => {
                onSelect(opt.spreadId);
                setOpen(false);
              }}
            >
              <span className="guided-option__label">{opt.label}</span>
              <span className="guided-option__hint">{opt.hint}</span>
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
