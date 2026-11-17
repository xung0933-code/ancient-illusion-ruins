/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import gameConfig from './game-config.json';
import { CameraSystem } from './CameraSystem';
import { MapGenerator } from './MapGenerator';
import {
  Chest,
  DynamicSpawningConfig,
  Monster,
  ObstacleType,
  PlayerStats,
  Position,
  SpawnCountWeight,
} from './types';

export interface NineGridRuntimeState {
  currentZoneKey: string;
  activeNineGridKeys: Set<string>;
  zoneLastEvaluatedTurn: Map<string, number>;
  lastSpawnTurn: number;
  wasSpecialCombatActive: boolean;
  reachableCells: Set<string>;
  spawnCounter: number;
}

export interface DynamicSpawnStepResult {
  spawnedMonsters: Monster[];
  pausedBySpecialCombat: boolean;
  specialCombatLifted: boolean;
  normalCountInNineGrid: number;
  pausedByPressure: boolean;
}

export class DynamicSpawnSystem {
  public static getConfig(): DynamicSpawningConfig {
    return gameConfig.dynamicSpawning as DynamicSpawningConfig;
  }

  public static createInitialState(
    mapWidth: number,
    mapHeight: number,
    obstacles: (ObstacleType | null)[][],
    playerStart: Position
  ): NineGridRuntimeState {
    const cfg = this.getConfig();
    const zoneW = Math.max(1, cfg.centralZoneWidth);
    const zoneH = Math.max(1, cfg.centralZoneHeight);
    const zx = Math.floor(playerStart.x / zoneW);
    const zy = Math.floor(playerStart.y / zoneH);

    const activeKeys = this.getNineGridSectorKeys(zx, zy);
    const reachableCells = MapGenerator.computeReachableCells(mapWidth, mapHeight, obstacles, playerStart);

    return {
      currentZoneKey: `${zx},${zy}`,
      activeNineGridKeys: activeKeys,
      zoneLastEvaluatedTurn: new Map<string, number>(),
      lastSpawnTurn: -999,
      wasSpecialCombatActive: false,
      reachableCells,
      spawnCounter: 0,
    };
  }

