import { Outlet, useLocation } from 'react-router-dom';
import { useImmersive } from '@/hooks/useImmersive';
import TabBar from './TabBar';

export default function AppShell() {
  const { immersive } = useImmersive();
  const location = useLocation();

  return (
    <div className={`app-shell${immersive ? ' app-shell--immersive' : ''}`}>
      <main className="app-main">
        {/* key 觸發每次路由切換的淡入動效（§7） */}
        <div className="route-fade" key={location.pathname}>
          <Outlet />
        </div>
      </main>
      {immersive ? null : <TabBar />}
    </div>
  );
}
