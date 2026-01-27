/**
 * Weather Effect Component
 *
 * Main component that renders phase-specific weather effects.
 */

import { getCurrentPhase } from '@/utils/phases';
import {
  StarryNightEffect,
  MysticFogEffect,
  DesertStormEffect,
  CosmicSpaceEffect,
  FireSpeedEffect,
  ChaosPsychedelicEffect,
  MistGeometricEffect,
  ApocalypticLavaEffect,
  CelestialDivineEffect,
} from './weather';

interface WeatherEffectProps {
  readonly level: number;
  readonly isMobile?: boolean;
}

/**
 * Phase to weather effect component mapping
 */
const PHASE_EFFECTS: Record<number, React.ComponentType<{ isMobile: boolean }>> = {
  1: StarryNightEffect,
  2: MysticFogEffect,
  3: DesertStormEffect,
  4: CosmicSpaceEffect,
  5: FireSpeedEffect,
  6: ChaosPsychedelicEffect,
  7: MistGeometricEffect,
  8: ApocalypticLavaEffect,
  10: CelestialDivineEffect,
};

/**
 * Weather Effect Component
 *
 * Renders the appropriate weather effect based on the current game phase.
 */
export function WeatherEffect({ level, isMobile = false }: WeatherEffectProps) {
  const phase = getCurrentPhase(level);
  const phaseId = phase?.id ?? 0;

  const EffectComponent = PHASE_EFFECTS[phaseId];

  if (!EffectComponent) {
    return null;
  }

  return <EffectComponent isMobile={isMobile} />;
}
