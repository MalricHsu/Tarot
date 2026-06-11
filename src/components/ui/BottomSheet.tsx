import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  /** 無障礙標籤（未提供 title 時建議填寫）。 */
  ariaLabel?: string;
};

export default function BottomSheet({ open, onClose, title, children, ariaLabel }: BottomSheetProps) {
  // Escape 關閉 + 開啟時鎖定背景捲動
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : ariaLabel}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__handle" aria-hidden />
        {title ? <h2 className="sheet__title">{title}</h2> : null}
        {children}
      </div>
    </div>,
    document.body,
  );
}
