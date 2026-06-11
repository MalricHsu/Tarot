import { useEffect, useState } from 'react';
import PageHeader from '@/layout/PageHeader';
import Button from '@/components/ui/Button';
import BottomSheet from '@/components/ui/BottomSheet';
import { useToast } from '@/components/ui/Toast';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useRitualContext } from '@/hooks/RitualContext';
import { clearDailyCardCache, getUserSeedValue, resetUserSeed } from '@/logic/storage';

type HealthState = 'idle' | 'loading' | 'ok' | 'error';
type ConfirmKind = null | 'history' | 'daily' | 'seed';

const APP_VERSION = '2.0.0';

export default function SettingsPage() {
  const { override, setOverride } = useReducedMotion();
  const { clearHistory, reloadHistory } = useRitualContext();
  const { showToast } = useToast();

  const [seed, setSeed] = useState(() => getUserSeedValue());
  const [health, setHealth] = useState<HealthState>('idle');
  const [healthAt, setHealthAt] = useState('');
  const [confirm, setConfirm] = useState<ConfirmKind>(null);

  const checkHealth = async () => {
    setHealth('loading');
    try {
      const res = await fetch('/api/gemini-health');
      const data = (await res.json()) as { configured?: boolean };
      setHealth(res.ok && data.configured ? 'ok' : 'error');
    } catch {
      setHealth('error');
    }
    setHealthAt(new Date().toLocaleTimeString('zh-TW', { hour12: false }));
  };

  useEffect(() => {
    void checkHealth();
  }, []);

  const healthText =
    health === 'loading'
      ? '檢查中…'
      : health === 'ok'
        ? '正常'
        : health === 'error'
          ? '異常'
          : '—';

  const runConfirm = () => {
    if (confirm === 'history') {
      clearHistory();
      showToast('已清空所有紀錄');
    } else if (confirm === 'daily') {
      clearDailyCardCache();
      showToast('已清空今日指引快取');
    } else if (confirm === 'seed') {
      const next = resetUserSeed();
      setSeed(next);
      reloadHistory();
      showToast('已重設種子，每日牌將重新洗牌');
    }
    setConfirm(null);
  };

  const confirmCopy: Record<Exclude<ConfirmKind, null>, { title: string; body: string; btn: string }> = {
    history: { title: '清空歷史紀錄？', body: '會刪除所有解讀紀錄（含收藏），無法復原。', btn: '確定清空' },
    daily: { title: '清空今日指引快取？', body: '會清掉今日牌與日曆回顧紀錄，下次進入每日頁會重新抽。', btn: '確定清空' },
    seed: { title: '重設使用者種子？', body: '每日牌會重新洗牌，今日快取也會清除。', btn: '確定重設' },
  };

  return (
    <>
      <PageHeader title="設定" />
      <div className="page-body settings-page">
        {/* 動態效果 */}
        <section className="settings-group">
          <h2 className="settings-group__title">動態效果</h2>
          <div className="settings-row">
            <div>
              <p className="settings-row__label">減少動畫</p>
              <p className="settings-row__hint">關閉翻牌與位移動效，改用淡入。</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={override}
              className={`toggle${override ? ' is-on' : ''}`}
              onClick={() => setOverride(!override)}
            >
              <span className="toggle__knob" />
            </button>
          </div>
        </section>

        {/* 資料管理 */}
        <section className="settings-group">
          <h2 className="settings-group__title">資料管理</h2>
          <div className="settings-row">
            <p className="settings-row__label">清空歷史紀錄</p>
            <Button variant="secondary" size="sm" onClick={() => setConfirm('history')}>
              清空
            </Button>
          </div>
          <div className="settings-row">
            <p className="settings-row__label">清空今日指引快取</p>
            <Button variant="secondary" size="sm" onClick={() => setConfirm('daily')}>
              清空
            </Button>
          </div>
        </section>

        {/* AI 連線狀態 */}
        <section className="settings-group">
          <h2 className="settings-group__title">AI 連線狀態</h2>
          <div className="settings-row">
            <div>
              <p className="settings-row__label">
                Gemini 服務：
                <span className={`health-dot health-dot--${health}`}>{healthText}</span>
              </p>
              {healthAt && <p className="settings-row__hint">最後檢查 {healthAt}</p>}
            </div>
            <Button variant="secondary" size="sm" onClick={checkHealth}>
              重新檢查
            </Button>
          </div>
        </section>

        {/* 進階 */}
        <section className="settings-group">
          <h2 className="settings-group__title">進階</h2>
          <div className="settings-row settings-row--column">
            <p className="settings-row__label">使用者種子</p>
            <code className="settings-seed">{seed}</code>
            <p className="settings-row__hint">重設後每日牌會重新洗牌。</p>
            <Button variant="secondary" size="sm" onClick={() => setConfirm('seed')}>
              重設種子
            </Button>
          </div>
        </section>

        {/* 關於 */}
        <section className="settings-group">
          <h2 className="settings-group__title">關於</h2>
          <div className="settings-about">
            <p><strong>燭見</strong>　v{APP_VERSION}</p>
            <p>探索內心、照見方向的塔羅占卜 App。</p>
            <p>採用 React + Gemini AI 雙層解讀。</p>
            <p className="settings-row__hint">
              隱私：所有占卜紀錄僅儲存在本機 localStorage，不會上傳。
            </p>
          </div>
        </section>
      </div>

      <BottomSheet open={confirm !== null} onClose={() => setConfirm(null)} title={confirm ? confirmCopy[confirm].title : ''}>
        {confirm && (
          <>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
              {confirmCopy[confirm].body}
            </p>
            <div style={{ height: 'var(--sp-4)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              <Button variant="primary" block onClick={runConfirm}>
                {confirmCopy[confirm].btn}
              </Button>
              <Button variant="secondary" block onClick={() => setConfirm(null)}>
                取消
              </Button>
            </div>
          </>
        )}
      </BottomSheet>
    </>
  );
}
