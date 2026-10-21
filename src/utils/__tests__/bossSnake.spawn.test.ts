import { describe, it, expect } from 'vitest';
import { CHEFS } from '@/constants/phases';
import { initializeBossSnake } from '@/utils/bossSnake';
import type { Position } from '@/types/game';

describe('initializeBossSnake spawn safety (REF-10)', () => {
  it('never places boss segments on the player snake', () => {
    const guardian = CHEFS.find((c) => c.id === 'guardian')!;
    const playerSnake: Position[] = [];
    for (let x = 0; x < 40; x++) {
      for (let y = 18; y <= 22; y++) {
        playerSnake.push({ x, y });
      }
    }

    for (let i = 0; i < 20; i++) {
      const boss = initializeBossSnake(guardian, playerSnake, [], 40);
      expect(boss).not.toBeNull();
      const occupied = new Set(playerSnake.map((p) => `${p.x},${p.y}`));
      for (const seg of boss!.positions) {
        expect(occupied.has(`${seg.x},${seg.y}`)).toBe(false);
      }
    }
  });

  it('keeps boss segments in bounds and unique', () => {
    const guardian = CHEFS.find((c) => c.id === 'guardian')!;
    const player: Position[] = [
      { x: 10, y: 20 },
      { x: 9, y: 20 },
      { x: 8, y: 20 },
    ];

    const boss = initializeBossSnake(guardian, player, [], 40);
    expect(boss).not.toBeNull();

    const keys = new Set<string>();
    for (const seg of boss!.positions) {
      expect(seg.x).toBeGreaterThanOrEqual(0);
      expect(seg.x).toBeLessThan(40);
      expect(seg.y).toBeGreaterThanOrEqual(0);
      expect(seg.y).toBeLessThan(40);
      const key = `${seg.x},${seg.y}`;
      expect(keys.has(key)).toBe(false);
      keys.add(key);
    }
  });
});
