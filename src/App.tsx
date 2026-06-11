import { Navigate, Route, Routes } from 'react-router-dom';
import { ImmersiveProvider } from '@/hooks/useImmersive';
import { MotionProvider } from '@/hooks/useReducedMotion';
import { ToastProvider } from '@/components/ui/Toast';
import { RitualProvider } from '@/hooks/RitualContext';
import AppShell from '@/layout/AppShell';
import DivinationPage from '@/routes/DivinationPage';
import DailyPage from '@/routes/DailyPage';
import HistoryPage from '@/routes/HistoryPage';
import LibraryPage from '@/routes/LibraryPage';
import SettingsPage from '@/routes/SettingsPage';
export default function App() {
  return (
    <MotionProvider>
      <ImmersiveProvider>
        <ToastProvider>
          <RitualProvider>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/" element={<DivinationPage />} />
                <Route path="/daily" element={<DailyPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </RitualProvider>
        </ToastProvider>
      </ImmersiveProvider>
    </MotionProvider>
  );
}
