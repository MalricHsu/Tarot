import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type ImmersiveContextValue = {
  /** 是否處於沉浸模式（隱藏 tab bar、全螢幕）。 */
  immersive: boolean;
  setImmersive: (value: boolean) => void;
};

const ImmersiveContext = createContext<ImmersiveContextValue | null>(null);

export function ImmersiveProvider({ children }: { children: ReactNode }) {
  const [immersive, setImmersive] = useState(false);

  const value = useMemo<ImmersiveContextValue>(() => ({ immersive, setImmersive }), [immersive]);

  return createElement(ImmersiveContext.Provider, { value }, children);
}

export function useImmersive(): ImmersiveContextValue {
  const ctx = useContext(ImmersiveContext);
  if (!ctx) {
    throw new Error('useImmersive 必須在 <ImmersiveProvider> 之內使用');
  }
  return ctx;
}

/**
 * 宣告式控制沉浸模式：當 active 為 true 時進入沉浸（隱藏 tab bar），
 * 元件卸載或 active 轉 false 時自動恢復。供占卜流程各階段使用。
 */
export function useImmersiveMode(active: boolean): void {
  const { setImmersive } = useImmersive();
  useEffect(() => {
    setImmersive(active);
    return () => setImmersive(false);
  }, [active, setImmersive]);
}
