/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type GroundTileType = 'grass' | 'dirt' | 'stone' | 'moss_stone';

export type ObstacleType = 'ancient_tree' | 'ruins_pillar' | 'wall' | 'rock';

export interface Position {
  x: number;
  y: number;
}

export type MonsterType = 'normal' | 'chestBoss' | 'finalBoss';

export interface Monster {
  id: string;
  name: string;
  type: MonsterType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  detectionRadius: number;
  guardTargetId?: string; // id of chest being guarded
  isDead: boolean;
  facing: Direction;
  lastHurtTurn?: number;
}

export interface Chest {
  id: string;
  x: number;
  y: number;
  isGrand: boolean;
  isOpened: boolean;
  isLocked: boolean; // locked until guardian boss is killed
  guardianBossId?: string;
}

export interface Buff {
  type: 'attack' | 'defense';
  value: number;
  remainingTurns: number;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  baseAttack: number;
  baseDefense: number;
  attackBonus: number;
  defenseBonus: number;
  buffs: Buff[];
}

export type SpellId = 'azureDragon' | 'whiteTiger' | 'blackTortoise' | 'vermilionBird' | 'yellowDragon';

export interface SpellConfig {
  id: SpellId;
  element: 'wood' | 'metal' | 'water' | 'fire' | 'earth';
  elementName: string;
  title: string;
  description: string;
  enabled: boolean;
  chargeProbability: number;
  effect: 'heal_max' | 'buff_attack' | 'buff_defense' | 'aoe_fire' | 'line_earth';
  buffValue?: number;
  duration?: number;
  damageMultiplier?: number;
  range?: string | number;
}

export interface SpellState {
  charged: boolean;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  createdAt: number;
  lifeTime: number; // in ms
  vy: number;
}

export interface AnimationParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface FlyingSwordAnimation {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number; // 0 to 1
  phase: 'forward' | 'backward';
  createdAt: number;
}

export interface SpellVisualEffect {
  id: string;
  type: 'heal' | 'fire_aoe' | 'earth_beam' | 'buff_tiger' | 'buff_tortoise' | 'vortex_warp' | 'monster_slash';
  tiles: Position[];
  createdAt: number;
  duration: number; // in ms
  color: string;
}

export interface VortexPortal {
  x: number;
  y: number;
  active: boolean;
  rotation: number;
}

export type GameLevelId = 'beginner' | 'intermediate' | 'advanced';

export interface MapLevelConfig {
  id: GameLevelId;
  name: string;
  unlocked: boolean;
  mapWidth: number;
  mapHeight: number;
  monsterCount: number;
  normalChestCount: number;
  bossCount: number;
  obstacleDensity: number;
  attackBonusValue: number;
  defenseBonusValue: number;
}

export interface GameLogEntry {
  id: string;
  turn: number;
  message: string;
  type: 'info' | 'combat' | 'loot' | 'spell' | 'danger';
}
