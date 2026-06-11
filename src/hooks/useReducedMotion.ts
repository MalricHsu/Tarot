import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'tarot.reduceMotion.v1';

type MotionContextValue = {
  /** 最終是否減少動畫（系統偏好 OR 使用者手動覆寫）。 */
  reduceMotion: boolean;
  /** 設定頁「減少動畫」開關狀態（手動覆寫；未設定時為 false）。 */
  override: boolean;
  /** 設定手動覆寫並寫入 localStorage。 */
  setOverride: (value: boolean) => void;
};

const MotionContext = createContext<MotionContextValue | null>(null);

function readOverride(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function readSystemPreference(): boolean {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const [override, setOverrideState] = useState<boolean>(readOverride);
  const [systemPref, setSystemPref] = useState<boolean>(readSystemPreference);

  // 追蹤系統偏好變化
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setSystemPref(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const reduceMotion = override || systemPref;

  // 將最終狀態反映到 <html data-reduce-motion>，供 CSS 使用
  useEffect(() => {
    document.documentElement.dataset.reduceMotion = reduceMotion ? 'true' : 'false';
  }, [reduceMotion]);

  const setOverride = useCallback((value: boolean) => {
    setOverrideState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<MotionContextValue>(
    () => ({ reduceMotion, override, setOverride }),
    [reduceMotion, override, setOverride],
  );

  return createElement(MotionContext.Provider, { value }, children);
}

export function useReducedMotion(): MotionContextValue {
  const ctx = useContext(MotionContext);
  if (!ctx) {
    throw new Error('useReducedMotion 必須在 <MotionProvider> 之內使用');
  }
  return ctx;
}
