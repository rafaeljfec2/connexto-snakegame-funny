import { Particle, Position } from '@/types/game';

// Counter to ensure unique particle IDs even when created in the same millisecond
let particleCounter = 0;

export function createParticles(
  position: Position,
  color: string,
  count: number = 5,
  lifetime: number = 500,
): Particle[] {
  const particles: Particle[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    particleCounter += 1;
    particles.push({
      id: `particle-${now}-${particleCounter}-${i}`,
      position: {
        x: position.x + (Math.random() - 0.5) * 0.5,
        y: position.y + (Math.random() - 0.5) * 0.5,
      },
      color,
      lifetime,
      startTime: now,
    });
  }

  return particles;
}

export function updateParticles(particles: Particle[], maxParticles: number = 100): Particle[] {
  const now = Date.now();
  // Remove expired particles first
  let activeParticles = particles.filter(
    (particle) => now - particle.startTime < particle.lifetime,
  );

  // Limit total particles to prevent memory issues
  if (activeParticles.length > maxParticles) {
    // Keep the most recently created particles (by startTime)
    activeParticles.sort((a, b) => b.startTime - a.startTime);
    activeParticles = activeParticles.slice(0, maxParticles);
  }

  return activeParticles;
}
