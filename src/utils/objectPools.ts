import { Position, Obstacle, Portal } from '@/types/game';

// Object Pool for Position
const POSITION_POOL_SIZE = 1000;
const positionPool: Position[] = [];

function initPositionPool(): void {
  for (let i = 0; i < POSITION_POOL_SIZE; i++) {
    positionPool.push({ x: 0, y: 0 });
  }
}

export function acquirePosition(x: number = 0, y: number = 0): Position {
  const pos = positionPool.pop() ?? { x: 0, y: 0 };
  pos.x = x;
  pos.y = y;
  return pos;
}

export function releasePosition(pos: Position): void {
  if (positionPool.length < POSITION_POOL_SIZE) {
    pos.x = 0;
    pos.y = 0;
    positionPool.push(pos);
  }
}

export function releasePositions(positions: Position[]): void {
  for (const pos of positions) {
    releasePosition(pos);
  }
}

// Object Pool for Obstacle
const OBSTACLE_POOL_SIZE = 200;
const obstaclePool: Obstacle[] = [];

function initObstaclePool(): void {
  for (let i = 0; i < OBSTACLE_POOL_SIZE; i++) {
    obstaclePool.push({
      position: { x: 0, y: 0 },
      type: 'static',
      id: `obstacle-${i}`,
    });
  }
}

export function acquireObstacle(
  position: Position,
  type: 'static' | 'moving' = 'static',
  id?: string,
): Obstacle {
  const obs = obstaclePool.pop() ?? {
    position: { x: 0, y: 0 },
    type: 'static',
    id: 'temp',
  };
  obs.position.x = position.x;
  obs.position.y = position.y;
  obs.type = type;
  obs.id = id ?? `obstacle-${Date.now()}-${Math.random()}`;
  return obs;
}

export function releaseObstacle(obs: Obstacle): void {
  if (obstaclePool.length < OBSTACLE_POOL_SIZE) {
    obs.position.x = 0;
    obs.position.y = 0;
    obs.type = 'static';
    obstaclePool.push(obs);
  }
}

export function releaseObstacles(obstacles: Obstacle[]): void {
  for (const obs of obstacles) {
    releaseObstacle(obs);
  }
}

// Object Pool for Portal
const PORTAL_POOL_SIZE = 20;
const portalPool: Portal[] = [];

function initPortalPool(): void {
  for (let i = 0; i < PORTAL_POOL_SIZE; i++) {
    portalPool.push({
      position: { x: 0, y: 0 },
      id: `portal-${i}`,
      pairId: '',
      color: '#d8b4fe',
    });
  }
}

export function acquirePortal(
  position: Position,
  id: string,
  pairId: string,
  color: string = '#d8b4fe',
): Portal {
  const portal = portalPool.pop() ?? {
    position: { x: 0, y: 0 },
    id: 'temp',
    pairId: '',
    color: '#d8b4fe',
  };
  portal.position.x = position.x;
  portal.position.y = position.y;
  portal.id = id;
  portal.pairId = pairId;
  portal.color = color;
  return portal;
}

export function releasePortal(portal: Portal): void {
  if (portalPool.length < PORTAL_POOL_SIZE) {
    portal.position.x = 0;
    portal.position.y = 0;
    portal.id = '';
    portal.pairId = '';
    portalPool.push(portal);
  }
}

export function releasePortals(portals: Portal[]): void {
  for (const portal of portals) {
    releasePortal(portal);
  }
}

// Initialize all pools
export function initializePools(): void {
  initPositionPool();
  initObstaclePool();
  initPortalPool();
}
