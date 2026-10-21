import { describe, it, expect } from 'vitest';
import { CHEFS } from '@/constants/phases';
import { toSerializableBoss } from '@/utils/bossPublish';

describe('toSerializableBoss (REF-10)', () => {
  it('strips ability effect functions so structuredClone succeeds for guardian', () => {
    const guardian = CHEFS.find((c) => c.id === 'guardian');
    expect(guardian).toBeDefined();
    expect(guardian!.abilities.some((a) => typeof a.effect === 'function')).toBe(true);

    const published = toSerializableBoss(guardian!);

    expect(() => structuredClone(published)).not.toThrow();
    expect(published.abilities.every((a) => !('effect' in a))).toBe(true);
    expect(published.id).toBe('guardian');
    expect(published.visual.color).toBeTruthy();
  });

  it('preserves ability metadata without effect', () => {
    const guardian = CHEFS.find((c) => c.id === 'guardian')!;
    const published = toSerializableBoss(guardian);
    const defend = published.abilities.find((a) => a.id === 'defend_flag');

    expect(defend?.name).toBeTruthy();
    expect(defend?.description).toBeTruthy();
  });
});
