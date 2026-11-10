/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Chest,
  Direction,
  FloatingText,
  FlyingSwordAnimation,
  GameLevelId,
  MapLevelConfig,
  Monster,
  ObstacleType,
  PlayerStats,
  Position,
  SpellConfig,
  SpellId,
  SpellState,
  SpellVisualEffect,
} from './types';
import gameConfig from './game-config.json';
import { sounds } from './audio';

export interface CombatActionResult {
  success: boolean;
  consumedTurn: boolean;
  message?: string;
  damageDealt?: number;
  damageReceived?: number;
  unlockedChestId?: string;
  openedChestReward?: {
    type: 'attack' | 'defense' | 'spell';
    value?: number;
    spellTitle?: string;
  };
  gameWon?: boolean;
  gameOver?: boolean;
}

export class CombatSystem {
  public static getEffectiveStats(stats: PlayerStats): { attack: number; defense: number } {
    let atk = stats.baseAttack + stats.attackBonus;
    let def = stats.baseDefense + stats.defenseBonus;

    for (const buff of stats.buffs) {
      if (buff.type === 'attack') atk += buff.value;
      if (buff.type === 'defense') def += buff.value;
    }

    return { attack: Math.max(1, atk), defense: Math.max(0, def) };
  }

  /**
   * Determine target tile directly in front of Xiao Xue
   */
  public static getFrontTile(pos: Position, facing: Direction): Position {
    switch (facing) {
      case 'UP':
        return { x: pos.x, y: pos.y - 1 };
      case 'DOWN':
        return { x: pos.x, y: pos.y + 1 };
      case 'LEFT':
        return { x: pos.x - 1, y: pos.y };
      case 'RIGHT':
        return { x: pos.x + 1, y: pos.y };
    }
  }

  /**
   * Execute Melee Flying Sword Attack (御劍術 - STRICT 1-tile front melee)
   */
  public static executeMeleeAttack(
    playerPos: Position,
    facing: Direction,
    playerStats: PlayerStats,
    monsters: Monster[],
    chests: Chest[],
    addFloatingText: (text: string, x: number, y: number, color: string) => void,
    addFlyingSwordAnim: (anim: FlyingSwordAnimation) => void
  ): { targetMonster: Monster | null; damage: number } | null {
    const front = this.getFrontTile(playerPos, facing);

    // Find alive monster strictly in the front tile
    const target = monsters.find(m => !m.isDead && m.x === front.x && m.y === front.y);

    if (!target) {
      // STRICT RULE: No enemy in front tile = cannot attack, 0 turns consumed
      return null;
    }

    const { attack } = this.getEffectiveStats(playerStats);
    // Damage = Math.max(1, attack - target.defense) with slight variance
    const rawDamage = Math.max(1, attack - target.defense);
    const variance = Math.floor(Math.random() * 5) - 2;
    const finalDamage = Math.max(1, rawDamage + variance);

    target.hp = Math.max(0, target.hp - finalDamage);

    // Flying sword animation from player to front target
    addFlyingSwordAnim({
      id: `sword_${Date.now()}_${Math.random()}`,
      startX: playerPos.x,
      startY: playerPos.y,
      targetX: front.x,
      targetY: front.y,
      progress: 0,
      phase: 'forward',
      createdAt: performance.now(),
    });

    sounds.playSwordAttack();

    addFloatingText(`-${finalDamage}`, (front.x + 0.5) * 48, (front.y + 0.2) * 48, 'rgb(250, 204, 21)');

    if (target.hp <= 0) {
      target.isDead = true;
      sounds.playMonsterDeath();
      addFloatingText('擊破！', (front.x + 0.5) * 48, (front.y - 0.2) * 48, 'rgb(239, 68, 68)');

      // If boss, unlock guarded chest
      if (target.guardTargetId) {
        const guardedChest = chests.find(c => c.id === target.guardTargetId);
        if (guardedChest) {
          guardedChest.isLocked = false;
        }
      }
    }

    return { targetMonster: target, damage: finalDamage };
  }

