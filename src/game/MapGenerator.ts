/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Chest, GroundTileType, MapLevelConfig, Monster, ObstacleType, Position } from './types';
import gameConfig from './game-config.json';

export interface GeneratedMap {
  width: number;
  height: number;
  ground: GroundTileType[][];
  obstacles: (ObstacleType | null)[][];
  playerStart: Position;
  chests: Chest[];
  monsters: Monster[];
  finalChest: Chest;
}

export class MapGenerator {
  public static generate(levelConfig: MapLevelConfig, maxRetries: number = 60): GeneratedMap {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const candidate = this.attemptGenerate(levelConfig);
      if (candidate) {
        return candidate;
      }
    }
    // Fallback simple guaranteed map if too many retries failed
    return this.generateFallbackMap(levelConfig);
  }

  private static attemptGenerate(config: MapLevelConfig): GeneratedMap | null {
    const width = config.mapWidth;
    const height = config.mapHeight;

    // 1. Generate Ground layer
    const ground: GroundTileType[][] = [];
    for (let y = 0; y < height; y++) {
      ground[y] = [];
      for (let x = 0; x < width; x++) {
        const rand = Math.random();
        if (rand < 0.45) ground[y][x] = 'stone';
        else if (rand < 0.75) ground[y][x] = 'moss_stone';
        else if (rand < 0.90) ground[y][x] = 'dirt';
        else ground[y][x] = 'grass';
      }
    }

    // 2. Generate Obstacles layer
    // Map edges are always solid walls
    const obstacles: (ObstacleType | null)[][] = [];
    for (let y = 0; y < height; y++) {
      obstacles[y] = [];
      for (let x = 0; x < width; x++) {
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
          obstacles[y][x] = 'wall';
        } else {
          // Density from config
          if (Math.random() < config.obstacleDensity) {
            const obsRand = Math.random();
            if (obsRand < 0.35) obstacles[y][x] = 'ruins_pillar';
            else if (obsRand < 0.65) obstacles[y][x] = 'ancient_tree';
            else if (obsRand < 0.85) obstacles[y][x] = 'wall';
            else obstacles[y][x] = 'rock';
          } else {
            obstacles[y][x] = null;
          }
        }
      }
    }

    // Carve natural ruin corridors / rooms so the map feels like ancient ruins rather than pure static noise
    const roomCount = Math.floor(width / 7);
    for (let i = 0; i < roomCount; i++) {
      const rx = Math.floor(3 + Math.random() * (width - 12));
      const ry = Math.floor(3 + Math.random() * (height - 12));
      const rw = Math.floor(4 + Math.random() * 5);
      const rh = Math.floor(4 + Math.random() * 5);
      for (let y = ry; y < Math.min(height - 1, ry + rh); y++) {
        for (let x = rx; x < Math.min(width - 1, rx + rw); x++) {
          obstacles[y][x] = null;
        }
      }
    }

    // 3. Player Spawn Point: place in lower-left area
    let playerStart: Position | null = null;
    const startZoneMargin = Math.min(10, Math.floor(width / 4));
    for (let tryCount = 0; tryCount < 100; tryCount++) {
      const px = 2 + Math.floor(Math.random() * startZoneMargin);
      const py = height - 3 - Math.floor(Math.random() * startZoneMargin);
      if (obstacles[py][px] === null) {
        playerStart = { x: px, y: py };
        break;
      }
    }
    if (!playerStart) {
      playerStart = { x: 2, y: height - 3 };
      obstacles[playerStart.y][playerStart.x] = null;
    }

    // Clear 3x3 around player
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const ny = playerStart.y + dy;
        const nx = playerStart.x + dx;
        if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
          obstacles[ny][nx] = null;
        }
      }
    }

    // 4. Place Grand Final Chest: far away in top-right area
    let finalChestPos: Position | null = null;
    const endZoneMargin = Math.min(12, Math.floor(width / 4));
    for (let tryCount = 0; tryCount < 100; tryCount++) {
      const fx = width - 3 - Math.floor(Math.random() * endZoneMargin);
      const fy = 2 + Math.floor(Math.random() * endZoneMargin);
      if (obstacles[fy][fx] === null) {
        finalChestPos = { x: fx, y: fy };
        break;
      }
    }
    if (!finalChestPos) {
      finalChestPos = { x: width - 3, y: 3 };
      obstacles[finalChestPos.y][finalChestPos.x] = null;
    }

    // Ensure clear around final chest
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const ny = finalChestPos.y + dy;
        const nx = finalChestPos.x + dx;
        if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
          obstacles[ny][nx] = null;
        }
      }
    }

    // 5. Place Normal Chests scattered across map
    const normalChests: Chest[] = [];
    const usedPositions = new Set<string>();
    usedPositions.add(`${playerStart.x},${playerStart.y}`);
    usedPositions.add(`${finalChestPos.x},${finalChestPos.y}`);

    const targetNormalChests = config.normalChestCount;
    let chestTries = 0;
    while (normalChests.length < targetNormalChests && chestTries < 400) {
      chestTries++;
      const cx = 3 + Math.floor(Math.random() * (width - 6));
      const cy = 3 + Math.floor(Math.random() * (height - 6));
      const key = `${cx},${cy}`;

      // Distance checks
      const distToPlayer = Math.abs(cx - playerStart.x) + Math.abs(cy - playerStart.y);
      const distToFinal = Math.abs(cx - finalChestPos.x) + Math.abs(cy - finalChestPos.y);

      if (distToPlayer > 8 && distToFinal > 8 && obstacles[cy][cx] === null && !usedPositions.has(key)) {
        // Clear cross around chest to allow interaction & boss guard placement
        const chestId = `chest_${normalChests.length + 1}`;
        usedPositions.add(key);
        normalChests.push({
          id: chestId,
          x: cx,
          y: cy,
          isGrand: false,
          isOpened: false,
          isLocked: true,
        });

        // Clear adjacent cells for access
        for (const [adx, ady] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          obstacles[cy + ady][cx + adx] = null;
        }
      }
    }

    if (normalChests.length < targetNormalChests) {
      return null; // Not enough chests placed, retry
    }

    const finalChest: Chest = {
      id: 'chest_grand_final',
      x: finalChestPos.x,
      y: finalChestPos.y,
      isGrand: true,
      isOpened: false,
      isLocked: true,
    };

    // 6. BFS Reachability Verification
    // Check that from playerStart, we can reach at least ONE walkable neighbor of EACH chest (normal + grand final)
    const reachable = this.computeReachableCells(width, height, obstacles, playerStart);

    const allChestsToCheck = [...normalChests, finalChest];
    for (const ch of allChestsToCheck) {
      const neighbors = [
        { x: ch.x + 1, y: ch.y },
        { x: ch.x - 1, y: ch.y },
        { x: ch.x, y: ch.y + 1 },
        { x: ch.x, y: ch.y - 1 },
      ];
      const hasReachableNeighbor = neighbors.some(
        n => n.x >= 0 && n.x < width && n.y >= 0 && n.y < height && reachable.has(`${n.x},${n.y}`)
      );
      if (!hasReachableNeighbor) {
        return null; // Dead end or blocked, retry entire generation!
      }
    }

    // 7. Spawn Guardian Normal Monsters, Final Boss, and Roaming Monsters
    const monsters: Monster[] = [];
    const pStats = gameConfig.player.baseStats;
    const mConfigs = gameConfig.monsterStats;

    // Normal Chest Guardians: exactly 1 normal monster per normal chest (normal stats, not a boss!)
    for (const ch of normalChests) {
      // Find neighbor cell for guardian normal monster
      const guardPos = this.findReachableAdjacentTile(ch, width, height, obstacles, reachable, usedPositions);
      if (!guardPos) return null; // Couldn't place guardian, retry

      const guardId = `guard_${ch.id}`;
      ch.guardianBossId = guardId;
      usedPositions.add(`${guardPos.x},${guardPos.y}`);

      monsters.push({
        id: guardId,
        name: `寶箱守衛妖魔`,
        type: 'normal',
        x: guardPos.x,
        y: guardPos.y,
        hp: Math.round(pStats.hp * mConfigs.normal.hpRatio),
        maxHp: Math.round(pStats.hp * mConfigs.normal.hpRatio),
        attack: Math.round(pStats.attack * mConfigs.normal.attackRatio),
        defense: Math.round(pStats.defense * mConfigs.normal.defenseRatio),
        detectionRadius: mConfigs.normal.detectionRadius,
        guardTargetId: ch.id,
        isDead: false,
        facing: 'DOWN',
      });
    }

    // Final Boss: the ONLY Boss in the game, guarding the final grand chest
    const finalBossPos = this.findReachableAdjacentTile(finalChest, width, height, obstacles, reachable, usedPositions);
    if (!finalBossPos) return null;

    const finalBossId = 'boss_final';
    finalChest.guardianBossId = finalBossId;
    usedPositions.add(`${finalBossPos.x},${finalBossPos.y}`);

    monsters.push({
      id: finalBossId,
      name: mConfigs.finalBoss.name,
      type: 'finalBoss',
      x: finalBossPos.x,
      y: finalBossPos.y,
      hp: Math.round(pStats.hp * mConfigs.finalBoss.hpRatio),
      maxHp: Math.round(pStats.hp * mConfigs.finalBoss.hpRatio),
      attack: Math.round(pStats.attack * mConfigs.finalBoss.attackRatio),
      defense: Math.round(pStats.defense * mConfigs.finalBoss.defenseRatio),
      detectionRadius: mConfigs.finalBoss.detectionRadius,
      guardTargetId: finalChest.id,
      isDead: false,
      facing: 'DOWN',
    });

    // Roaming Regular Monsters: exactly config.monsterCount regular monsters scattered across the map
    let regularMonsterTries = 0;
    const targetRoamingMonsters = config.monsterCount;
    let spawnedRoaming = 0;
    while (spawnedRoaming < targetRoamingMonsters && regularMonsterTries < 600) {
      regularMonsterTries++;
      const mx = 2 + Math.floor(Math.random() * (width - 4));
      const my = 2 + Math.floor(Math.random() * (height - 4));
      const key = `${mx},${my}`;

      // Distance from player start >= 7
      const distToPlayer = Math.abs(mx - playerStart.x) + Math.abs(my - playerStart.y);
      if (distToPlayer >= 7 && reachable.has(key) && !usedPositions.has(key)) {
        usedPositions.add(key);
        spawnedRoaming++;
        monsters.push({
          id: `monster_roam_${spawnedRoaming}`,
          name: mConfigs.normal.name,
          type: 'normal',
          x: mx,
          y: my,
          hp: Math.round(pStats.hp * mConfigs.normal.hpRatio),
          maxHp: Math.round(pStats.hp * mConfigs.normal.hpRatio),
          attack: Math.round(pStats.attack * mConfigs.normal.attackRatio),
          defense: Math.round(pStats.defense * mConfigs.normal.defenseRatio),
          detectionRadius: mConfigs.normal.detectionRadius,
          isDead: false,
          facing: Math.random() < 0.5 ? 'DOWN' : 'LEFT',
        });
      }
    }

    return {
      width,
      height,
      ground,
      obstacles,
      playerStart,
      chests: normalChests,
      monsters,
      finalChest,
    };
  }

  private static computeReachableCells(
    width: number,
    height: number,
    obstacles: (ObstacleType | null)[][],
    start: Position
  ): Set<string> {
    const reachable = new Set<string>();
    const queue: Position[] = [start];
    reachable.add(`${start.x},${start.y}`);

    const dirs = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];

    while (queue.length > 0) {
      const cur = queue.shift()!;
      for (const d of dirs) {
        const nx = cur.x + d.x;
        const ny = cur.y + d.y;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const key = `${nx},${ny}`;
          if (!reachable.has(key) && obstacles[ny][nx] === null) {
            reachable.add(key);
            queue.push({ x: nx, y: ny });
          }
        }
      }
    }

    return reachable;
  }

  private static findReachableAdjacentTile(
    chest: Chest,
    width: number,
    height: number,
    obstacles: (ObstacleType | null)[][],
    reachable: Set<string>,
    usedPositions: Set<string>
  ): Position | null {
    const candidates = [
      { x: chest.x + 1, y: chest.y },
      { x: chest.x - 1, y: chest.y },
      { x: chest.x, y: chest.y + 1 },
      { x: chest.x, y: chest.y - 1 },
    ];

    for (const c of candidates) {
      const key = `${c.x},${c.y}`;
      if (
        c.x > 0 &&
        c.x < width - 1 &&
        c.y > 0 &&
        c.y < height - 1 &&
        obstacles[c.y][c.x] === null &&
        reachable.has(key) &&
        !usedPositions.has(key)
      ) {
        return c;
      }
    }
    return null;
  }

  private static generateFallbackMap(config: MapLevelConfig): GeneratedMap {
    const width = config.mapWidth;
    const height = config.mapHeight;
    const ground: GroundTileType[][] = [];
    const obstacles: (ObstacleType | null)[][] = [];

    for (let y = 0; y < height; y++) {
      ground[y] = [];
      obstacles[y] = [];
      for (let x = 0; x < width; x++) {
        ground[y][x] = (x + y) % 2 === 0 ? 'stone' : 'moss_stone';
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
          obstacles[y][x] = 'wall';
        } else if ((x % 6 === 0 || y % 6 === 0) && !(x % 6 === 0 && y % 6 === 0)) {
          obstacles[y][x] = (x + y) % 3 === 0 ? 'wall' : null;
        } else {
          obstacles[y][x] = null;
        }
      }
    }

    const playerStart = { x: 3, y: height - 4 };
    const finalChestPos = { x: width - 4, y: 3 };

    const normalChests: Chest[] = [];
    for (let i = 0; i < config.normalChestCount; i++) {
      const cx = 5 + (i * 12) % (width - 10);
      const cy = 5 + (i * 9) % (height - 10);
      obstacles[cy][cx] = null;
      normalChests.push({
        id: `chest_${i + 1}`,
        x: cx,
        y: cy,
        isGrand: false,
        isOpened: false,
        isLocked: true,
      });
    }

    const finalChest: Chest = {
      id: 'chest_grand_final',
      x: finalChestPos.x,
      y: finalChestPos.y,
      isGrand: true,
      isOpened: false,
      isLocked: true,
    };

    const monsters: Monster[] = [];
    const pStats = gameConfig.player.baseStats;
    const mConfigs = gameConfig.monsterStats;

    normalChests.forEach((ch, idx) => {
      const guardId = `guard_${ch.id}`;
      ch.guardianBossId = guardId;
      monsters.push({
        id: guardId,
        name: `寶箱守衛妖魔`,
        type: 'normal',
        x: ch.x + 1,
        y: ch.y,
        hp: Math.round(pStats.hp * mConfigs.normal.hpRatio),
        maxHp: Math.round(pStats.hp * mConfigs.normal.hpRatio),
        attack: Math.round(pStats.attack * mConfigs.normal.attackRatio),
        defense: Math.round(pStats.defense * mConfigs.normal.defenseRatio),
        detectionRadius: mConfigs.normal.detectionRadius,
        guardTargetId: ch.id,
        isDead: false,
        facing: 'DOWN',
      });
    });

    finalChest.guardianBossId = 'boss_final';
    monsters.push({
      id: 'boss_final',
      name: mConfigs.finalBoss.name,
      type: 'finalBoss',
      x: finalChest.x - 1,
      y: finalChest.y,
      hp: Math.round(pStats.hp * mConfigs.finalBoss.hpRatio),
      maxHp: Math.round(pStats.hp * mConfigs.finalBoss.hpRatio),
      attack: Math.round(pStats.attack * mConfigs.finalBoss.attackRatio),
      defense: Math.round(pStats.defense * mConfigs.finalBoss.defenseRatio),
      detectionRadius: mConfigs.finalBoss.detectionRadius,
      guardTargetId: finalChest.id,
      isDead: false,
      facing: 'DOWN',
    });

    return {
      width,
      height,
      ground,
      obstacles,
      playerStart,
      chests: normalChests,
      monsters,
      finalChest,
    };
  }
}
