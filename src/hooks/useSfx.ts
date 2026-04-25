import { useCallback, useEffect, useState, useMemo } from 'react';
import { sfxEngine } from '@/utils/sfxEngine';
import type { SfxApi, SfxId, SfxPlayOptions } from '@/types/sfx';

export function useSfx(): SfxApi {
  const [state, setState] = useState(() => sfxEngine.getState());

  useEffect(() => {
    void sfxEngine.init();
    sfxEngine.armAutoplay();
    return sfxEngine.subscribe(setState);
  }, []);

  const play = useCallback((id: SfxId, opts?: SfxPlayOptions) => {
    sfxEngine.play(id, opts);
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    sfxEngine.setMuted(muted);
  }, []);

  const setVolume = useCallback((v: number) => {
    sfxEngine.setVolume(v);
  }, []);

  return useMemo(
    () => ({
      play,
      setMuted,
      setVolume,
      isMuted: state.isMuted,
      volume: state.volume,
      isReady: state.isReady,
    }),
    [play, setMuted, setVolume, state.isMuted, state.volume, state.isReady],
  );
}
