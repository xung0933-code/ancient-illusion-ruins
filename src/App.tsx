/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import gameConfig from './game/game-config.json';
import {
  Chest,
  Direction,
  FloatingText,
  FlyingSwordAnimation,
  GameLevelId,
  GameLogEntry,
  MapLevelConfig,
  Monster,
  ObstacleType,
  PlayerStats,
  Position,
  SpellConfig,
  SpellId,
  SpellState,
  SpellVisualEffect,
} from './game/types';
import { MapGenerator } from './game/MapGenerator';
import { CameraSystem } from './game/CameraSystem';
import { CanvasRenderer } from './game/CanvasRenderer';
import { CombatSystem } from './game/CombatSystem';
import { sounds } from './game/audio';
import { SkillConfirmationModal } from './components/SkillConfirmationModal';
import { ChestRewardModal } from './components/ChestRewardModal';
import { GameOverModal } from './components/GameOverModal';
import { TouchControls } from './components/TouchControls';
import { DifficultySelectModal } from './components/DifficultySelectModal';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  HelpCircle,
  Sword,
  Shield,
  Heart,
  Sparkles,
  Compass,
  Flame,
  Mountain,
  Crosshair,
  Info,
  Home,
  X,
} from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<CameraSystem>(new CameraSystem());
  const rendererRef = useRef<CanvasRenderer | null>(null);

  // Level Selection & Game State
  const [currentLevel, setCurrentLevel] = useState<GameLevelId>('beginner');
  const [showDifficultyModal, setShowDifficultyModal] = useState<boolean>(false);
  const [unchargedSkillInfo, setUnchargedSkillInfo] = useState<SpellConfig | null>(null);
  const levelConfig = (gameConfig.mapLevels as Record<GameLevelId, MapLevelConfig>)[currentLevel];

  // Game World State
  const [mapWidth, setMapWidth] = useState<number>(levelConfig.mapWidth);
  const [mapHeight, setMapHeight] = useState<number>(levelConfig.mapHeight);
  const [ground, setGround] = useState<string[][]>([]);
  const [obstacles, setObstacles] = useState<(ObstacleType | null)[][]>([]);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 0, y: 0 });
  const [playerFacing, setPlayerFacing] = useState<Direction>('DOWN');
  const [chests, setChests] = useState<Chest[]>([]);
  const [finalChest, setFinalChest] = useState<Chest | null>(null);
  const [monsters, setMonsters] = useState<Monster[]>([]);

  // Player Stats
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    hp: gameConfig.player.baseStats.hp,
    maxHp: gameConfig.player.baseStats.maxHp,
    baseAttack: gameConfig.player.baseStats.attack,
    baseDefense: gameConfig.player.baseStats.defense,
    attackBonus: 0,
    defenseBonus: 0,
    buffs: [],
  });

  // Turn management
  const [turns, setTurns] = useState<number>(0);
  const [turnsSinceDamage, setTurnsSinceDamage] = useState<number>(0);
  const [monstersKilledCount, setMonstersKilledCount] = useState<number>(0);

  // Five Elements Spells State
  const [spellsState, setSpellsState] = useState<Record<SpellId, SpellState>>({
    azureDragon: { charged: false },
    whiteTiger: { charged: false },
    blackTortoise: { charged: false },
    vermilionBird: { charged: false },
    yellowDragon: { charged: false },
  });

  // Animations & Visuals
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const flyingSwordsRef = useRef<FlyingSwordAnimation[]>([]);
  const spellEffectsRef = useRef<SpellVisualEffect[]>([]);

  // Modals & UI State
  const lastHurtTimeRef = useRef<number>(0);
  const [screenFlashRed, setScreenFlashRed] = useState<boolean>(false);
  const [pendingSpellConfirm, setPendingSpellConfirm] = useState<SpellConfig | null>(null);
  const [chestReward, setChestReward] = useState<{
    type: 'attack' | 'defense' | 'spell';
    value?: number;
    spellTitle?: string;
  } | null>(null);
  const [gameOverState, setGameOverState] = useState<{ isVictory: boolean } | null>(null);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [logs, setLogs] = useState<GameLogEntry[]>([]);

  const addLog = useCallback((message: string, type: GameLogEntry['type'] = 'info') => {
    setLogs(prev => [{ id: `${Date.now()}_${Math.random()}`, turn: turns, message, type }, ...prev.slice(0, 30)]);
  }, [turns]);

  const addFloatingText = useCallback((text: string, x: number, y: number, color: string) => {
    floatingTextsRef.current.push({
      id: `${Date.now()}_${Math.random()}`,
      x,
      y,
      text,
      color,
      createdAt: performance.now(),
      lifeTime: 1000,
      vy: -0.6,
    });
  }, []);

  const addFlyingSwordAnim = useCallback((anim: FlyingSwordAnimation) => {
    flyingSwordsRef.current.push(anim);
  }, []);

  const addSpellEffect = useCallback((eff: SpellVisualEffect) => {
    spellEffectsRef.current.push(eff);
  }, []);

  // Initialize or Restart Game
  const initGame = useCallback((levelId: GameLevelId = currentLevel) => {
    const config = (gameConfig.mapLevels as Record<GameLevelId, MapLevelConfig>)[levelId];
    setCurrentLevel(levelId);
    setMapWidth(config.mapWidth);
    setMapHeight(config.mapHeight);

    // Generate procedural map with BFS validation
    const gen = MapGenerator.generate(config);

    setGround(gen.ground);
    setObstacles(gen.obstacles);
    setPlayerPos(gen.playerStart);
    setPlayerFacing('DOWN');
    setChests(gen.chests);
    setFinalChest(gen.finalChest);
    setMonsters(gen.monsters);

    // Reset stats
    setPlayerStats({
      hp: gameConfig.player.baseStats.hp,
      maxHp: gameConfig.player.baseStats.maxHp,
      baseAttack: gameConfig.player.baseStats.attack,
      baseDefense: gameConfig.player.baseStats.defense,
      attackBonus: 0,
      defenseBonus: 0,
      buffs: [],
    });

    setTurns(0);
    setTurnsSinceDamage(0);
    setMonstersKilledCount(0);

    // Reset spells
    setSpellsState({
      azureDragon: { charged: false },
      whiteTiger: { charged: false },
      blackTortoise: { charged: false },
      vermilionBird: { charged: false },
      yellowDragon: { charged: false },
    });

    floatingTextsRef.current = [];
    flyingSwordsRef.current = [];
    spellEffectsRef.current = [];
    setPendingSpellConfirm(null);
    setChestReward(null);
    setGameOverState(null);

    // Update camera immediately
    cameraRef.current.update(gen.playerStart.x, gen.playerStart.y, config.mapWidth, config.mapHeight);

    addLog(`進入【${config.name} (${config.mapWidth}×${config.mapHeight})】，開始探索古遺跡！`, 'info');
  }, [currentLevel, addLog]);

  // Initial game setup
  useEffect(() => {
    initGame(currentLevel);
  }, []);

  // Handler to switch difficulty and regenerate map
  const handleSelectLevelAndStart = useCallback((levelId: GameLevelId) => {
    initGame(levelId);
    setShowDifficultyModal(false);
  }, [initGame]);

  // Handler to open difficulty select modal
  const handleReturnToMenu = useCallback(() => {
    setShowDifficultyModal(true);
  }, []);

  // Window resize & canvas context setup
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const width = canvas.parentElement?.clientWidth || window.innerWidth;
      const height = canvas.parentElement?.clientHeight || window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      cameraRef.current.updateViewport(width, height);
      cameraRef.current.update(playerPos.x, playerPos.y, mapWidth, mapHeight);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        rendererRef.current = new CanvasRenderer(ctx, cameraRef.current);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mapWidth, mapHeight, playerPos.x, playerPos.y]);

  // Main Canvas Render Loop (60 FPS)
  useEffect(() => {
    let animId: number;

    const renderLoop = (timestamp: number) => {
      const canvas = canvasRef.current;
      const renderer = rendererRef.current;
      if (canvas && renderer && ground.length > 0) {
        // Update camera position
        cameraRef.current.update(playerPos.x, playerPos.y, mapWidth, mapHeight);

        // Clear void
        renderer.clear(canvas.width, canvas.height);

        // Draw Ground Layer
        renderer.renderGround(ground as any, mapWidth, mapHeight);

        // Draw Obstacles Layer
        renderer.renderObstacles(obstacles, mapWidth, mapHeight, timestamp);

        // Draw Chests & Space-Time Vortex
        if (finalChest) {
          renderer.renderChests(chests, finalChest, timestamp);
        }

        // Draw Monsters & Bosses
        renderer.renderMonsters(monsters, timestamp);

        // Update & Draw Flying Sword animations
        for (let i = flyingSwordsRef.current.length - 1; i >= 0; i--) {
          const anim = flyingSwordsRef.current[i];
          const elapsed = timestamp - anim.createdAt;
          const duration = 120; // 120ms per phase

          if (anim.phase === 'forward') {
            anim.progress = Math.min(1, elapsed / duration);
            if (anim.progress >= 1) {
              anim.phase = 'backward';
              anim.createdAt = timestamp;
            }
          } else {
            anim.progress = Math.min(1, elapsed / duration);
            if (anim.progress >= 1) {
              flyingSwordsRef.current.splice(i, 1);
            }
          }
        }
        renderer.renderFlyingSwords(flyingSwordsRef.current, timestamp);

        // Determine if an alive enemy is in front of Xiao Xue for reticle aim
        let fx = playerPos.x;
        let fy = playerPos.y;
        if (playerFacing === 'UP') fy -= 1;
        if (playerFacing === 'DOWN') fy += 1;
        if (playerFacing === 'LEFT') fx -= 1;
        if (playerFacing === 'RIGHT') fx += 1;
        const hasEnemyInFront = monsters.some(m => !m.isDead && m.x === fx && m.y === fy);

        // Draw Xiao Xue (Heroine with full 4-direction sprite & aim reticle & hurt flicker)
        renderer.renderPlayer(
          playerPos,
          playerFacing,
          playerStats,
          timestamp,
          flyingSwordsRef.current,
          hasEnemyInFront,
          lastHurtTimeRef.current
        );

        // Draw Spell Effects
        for (let i = spellEffectsRef.current.length - 1; i >= 0; i--) {
          const eff = spellEffectsRef.current[i];
          if (timestamp - eff.createdAt >= eff.duration) {
            spellEffectsRef.current.splice(i, 1);
          }
        }
        renderer.renderSpellEffects(spellEffectsRef.current, timestamp);

        // Clean & Render Floating Damage/Heal text
        for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
          const item = floatingTextsRef.current[i];
          if (timestamp - item.createdAt >= item.lifeTime) {
            floatingTextsRef.current.splice(i, 1);
          }
        }
        renderer.renderFloatingTexts(floatingTextsRef.current, timestamp);
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [ground, obstacles, playerPos, playerFacing, chests, finalChest, monsters, playerStats, mapWidth, mapHeight]);

  // Turn Execution Logic: monsters act -> damage check -> natural recovery -> state update
  const completePlayerActionTurn = useCallback(
    (actionDescription: string, activePlayerPos?: Position) => {
      const currentPos = activePlayerPos || playerPos;

      // 1. Monsters take action based on active position of Xiao Xue
      const { totalDamageTaken } = CombatSystem.processMonstersTurn(
        currentPos,
        playerStats,
        monsters,
        obstacles,
        chests,
        mapWidth,
        mapHeight,
        addFloatingText,
        addSpellEffect
      );

      // Trigger visual hurt feedback: screen edge red flash & hurt blink
      if (totalDamageTaken > 0) {
        lastHurtTimeRef.current = performance.now();
        setScreenFlashRed(true);
        setTimeout(() => setScreenFlashRed(false), 240);
      }

      // 2. Natural Recovery check
      const { recovered, newTurnsSinceDamage } = CombatSystem.processNaturalRecovery(
        playerStats,
        totalDamageTaken > 0,
        turnsSinceDamage,
        addFloatingText,
        currentPos
      );
      setTurnsSinceDamage(newTurnsSinceDamage);

      // 3. Update Buff Timers
      CombatSystem.updateBuffs(playerStats);

      // 4. Update Stats and Turn Counter
      const nextTurn = turns + 1;
      setTurns(nextTurn);
      setPlayerStats({ ...playerStats });

      // Count defeated monsters
      const deadCount = monsters.filter(m => m.isDead).length;
      setMonstersKilledCount(deadCount);

      // Check Player Death
      if (playerStats.hp <= 0) {
        setGameOverState({ isVictory: false });
        addLog(`小雪力竭道消，探索中斷！`, 'danger');
      }
    },
    [playerPos, playerStats, monsters, obstacles, chests, mapWidth, mapHeight, turnsSinceDamage, turns, addFloatingText, addSpellEffect, addLog]
  );

  // Movement Action
  const handleMove = useCallback(
    (dir: Direction) => {
      if (gameOverState || pendingSpellConfirm || chestReward) return;

      setPlayerFacing(dir);

      let targetX = playerPos.x;
      let targetY = playerPos.y;

      if (dir === 'UP') targetY -= 1;
      if (dir === 'DOWN') targetY += 1;
      if (dir === 'LEFT') targetX -= 1;
      if (dir === 'RIGHT') targetX += 1;

      // 1. Bounds check
      if (targetX < 0 || targetX >= mapWidth || targetY < 0 || targetY >= mapHeight) {
        return; // Bump boundary, no turn consumed
      }

      // 2. Obstacle check
      if (obstacles[targetY][targetX] !== null) {
        addFloatingText('前方為障礙壁', (targetX + 0.5) * 48, (targetY + 0.5) * 48, 'rgb(148, 163, 184)');
        return; // Bump obstacle, no turn consumed
      }

      // 3. Alive Monster block check (STRICT: Monsters are impassable solid obstacles, player CANNOT step on them!)
      const monsterAtTarget = monsters.find(m => !m.isDead && m.x === targetX && m.y === targetY);
      if (monsterAtTarget) {
        addFloatingText('⚠️ 妖物擋道！請使用【御劍】斬殺', (targetX + 0.5) * 48, (targetY + 0.5) * 48, 'rgb(248, 113, 113)');
        return; // Blocked by monster, no turn consumed
      }

      // 4. Chest block check (Walkable up to chest, unopened chest itself is solid)
      const chestAtTarget = [...chests, finalChest].find(c => c && c.x === targetX && c.y === targetY);
      if (chestAtTarget && !chestAtTarget.isOpened) {
        addFloatingText('前方為寶箱', (targetX + 0.5) * 48, (targetY + 0.5) * 48, 'rgb(251, 191, 36)');
        return; // Solid chest, interact to open
      }

      // Valid move!
      const newPos = { x: targetX, y: targetY };
      sounds.playFootstep();
      setPlayerPos(newPos);

      // Check if stepped into active Space-Time Vortex (Grand chest opened)
      if (finalChest && finalChest.isOpened && targetX === finalChest.x && targetY === finalChest.y) {
        sounds.playVictory();
        setGameOverState({ isVictory: true });
        addLog('小雪踏入時空漩渦，成功通關古遺跡！', 'loot');
        return;
      }

      // Complete turn with newPos passed directly so monster AI uses new coordinates synchronously
      completePlayerActionTurn(`小雪移動至 (${targetX}, ${targetY})`, newPos);
    },
    [gameOverState, pendingSpellConfirm, chestReward, playerPos, mapWidth, mapHeight, obstacles, monsters, chests, finalChest, completePlayerActionTurn, addFloatingText, addLog]
  );

  // Normal Attack Action (Flying Sword / 御劍術 - STRICT melee front 1-tile)
  const handleAttack = useCallback(() => {
    if (gameOverState || pendingSpellConfirm || chestReward) return;

    const result = CombatSystem.executeMeleeAttack(
      playerPos,
      playerFacing,
      playerStats,
      monsters,
      chests,
      addFloatingText,
      addFlyingSwordAnim
    );

    if (!result) {
      // STRICT GDD REQUIREMENT: No enemy in front 1-tile -> CANNOT attack, 0 turns consumed!
      addFloatingText('正前方無妖物', (playerPos.x + 0.5) * 48, (playerPos.y - 0.3) * 48, 'rgb(148, 163, 184)');
      return;
    }

    addLog(`小雪御劍斬擊【${result.targetMonster?.name}】，造成 ${result.damage} 點傷害！`, 'combat');

    // Consumes 1 turn, enemies respond
    completePlayerActionTurn('御劍攻擊');
  }, [gameOverState, pendingSpellConfirm, chestReward, playerPos, playerFacing, playerStats, monsters, chests, addFloatingText, addFlyingSwordAnim, addLog, completePlayerActionTurn]);

  // Contextual Interaction (Open normal chest / Grand chest / Enter Vortex)
  const getAdjacentInteractive = useCallback((): { type: 'normal_chest' | 'grand_chest' | 'vortex'; target: Chest } | null => {
    const allChests = finalChest ? [...chests, finalChest] : chests;
    for (const c of allChests) {
      const dist = Math.abs(c.x - playerPos.x) + Math.abs(c.y - playerPos.y);
      if (dist <= 1) {
        if (c.isGrand) {
          if (c.isOpened) return { type: 'vortex', target: c };
          return { type: 'grand_chest', target: c };
        } else {
          if (!c.isOpened) return { type: 'normal_chest', target: c };
        }
      }
    }
    return null;
  }, [chests, finalChest, playerPos]);

  const interactive = getAdjacentInteractive();

  const handleInteract = useCallback(() => {
    if (gameOverState || pendingSpellConfirm || chestReward || !interactive) return;

    if (interactive.type === 'vortex') {
      // Step into space-time vortex
      sounds.playVictory();
      setGameOverState({ isVictory: true });
      addLog('小雪踏入時空漩渦，成功通關古遺跡！', 'loot');
      return;
    }

    const chest = interactive.target;
    if (chest.isLocked) {
      addFloatingText('守護尊者尚未誅滅！寶箱封鎖中', (chest.x + 0.5) * 48, (chest.y - 0.2) * 48, 'rgb(239, 68, 68)');
      addLog('寶箱受尊者煞氣封印，必須先擊敗守護者！', 'danger');
      return;
    }

    if (chest.isGrand) {
      // Grand final chest opened!
      chest.isOpened = true;
      sounds.playChestOpen();
      addLog('太古終極寶箱開啟！深處湧現時空漩渦！請踏入漩渦離開遺跡！', 'loot');
      addFloatingText('時空漩渦已現！', (chest.x + 0.5) * 48, (chest.y - 0.2) * 48, 'rgb(56, 189, 248)');
      completePlayerActionTurn('開啟太古大寶箱');
      return;
    }

    // Normal chest opened!
    const reward = CombatSystem.openChest(chest, levelConfig, playerStats, spellsState);
    setChestReward(reward);
    setSpellsState({ ...spellsState });

    let rewardMsg = '';
    if (reward.type === 'attack') rewardMsg = `攻擊力永久提升 +${reward.value} 點！`;
    else if (reward.type === 'defense') rewardMsg = `防禦力永久提升 +${reward.value} 點！`;
    else if (reward.type === 'spell') rewardMsg = `五行必殺技【${reward.spellTitle}】充能完畢！`;

    addLog(`開啟古遺跡寶箱！${rewardMsg}`, 'loot');

    // Opening chest consumes 1 turn
    completePlayerActionTurn('開啟寶箱');
  }, [gameOverState, pendingSpellConfirm, chestReward, interactive, levelConfig, playerStats, spellsState, addFloatingText, addLog, completePlayerActionTurn]);

  // Click Five Elements Skill Button (Interception Card Flow)
  const handleSkillButtonClick = useCallback((spellId: SpellId) => {
    if (gameOverState || pendingSpellConfirm || chestReward) return;

    const spellCfg = (gameConfig.spells as Record<string, SpellConfig>)[spellId];
    if (!spellCfg || !spellCfg.enabled) return;

    // If not charged, open skill info modal so player understands what the skill does and how to unlock it
    if (!spellsState[spellId].charged) {
      setUnchargedSkillInfo(spellCfg);
      return;
    }

    // STRICT GDD REQUIREMENT: Open Confirmation Card, pause game, 0 turns consumed, charge retained
    setPendingSpellConfirm(spellCfg);
  }, [gameOverState, pendingSpellConfirm, chestReward, spellsState]);

  // Confirm Spell Cast
  const handleConfirmSpellCast = useCallback(() => {
    if (!pendingSpellConfirm) return;

    const spellId = pendingSpellConfirm.id;
    // Deduct charge
    spellsState[spellId].charged = false;
    setSpellsState({ ...spellsState });

    // Execute spell effect
    const res = CombatSystem.executeSpell(
      spellId,
      playerPos,
      playerFacing,
      playerStats,
      monsters,
      chests,
      addFloatingText,
      addSpellEffect
    );

    addLog(res.message, 'spell');
    setPendingSpellConfirm(null);

    // Consumes 1 turn, enemies respond
    completePlayerActionTurn(`發動必殺技【${pendingSpellConfirm.title}】`);
  }, [pendingSpellConfirm, spellsState, playerPos, playerFacing, playerStats, monsters, chests, addFloatingText, addSpellEffect, addLog, completePlayerActionTurn]);

  // Cancel Spell Cast
  const handleCancelSpellCast = useCallback(() => {
    // Closes card, preserves charge, 0 turns consumed
    setPendingSpellConfirm(null);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If modal is active, Esc cancels
      if (pendingSpellConfirm) {
        if (e.key === 'Escape') handleCancelSpellCast();
        if (e.key === 'Enter') handleConfirmSpellCast();
        return;
      }
      if (showDifficultyModal) {
        if (e.key === 'Escape') setShowDifficultyModal(false);
        return;
      }
      if (unchargedSkillInfo) {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') setUnchargedSkillInfo(null);
        return;
      }
      if (chestReward) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') setChestReward(null);
        return;
      }
      if (gameOverState) {
        if (e.key === 'Enter' || e.key === 'r' || e.key === 'R') initGame(currentLevel);
        return;
      }

      const code = e.code;
      const key = e.key ? e.key.toLowerCase() : '';

      // Move UP (Supports W, w, KeyW, ArrowUp)
      if (code === 'KeyW' || key === 'w' || code === 'ArrowUp' || key === 'arrowup') {
        e.preventDefault();
        handleMove('UP');
        return;
      }

      // Move DOWN (Supports S, s, KeyS, ArrowDown)
      if (code === 'KeyS' || key === 's' || code === 'ArrowDown' || key === 'arrowdown') {
        e.preventDefault();
        handleMove('DOWN');
        return;
      }

      // Move LEFT (Supports A, a, KeyA, ArrowLeft)
      if (code === 'KeyA' || key === 'a' || code === 'ArrowLeft' || key === 'arrowleft') {
        e.preventDefault();
        handleMove('LEFT');
        return;
      }

      // Move RIGHT (Supports D, d, KeyD, ArrowRight)
      if (code === 'KeyD' || key === 'd' || code === 'ArrowRight' || key === 'arrowright') {
        e.preventDefault();
        handleMove('RIGHT');
        return;
      }

      // Attack (Supports J, j, KeyJ, Space)
      if (code === 'KeyJ' || key === 'j' || code === 'Space' || key === ' ') {
        e.preventDefault();
        handleAttack();
        return;
      }

      // Interact (Supports E, e, F, f, Enter)
      if (code === 'KeyE' || key === 'e' || code === 'KeyF' || key === 'f' || code === 'Enter' || key === 'enter') {
        e.preventDefault();
        handleInteract();
        return;
      }

      // Five Elements Skills (1-5, Numpad 1-5)
      if (code === 'Digit1' || code === 'Numpad1' || key === '1') {
        handleSkillButtonClick('azureDragon');
        return;
      }
      if (code === 'Digit2' || code === 'Numpad2' || key === '2') {
        handleSkillButtonClick('whiteTiger');
        return;
      }
      if (code === 'Digit3' || code === 'Numpad3' || key === '3') {
        handleSkillButtonClick('blackTortoise');
        return;
      }
      if (code === 'Digit4' || code === 'Numpad4' || key === '4') {
        handleSkillButtonClick('vermilionBird');
        return;
      }
      if (code === 'Digit5' || code === 'Numpad5' || key === '5') {
        handleSkillButtonClick('yellowDragon');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    pendingSpellConfirm,
    chestReward,
    gameOverState,
    handleMove,
    handleAttack,
    handleInteract,
    handleSkillButtonClick,
    handleCancelSpellCast,
    handleConfirmSpellCast,
    initGame,
    currentLevel,
    showDifficultyModal,
    unchargedSkillInfo,
  ]);

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const effectiveStats = CombatSystem.getEffectiveStats(playerStats);
  const openedChestsCount = chests.filter(c => c.isOpened).length + (finalChest?.isOpened ? 1 : 0);
  const totalChestsCount = chests.length + 1;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none text-slate-100 flex flex-col">
      {/* Top Bar Header */}
      <header className="relative z-20 flex items-center justify-between px-3 md:px-6 py-2.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg">
        {/* Left: Xiao Xue Portrait & Name */}
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden border-2 border-cyan-400/70 shadow-[0_0_12px_rgba(56,189,248,0.3)] bg-slate-800 shrink-0">
            <img
              src="/public/assets/aistudio/_____3_be38311a.png"
              alt="小雪立繪"
              className="w-full h-full object-cover object-top"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-wide text-white">小雪</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-medium tracking-wide">
                {levelConfig.name} ({levelConfig.mapWidth}×{levelConfig.mapHeight})
              </span>
            </div>
            {/* HP Bar */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-24 md:w-36 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, (playerStats.hp / playerStats.maxHp) * 100))}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-emerald-400 tabular-nums">
                {playerStats.hp}/{playerStats.maxHp}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Core Stats (ATK, DEF, Turn, Chests) */}
        <div className="hidden sm:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-slate-800">
            <Sword className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">攻</span>
            <span className="font-mono font-bold text-amber-300 tabular-nums">{effectiveStats.attack}</span>
            {playerStats.attackBonus > 0 && (
              <span className="text-[10px] text-amber-400/80 font-mono">+{playerStats.attackBonus}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-slate-800">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">防</span>
            <span className="font-mono font-bold text-cyan-300 tabular-nums">{effectiveStats.defense}</span>
            {playerStats.defenseBonus > 0 && (
              <span className="text-[10px] text-cyan-400/80 font-mono">+{playerStats.defenseBonus}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-slate-400">寶箱</span>
            <span className="font-mono font-bold text-yellow-300 tabular-nums">
              {openedChestsCount}/{totalChestsCount}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-slate-800">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">回合</span>
            <span className="font-mono font-bold text-indigo-300 tabular-nums">{turns}</span>
          </div>
        </div>

        {/* Right: Controls & Actions (Level switchers REMOVED to prevent accidental clicks) */}
        <div className="flex items-center gap-2">
          {/* Change Difficulty / Return to Menu */}
          <button
            onClick={handleReturnToMenu}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/70 text-xs font-medium transition-colors cursor-pointer"
            title="更換難度 (返回選擇界面)"
          >
            <Home className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">更換難度</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title={isMuted ? '開啟音效' : '靜音'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Help Modal Toggle */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="操作與規則說明"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Reset / Restart Run */}
          <button
            onClick={() => {
              if (window.confirm('確定要重新生成當前地圖嗎？')) {
                initGame(currentLevel);
              }
            }}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="重新生成當前地圖"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Game Canvas Viewport */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-slate-950">
        <canvas ref={canvasRef} className="block w-full h-full touch-none" />

        {/* Screen Hurt Red Flash Vignette */}
        {screenFlashRed && (
          <div className="pointer-events-none absolute inset-0 z-30 bg-rose-600/35 border-[10px] border-rose-500 shadow-[inset_0_0_60px_rgba(225,29,72,0.8)] animate-pulse" />
        )}

        {/* Desktop Controls Hint (Top-Left overlay) */}
        <div className="hidden lg:flex flex-col gap-1 absolute top-3 left-4 z-10 bg-slate-900/75 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 shadow-lg pointer-events-none">
          <div className="flex items-center gap-1.5 text-slate-200 font-semibold mb-0.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            操作指引
          </div>
          <div>移動：WASD 或 方向鍵</div>
          <div>御劍普攻：J 或 空白鍵 (前方一格近戰)</div>
          <div>互動/開箱：E 或 Enter</div>
          <div>五行必殺技：數字鍵 1 ~ 5</div>
        </div>

        {/* Real-time Combat & Event Ticker (Top-Right overlay) */}
        {logs.length > 0 && (
          <div className="hidden sm:flex flex-col gap-1 absolute top-3 right-4 z-10 max-w-xs bg-slate-900/80 backdrop-blur-md p-2.5 rounded-xl border border-slate-800/80 text-[11px] shadow-lg pointer-events-none overflow-hidden max-h-32">
            <span className="text-[10px] text-slate-500 font-medium">遺跡動態</span>
            {logs.slice(0, 3).map(log => (
              <div
                key={log.id}
                className={`truncate ${
                  log.type === 'danger'
                    ? 'text-rose-400'
                    : log.type === 'loot'
                    ? 'text-amber-300'
                    : log.type === 'spell'
                    ? 'text-cyan-300 font-medium'
                    : 'text-slate-300'
                }`}
              >
                {log.message}
              </div>
            ))}
          </div>
        )}

        {/* Mobile Touch D-Pad & Attack Controls */}
        <TouchControls
          onMove={handleMove}
          onAttack={handleAttack}
          onInteract={handleInteract}
          canInteract={interactive !== null}
          interactLabel={
            interactive?.type === 'vortex'
              ? '踏入時空漩渦'
              : interactive?.type === 'grand_chest'
              ? '開啟終極寶箱'
              : '開啟寶箱'
          }
        />
      </div>

      {/* Bottom Bar: Five Elements Ultimate Skills (五大神獸必殺技專屬按鈕區) */}
      <footer className="relative z-20 py-2 px-2 sm:px-6 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>五大神獸必殺技 (開箱充能·點擊檢視/發動)</span>
        </div>

        {/* 5 Elemental Sacred Beast Buttons - Always visible and clear */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 w-full md:w-auto">
          {/* 1. Wood: Azure Dragon (木・青龍) */}
          <button
            onClick={() => handleSkillButtonClick('azureDragon')}
            className={`relative px-1.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border text-xs flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all cursor-pointer ${
              spellsState.azureDragon.charged
                ? 'bg-gradient-to-b from-emerald-600 to-emerald-950 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] active:scale-95 animate-pulse'
                : 'bg-slate-900/90 hover:bg-slate-800/90 border-emerald-900/50 hover:border-emerald-700/60 text-slate-300'
            }`}
            title="木・青龍 (點擊查看詳情)"
          >
            <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-emerald-400">
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>木・青龍</span>
            </div>
            <span className="text-[10px] text-slate-300 font-medium">回復全滿</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium ${
                spellsState.azureDragon.charged
                  ? 'bg-emerald-400 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {spellsState.azureDragon.charged ? '已就緒 [1]' : '未充能 [1]'}
            </span>
            {spellsState.azureDragon.charged && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            )}
          </button>

          {/* 2. Metal: White Tiger (金・白虎) */}
          <button
            onClick={() => handleSkillButtonClick('whiteTiger')}
            className={`relative px-1.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border text-xs flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all cursor-pointer ${
              spellsState.whiteTiger.charged
                ? 'bg-gradient-to-b from-amber-600 to-amber-950 border-amber-300 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] active:scale-95 animate-pulse'
                : 'bg-slate-900/90 hover:bg-slate-800/90 border-amber-900/50 hover:border-amber-700/60 text-slate-300'
            }`}
            title="金・白虎 (點擊查看詳情)"
          >
            <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-amber-400">
              <Crosshair className="w-3.5 h-3.5" />
              <span>金・白虎</span>
            </div>
            <span className="text-[10px] text-slate-300 font-medium">狂攻(+10)</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium ${
                spellsState.whiteTiger.charged
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {spellsState.whiteTiger.charged ? '已就緒 [2]' : '未充能 [2]'}
            </span>
            {spellsState.whiteTiger.charged && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
            )}
          </button>

          {/* 3. Water: Black Tortoise (水・玄武) */}
          <button
            onClick={() => handleSkillButtonClick('blackTortoise')}
            className={`relative px-1.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border text-xs flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all cursor-pointer ${
              spellsState.blackTortoise.charged
                ? 'bg-gradient-to-b from-cyan-600 to-cyan-950 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] active:scale-95 animate-pulse'
                : 'bg-slate-900/90 hover:bg-slate-800/90 border-cyan-900/50 hover:border-cyan-700/60 text-slate-300'
            }`}
            title="水・玄武 (點擊查看詳情)"
          >
            <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-cyan-400">
              <Shield className="w-3.5 h-3.5 fill-current" />
              <span>水・玄武</span>
            </div>
            <span className="text-[10px] text-slate-300 font-medium">金剛(+10)</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium ${
                spellsState.blackTortoise.charged
                  ? 'bg-cyan-400 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {spellsState.blackTortoise.charged ? '已就緒 [3]' : '未充能 [3]'}
            </span>
            {spellsState.blackTortoise.charged && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
            )}
          </button>

          {/* 4. Fire: Vermilion Bird (火・朱雀) */}
          <button
            onClick={() => handleSkillButtonClick('vermilionBird')}
            className={`relative px-1.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border text-xs flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all cursor-pointer ${
              spellsState.vermilionBird.charged
                ? 'bg-gradient-to-b from-rose-600 to-rose-950 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)] active:scale-95 animate-pulse'
                : 'bg-slate-900/90 hover:bg-slate-800/90 border-rose-900/50 hover:border-rose-700/60 text-slate-300'
            }`}
            title="火・朱雀 (點擊查看詳情)"
          >
            <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-rose-400">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>火・朱雀</span>
            </div>
            <span className="text-[10px] text-slate-300 font-medium">3×3爆破</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium ${
                spellsState.vermilionBird.charged
                  ? 'bg-rose-400 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {spellsState.vermilionBird.charged ? '已就緒 [4]' : '未充能 [4]'}
            </span>
            {spellsState.vermilionBird.charged && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-400 rounded-full animate-ping" />
            )}
          </button>

          {/* 5. Earth: Yellow Dragon (土・黃龍) */}
          <button
            onClick={() => handleSkillButtonClick('yellowDragon')}
            className={`relative px-1.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border text-xs flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all cursor-pointer ${
              spellsState.yellowDragon.charged
                ? 'bg-gradient-to-b from-yellow-600 to-yellow-950 border-yellow-300 text-white shadow-[0_0_15px_rgba(234,179,8,0.5)] active:scale-95 animate-pulse'
                : 'bg-slate-900/90 hover:bg-slate-800/90 border-yellow-900/50 hover:border-yellow-700/60 text-slate-300'
            }`}
            title="土・黃龍 (點擊查看詳情)"
          >
            <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-yellow-400">
              <Mountain className="w-3.5 h-3.5" />
              <span>土・黃龍</span>
            </div>
            <span className="text-[10px] text-slate-300 font-medium">5格貫穿</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium ${
                spellsState.yellowDragon.charged
                  ? 'bg-yellow-400 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {spellsState.yellowDragon.charged ? '已就緒 [5]' : '未充能 [5]'}
            </span>
            {spellsState.yellowDragon.charged && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping" />
            )}
          </button>
        </div>
      </footer>

      {/* Skill Confirmation Modal (Strict requirement from GDD Section 8.2) */}
      <SkillConfirmationModal
        spell={pendingSpellConfirm}
        onConfirm={handleConfirmSpellCast}
        onCancel={handleCancelSpellCast}
      />

      {/* Uncharged Skill Info Modal (Explaining sacred beast skill & how to charge it) */}
      {unchargedSkillInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 p-6 text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300">
                  五行神獸必殺技
                </span>
                <span className="text-xs text-amber-400 font-mono">靈力未充能</span>
              </div>
              <button
                onClick={() => setUnchargedSkillInfo(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-300">
                {unchargedSkillInfo.id === 'azureDragon' && <Heart className="w-6 h-6 text-emerald-400 fill-current" />}
                {unchargedSkillInfo.id === 'whiteTiger' && <Crosshair className="w-6 h-6 text-amber-400" />}
                {unchargedSkillInfo.id === 'blackTortoise' && <Shield className="w-6 h-6 text-cyan-400 fill-current" />}
                {unchargedSkillInfo.id === 'vermilionBird' && <Flame className="w-6 h-6 text-rose-400 fill-current" />}
                {unchargedSkillInfo.id === 'yellowDragon' && <Mountain className="w-6 h-6 text-yellow-400" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{unchargedSkillInfo.title}</h3>
                <p className="text-xs text-slate-400">{unchargedSkillInfo.elementName}</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs leading-relaxed mb-5">
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5">必殺技威力</span>
                <span className="text-cyan-200 font-medium">{unchargedSkillInfo.description}</span>
              </div>
              <div className="border-t border-slate-800/80 pt-2">
                <span className="text-slate-400 block font-semibold mb-0.5">如何喚醒充能？</span>
                <span className="text-amber-300">
                  探索古遺跡迷宮並開啟寶箱，有機率獲得對應神獸靈力充能！充能完成後按鈕將綻放燦爛光芒，點擊即可確認發動。
                </span>
              </div>
            </div>

            <button
              onClick={() => setUnchargedSkillInfo(null)}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-colors cursor-pointer"
            >
              明白了
            </button>
          </div>
        </div>
      )}

      {/* Difficulty Select Modal (Change level at any time with 3 buttons) */}
      <DifficultySelectModal
        isOpen={showDifficultyModal}
        onClose={() => setShowDifficultyModal(false)}
        onSelectLevel={handleSelectLevelAndStart}
        currentLevel={currentLevel}
      />

      {/* Chest Reward Modal */}
      <ChestRewardModal reward={chestReward} onClose={() => setChestReward(null)} />

      {/* Victory / Defeat Modal */}
      {gameOverState && (
        <GameOverModal
          isVictory={gameOverState.isVictory}
          currentLevel={currentLevel}
          turns={turns}
          monstersKilled={monstersKilledCount}
          chestsOpened={openedChestsCount}
          totalChests={totalChestsCount}
          onRestart={(nextLvl) => initGame(nextLvl || currentLevel)}
          onReturnToMenu={() => setShowDifficultyModal(true)}
        />
      )}

      {/* Help / Game Rules Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-700 p-6 text-slate-200 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              《幻變古遺跡》探索指南
            </h3>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300 max-h-[60vh] overflow-y-auto pr-1">
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <span className="font-bold text-amber-300 block mb-1">一、純粹 Roguelike 核心</span>
                無飢餓度、無背包管理、無貨幣商店。專注於探索隨機地圖、誅殺怪物與守護 Boss、收集寶箱強化攻防、斬滅太古巨龍通關。
              </div>

              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <span className="font-bold text-cyan-300 block mb-1">二、嚴格回合制與飛劍御劍術</span>
                小雪行動一格，怪物才行動一次。飛劍普攻判定嚴格為<strong>正前方一格</strong>，若正前方無妖物則無法發動且<strong>不消耗回合</strong>。
              </div>

              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <span className="font-bold text-emerald-300 block mb-1">三、自然生命恢復</span>
                每次有效行動後，若當回合未受傷，且脫離戰鬥延遲 3 回合以上，每回合自然恢復 2 點生命。
              </div>

              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <span className="font-bold text-yellow-300 block mb-1">四、五行必殺技卡片確認</span>
                開箱獲得充能後按鈕亮起。點擊按鈕彈出確認卡片（遊戲暫停），點擊【發動】才扣除充能、消耗 1 回合；點擊【取消】保留充能，不消耗回合。
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-colors"
            >
              明白，重返探索
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
