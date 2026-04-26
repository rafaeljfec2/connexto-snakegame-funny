import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { type SkinId, type SkinPalette } from '@/types/skin';
import { SKIN_CATALOG } from '@/constants/skins';
import { getStoredSkin, saveSkin } from '@/utils/skin';

interface SkinContextValue {
  readonly skinId: SkinId;
  readonly palette: SkinPalette;
  readonly setSkin: (id: SkinId) => void;
}

interface SkinProviderProps {
  readonly children: ReactNode;
}

const SkinContext = createContext<SkinContextValue | undefined>(undefined);

export function SkinProvider({ children }: SkinProviderProps) {
  const [skinId, setSkinIdState] = useState<SkinId>(() => getStoredSkin());

  useEffect(() => {
    saveSkin(skinId);
  }, [skinId]);

  const setSkin = useCallback((id: SkinId): void => {
    setSkinIdState(id);
  }, []);

  const value = useMemo<SkinContextValue>(
    () => ({
      skinId,
      palette: SKIN_CATALOG[skinId],
      setSkin,
    }),
    [skinId, setSkin],
  );

  return <SkinContext.Provider value={value}>{children}</SkinContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSkin(): SkinContextValue {
  const context = useContext(SkinContext);
  if (context === undefined) {
    throw new Error('useSkin must be used within a SkinProvider');
  }
  return context;
}
