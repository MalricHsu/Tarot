import Button from '@/components/ui/Button';
import BottomSheet from '@/components/ui/BottomSheet';
import { useToast } from '@/components/ui/Toast';
import { buildShareText, wrapCanvasText } from '@/hooks/useRitual';
import type { ReadingResult, SpreadDefinition } from '@/types';

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  question: string;
  spread: SpreadDefinition;
  reading: ReadingResult;
}

export default function ShareSheet({ open, onClose, question, spread, reading }: ShareSheetProps) {
  const { showToast } = useToast();

  const copyText = async () => {
    const text = buildShareText(question, spread, reading);
    try {
      await navigator.clipboard.writeText(text);
      showToast('已複製解讀文字');
    } catch {
      showToast('無法複製，請稍後再試');
    }
    onClose();
  };

  const downloadImage = () => {
    const canvas = document.createElement('canvas');
    const scale = window.devicePixelRatio || 1;
    const width = 1080;
    const padding = 72;
    const contentWidth = width - padding * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.font = '32px "Noto Sans TC", sans-serif';
    const text = buildShareText(question, spread, reading);
    const lines = wrapCanvasText(ctx, text, contentWidth);
    const height = Math.max(1080, 190 + lines.length * 46 + padding);

    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(scale, scale);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#fff5df');
    gradient.addColorStop(0.52, '#efd19b');
    gradient.addColorStop(1, '#d7ad6b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width * 0.18, 100, 20, width * 0.18, 100, 380);
    glow.addColorStop(0, 'rgba(255,255,255,0.62)');
    glow.addColorStop(0.46, 'rgba(255,244,216,0.28)');
    glow.addColorStop(1, 'rgba(255,244,216,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(93,49,21,0.46)';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, width - 72, height - 72);

    ctx.fillStyle = '#5a2e16';
    ctx.font = '700 34px "Noto Serif TC", serif';
    ctx.fillText('燭見', padding, 118);

    ctx.fillStyle = '#2f1b10';
    ctx.font = '32px "Noto Sans TC", sans-serif';
    let y = 190;
    for (const line of lines) {
      ctx.fillText(line, padding, y);
      y += line ? 46 : 26;
    }

    const link = document.createElement('a');
    link.download = 'tarot-reading.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('已下載分享圖');
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="分享這次解讀">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        <Button variant="secondary" block onClick={copyText}>複製解讀文字</Button>
        <Button variant="secondary" block onClick={downloadImage}>下載分享圖</Button>
      </div>
    </BottomSheet>
  );
}
