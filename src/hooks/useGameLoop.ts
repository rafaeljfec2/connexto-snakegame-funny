import { useEffect, useRef, useCallback } from 'react';
import { GameStatus, GameState, FoodType, Obstacle } from '@/types/game';
import { GAME_CONFIG, INITIAL_SNAKE_POSITION } from '@/constants/game';
import {
  moveSnake,
  hasSelfCollision,
  hasFoodCollision,
  generateRandomFood,
  isValidDirectionChange,
  isSafeDirectionChange,
  saveHighScore,
  getOppositeDirection,
} from '@/utils/gameLogic';
import { calculateLevel, calculateGameSpeed } from '@/utils/difficulty';
import {
  applyPowerUpEffect,
  createActivePowerUp,
  getActivePowerUps,
  getEffectiveGameSpeed,
  hasReverseControls,
  hasPhaseThrough,
} from '@/utils/powerUps';
import { updateCombo } from '@/utils/combos';
import { createParticles, updateParticles } from '@/utils/particles';
import { generateObstacles, hasObstacleCollision, getActiveObstacles } from '@/utils/obstacles';
import { OBSTACLE_CONFIG } from '@/constants/obstacles';
import { checkAchievements, saveAchievements } from '@/utils/achievements';
import { hasFoodExpired } from '@/utils/foodTimer';
import { loseLife, isLivesEnabled, addLife } from '@/utils/lives';
import { POWER_UP_CONFIG } from '@/constants/powerUps';
import { INITIAL_DIRECTION } from '@/constants/game';
import { useGameState } from './useGameState';
import { initializeStatistics } from '@/utils/statistics';
import { GameStatisticsTracking } from '@/types/statistics';
import {
  generatePortalPair,
  getPortalAtPosition,
  getPortalPair,
  getActivePortals,
} from '@/utils/portals';
import { PORTAL_CONFIG } from '@/constants/portals';
import { getCurrentPhase, getBossForLevel, shouldSpawnBoss, getPhaseByBoss } from '@/utils/phases';
import { handleBossDefeat } from '@/utils/bosses';
import {
  initializeBossSnake,
  moveBossSnake,
  calculateBossNextDirection,
  getBossHitPart,
  weakenBossSnake,
  canDefeatBoss,
} from '@/utils/bossSnake';
import { Chef } from '@/types/phases';
import {
  processBossAbilities,
  generateGuardianFlagPosition,
  getFlagOffsetFromBossHead,
} from '@/utils/bossAbilities';
import { generateBossInitialResources } from '@/utils/bossResources';

