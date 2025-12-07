import { useCallback, useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Direction } from '@/types/game';
import styles from './MobileGamepad.module.css';

interface MobileGamepadProps {
  onDirectionChange: (direction: Direction) => void;
  onSpeedBoost?: (isBoosted: boolean) => void;
  onFirePoison?: () => void;
  onStopFiringPoison?: () => void;
  enabled?: boolean;
}

export function MobileGamepad({
  onDirectionChange,
  onSpeedBoost,
  onFirePoison,
  onStopFiringPoison,
  enabled = true,
}: MobileGamepadProps) {
  const { t } = useTranslation();
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const speedBoostActiveRef = useRef(false);
  const speedBoostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });
  const currentDirectionRef = useRef<Direction | null>(null);
  const lastDirectionTimeRef = useRef<number>(0);

  // Joystick constants
  const JOYSTICK_RADIUS = 60; // Radius of joystick area
  const KNOB_RADIUS = 25; // Radius of the knob
  const DEAD_ZONE = 0.2; // Dead zone in percentage (20% of radius)
  // Mobile gets faster speed boost activation (100ms vs 200ms)
  const SPEED_BOOST_DELAY = 100; // Faster activation for better mobile responsiveness

  const getTouchPosition = useCallback((touch: Touch) => {
    if (!joystickRef.current) return null;

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    return {
      x: touch.clientX - centerX,
      y: touch.clientY - centerY,
    };
  }, []);

  const calculateDirection = useCallback((x: number, y: number): Direction | null => {
    const distance = Math.sqrt(x * x + y * y);
    const deadZoneDistance = JOYSTICK_RADIUS * DEAD_ZONE;

    // Check if in dead zone
    if (distance < deadZoneDistance) {
      return null;
    }

    // Normalize to get angle
    const angle = Math.atan2(-y, x); // Negative y because screen coordinates are inverted

    // Convert angle to direction
    // Right: -π/4 to π/4
    // Up: π/4 to 3π/4
    // Left: 3π/4 to -3π/4
    // Down: -3π/4 to -π/4

    if (angle >= -Math.PI / 4 && angle < Math.PI / 4) {
      return Direction.RIGHT;
    } else if (angle >= Math.PI / 4 && angle < (3 * Math.PI) / 4) {
      return Direction.UP;
    } else if (angle >= (3 * Math.PI) / 4 || angle < (-3 * Math.PI) / 4) {
      return Direction.LEFT;
    } else {
      return Direction.DOWN;
    }
  }, []);

  const updateJoystick = useCallback(
    (x: number, y: number) => {
      const distance = Math.sqrt(x * x + y * y);
      const maxDistance = JOYSTICK_RADIUS - KNOB_RADIUS;

      // Clamp to joystick bounds
      if (distance > maxDistance) {
        const angle = Math.atan2(y, x);
        x = Math.cos(angle) * maxDistance;
        y = Math.sin(angle) * maxDistance;
      }

      setKnobPosition({ x, y });

      // Calculate direction
      const direction = calculateDirection(x, y);
      const now = Date.now();

      // Update direction if changed (reduced cooldown for mobile responsiveness)
      // Mobile needs faster response time, so we use a shorter cooldown
      const directionChangeCooldown = 20; // Reduced from 50ms to 20ms for better mobile responsiveness
      if (direction && direction !== currentDirectionRef.current) {
        if (now - lastDirectionTimeRef.current > directionChangeCooldown) {
          currentDirectionRef.current = direction;
          lastDirectionTimeRef.current = now;
          onDirectionChange(direction);
        }
      } else if (!direction && currentDirectionRef.current) {
        // Reset when back to center
        currentDirectionRef.current = null;
      }

      // Handle speed boost
      if (direction && onSpeedBoost) {
        if (!speedBoostActiveRef.current && !speedBoostTimerRef.current) {
          speedBoostTimerRef.current = setTimeout(() => {
            if (isDraggingRef.current && direction) {
              speedBoostActiveRef.current = true;
              onSpeedBoost(true);
            }
          }, SPEED_BOOST_DELAY);
        }
      } else {
        // Stop speed boost
        if (speedBoostTimerRef.current) {
          clearTimeout(speedBoostTimerRef.current);
          speedBoostTimerRef.current = null;
        }
        if (speedBoostActiveRef.current && onSpeedBoost) {
          speedBoostActiveRef.current = false;
          onSpeedBoost(false);
        }
      }
    },
    [calculateDirection, onDirectionChange, onSpeedBoost],
  );

  const handleJoystickTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !joystickRef.current) return;
      if (e.cancelable) {
        e.preventDefault();
      }

      const touch = e.touches[0];
      if (!touch) return;

      isDraggingRef.current = true;
      // Convert React.Touch to native Touch-like object
      const nativeTouch = {
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as Touch;
      const pos = getTouchPosition(nativeTouch);
      if (pos) {
        updateJoystick(pos.x, pos.y);
      }
    },
    [enabled, getTouchPosition, updateJoystick],
  );

  const handleJoystickTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !isDraggingRef.current) return;
      if (e.cancelable) {
        e.preventDefault();
      }
      e.stopPropagation();

      const touch = e.touches[0];
      if (!touch) return;

      // Convert React.Touch to native Touch-like object
      const nativeTouch = {
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as Touch;
      const pos = getTouchPosition(nativeTouch);
      if (pos) {
        updateJoystick(pos.x, pos.y);
      }
    },
    [enabled, getTouchPosition, updateJoystick],
  );

  const handleJoystickTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      if (e.cancelable) {
        e.preventDefault();
      }
      e.stopPropagation();

      isDraggingRef.current = false;
      setKnobPosition({ x: 0, y: 0 });
      currentDirectionRef.current = null;

      // Stop speed boost
      if (speedBoostTimerRef.current) {
        clearTimeout(speedBoostTimerRef.current);
        speedBoostTimerRef.current = null;
      }
      if (speedBoostActiveRef.current && onSpeedBoost) {
        speedBoostActiveRef.current = false;
        onSpeedBoost(false);
      }
    },
    [enabled, onSpeedBoost],
  );

  // Cleanup on unmount or when disabled
  useEffect(() => {
    if (!enabled) {
      isDraggingRef.current = false;
      setKnobPosition({ x: 0, y: 0 });
      currentDirectionRef.current = null;

      if (speedBoostTimerRef.current) {
        clearTimeout(speedBoostTimerRef.current);
        speedBoostTimerRef.current = null;
      }
      if (speedBoostActiveRef.current && onSpeedBoost) {
        speedBoostActiveRef.current = false;
        onSpeedBoost(false);
      }
    }
  }, [enabled, onSpeedBoost]);

  // Handle global touch events for joystick
  useEffect(() => {
    if (!enabled) return;

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current && joystickRef.current) {
        if (e.cancelable) {
          e.preventDefault();
        }
        const touch = e.touches[0];
        if (touch) {
          const pos = getTouchPosition(touch);
          if (pos) {
            updateJoystick(pos.x, pos.y);
          }
        }
      }
    };

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (isDraggingRef.current) {
        if (e.cancelable) {
          e.preventDefault();
        }
        isDraggingRef.current = false;
        setKnobPosition({ x: 0, y: 0 });
        currentDirectionRef.current = null;

        if (speedBoostTimerRef.current) {
          clearTimeout(speedBoostTimerRef.current);
          speedBoostTimerRef.current = null;
        }
        if (speedBoostActiveRef.current && onSpeedBoost) {
          speedBoostActiveRef.current = false;
          onSpeedBoost(false);
        }
      }
    };

    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd, { passive: false });
    document.addEventListener('touchcancel', handleGlobalTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      document.removeEventListener('touchcancel', handleGlobalTouchEnd);
    };
  }, [enabled, getTouchPosition, updateJoystick, onSpeedBoost]);

  return (
    <div className={`${styles.gamepad} ${!enabled ? styles.disabled : ''}`}>
      {/* Joystick - Left side */}
      <div
        ref={joystickRef}
        className={styles.joystick}
        onTouchStart={handleJoystickTouchStart}
        onTouchMove={handleJoystickTouchMove}
        onTouchEnd={handleJoystickTouchEnd}
        onTouchCancel={handleJoystickTouchEnd}
      >
        <div className={styles.joystickBackground} />
        <div
          ref={knobRef}
          className={styles.joystickKnob}
          style={{
            transform: `translate(${knobPosition.x}px, ${knobPosition.y}px)`,
          }}
        />
      </div>

      {/* Fire Button - Right side */}
      <button
        className={styles.fireButton}
        onTouchStart={(e) => {
          if (!enabled) return;
          if (e.cancelable) {
            e.preventDefault();
          }
          e.stopPropagation();
          onFirePoison?.();
        }}
        onTouchEnd={(e) => {
          if (!enabled) return;
          if (e.cancelable) {
            e.preventDefault();
          }
          e.stopPropagation();
          onStopFiringPoison?.();
        }}
        onTouchCancel={(e) => {
          if (!enabled) return;
          if (e.cancelable) {
            e.preventDefault();
          }
          e.stopPropagation();
          onStopFiringPoison?.();
        }}
        onClick={(e) => {
          if (!enabled) return;
          e.preventDefault();
          onFirePoison?.();
        }}
        aria-label={t('touchControls.firePoison')}
        type='button'
        disabled={!enabled}
      >
        <span className={styles.fireIcon}>💚</span>
        <span className={styles.fireLabel}>FIRE</span>
      </button>
    </div>
  );
}
