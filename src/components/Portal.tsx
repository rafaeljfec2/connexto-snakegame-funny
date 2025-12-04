import { Portal as PortalType } from '@/types/game';
import { PORTAL_CONFIG } from '@/constants/portals';
import { getPortalRemainingPercentage } from '@/utils/portals';
import { GAME_CONFIG } from '@/constants/game';
import styles from './Portal.module.css';

interface PortalProps {
  portal: PortalType;
  isFirst: boolean; // true for first portal in pair, false for second
}

export function Portal({ portal, isFirst }: PortalProps) {
  const x = Math.max(0, Math.min(portal.position.x, GAME_CONFIG.gridSize - 1));
  const y = Math.max(0, Math.min(portal.position.y, GAME_CONFIG.gridSize - 1));

  const remainingPercentage = getPortalRemainingPercentage(portal);
  const colors = isFirst ? PORTAL_CONFIG.colors.portal1 : PORTAL_CONFIG.colors.portal2;

  return (
    <div
      className={styles.portal}
      style={
        {
          gridColumn: x + 1,
          gridRow: y + 1,
          '--portal-primary': colors.primary,
          '--portal-secondary': colors.secondary,
          '--portal-glow': colors.glow,
        } as React.CSSProperties
      }
      aria-label={`Portal at ${x}, ${y}`}
    >
      <div className={styles.portalRing}>
        <div className={styles.portalCore}></div>
      </div>
      <div className={styles.portalTimer}>
        <div
          className={styles.portalTimerFill}
          style={{ width: `${remainingPercentage * 100}%` }}
        ></div>
      </div>
    </div>
  );
}