export function useGameLoop() {
  const {
    gameState,
    resetGame,
    startGame,
    pauseGame,
    setDirection,
    updateGameState,
    setSpeedBoost,
  } = useGameState();

  const gameLoopRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);
  const deathTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bossAbilityCooldownsRef = useRef<Map<string, number>>(new Map());
  const lastObstacleSpawnRef = useRef<number>(0); // Track last obstacle spawn time
  const forcedFoodTypeRef = useRef<FoodType | null>(null);

  const updateGame = useCallback(() => {
    updateGameState((prev: GameState) => {
      if (prev.status !== GameStatus.PLAYING) {
        return prev;
      }

      // Handle reverse controls
      const reverseControls = hasReverseControls(prev.activePowerUps);
      let currentDirection = prev.direction;
      let nextDirectionInput = prev.nextDirection;

      // Reverse the input direction if reverse controls are active
      if (reverseControls && prev.nextDirection !== prev.direction) {
        nextDirectionInput = getOppositeDirection(prev.nextDirection);
      }

      // Apply direction change immediately if valid and safe
      // This provides maximum responsiveness for rapid key presses
      if (
        nextDirectionInput !== prev.direction &&
        isValidDirectionChange(prev.direction, nextDirectionInput)
      ) {
        // Check if direction change is safe (won't cause collision)
        const isSafe = isSafeDirectionChange(
          prev.snake,
          prev.direction,
          nextDirectionInput,
          GAME_CONFIG.gridSize,
        );

        if (isSafe) {
          // Apply immediately for instant response to rapid key presses
          currentDirection = nextDirectionInput;
        } else {
          // Not safe yet - keep current direction but queue for next check
          // This allows rapid changes to be applied as soon as they become safe
          currentDirection = prev.direction;
        }
      } else {
        // Use the current direction
        currentDirection = prev.direction;
      }

      let newSnake = moveSnake(prev.snake, currentDirection, GAME_CONFIG.gridSize, false);

      // Initialize particles early for portal teleportation
      let newParticles = GAME_CONFIG.enableParticles
        ? updateParticles(prev.particles)
        : prev.particles;

      // Check for portal teleportation BEFORE collision checks
      const activePortals = getActivePortals(prev.portals);
      let headPosition = newSnake[0];
      if (headPosition) {
        const portalAtHead = getPortalAtPosition(headPosition, activePortals);
        if (portalAtHead) {
          const pairedPortal = getPortalPair(portalAtHead, activePortals);
          if (pairedPortal) {
            // Teleport to paired portal, maintaining direction
            newSnake = [{ ...pairedPortal.position }, ...newSnake.slice(1)];
            headPosition = newSnake[0]; // Update head position after teleportation

            // Create teleportation particles
            if (GAME_CONFIG.enableParticles) {
              const portalColor = PORTAL_CONFIG.colors.portal1.primary;
              newParticles = [
                ...newParticles,
                ...createParticles(headPosition, portalColor, 12, 800),
                ...createParticles(pairedPortal.position, portalColor, 12, 800),
              ];
            }
          }
        }
      }

      // Filter out expired temporary obstacles
      const activeObstacles = getActiveObstacles(prev.obstacles);

      // Check obstacle collision (ignore if phase through is active)
      const currentActivePowerUps = getActivePowerUps(prev.activePowerUps);
      const canPhaseThrough = hasPhaseThrough(currentActivePowerUps);

      // Check for collisions
      const hasCollision =
        (GAME_CONFIG.enableObstacles &&
          !canPhaseThrough &&
          hasObstacleCollision(headPosition ?? newSnake[0], activeObstacles)) ||
        (newSnake.length >= 4 && hasSelfCollision(newSnake));

      // Initialize statistics if not present (at start of update)
      let statistics: GameStatisticsTracking = prev.statistics ?? initializeStatistics();

      if (hasCollision) {
        // Use lives system if enabled
        if (isLivesEnabled() && prev.lives > 0) {
          // Enter dying state to show death animation
          return {
            ...prev,
            status: GameStatus.DYING,
            statistics,
          };
        } else {
          // No lives left, game over
          saveHighScore(prev.score);
          saveAchievements(prev.achievements);
          return {
            ...prev,
            status: GameStatus.GAME_OVER,
            highScore: Math.max(prev.score, prev.highScore),
            statistics,
          };
        }
      }

      // Use the head position after portal teleportation (if any)
      const ateFood = headPosition ? hasFoodCollision(headPosition, prev.food) : false;

      // Check flag capture - must check AFTER portal teleportation
      const capturedFlag =
        prev.guardianFlag &&
        headPosition &&
        headPosition.x === prev.guardianFlag.position.x &&
        headPosition.y === prev.guardianFlag.position.y;

      let finalSnake = newSnake;
      let newScore = prev.score;
      const newActivePowerUps = [...getActivePowerUps(prev.activePowerUps)];
      let newCombo = prev.combo;
      let atePowerUp = false;
      let newLives = prev.lives;
      let newGuardianFlag = prev.guardianFlag;
      let newGuardianFlagSide = prev.guardianFlagSide;

      // Initialize boss variables early (needed for flag capture check)
      let activeBoss = prev.activeBoss;
      let bossSnake = prev.bossSnake;

      if (ateFood) {
        // Update statistics - food eaten
        const currentFoodCount = statistics.foodsByType[prev.food.type] ?? 0;
        statistics = {
          ...statistics,
          foodsEaten: statistics.foodsEaten + 1,
          foodsByType: {
            ...statistics.foodsByType,
            [prev.food.type]: currentFoodCount + 1,
          },
        };

        // Handle JOKER - randomly choose a positive power-up before applying effects
        let actualFoodType = prev.food.type;
        if (prev.food.type === FoodType.JOKER) {
          const positiveTypes = [
            FoodType.SPEED_BOOST,
            FoodType.BONUS_POINTS,
            FoodType.EXTRA_GROWTH,
            FoodType.PHASE_THROUGH,
          ];
          actualFoodType =
            positiveTypes[Math.floor(Math.random() * positiveTypes.length)] ??
            FoodType.BONUS_POINTS;
        }

        const powerUpEffect = applyPowerUpEffect(actualFoodType, prev.score, prev.snake.length);

        // Add bonus points if JOKER was eaten
        if (prev.food.type === FoodType.JOKER) {
          powerUpEffect.scoreIncrease += 15; // Bonus for eating joker
        }

        // Track if power-up was eaten
        if (prev.food.type !== FoodType.NORMAL) {
          atePowerUp = true;
        }

        // Calculate score: base points only (no multipliers for now)
        // First food should give exactly 10 points
        const baseScoreIncrease = powerUpEffect.scoreIncrease;
        newScore = prev.score + baseScoreIncrease;

        // Update combo AFTER calculating score (for next food)
        if (GAME_CONFIG.enableCombos) {
          newCombo = updateCombo(prev.combo, true);
        }

        // Create particles
        if (GAME_CONFIG.enableParticles) {
          const foodColor = POWER_UP_CONFIG.colors[prev.food.type]?.primary || '#ef4444';
          newParticles = [...newParticles, ...createParticles(newSnake[0], foodColor, 8, 600)];
        }

        // Apply growth (positive or negative)
        if (powerUpEffect.growthAmount > 0) {
          // Grow: When snake eats, it should grow from the tail
          // The head has already moved, so we just need to add segments at the end
          const growthAmount = powerUpEffect.growthAmount;
          const currentTail = finalSnake[finalSnake.length - 1];

          // Add new segments at the tail position (they will move next frame)
          for (let i = 0; i < growthAmount; i++) {
            finalSnake = [...finalSnake, { ...currentTail }];
          }
        } else if (powerUpEffect.growthAmount < 0) {
          // Shrink (for poison)
          const shrinkAmount = Math.abs(powerUpEffect.growthAmount);
          const minLength = 1;
          const newLength = Math.max(minLength, finalSnake.length - shrinkAmount);
          finalSnake = finalSnake.slice(0, newLength);
        }

        // Update statistics - max combo
        if (newCombo.multiplier > statistics.maxCombo) {
          statistics = {
            ...statistics,
            maxCombo: newCombo.multiplier,
          };
        }

        // Handle EXTRA_LIFE power-up
        if (prev.food.type === FoodType.EXTRA_LIFE) {
          newLives = addLife(prev.lives);
        }

        // Activate power-up if needed
        if (powerUpEffect.shouldActivatePowerUp) {
          newActivePowerUps.push(createActivePowerUp(actualFoodType));
        }
      } else {
        // Update combo expiration when no food eaten
        if (GAME_CONFIG.enableCombos) {
          newCombo = updateCombo(prev.combo, false);
        }
      }

      // Handle Guardian flag capture - instant boss defeat!
      // Check this OUTSIDE the ateFood block so it works independently
      if (capturedFlag && activeBoss && activeBoss.id === 'guardian') {
        // Player captured the flag - boss is defeated!
        const bossReward = handleBossDefeat(activeBoss, prev);
        newScore += bossReward.scoreIncrease;
        newLives = addLife(prev.lives); // Flag gives extra life
        newGuardianFlag = null; // Clear flag
        activeBoss = undefined; // Remove boss
        bossSnake = undefined; // Remove boss snake

        // Create particles for flag capture
        if (GAME_CONFIG.enableParticles && prev.guardianFlag) {
          const flagColor = '#10b981'; // Green for success
          newParticles = [
            ...newParticles,
            ...createParticles(prev.guardianFlag.position, flagColor, 30, 1500),
          ];
        }

        // Clear boss ability cooldowns
        bossAbilityCooldownsRef.current = new Map();
        forcedFoodTypeRef.current = null;
      }

      // Handle Guardian flag capture - instant boss defeat!
      // Check this OUTSIDE the ateFood block so it works independently
      if (capturedFlag && activeBoss && activeBoss.id === 'guardian') {
        // Player captured the flag - boss is defeated!
        const bossReward = handleBossDefeat(activeBoss, prev);
        newScore += bossReward.scoreIncrease;
        newLives = addLife(prev.lives); // Flag gives extra life
        newGuardianFlag = null; // Clear flag
        activeBoss = undefined; // Remove boss
        bossSnake = undefined; // Remove boss snake

        // Create particles for flag capture
        if (GAME_CONFIG.enableParticles && prev.guardianFlag) {
          const flagColor = '#10b981'; // Green for success
          newParticles = [
            ...newParticles,
            ...createParticles(prev.guardianFlag.position, flagColor, 30, 1500),
          ];
        }

        // Clear boss ability cooldowns
        bossAbilityCooldownsRef.current = new Map();
        forcedFoodTypeRef.current = null;
      }

      const newLevel = calculateLevel(newScore);
      let baseGameSpeed = calculateGameSpeed(newLevel);

      // Phase system: Detect phase changes and update phase state (before obstacles and food generation)
      // If there's an active boss that doesn't match the level (debug boss), use boss phase
      let currentPhase = getCurrentPhase(newLevel);
      if (prev.activeBoss) {
        const bossPhase = getPhaseByBoss(prev.activeBoss);
        if (
          bossPhase &&
          (!shouldSpawnBoss(newLevel) || getBossForLevel(newLevel)?.id !== prev.activeBoss.id)
        ) {
          // Boss is from debug mode - use boss phase
          currentPhase = bossPhase;
        }
      }
      const phaseConfig = currentPhase?.config;

      // Generate obstacles continuously during gameplay (respecting phase configuration)
      // Filter out expired temporary obstacles first
      let newObstacles = getActiveObstacles(prev.obstacles);
      const currentTime = Date.now();

      // Initialize spawn timer on first game start
      if (lastObstacleSpawnRef.current === 0 && prev.status === GameStatus.PLAYING) {
        lastObstacleSpawnRef.current = currentTime;
      }

      const timeSinceLastSpawn = currentTime - lastObstacleSpawnRef.current;

      // Spawn obstacles on level up OR periodically during gameplay (every 1.5 seconds)
      const shouldSpawnObstacle =
        GAME_CONFIG.enableObstacles &&
        phaseConfig?.obstaclesEnabled !== false &&
        (newLevel > prev.level || // Spawn on level up
          (lastObstacleSpawnRef.current > 0 &&
            timeSinceLastSpawn >= OBSTACLE_CONFIG.spawnInterval)); // Spawn periodically

      if (shouldSpawnObstacle) {
        const previousObstaclesCount = newObstacles.length;
        newObstacles = generateObstacles(
          newLevel,
          finalSnake,
          newObstacles,
          GAME_CONFIG.gridSize,
          phaseConfig?.obstaclesEnabled,
          phaseConfig?.obstaclesFrequency ?? OBSTACLE_CONFIG.spawnChance,
        );
        // Update spawn time whenever we attempt to spawn (even if no obstacles were created)
        lastObstacleSpawnRef.current = currentTime;
        // Update statistics - obstacles encountered
        if (newObstacles.length > previousObstaclesCount) {
          statistics = {
            ...statistics,
            obstaclesEncountered:
              statistics.obstaclesEncountered + (newObstacles.length - previousObstaclesCount),
          };
        }
      } else if (phaseConfig?.obstaclesEnabled === false) {
        // Clear obstacles if phase doesn't allow them
        newObstacles = [];
      }

      // Update statistics - max snake length
      if (finalSnake.length > statistics.maxSnakeLength) {
        statistics = {
          ...statistics,
          maxSnakeLength: finalSnake.length,
        };
      }

      // Check if current food has expired
      const foodExpired = hasFoodExpired(prev.food);

      // Generate food with phase-specific configurations
      // Use forced food type if chaos_powerups is active
      const forcedFoodType = forcedFoodTypeRef.current;
      const newFood =
        ateFood || foodExpired
          ? generateRandomFood(
              finalSnake,
              GAME_CONFIG.gridSize,
              newObstacles,
              phaseConfig?.powerUpsFrequency,
              phaseConfig?.timedFoodFrequency,
              forcedFoodType ?? undefined,
            )
          : prev.food;

      // Clear forced food type after using it (only applies to next food)
      if (forcedFoodType && (ateFood || foodExpired)) {
        forcedFoodTypeRef.current = null;
      }

      // Handle PORTAL power-up - create portal pair when food is eaten
      // Only if portals are enabled in current phase
      let newPortals = getActivePortals(prev.portals);
      if (ateFood && prev.food.type === FoodType.PORTAL && phaseConfig?.portalsEnabled) {
        const portalPair = generatePortalPair(finalSnake, newObstacles, GAME_CONFIG.gridSize);
        if (portalPair) {
          newPortals = [...newPortals, ...portalPair];
        }
      }
      // Update boss for boss levels (levels 10, 20, 30, etc.)
      // But preserve debug boss if it doesn't match the level
      // activeBoss already declared above
      if (shouldSpawnBoss(newLevel)) {
        const levelBoss = getBossForLevel(newLevel);
        // Only override if boss matches level (not a debug boss)
        if (levelBoss && levelBoss.id === prev.activeBoss?.id) {
          activeBoss = levelBoss;
        } else if (!prev.activeBoss) {
          // No debug boss, use level boss
          activeBoss = levelBoss;
        }
        // Otherwise keep debug boss
      }
      // Don't clear boss if it's a debug boss that doesn't match level

      // Initialize or update boss snake
      // bossSnake already declared above
      if (activeBoss && (!prev.activeBoss || prev.activeBoss.id !== activeBoss.id)) {
        // New boss spawned - generate initial resources first
        const bossResources = generateBossInitialResources(
          activeBoss,
          finalSnake,
          newObstacles,
          newPortals,
          GAME_CONFIG.gridSize,
        );
        newObstacles = bossResources.obstacles;
        newPortals = bossResources.portals;

        // Initialize boss snake with resources available
        bossSnake =
          initializeBossSnake(activeBoss, finalSnake, newObstacles, GAME_CONFIG.gridSize) ??
          undefined;
        // Clear cooldowns for new boss
        bossAbilityCooldownsRef.current = new Map();
        forcedFoodTypeRef.current = null;

        // For Guardian boss, create the flag immediately when boss spawns
        if (activeBoss.id === 'guardian' && !prev.guardianFlag) {
          const flagPosition = generateGuardianFlagPosition(
            finalSnake,
            bossSnake?.positions ?? [],
            newObstacles,
            GAME_CONFIG.gridSize,
          );
          if (flagPosition) {
            newGuardianFlag = {
              position: flagPosition,
              type: FoodType.EXTRA_LIFE,
              spawnTime: Date.now(),
              duration: undefined,
            };
          }
        }
      } else if (!activeBoss) {
        // Boss was removed or not active - clear boss snake
        bossSnake = undefined;
        // Clear cooldowns when boss is removed
        bossAbilityCooldownsRef.current = new Map();
        forcedFoodTypeRef.current = null;
      } else if (bossSnake && activeBoss) {
        // Process boss abilities FIRST (to create flag if needed)
        const currentGameState: GameState = {
          ...prev,
          snake: finalSnake,
          obstacles: newObstacles,
          portals: newPortals,
          bossSnake,
          guardianFlag: newGuardianFlag, // Include current flag state
          guardianFlagSide: newGuardianFlagSide, // Include current flag side
        };
        const abilityResult = processBossAbilities(
          activeBoss,
          currentGameState,
          bossAbilityCooldownsRef.current,
        );
        bossAbilityCooldownsRef.current = abilityResult.updatedCooldowns;

        // Handle guardian flag spawn BEFORE boss movement
        if (abilityResult.result.guardianFlag !== undefined) {
          newGuardianFlag = abilityResult.result.guardianFlag;
        }
        if (abilityResult.result.guardianFlagSide !== undefined) {
          newGuardianFlagSide = abilityResult.result.guardianFlagSide;
        }

        // Move boss snake based on AI behavior (now with updated flag position)
        const nextBossDirection = calculateBossNextDirection(
          activeBoss,
          bossSnake,
          finalSnake,
          newObstacles,
          prev.food.position,
          GAME_CONFIG.gridSize,
          newGuardianFlag?.position ?? null, // Use updated flag position
        );
        bossSnake = moveBossSnake(bossSnake, nextBossDirection, GAME_CONFIG.gridSize);

        // Update flag position after boss moves (flag follows boss to the side)
        if (newGuardianFlag && bossSnake && bossSnake.positions.length > 0) {
          const bossHead = bossSnake.positions[0];
          // Use the stored side or default to right (1)
          const flagSide = newGuardianFlagSide ?? 1;
          const flagOffset = getFlagOffsetFromBossHead(bossSnake.direction, flagSide);
          const newFlagPosition = {
            x: Math.max(0, Math.min(bossHead.x + flagOffset.x, GAME_CONFIG.gridSize - 1)),
            y: Math.max(0, Math.min(bossHead.y + flagOffset.y, GAME_CONFIG.gridSize - 1)),
          };

          // Only update if position is valid and not occupied by boss body
          const isOnBossBody = bossSnake.positions.some(
            (pos) => pos.x === newFlagPosition.x && pos.y === newFlagPosition.y,
          );
          if (!isOnBossBody) {
            newGuardianFlag = {
              ...newGuardianFlag,
              position: newFlagPosition,
            };
          }
        }

        // Apply ability effects
        if (abilityResult.result.obstacles) {
          // Always merge new obstacles with existing ones to prevent losing any
          const resultObstacles = abilityResult.result.obstacles;
          if (resultObstacles.length > 0) {
            // Create a map of existing obstacles by position for quick lookup
            const existingObstaclesMap = new Map<string, Obstacle>();
            newObstacles.forEach((obs) => {
              const key = `${obs.position.x},${obs.position.y}`;
              existingObstaclesMap.set(key, obs);
            });

            // Add new obstacles, avoiding duplicates by position
            resultObstacles.forEach((obs) => {
              const key = `${obs.position.x},${obs.position.y}`;
              if (!existingObstaclesMap.has(key)) {
                newObstacles.push(obs);
                existingObstaclesMap.set(key, obs);
              } else {
                // Update existing obstacle if it's a moved one (different ID)
                const existing = existingObstaclesMap.get(key);
                if (existing && existing.id !== obs.id) {
                  // Replace the old obstacle with the new one (moved)
                  const index = newObstacles.findIndex((o) => o.id === existing.id);
                  if (index !== -1) {
                    newObstacles[index] = obs;
                  }
                }
              }
            });
          }
        }

        if (abilityResult.result.portals) {
          newPortals = [...newPortals, ...abilityResult.result.portals];
        }

        if (abilityResult.result.gameSpeed !== undefined) {
          baseGameSpeed = abilityResult.result.gameSpeed;
        }

        if (abilityResult.result.lives !== undefined) {
          newLives = abilityResult.result.lives;
        }

        // Handle chaos_powerups - force food type
        if (abilityResult.result.forceFoodType && abilityResult.result.foodType) {
          forcedFoodTypeRef.current = abilityResult.result.foodType;
        }

        // Handle guardian flag spawn
        if (abilityResult.result.guardianFlag !== undefined) {
          newGuardianFlag = abilityResult.result.guardianFlag;
        }
      }

      // Check for boss collision - new strategic battle system
      if (bossSnake && headPosition) {
        const hitPart = getBossHitPart(headPosition, bossSnake);

        if (hitPart === 'head') {
          // Player hit boss head
          if (canDefeatBoss(bossSnake)) {
            // Boss is weakened enough - can be defeated!
            if (activeBoss) {
              const bossReward = handleBossDefeat(activeBoss, prev);
              newScore += bossReward.scoreIncrease;

              // Create particles for boss defeat
              if (GAME_CONFIG.enableParticles && bossSnake.positions[0]) {
                const bossColor = activeBoss.visual.color;
                newParticles = [
                  ...newParticles,
                  ...createParticles(bossSnake.positions[0], bossColor, 30, 1500),
                ];
              }

              // Clear boss after defeat
              activeBoss = undefined;
              bossSnake = undefined;
              // Clear ability cooldowns
              bossAbilityCooldownsRef.current = new Map();
              forcedFoodTypeRef.current = null;
            }
          } else {
            // Boss is still too strong - player loses life/game over
            if (isLivesEnabled() && prev.lives > 0) {
              // Enter dying state
              return {
                ...prev,
                snake: finalSnake,
                score: newScore,
                status: GameStatus.DYING,
                lives: prev.lives,
                portals: newPortals,
                statistics,
                bossSnake,
              };
            } else {
              // No lives left, game over
              saveHighScore(newScore);
              saveAchievements(prev.achievements);
              return {
                ...prev,
                snake: finalSnake,
                score: newScore,
                status: GameStatus.GAME_OVER,
                portals: newPortals,
                highScore: Math.max(newScore, prev.highScore),
                statistics,
                bossSnake,
              };
            }
          }
        } else if (hitPart === 'body') {
          // Player hit boss body - weaken the boss!
          const weakenResult = weakenBossSnake(bossSnake, 2);
          bossSnake = weakenResult.newBossSnake;
          newScore += weakenResult.pointsEarned;

          // Create particles for weakening
          if (GAME_CONFIG.enableParticles && headPosition) {
            const bossColor = activeBoss?.visual.color ?? '#3b82f6';
            newParticles = [...newParticles, ...createParticles(headPosition, bossColor, 10, 600)];
          }

          // If boss was weakened to death (1 segment left)
          if (bossSnake.positions.length <= 1) {
            // Boss automatically defeated
            if (activeBoss) {
              const bossReward = handleBossDefeat(activeBoss, prev);
              newScore += bossReward.scoreIncrease;

              // Create particles for boss defeat
              if (GAME_CONFIG.enableParticles && bossSnake.positions[0]) {
                const bossColor = activeBoss.visual.color;
                newParticles = [
                  ...newParticles,
                  ...createParticles(bossSnake.positions[0], bossColor, 30, 1500),
                ];
              }

              // Clear boss after defeat
              activeBoss = undefined;
              bossSnake = undefined;
              // Clear ability cooldowns
              bossAbilityCooldownsRef.current = new Map();
              forcedFoodTypeRef.current = null;
            }
          }
        }
      }

      // Clean expired power-ups
      const activePowerUps = getActivePowerUps(newActivePowerUps);

      // Check achievements
      let updatedAchievements = prev.achievements;
      if (GAME_CONFIG.enableAchievements) {
        const achievementResult = checkAchievements(prev.achievements, {
          score: newScore,
          level: newLevel,
          snakeLength: finalSnake.length,
          comboMultiplier: newCombo.multiplier,
          atePowerUp,
        });
        updatedAchievements = achievementResult.achievements;
      }

      // Final collision check after all modifications (growth, achievements, etc.)
      // This ensures no false positives from temporary states during updates
      const finalHasCollision = finalSnake.length >= 4 && hasSelfCollision(finalSnake);
      if (finalHasCollision) {
        // Use lives system if enabled
        if (isLivesEnabled() && prev.lives > 0) {
          // Enter dying state to show death animation
          return {
            ...prev,
            snake: finalSnake,
            score: newScore,
            status: GameStatus.DYING,
            lives: prev.lives,
            portals: newPortals,
            statistics,
          };
        } else {
          // No lives left, game over
          saveHighScore(newScore);
          saveAchievements(updatedAchievements);
          return {
            ...prev,
            snake: finalSnake,
            score: newScore,
            status: GameStatus.GAME_OVER,
            portals: newPortals,
            highScore: Math.max(newScore, prev.highScore),
            statistics,
          };
        }
      }

      return {
        ...prev,
        snake: finalSnake,
        food: newFood,
        direction: currentDirection,
        nextDirection: currentDirection,
        score: newScore,
        highScore: ateFood && newScore > prev.highScore ? newScore : prev.highScore,
        level: newLevel,
        gameSpeed: baseGameSpeed,
        activePowerUps: activePowerUps,
        obstacles: newObstacles,
        portals: newPortals,
        combo: newCombo,
        guardianFlag: newGuardianFlag,
        guardianFlagSide: newGuardianFlagSide,
        particles: newParticles,
        achievements: updatedAchievements,
        lives: newLives,
        statistics,
        currentPhase: currentPhase?.id ?? prev.currentPhase,
        phaseLevelType: currentPhase?.type ?? prev.phaseLevelType,
        activeBoss: activeBoss,
        bossSnake: bossSnake,
      };
    });
  }, [updateGameState]);

  useEffect(() => {
    if (gameState.status !== GameStatus.PLAYING) {
      if (gameLoopRef.current !== undefined) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = undefined;
      }
      return;
    }

    const loop = (currentTime: number) => {
      if (lastUpdateTimeRef.current === 0) {
        lastUpdateTimeRef.current = currentTime;
      }

      const elapsed = currentTime - lastUpdateTimeRef.current;

      // Update active power-ups and get effective speed
      const activePowerUps = getActivePowerUps(gameState.activePowerUps);
      let effectiveSpeed = getEffectiveGameSpeed(gameState.gameSpeed, activePowerUps);

      // Apply phase speed modifier (already included in calculateGameSpeed, but keep for clarity)

      // Apply 3x speed boost if direction key is held
      if (gameState.isSpeedBoosted) {
        effectiveSpeed = Math.floor(effectiveSpeed / 3);
      }

      if (elapsed >= effectiveSpeed) {
        updateGame();
        lastUpdateTimeRef.current = currentTime;
      }

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopRef.current !== undefined) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = undefined;
      }
      lastUpdateTimeRef.current = 0;
    };
  }, [
    gameState.status,
    gameState.gameSpeed,
    gameState.activePowerUps,
    gameState.isSpeedBoosted,
    updateGame,
  ]);

  const continueAfterDeath = useCallback(() => {
    updateGameState((prev) => {
      if (prev.status !== GameStatus.DYING || prev.lives <= 0) {
        return prev;
      }

      // Apply penalties
      const { newScore, newSnake } = loseLife(prev.score, prev.snake);
      const newLives = prev.lives - 1;

      // Update statistics - life lost
      let statistics = prev.statistics ?? initializeStatistics();
      statistics = {
        ...statistics,
        livesLost: statistics.livesLost + 1,
      };

      // Check if game should end or continue
      if (newLives <= 0) {
        // No more lives, game over
        saveHighScore(newScore);
        saveAchievements(prev.achievements);
        return {
          ...prev,
          snake: newSnake,
          score: newScore,
          lives: 0,
          status: GameStatus.GAME_OVER,
          highScore: Math.max(newScore, prev.highScore),
          statistics,
        };
      }

      // Continue with same snake size - no reduction on death
      // Always reset snake to initial safe position to avoid collision
      // Don't use the snake that just collided, always use safe initial position
      // Maintain current snake length - don't reduce size
      const targetLength = prev.snake.length;

      // Always create fresh snake from initial position to avoid any collision
      const safeSnake = INITIAL_SNAKE_POSITION.slice(
        0,
        Math.min(targetLength, INITIAL_SNAKE_POSITION.length),
      );

      // If we need longer snake, extend from initial position
      if (targetLength > INITIAL_SNAKE_POSITION.length) {
        const lastPos = INITIAL_SNAKE_POSITION[INITIAL_SNAKE_POSITION.length - 1];
        for (let i = INITIAL_SNAKE_POSITION.length; i < targetLength; i++) {
          safeSnake.push({
            x: Math.max(0, lastPos.x - (i - INITIAL_SNAKE_POSITION.length + 1)),
            y: lastPos.y,
          });
        }
      }

      // Generate new food (no obstacles at this point since we reset)
      const newFood = generateRandomFood(safeSnake, GAME_CONFIG.gridSize, []);

      // Reset combo and active power-ups
      const newLevel = calculateLevel(newScore);
      const baseGameSpeed = calculateGameSpeed(newLevel);

      return {
        ...prev,
        snake: safeSnake,
        food: newFood,
        score: newScore,
        lives: newLives,
        level: newLevel,
        gameSpeed: baseGameSpeed,
        direction: INITIAL_DIRECTION,
        nextDirection: INITIAL_DIRECTION,
        status: GameStatus.PLAYING,
        activePowerUps: [], // Clear all power-ups on death
        combo: {
          count: 0,
          multiplier: 1,
          lastFoodTime: 0,
        },
        particles: [],
        statistics, // Keep statistics when continuing
      };
    });
  }, [updateGameState]);

  // Auto-continue after death with 3 second delay
  useEffect(() => {
    if (gameState.status === GameStatus.DYING && gameState.lives > 0) {
      // Clear any existing timer
      if (deathTimerRef.current) {
        clearTimeout(deathTimerRef.current);
      }

      // Start 3 second countdown
      deathTimerRef.current = setTimeout(() => {
        continueAfterDeath();
        deathTimerRef.current = null;
      }, 3000);

      return () => {
        if (deathTimerRef.current) {
          clearTimeout(deathTimerRef.current);
          deathTimerRef.current = null;
        }
      };
    } else {
      // Clear timer if not in DYING state
      if (deathTimerRef.current) {
        clearTimeout(deathTimerRef.current);
        deathTimerRef.current = null;
      }
    }
  }, [gameState.status, gameState.lives, continueAfterDeath]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === ' ') {
        if (gameState.status === GameStatus.IDLE) {
          startGame();
        } else if (
          gameState.status === GameStatus.PLAYING ||
          gameState.status === GameStatus.PAUSED
        ) {
          pauseGame();
        } else if (gameState.status === GameStatus.DYING) {
          // Allow manual continue (skip the timer)
          if (deathTimerRef.current) {
            clearTimeout(deathTimerRef.current);
            deathTimerRef.current = null;
          }
          continueAfterDeath();
        } else if (gameState.status === GameStatus.GAME_OVER) {
          resetGame();
          startGame();
        }
        return;
      }

      if (key === 'Enter' || key === 'Escape') {
        if (gameState.status === GameStatus.GAME_OVER) {
          resetGame();
        } else if (
          gameState.status === GameStatus.PLAYING ||
          gameState.status === GameStatus.PAUSED
        ) {
          pauseGame();
        }
        return;
      }
    },
    [gameState.status, startGame, pauseGame, resetGame, continueAfterDeath],
  );

  const spawnBoss = useCallback(
    (boss: Chef | null) => {
      updateGameState((prev) => {
        if (!boss) {
          // Remove boss and reset phase to level-based phase
          const levelPhase = getCurrentPhase(prev.level);
          return {
            ...prev,
            activeBoss: undefined,
            bossSnake: undefined,
            currentPhase: levelPhase?.id,
            phaseLevelType: levelPhase?.type,
          };
        }

        // Force spawn boss and update phase to match boss
        const bossSnake = initializeBossSnake(
          boss,
          prev.snake,
          prev.obstacles,
          GAME_CONFIG.gridSize,
        );

        // Get phase configuration for the boss
        const bossPhase = getPhaseByBoss(boss);

        return {
          ...prev,
          activeBoss: boss,
          bossSnake: bossSnake ?? undefined,
          currentPhase: bossPhase?.id,
          phaseLevelType: bossPhase?.type,
        };
      });
    },
    [updateGameState],
  );

  // Reset obstacle spawn timer when game starts
  useEffect(() => {
    if (gameState.status === GameStatus.PLAYING && lastObstacleSpawnRef.current === 0) {
      lastObstacleSpawnRef.current = Date.now();
    } else if (gameState.status === GameStatus.IDLE || gameState.status === GameStatus.GAME_OVER) {
      lastObstacleSpawnRef.current = 0;
    }
  }, [gameState.status]);

  return {
    gameState,
    resetGame,
    startGame,
    pauseGame,
    setDirection,
    setSpeedBoost,
    handleKeyPress,
    spawnBoss,
  };
}
