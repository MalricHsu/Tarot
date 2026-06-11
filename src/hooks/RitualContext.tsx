import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useRitual } from '@/hooks/useRitual';
import type { RitualApi } from '@/hooks/useRitual';

const RitualContext = createContext<RitualApi | null>(null);

export function RitualProvider({ children }: { children: ReactNode }) {
  const ritual = useRitual();
  return <RitualContext.Provider value={ritual}>{children}</RitualContext.Provider>;
}

export function useRitualContext(): RitualApi {
  const ctx = useContext(RitualContext);
  if (!ctx) throw new Error('useRitualContext must be used within RitualProvider');
  return ctx;
}
