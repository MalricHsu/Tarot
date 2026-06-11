import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import PageHeader from '@/layout/PageHeader';
import Button from '@/components/ui/Button';
import TarotCard from '@/components/tarot/TarotCard';
import { getDailyCardRecord, getTaipeiDateKey, loadDailyCardLog, revealDailyCard } from '@/logic/storage';
import type { DailyCardRecord } from '@/types';

function formatTodayLabel(dateKey: string): string {
  // dateKey is YYYY-MM-DD (Asia/Taipei)
  const [y, m, d] = dateKey.split('-');
  return `${y} 年 ${Number(m)} 月 ${Number(d)} 日`;
}

function formatTaipeiTime(date: Date): string {
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function dayMonthLabel(dateKey: string): string {
  const [, m, d] = dateKey.split('-');
  return `${Number(m)}/${Number(d)}`;
}

export default function DailyPage() {
  const navigate = useNavigate();
  const todayKey = getTaipeiDateKey();

  // Today's record + multi-day log (computed once on mount)
  const [record] = useState<DailyCardRecord>(() => getDailyCardRecord());
  const log = useMemo<DailyCardRecord[]>(() => loadDailyCardLog(), []);
  const [revealed, setRevealed] = useState(() => record.revealed);
  const [activeKey, setActiveKey] = useState(todayKey);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Which record is currently shown (today, or a past day from the calendar)
  const active = useMemo<DailyCardRecord>(
    () => log.find((r) => r.date === activeKey) ?? record,
    [activeKey, log, record],
  );
  const draw = active.historyItem.reading.cards[0];
  const isToday = activeKey === todayKey;
  const showFace = isToday ? revealed : true; // past days always shown face-up

  return (
    <>
      <PageHeader title="每日指引" />
      <div className="page-body daily-page">
        <div className="daily-date">
          <p>{formatTodayLabel(active.date)}</p>
          {isToday ? <span className="daily-time">{formatTaipeiTime(now)}</span> : null}
        </div>

        <div className="daily-card-stage">
          <div className="daily-card-frame">
            <TarotCard
              card={draw.card}
              orientation={draw.orientation}
              faceUp={showFace}
              ariaLabel={
                showFace
                  ? `${draw.card.nameZh}（${draw.orientation === 'upright' ? '正位' : '逆位'}）`
                  : '今日指引（未翻開）'
              }
            />
          </div>

          {isToday && !revealed ? (
            <Button
              variant="primary"
              size="lg"
              className="daily-flip-btn"
              onClick={() => {
                revealDailyCard(todayKey);
                setRevealed(true);
              }}
            >
              翻開今日指引
            </Button>
          ) : (
            <div className="daily-meaning">
              <h2 className="daily-card-name">
                {draw.card.nameZh}｜{draw.card.nameEn}
              </h2>
              <span className={`orientation-badge orientation-badge--${draw.orientation}`}>
                {draw.orientation === 'upright' ? '正位' : '逆位'}
              </span>
              <p className="daily-card-message">{draw.card.cardMessage}</p>
              <p className="daily-card-detail">
                {draw.orientation === 'upright'
                  ? draw.card.uprightMeaning
                  : draw.card.reversedMeaning}
              </p>
            </div>
          )}
        </div>

        <Button variant="secondary" block className="daily-deep-btn" onClick={() => navigate('/')}>
          <Sparkles size={16} />
          深入占卜
        </Button>

        {log.length > 1 && (
          <section className="daily-calendar" aria-label="近期每日牌回顧">
            <p className="daily-calendar__label">回顧</p>
            <div className="daily-calendar__scroll">
              {log.map((entry) => {
                const c = entry.historyItem.reading.cards[0];
                const isActive = entry.date === activeKey;
                return (
                  <button
                    key={entry.date}
                    type="button"
                    className={`daily-calendar__item${isActive ? ' is-active' : ''}`}
                    onClick={() => setActiveKey(entry.date)}
                  >
                    <span className="daily-calendar__thumb">
                      <TarotCard card={c.card} orientation={c.orientation} faceUp />
                    </span>
                    <span className="daily-calendar__date">
                      {entry.date === todayKey ? '今天' : dayMonthLabel(entry.date)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
