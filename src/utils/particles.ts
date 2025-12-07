import { Particle, Position } from '@/types/game';

// Counter to ensure unique particle IDs even when created in the same millisecond
let particleCounter = 0;

/**
 * Check if device is mobile
 */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function createParticles(
  position: Position,
  color: string,
  count: number = 5,
  lifetime: number = 500,
): Particle[] {
  // Reduce particle count on mobile for better performance
  const isMobile = isMobileDevice();
  const actualCount = isMobile ? Math.max(1, Math.floor(count * 0.4)) : count; // Mobile: 40% of particles
  
  const particles: Particle[] = [];
  const now = Date.now();

  for (let i = 0; i < actualCount; i++) {
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
