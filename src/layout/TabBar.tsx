import type { CSSProperties } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutGrid, ScrollText, Settings, Sparkles, Sun } from 'lucide-react';

type TabDef = {
  to: string;
  label: string;
  icon: typeof Sparkles;
};

const TABS: TabDef[] = [
  { to: '/', label: '占卜', icon: Sparkles },
  { to: '/daily', label: '每日', icon: Sun },
  { to: '/history', label: '紀錄', icon: ScrollText },
  { to: '/library', label: '牌庫', icon: LayoutGrid },
  { to: '/settings', label: '設定', icon: Settings },
];

function activeIndex(pathname: string): number {
  // 精確比對首頁，其餘用前綴比對
  const idx = TABS.findIndex((t) => (t.to === '/' ? pathname === '/' : pathname.startsWith(t.to)));
  return idx < 0 ? 0 : idx;
}

export default function TabBar() {
  const { pathname } = useLocation();
  const index = activeIndex(pathname);

  return (
    <nav
      className="tab-bar"
      aria-label="主要導覽"
      style={{ '--active-index': index } as CSSProperties}
    >
      {/* 滑動液態玻璃膠囊（隨選中分頁平滑移動） */}
      <span className="tab-bar__pill" aria-hidden />
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `tab-bar__item${isActive ? ' is-active' : ''}`}
          aria-label={label}
        >
          <Icon strokeWidth={1.8} aria-hidden />
          <span className="tab-bar__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
