import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ScrollText, Trash2 } from 'lucide-react';
import PageHeader from '@/layout/PageHeader';
import Button from '@/components/ui/Button';
import Segmented from '@/components/ui/Segmented';
import EmptyState from '@/components/ui/EmptyState';
import BottomSheet from '@/components/ui/BottomSheet';
import { useRitualContext } from '@/hooks/RitualContext';

type HistoryFilter = 'all' | 'favorite';

const FILTER_TABS: Array<{ value: HistoryFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'favorite', label: '收藏' },
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { historyItems, openHistoryItem, toggleFavorite, removeHistoryItem, clearHistory } =
    useRitualContext();
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const items = useMemo(
    () => (filter === 'favorite' ? historyItems.filter((i) => i.isFavorite) : historyItems),
    [filter, historyItems],
  );

  const open = (id: string) => {
    const item = historyItems.find((i) => i.id === id);
    if (!item) return;
    openHistoryItem(item);
    navigate('/');
  };

  return (
    <>
      <PageHeader
        title="解讀紀錄"
        action={
          historyItems.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
              清空
            </Button>
          ) : undefined
        }
      />
      <div className="page-body">
        <Segmented options={FILTER_TABS} value={filter} onChange={setFilter} />

        {items.length === 0 ? (
          <EmptyState
            icon={<ScrollText size={28} />}
            title={filter === 'favorite' ? '還沒有收藏' : '還沒有紀錄'}
            description={
              filter === 'favorite'
                ? '在解讀結果按下收藏，就會出現在這裡。'
                : '去占卜一次，這裡就會留下你的指引。'
            }
            action={
              filter === 'all' ? (
                <Button variant="primary" className="history-empty-cta" onClick={() => navigate('/')}>
                  開始占卜
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="history-list">
            {items.map((item) => (
              <article key={item.id} className="history-card">
                <button type="button" className="history-card__body" onClick={() => open(item.id)}>
                  <div className="history-card__top">
                    <span className="history-card__spread">
                      {item.source === 'daily' ? '今日指引' : item.spreadLabel}
                    </span>
                    <span className="history-card__date">{formatDate(item.createdAt)}</span>
                  </div>
                  <p className="history-card__q">{item.question}</p>
                  <div className="history-card__cards">
                    {item.reading.cards.map((draw, i) => (
                      <span key={i} className="history-card__chip">
                        {draw.card.nameZh}
                        {draw.orientation === 'reversed' ? '（逆）' : ''}
                      </span>
                    ))}
                  </div>
                </button>
                <div className="history-card__actions">
                  <button
                    type="button"
                    className={`history-icon-btn${item.isFavorite ? ' is-active' : ''}`}
                    onClick={() => toggleFavorite(item.id)}
                    aria-pressed={item.isFavorite}
                    aria-label={item.isFavorite ? '取消收藏' : '加入收藏'}
                  >
                    <Heart size={18} fill={item.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    className="history-icon-btn history-icon-btn--danger"
                    onClick={() => removeHistoryItem(item.id)}
                    aria-label="刪除"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <BottomSheet open={confirmClear} onClose={() => setConfirmClear(false)} title="清空全部紀錄？">
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
          這會刪除所有解讀紀錄（含收藏），且無法復原。
        </p>
        <div style={{ height: 'var(--sp-4)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          <Button
            variant="primary"
            block
            onClick={() => {
              clearHistory();
              setConfirmClear(false);
            }}
          >
            確定清空
          </Button>
          <Button variant="secondary" block onClick={() => setConfirmClear(false)}>
            取消
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