  /**
   * Execute Five Elements Ultimate Spell
   */
  public static executeSpell(
    spellId: SpellId,
    playerPos: Position,
    facing: Direction,
    playerStats: PlayerStats,
    monsters: Monster[],
    chests: Chest[],
    addFloatingText: (text: string, x: number, y: number, color: string) => void,
    addSpellEffect: (eff: SpellVisualEffect) => void
  ): { message: string; affectedTiles: Position[] } {
    const spell = (gameConfig.spells as Record<string, SpellConfig>)[spellId];
    const { attack } = this.getEffectiveStats(playerStats);
    const affectedTiles: Position[] = [];

    switch (spell.effect) {
      case 'heal_max': {
        // Azure Dragon Wood: Instant Full HP Heal
        const healed = playerStats.maxHp - playerStats.hp;
        playerStats.hp = playerStats.maxHp;
        affectedTiles.push(playerPos);
        sounds.playSpellHeal();

        addSpellEffect({
          id: `spell_heal_${Date.now()}`,
          type: 'heal',
          tiles: [playerPos],
          createdAt: performance.now(),
          duration: 600,
          color: '#34d399',
        });

        addFloatingText(`+${healed} 滿血復原！`, (playerPos.x + 0.5) * 48, (playerPos.y - 0.3) * 48, 'rgb(52, 211, 153)');
        return { message: `【青龍・生命回復】發動！生命值完全復原。`, affectedTiles };
      }

      case 'buff_attack': {
        // White Tiger Metal: +15 ATK for 10 turns
        const buffVal = spell.buffValue || 15;
        const dur = spell.duration || 10;
        playerStats.buffs.push({ type: 'attack', value: buffVal, remainingTurns: dur });
        affectedTiles.push(playerPos);
        sounds.playSpellBuff();

        addFloatingText(`攻擊力 +${buffVal}！(10回)`, (playerPos.x + 0.5) * 48, (playerPos.y - 0.3) * 48, 'rgb(250, 204, 21)');
        return { message: `【白虎・攻擊強化】發動！攻擊力提升 ${buffVal}，持續 ${dur} 回合。`, affectedTiles };
      }

      case 'buff_defense': {
        // Black Tortoise Water: +10 DEF for 10 turns
        const buffVal = spell.buffValue || 10;
        const dur = spell.duration || 10;
        playerStats.buffs.push({ type: 'defense', value: buffVal, remainingTurns: dur });
        affectedTiles.push(playerPos);
        sounds.playSpellBuff();

        addFloatingText(`防禦力 +${buffVal}！(10回)`, (playerPos.x + 0.5) * 48, (playerPos.y - 0.3) * 48, 'rgb(56, 189, 248)');
        return { message: `【玄武・防禦強化】發動！防禦力提升 ${buffVal}，持續 ${dur} 回合。`, affectedTiles };
      }

      case 'aoe_fire': {
        // Vermilion Bird Fire: 3x3 blast in front of player
        sounds.playSpellFire();
        const front = this.getFrontTile(playerPos, facing);
        const multiplier = spell.damageMultiplier || 2;
        const spellDmg = Math.round(attack * multiplier);

        // 3x3 center is front tile
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            affectedTiles.push({ x: front.x + dx, y: front.y + dy });
          }
        }

        addSpellEffect({
          id: `spell_fire_${Date.now()}`,
          type: 'fire_aoe',
          tiles: affectedTiles,
          createdAt: performance.now(),
          duration: 700,
          color: '#ef4444',
        });

        // Damage all monsters in 3x3
        let hitCount = 0;
        monsters.forEach(m => {
          if (!m.isDead && affectedTiles.some(t => t.x === m.x && t.y === m.y)) {
            const finalDmg = Math.max(1, spellDmg - m.defense);
            m.hp = Math.max(0, m.hp - finalDmg);
            hitCount++;
            addFloatingText(`-${finalDmg}`, (m.x + 0.5) * 48, (m.y + 0.2) * 48, 'rgb(239, 68, 68)');
            if (m.hp <= 0) {
              m.isDead = true;
              if (m.guardTargetId) {
                const gChest = chests.find(c => c.id === m.guardTargetId);
                if (gChest) gChest.isLocked = false;
              }
            }
          }
        });

        return { message: `【朱雀・烈焰爆破】轟擊前方 3×3 區域，擊中 ${hitCount} 隻目標！`, affectedTiles };
      }

