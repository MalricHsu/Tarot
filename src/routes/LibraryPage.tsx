import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import PageHeader from '@/layout/PageHeader';
import TarotCard from '@/components/tarot/TarotCard';
import { TAROT_DECK } from '@/data/tarot';
import type { TarotCard as TarotCardData } from '@/types';

type LibFilter = 'all' | 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

const FILTERS: Array<{ value: LibFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'major', label: '大牌' },
  { value: 'wands', label: '權杖' },
  { value: 'cups', label: '聖杯' },
  { value: 'swords', label: '寶劍' },
  { value: 'pentacles', label: '錢幣' },
];

function matchesFilter(card: TarotCardData, filter: LibFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'major') return card.arcana === 'major';
  return card.suit === filter;
}

export default function LibraryPage() {
  const [filter, setFilter] = useState<LibFilter>('all');
  const [query, setQuery] = useState('');
  const [detailIndex, setDetailIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TAROT_DECK.filter(
      (card) =>
        matchesFilter(card, filter) &&
        (q === '' ||
          card.nameZh.toLowerCase().includes(q) ||
          card.nameEn.toLowerCase().includes(q)),
    );
  }, [filter, query]);

  const detailCard = detailIndex !== null ? filtered[detailIndex] : null;

  const goPrev = () =>
    setDetailIndex((i) => (i === null ? i : (i - 1 + filtered.length) % filtered.length));
  const goNext = () =>
    setDetailIndex((i) => (i === null ? i : (i + 1) % filtered.length));

  return (
    <>
      <PageHeader title="牌庫" />
      <div className="page-body">
        <div className="library-search">
          <Search size={16} />
          <input
            type="search"
            placeholder="搜尋牌名（中／英）"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="library-filters">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`library-filter-btn${filter === f.value ? ' is-selected' : ''}`}
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="library-empty">找不到符合的牌。</p>
        ) : (
          <div className="library-grid">
            {filtered.map((card, i) => (
              <button
                key={card.id}
                type="button"
                className="library-cell"
                onClick={() => setDetailIndex(i)}
              >
                <TarotCard card={card} orientation="upright" faceUp />
                <span className="library-cell__name">{card.nameZh}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {detailCard && (
        <div className="library-detail" role="dialog" aria-modal="true" aria-label={detailCard.nameZh}>
          <button
            type="button"
            className="library-detail__close"
            onClick={() => setDetailIndex(null)}
            aria-label="關閉"
          >
            <X size={22} />
          </button>
          <div className="library-detail__body">
            <div className="library-detail__hero">
              <button type="button" className="library-detail__nav" onClick={goPrev} aria-label="上一張">
                <ChevronLeft size={28} />
              </button>
              <div className="library-detail__img">
                <TarotCard card={detailCard} orientation="upright" faceUp />
              </div>
              <button type="button" className="library-detail__nav" onClick={goNext} aria-label="下一張">
                <ChevronRight size={28} />
              </button>
            </div>

            <h2 className="library-detail__name">
              {detailCard.nameZh}｜{detailCard.nameEn}
            </h2>
            <div className="library-detail__tags">
              {detailCard.keywords.map((k) => (
                <span key={k} className="library-tag">{k}</span>
              ))}
            </div>

            <div className="library-detail__sections">
              <section>
                <h3>正位牌義</h3>
                <p>{detailCard.uprightMeaning}</p>
              </section>
              <section>
                <h3>逆位牌義</h3>
                <p>{detailCard.reversedMeaning}</p>
              </section>
              <section>
                <h3>牌面長相</h3>
                <p>{detailCard.visualDescription}</p>
              </section>
              <section>
                <h3>這張牌在說什麼</h3>
                <p>{detailCard.cardMessage}</p>
              </section>
              <section>
                <h3>一般解讀</h3>
                <p>{detailCard.generalInterpretation}</p>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