  private static getNineGridSectorKeys(zx: number, zy: number): Set<string> {
    const keys = new Set<string>();
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        keys.add(`${zx + dx},${zy + dy}`);
      }
    }
    return keys;
  }

  /**
   * Determine if a tile is inside the Central Zone 5 actual visible screen.
   * Combines the real Camera viewport with a strict central (zoneWidth x zoneHeight) window
   * so Elite/BOSS checks and spawn-exclusion always match what the player can actually see on mobile.
   */
  public static isTileInCentralVisibleZone(
    tx: number,
    ty: number,
    playerPos: Position,
    camera: CameraSystem,
    cfg: DynamicSpawningConfig
  ): boolean {
    const halfW = Math.floor(cfg.centralZoneWidth / 2); // 4 for 9x9
    const halfH = Math.floor(cfg.centralZoneHeight / 2); // 4 for 9x9

    // 1. If camera viewport is initialized, check exact visible screen bounds
    if (camera.viewportWidth > 0 && camera.viewportHeight > 0 && camera.tileSize > 0) {
      const screen = camera.tileToScreen(tx, ty);
      const centerX = screen.x + camera.tileSize * 0.5;
      const centerY = screen.y + camera.tileSize * 0.5;
      const inCanvasViewport =
        centerX >= 0 &&
        centerX <= camera.viewportWidth &&
        centerY >= 0 &&
        centerY <= camera.viewportHeight;

      if (inCanvasViewport) {
        return true;
      }

      // Also check central 9x9 around camera tile center (in case viewport is compact)
      const camCenterX = Math.floor((camera.cameraX + camera.viewportWidth * 0.5) / camera.tileSize);
      const camCenterY = Math.floor((camera.cameraY + camera.viewportHeight * 0.5) / camera.tileSize);
      if (Math.abs(tx - camCenterX) <= halfW && Math.abs(ty - camCenterY) <= halfH) {
        return true;
      }
    }

    // 2. Fallback / symmetric central 9x9 around Xiao Xue
    return Math.abs(tx - playerPos.x) <= halfW && Math.abs(ty - playerPos.y) <= halfH;
  }

  /**
   * Rule 8: Check if any alive Elite ('chestBoss') or Boss ('finalBoss') is currently inside Central Zone 5.
   * Monsters in the outer 8 preview zones do NOT trigger this freeze.
   */
  public static isSpecialCombatActiveInCentralZone(
    monsters: Monster[],
    playerPos: Position,
    camera: CameraSystem,
    cfg: DynamicSpawningConfig
  ): boolean {
    return monsters.some(
      (m) =>
        !m.isDead &&
        (m.type === 'chestBoss' || m.type === 'finalBoss') &&
        this.isTileInCentralVisibleZone(m.x, m.y, playerPos, camera, cfg)
    );
  }

  /**
   * Rule 2: Count ALL alive normal monsters currently inside the entire 9-grid (Central + 8 preview sectors).
   */
  public static countNormalMonstersInNineGrid(
    monsters: Monster[],
    playerZx: number,
    playerZy: number,
    cfg: DynamicSpawningConfig
  ): number {
    const minX = (playerZx - 1) * cfg.centralZoneWidth;
    const maxX = (playerZx + 2) * cfg.centralZoneWidth - 1;
    const minY = (playerZy - 1) * cfg.centralZoneHeight;
    const maxY = (playerZy + 2) * cfg.centralZoneHeight - 1;

    let count = 0;
    for (const m of monsters) {
      if (m.isDead || m.type !== 'normal') continue;
      if (m.x >= minX && m.x <= maxX && m.y >= minY && m.y <= maxY) {
        count++;
      }
    }
    return count;
  }

  /**
   * Weighted random count selection (1:40%, 2:30%, 3:20%, 4:7%, 5:3%).
   */
  private static rollBatchCount(weights: SpawnCountWeight[]): number {
    if (!weights || weights.length === 0) return 1;
    const totalWeight = weights.reduce((acc, w) => acc + Math.max(0, w.weight), 0);
    if (totalWeight <= 0) return 1;

    let roll = Math.random() * totalWeight;
    for (const entry of weights) {
      roll -= Math.max(0, entry.weight);
      if (roll <= 0) return Math.max(1, entry.count);
    }
    return Math.max(1, weights[weights.length - 1].count);
  }

  /**
   * Rule 6: Evaluate current combat pressure around Xiao Xue.
   * Returns maximum allowed spawn count for this cycle (0 = pause spawning).
   */
  private static evaluateCombatPressureBudget(
    monsters: Monster[],
    playerPos: Position,
    playerStats: PlayerStats,
    damagedThisTurn: boolean,
    cfg: DynamicSpawningConfig
  ): number {
    const pressure = cfg.combatPressure;
    const radius = pressure.chasingRadius;

    let threateningCount = 0;
    let adjacentCount = 0;

    for (const m of monsters) {
      if (m.isDead) continue;
      const dist = Math.abs(m.x - playerPos.x) + Math.abs(m.y - playerPos.y);
      if (dist <= 1) adjacentCount++;
      if (dist <= Math.max(radius, m.detectionRadius)) {
        threateningCount++;
      }
    }

    const hpRatio = playerStats.maxHp > 0 ? playerStats.hp / playerStats.maxHp : 1;
    const isLowHp = hpRatio <= pressure.lowHpRatio;

    // Critical pressure: surrounded by >= 3 chasing monsters, >= 2 adjacent enemies, or hurt while pressured
    if (
      threateningCount >= pressure.pausePressureMonsterCount ||
      adjacentCount >= 2 ||
      (pressure.pauseWhenHurtAndPressured && damagedThisTurn && threateningCount >= pressure.moderatePressureMonsterCount) ||
      (isLowHp && threateningCount >= pressure.moderatePressureMonsterCount)
    ) {
      return 0;
    }

    // Moderate pressure: cap new spawns
    if (threateningCount >= pressure.moderatePressureMonsterCount || isLowHp) {
      return Math.max(0, pressure.moderatePressureMaxSpawn);
    }

    return cfg.maxNormalMonstersInNineGrid;
  }

  /**
   * Evaluate Nine-Grid Dynamic Spawning for the current world state.
   * Called after initial map generation and after each valid player action turn.
   * Operates strictly on full-map coordinates & persistent monster list (Rules 5 & 7).
   */
  public static evaluateAndSpawn(params: {
    runtimeState: NineGridRuntimeState;
    isInitialSetup?: boolean;
    turn: number;
    damagedThisTurn?: boolean;
    playerPos: Position;
    playerStats: PlayerStats;
    monsters: Monster[];
    obstacles: (ObstacleType | null)[][];
    chests: Chest[];
    finalChest: Chest | null;
    mapWidth: number;
    mapHeight: number;
    camera: CameraSystem;
  }): DynamicSpawnStepResult {
    const cfg = this.getConfig();
    if (!cfg.enabled) {
      return {
        spawnedMonsters: [],
        pausedBySpecialCombat: false,
        specialCombatLifted: false,
        normalCountInNineGrid: 0,
        pausedByPressure: false,
      };
    }

    const {
      runtimeState,
      isInitialSetup = false,
      turn,
      damagedThisTurn = false,
      playerPos,
      playerStats,
      monsters,
      obstacles,
      chests,
      finalChest,
      mapWidth,
      mapHeight,
      camera,
    } = params;

    const zoneW = Math.max(1, cfg.centralZoneWidth);
    const zoneH = Math.max(1, cfg.centralZoneHeight);
    const playerZx = Math.floor(playerPos.x / zoneW);
    const playerZy = Math.floor(playerPos.y / zoneH);
    const newZoneKey = `${playerZx},${playerZy}`;

    // Always recalculate normal monsters currently inside the 9-grid (Rules 2 & 8.1)
    const normalCountInNineGrid = this.countNormalMonstersInNineGrid(monsters, playerZx, playerZy, cfg);

    // Check Rule 8 Special Combat Control (highest priority, based strictly on Central Zone 5 visibility)
    const specialCombatActive = this.isSpecialCombatActiveInCentralZone(monsters, playerPos, camera, cfg);
    const specialCombatLifted = runtimeState.wasSpecialCombatActive && !specialCombatActive;
    runtimeState.wasSpecialCombatActive = specialCombatActive;

    // Update nine-grid tracking state even during pause
    const previousNineGridKeys = runtimeState.activeNineGridKeys;
    const currentNineGridKeys = this.getNineGridSectorKeys(playerZx, playerZy);

    // Collect the 8 surrounding preview zone coords
    const previewZones: Array<{ zx: number; zy: number; key: string; isNewlyAdded: boolean }> = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue; // Skip Central Zone 5 itself
        const pzx = playerZx + dx;
        const pzy = playerZy + dy;
        const minTx = pzx * zoneW;
        const maxTx = (pzx + 1) * zoneW - 1;
        const minTy = pzy * zoneH;
        const maxTy = (pzy + 1) * zoneH - 1;

        // Ignore preview zones completely outside playable map bounds
        if (maxTx < 1 || minTx > mapWidth - 2 || maxTy < 1 || minTy > mapHeight - 2) {
          continue;
        }

        const key = `${pzx},${pzy}`;
        const isNewlyAdded = isInitialSetup || !previousNineGridKeys.has(key);
        previewZones.push({ zx: pzx, zy: pzy, key, isNewlyAdded });
      }
    }

    runtimeState.currentZoneKey = newZoneKey;
    runtimeState.activeNineGridKeys = currentNineGridKeys;

    // Rule 8.1 & 8.5: Elite or BOSS visible in Central Zone 5 -> Immediately halt all preview zone spawns.
    // Do NOT delete or alter existing normal monsters (Rule 8.2).
    if (specialCombatActive) {
      return {
        spawnedMonsters: [],
        pausedBySpecialCombat: true,
        specialCombatLifted: false,
        normalCountInNineGrid,
        pausedByPressure: false,
      };
    }

    // Rule 2: Cap reached -> Do not spawn
    const remainingSlots = cfg.maxNormalMonstersInNineGrid - normalCountInNineGrid;
    if (remainingSlots <= 0) {
      return {
        spawnedMonsters: [],
        pausedBySpecialCombat: false,
        specialCombatLifted,
        normalCountInNineGrid,
        pausedByPressure: false,
      };
    }

    // Rule 4 & Rule 8.3: Only evaluate spawn when:
    //  a) Initial setup (populate initial 8 preview zones),
    //  b) Nine-grid shifts and adds new preview zones, or
    //  c) Elite/BOSS special combat control just lifted so replenishment resumes.
    const newlyAddedZones = previewZones.filter((z) => {
      if (!z.isNewlyAdded) return false;
      const lastTurn = runtimeState.zoneLastEvaluatedTurn.get(z.key);
      return lastTurn === undefined || turn - lastTurn >= cfg.zoneCooldownTurns;
    });

    const cooledDownAllZones = previewZones.filter((z) => {
      const lastTurn = runtimeState.zoneLastEvaluatedTurn.get(z.key);
      return lastTurn === undefined || turn - lastTurn >= cfg.zoneCooldownTurns;
    });

    const candidateZones = isInitialSetup
      ? previewZones
      : specialCombatLifted
      ? (cooledDownAllZones.length > 0 ? cooledDownAllZones : previewZones)
      : newlyAddedZones;

    if (candidateZones.length === 0) {
      return {
        spawnedMonsters: [],
        pausedBySpecialCombat: false,
        specialCombatLifted,
        normalCountInNineGrid,
        pausedByPressure: false,
      };
    }

    // Global spawn wave cadence check (skipped on initial setup or when combat freeze just lifted)
    if (!isInitialSetup && !specialCombatLifted && turn - runtimeState.lastSpawnTurn < cfg.minTurnsBetweenSpawns) {
      return {
        spawnedMonsters: [],
        pausedBySpecialCombat: false,
        specialCombatLifted,
        normalCountInNineGrid,
        pausedByPressure: false,
      };
    }

    // Rule 6: Check Combat Pressure across the unified 9-grid
    const pressureBudget = isInitialSetup
      ? cfg.maxNormalMonstersInNineGrid
      : this.evaluateCombatPressureBudget(monsters, playerPos, playerStats, damagedThisTurn, cfg);

    if (pressureBudget <= 0) {
      return {
        spawnedMonsters: [],
        pausedBySpecialCombat: false,
        specialCombatLifted,
        normalCountInNineGrid,
        pausedByPressure: true,
      };
    }

    // Roll desired batch size and clamp strictly by unified cap + pressure budget
    const rolledCount = this.rollBatchCount(cfg.spawnCountWeights);
    const targetSpawnCount = Math.min(rolledCount, remainingSlots, pressureBudget);
    if (targetSpawnCount <= 0) {
      return {
        spawnedMonsters: [],
        pausedBySpecialCombat: false,
        specialCombatLifted,
        normalCountInNineGrid,
        pausedByPressure: false,
      };
    }

    // Build fast lookup sets for occupancy checks (on full map state)
    const occupiedTiles = new Set<string>();
    occupiedTiles.add(`${playerPos.x},${playerPos.y}`);
    for (const m of monsters) {
      if (!m.isDead) occupiedTiles.add(`${m.x},${m.y}`);
    }
    const allChests = finalChest ? [...chests, finalChest] : chests;
    for (const ch of allChests) {
      if (!ch.isOpened) occupiedTiles.add(`${ch.x},${ch.y}`);
    }

    // Collect valid candidate positions across eligible preview zones (Rules 1 & 3)
    interface SpawnCandidate {
      x: number;
      y: number;
      zoneKey: string;
      walkableNeighbors: number;
      score: number;
    }

    const candidatesByZone = new Map<string, SpawnCandidate[]>();
    for (const z of candidateZones) {
      const startX = Math.max(1, z.zx * zoneW);
      const endX = Math.min(mapWidth - 2, (z.zx + 1) * zoneW - 1);
      const startY = Math.max(1, z.zy * zoneH);
      const endY = Math.min(mapHeight - 2, (z.zy + 1) * zoneH - 1);

      const zoneCandidates: SpawnCandidate[] = [];

      for (let ty = startY; ty <= endY; ty++) {
        for (let tx = startX; tx <= endX; tx++) {
          // 1. Walkable terrain
          if (obstacles[ty][tx] !== null) continue;

          // 2. Reachable from player's connected maze area (has valid path)
          const key = `${tx},${ty}`;
          if (!runtimeState.reachableCells.has(key)) continue;

          // 3. Not occupied by player, monster, or solid chest
          if (occupiedTiles.has(key)) continue;

          // 4. Not too close to Xiao Xue & NOT inside Central Zone 5 actual visible screen
          const distToPlayer = Math.abs(tx - playerPos.x) + Math.abs(ty - playerPos.y);
          if (distToPlayer < cfg.minDistanceFromPlayer) continue;
          if (this.isTileInCentralVisibleZone(tx, ty, playerPos, camera, cfg)) continue;

          // 5. Count walkable neighbors to confirm viable monster pathing (avoid 1-tile traps)
          let walkableNeighbors = 0;
          for (const [ndx, ndy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = tx + ndx;
            const ny = ty + ndy;
            if (nx > 0 && nx < mapWidth - 1 && ny > 0 && ny < mapHeight - 1 && obstacles[ny][nx] === null) {
              walkableNeighbors++;
            }
          }
          if (walkableNeighbors < 2) continue;

          // Score favors natural ambush distance (7..14 tiles) & well-connected tiles + jitter
          const idealDist = 9;
          const distPenalty = Math.abs(distToPlayer - idealDist) * 0.4;
          const score = walkableNeighbors * 1.5 - distPenalty + Math.random() * 4;

          zoneCandidates.push({
            x: tx,
            y: ty,
            zoneKey: z.key,
            walkableNeighbors,
            score,
          });
        }
      }

      if (zoneCandidates.length > 0) {
        zoneCandidates.sort((a, b) => b.score - a.score);
        candidatesByZone.set(z.key, zoneCandidates);
      }
    }

    if (candidatesByZone.size === 0) {
      return {
        spawnedMonsters: [],
        pausedBySpecialCombat: false,
        specialCombatLifted,
        normalCountInNineGrid,
        pausedByPressure: false,
      };
    }

    // Select up to targetSpawnCount valid positions without clumping or forcing every zone
    const chosen: SpawnCandidate[] = [];
    const zoneKeys = Array.from(candidatesByZone.keys());
    // Shuffle eligible zone order so no single preview zone is favored
    for (let i = zoneKeys.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [zoneKeys[i], zoneKeys[j]] = [zoneKeys[j], zoneKeys[i]];
    }

    const isSpacedWell = (cand: SpawnCandidate): boolean => {
      // Check against newly chosen monsters in this wave
      for (const prev of chosen) {
        const d = Math.abs(cand.x - prev.x) + Math.abs(cand.y - prev.y);
        if (d < cfg.minSpacingBetweenSpawns) return false;
      }
      // Also avoid stacking immediately adjacent to existing alive monsters
      for (const m of monsters) {
        if (m.isDead) continue;
        const d = Math.abs(cand.x - m.x) + Math.abs(cand.y - m.y);
        if (d < cfg.minSpacingBetweenSpawns) return false;
      }
      return true;
    };

    // Round-robin pick from randomized preview zones first to prevent directional clumping/surrounding,
    // then allow additional picks from remaining candidates if fewer zones have space
    let progress = true;
    while (chosen.length < targetSpawnCount && progress) {
      progress = false;
      for (const zKey of zoneKeys) {
        if (chosen.length >= targetSpawnCount) break;
        const list = candidatesByZone.get(zKey);
        if (!list || list.length === 0) continue;

        let pickedIdx = -1;
        // Look through top candidates in this zone for a well-spaced spot
        const searchLimit = Math.min(list.length, 24);
        for (let k = 0; k < searchLimit; k++) {
          if (isSpacedWell(list[k])) {
            pickedIdx = k;
            break;
          }
        }

        if (pickedIdx !== -1) {
          const [cand] = list.splice(pickedIdx, 1);
          chosen.push(cand);
          progress = true;
        }
      }
    }

    if (chosen.length === 0) {
      return {
        spawnedMonsters: [],
        pausedBySpecialCombat: false,
        specialCombatLifted,
        normalCountInNineGrid,
        pausedByPressure: false,
      };
    }

    // Instantiate normal monsters on full-map coordinates
    const pStats = gameConfig.player.baseStats;
    const normalCfg = gameConfig.monsterStats.normal;
    const spawnedMonsters: Monster[] = [];

    for (const spot of chosen) {
      runtimeState.spawnCounter++;
      const monster: Monster = {
        id: `dyn_normal_${turn}_${runtimeState.spawnCounter}`,
        name: normalCfg.name,
        type: 'normal',
        x: spot.x,
        y: spot.y,
        hp: Math.round(pStats.hp * normalCfg.hpRatio),
        maxHp: Math.round(pStats.hp * normalCfg.hpRatio),
        attack: Math.round(pStats.attack * normalCfg.attackRatio),
        defense: Math.round(pStats.defense * normalCfg.defenseRatio),
        detectionRadius: normalCfg.detectionRadius,
        isDead: false,
        facing: Math.random() < 0.5 ? 'DOWN' : 'LEFT',
        isDynamicSpawn: true,
      };

      monsters.push(monster);
      spawnedMonsters.push(monster);
    }

    // Record cooldown timestamps for evaluated zones
    for (const z of candidateZones) {
      runtimeState.zoneLastEvaluatedTurn.set(z.key, turn);
    }
    runtimeState.lastSpawnTurn = turn;

    return {
      spawnedMonsters,
      pausedBySpecialCombat: false,
      specialCombatLifted,
      normalCountInNineGrid: normalCountInNineGrid + spawnedMonsters.length,
      pausedByPressure: false,
    };
  }
}
