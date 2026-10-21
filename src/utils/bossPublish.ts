import type { ActiveBoss, PublishedBoss } from '@/types/phases';

/**
 * Clone-safe boss payload for main thread / render worker (REF-10).
 * Strips ability `effect` functions that break structured clone / postMessage.
 */
export type SerializableBoss = PublishedBoss;

export function toSerializableBoss(boss: ActiveBoss): PublishedBoss {
  return {
    id: boss.id,
    name: boss.name,
    description: boss.description,
    phase: boss.phase,
    behavior: boss.behavior,
    initialLength: boss.initialLength,
    health: boss.health,
    visual: {
      color: boss.visual.color,
      icon: boss.visual.icon,
      size: boss.visual.size,
    },
    abilities: boss.abilities.map((ability) => ({
      id: ability.id,
      name: ability.name,
      description: ability.description,
      cooldown: ability.cooldown,
    })),
  };
}