      case 'line_earth': {
        // Yellow Dragon Earth: Line piercing up to 5 tiles forward
        sounds.playSpellEarth();
        const multiplier = spell.damageMultiplier || 3;
        const spellDmg = Math.round(attack * multiplier);
        const range = Number(spell.range) || 5;

        let curX = playerPos.x;
        let curY = playerPos.y;
        let stepX = 0;
        let stepY = 0;
        if (facing === 'UP') stepY = -1;
        if (facing === 'DOWN') stepY = 1;
        if (facing === 'LEFT') stepX = -1;
        if (facing === 'RIGHT') stepX = 1;

        for (let i = 1; i <= range; i++) {
          curX += stepX;
          curY += stepY;
          affectedTiles.push({ x: curX, y: curY });
        }

        addSpellEffect({
          id: `spell_earth_${Date.now()}`,
          type: 'earth_beam',
          tiles: affectedTiles,
          createdAt: performance.now(),
          duration: 650,
          color: '#eab308',
        });

        let hitCount = 0;
        monsters.forEach(m => {
          if (!m.isDead && affectedTiles.some(t => t.x === m.x && t.y === m.y)) {
            const finalDmg = Math.max(1, spellDmg - m.defense);
            m.hp = Math.max(0, m.hp - finalDmg);
            hitCount++;
            addFloatingText(`-${finalDmg}`, (m.x + 0.5) * 48, (m.y + 0.2) * 48, 'rgb(234, 179, 8)');
            if (m.hp <= 0) {
              m.isDead = true;
              if (m.guardTargetId) {
                const gChest = chests.find(c => c.id === m.guardTargetId);
                if (gChest) gChest.isLocked = false;
              }
            }
          }
        });

        return { message: `【黃龍・金龍貫擊】貫穿前方直線 5 格，命中 ${hitCount} 隻目標！`, affectedTiles };
      }
    }
  }

  /**
   * Process Monsters Turn (AI & Attacks)
   */
  /**
   * Process Monsters Turn (AI & Attacks)
   */
  public static processMonstersTurn(
    playerPos: Position,
    playerStats: PlayerStats,
    monsters: Monster[],
    obstacles: (ObstacleType | null)[][],
    chests: Chest[],
    mapWidth: number,
    mapHeight: number,
    addFloatingText: (text: string, x: number, y: number, color: string) => void,
    addSpellEffect: (eff: SpellVisualEffect) => void
  ): { totalDamageTaken: number } {
    let totalDamageTaken = 0;
    const { defense: playerDef } = this.getEffectiveStats(playerStats);

    for (const m of monsters) {
      if (m.isDead) continue;

      const dist = Math.abs(m.x - playerPos.x) + Math.abs(m.y - playerPos.y);

      // Attack if adjacent to player (distance is strictly 1 tile)
      if (dist === 1) {
        const rawDmg = Math.max(1, m.attack - playerDef);
        const variance = Math.floor(Math.random() * 3) - 1;
        const finalDmg = Math.max(1, rawDmg + variance);

        playerStats.hp = Math.max(0, playerStats.hp - finalDmg);
        totalDamageTaken += finalDmg;

        // Facing towards player
        if (playerPos.x < m.x) m.facing = 'LEFT';
        else if (playerPos.x > m.x) m.facing = 'RIGHT';
        else if (playerPos.y < m.y) m.facing = 'UP';
        else m.facing = 'DOWN';

        // Trigger monster claw/slash animation on player's tile!
        addSpellEffect({
          id: `slash_${Date.now()}_${Math.random()}`,
          type: 'monster_slash',
          tiles: [playerPos],
          createdAt: performance.now(),
          duration: 350,
          color: '#f43f5e',
        });

        sounds.playPlayerHurt();
        addFloatingText(`-${finalDmg}`, (playerPos.x + 0.5) * 48, (playerPos.y + 0.3) * 48, 'rgb(239, 68, 68)');
      } else if (dist <= m.detectionRadius) {
        // Move towards player (STRICT: monsters can never step onto playerPos)
        this.stepMonsterTowardsPlayer(m, playerPos, monsters, obstacles, chests, mapWidth, mapHeight);
      }
    }

    return { totalDamageTaken };
  }

  private static stepMonsterTowardsPlayer(
    m: Monster,
    playerPos: Position,
    monsters: Monster[],
    obstacles: (ObstacleType | null)[][],
    chests: Chest[],
    mapWidth: number,
    mapHeight: number
  ) {
    const candidates: Position[] = [];
    const dx = playerPos.x - m.x;
    const dy = playerPos.y - m.y;

    // Prioritize axis with larger delta
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (dx > 0) candidates.push({ x: m.x + 1, y: m.y });
      else if (dx < 0) candidates.push({ x: m.x - 1, y: m.y });
      if (dy > 0) candidates.push({ x: m.x, y: m.y + 1 });
      else if (dy < 0) candidates.push({ x: m.x, y: m.y - 1 });
    } else {
      if (dy > 0) candidates.push({ x: m.x, y: m.y + 1 });
      else if (dy < 0) candidates.push({ x: m.x, y: m.y - 1 });
      if (dx > 0) candidates.push({ x: m.x + 1, y: m.y });
      else if (dx < 0) candidates.push({ x: m.x - 1, y: m.y });
    }

    for (const c of candidates) {
      if (c.x > 0 && c.x < mapWidth - 1 && c.y > 0 && c.y < mapHeight - 1) {
        // 1. Check obstacle
        if (obstacles[c.y][c.x] !== null) continue;

        // 2. STRICT: Monsters cannot step onto the player's tile!
        if (c.x === playerPos.x && c.y === playerPos.y) continue;

        // 3. Check chests (monsters cannot step onto solid chests)
        const isChestTile = chests.some(ch => !ch.isOpened && ch.x === c.x && ch.y === c.y);
        if (isChestTile) continue;

        // 4. Check other monster position
        const occupied = monsters.some(other => !other.isDead && other.id !== m.id && other.x === c.x && other.y === c.y);
        if (occupied) continue;

        // Move to candidate
        if (c.x < m.x) m.facing = 'LEFT';
        else if (c.x > m.x) m.facing = 'RIGHT';
        else if (c.y < m.y) m.facing = 'UP';
        else m.facing = 'DOWN';

        m.x = c.x;
        m.y = c.y;
        break;
      }
    }
  }

  /**
   * Process Natural HP Recovery
   */
  public static processNaturalRecovery(
    playerStats: PlayerStats,
    damagedThisTurn: boolean,
    turnsSinceDamage: number,
    addFloatingText: (text: string, x: number, y: number, color: string) => void,
    playerPos: Position
  ): { recovered: number; newTurnsSinceDamage: number } {
    const recoveryConfig = gameConfig.player.recovery;
    if (!recoveryConfig.enabled) {
      return { recovered: 0, newTurnsSinceDamage: 0 };
    }

    if (damagedThisTurn) {
      return { recovered: 0, newTurnsSinceDamage: 0 };
    }

    const newTurnsSince = turnsSinceDamage + 1;
    if (newTurnsSince >= recoveryConfig.delayAfterDamage) {
      if (playerStats.hp < playerStats.maxHp) {
        const healAmt = Math.min(recoveryConfig.hpPerTurn, playerStats.maxHp - playerStats.hp);
        playerStats.hp += healAmt;
        addFloatingText(`+${healAmt}`, (playerPos.x + 0.5) * 48, (playerPos.y - 0.2) * 48, 'rgb(34, 197, 94)');
        return { recovered: healAmt, newTurnsSinceDamage: newTurnsSince };
      }
    }

    return { recovered: 0, newTurnsSinceDamage: newTurnsSince };
  }

  /**
   * Process Buff Turns Expiration
   */
  public static updateBuffs(playerStats: PlayerStats): void {
    for (let i = playerStats.buffs.length - 1; i >= 0; i--) {
      playerStats.buffs[i].remainingTurns--;
      if (playerStats.buffs[i].remainingTurns <= 0) {
        playerStats.buffs.splice(i, 1);
      }
    }
  }

  /**
   * Open Normal Chest and grant rewards from config probabilities
   */
  public static openChest(
    chest: Chest,
    levelConfig: MapLevelConfig,
    playerStats: PlayerStats,
    spellsState: Record<SpellId, SpellState>
  ): { type: 'attack' | 'defense' | 'spell'; value?: number; spellTitle?: string } {
    chest.isOpened = true;
    sounds.playChestOpen();

    const probs = gameConfig.chestRewards;
    const roll = Math.random() * 100;

    // Check available uncharged spells
    const unchargedSpells = (Object.keys(gameConfig.spells) as SpellId[]).filter(id => {
      const sp = (gameConfig.spells as Record<string, SpellConfig>)[id];
      return sp.enabled && !spellsState[id].charged;
    });

    if (roll < probs.attackBonusProbability) {
      // Attack bonus
      const val = levelConfig.attackBonusValue;
      playerStats.attackBonus += val;
      return { type: 'attack', value: val };
    } else if (roll < probs.attackBonusProbability + probs.defenseBonusProbability) {
      // Defense bonus
      const val = levelConfig.defenseBonusValue;
      playerStats.defenseBonus += val;
      return { type: 'defense', value: val };
    } else {
      // Spell charge
      if (unchargedSpells.length > 0) {
        const chosenId = unchargedSpells[Math.floor(Math.random() * unchargedSpells.length)];
        spellsState[chosenId].charged = true;
        const spConfig = (gameConfig.spells as Record<string, SpellConfig>)[chosenId];
        return { type: 'spell', spellTitle: spConfig.title };
      } else {
        // Fallback to attack bonus if all spells are charged
        const val = levelConfig.attackBonusValue;
        playerStats.attackBonus += val;
        return { type: 'attack', value: val };
      }
    }
  }
}
