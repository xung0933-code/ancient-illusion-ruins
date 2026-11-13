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
  Home,
  X,
} from 'lucide-react';
import avatarImgUrl from './assets/images/xiaoxue_avatar.png';

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
  const [showRestartConfirm, setShowRestartConfirm] = useState<boolean>(false);
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

  // Latest world state ref so the 60fps loop never restarts or blanks the canvas on movement
  const renderStateRef = useRef({
    ground,
    obstacles,
    playerPos,
    playerFacing,
    chests,
    finalChest,
    monsters,
    playerStats,
    mapWidth,
    mapHeight,
  });

  renderStateRef.current = {
    ground,
    obstacles,
    playerPos,
    playerFacing,
    chests,
    finalChest,
    monsters,
    playerStats,
    mapWidth,
    mapHeight,
  };

  // Helper to draw one full frame immediately
  const drawFrame = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    const state = renderStateRef.current;
    if (!canvas || !renderer || state.ground.length === 0) return;

    // Update camera position
    cameraRef.current.update(state.playerPos.x, state.playerPos.y, state.mapWidth, state.mapHeight);

    // Clear void
    renderer.clear(canvas.width, canvas.height);

    // Draw Ground Layer
    renderer.renderGround(state.ground as any, state.mapWidth, state.mapHeight);

    // Draw Obstacles Layer
    renderer.renderObstacles(state.obstacles, state.mapWidth, state.mapHeight, timestamp);

    // Draw Chests & Space-Time Vortex
    if (state.finalChest) {
      renderer.renderChests(state.chests, state.finalChest, timestamp);
    }

    // Draw Monsters & Bosses
    renderer.renderMonsters(state.monsters, timestamp);

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
    let fx = state.playerPos.x;
    let fy = state.playerPos.y;
    if (state.playerFacing === 'UP') fy -= 1;
    if (state.playerFacing === 'DOWN') fy += 1;
    if (state.playerFacing === 'LEFT') fx -= 1;
    if (state.playerFacing === 'RIGHT') fx += 1;
    const hasEnemyInFront = state.monsters.some(m => !m.isDead && m.x === fx && m.y === fy);

    // Draw Xiao Xue (Heroine with full 4-direction sprite & aim reticle & hurt flicker)
    renderer.renderPlayer(
      state.playerPos,
      state.playerFacing,
      state.playerStats,
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
  }, []);

  // Window resize & ResizeObserver (Only updates canvas dimensions when container size actually changes!)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      if (!canvasRef.current) return;
      const targetCanvas = canvasRef.current;
      const parent = targetCanvas.parentElement;
      const width = parent?.clientWidth || window.innerWidth;
      const height = parent?.clientHeight || window.innerHeight;
      if (width <= 0 || height <= 0) return;

      const sizeChanged = targetCanvas.width !== width || targetCanvas.height !== height;
      if (sizeChanged) {
        targetCanvas.width = width;
        targetCanvas.height = height;
      }

      cameraRef.current.updateViewport(width, height);

      if (!rendererRef.current) {
        const ctx = targetCanvas.getContext('2d');
        if (ctx) {
          rendererRef.current = new CanvasRenderer(ctx, cameraRef.current);
        }
      }

      if (sizeChanged) {
        drawFrame(performance.now());
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
      observer = new ResizeObserver(() => handleResize());
      observer.observe(canvas.parentElement);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer?.disconnect();
    };
  }, [drawFrame]);

  // Single Persistent 60 FPS Canvas Render Loop (Zero flicker / zero frame drops)
  useEffect(() => {
    let animId: number;

    const renderLoop = (timestamp: number) => {
      drawFrame(timestamp);
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [drawFrame]);

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

  // Check if an alive enemy stands directly in front of Xiao Xue
  let targetTileX = playerPos.x;
  let targetTileY = playerPos.y;
  if (playerFacing === 'UP') targetTileY -= 1;
  if (playerFacing === 'DOWN') targetTileY += 1;
  if (playerFacing === 'LEFT') targetTileX -= 1;
  if (playerFacing === 'RIGHT') targetTileX += 1;
  const hasTargetInFront = monsters.some(m => !m.isDead && m.x === targetTileX && m.y === targetTileY);

  return (
    <div className="w-screen h-dvh overflow-hidden bg-[#020617] bg-[radial-gradient(ellipse_at_top,_rgba(8,51,68,0.28),_#020617_72%)] flex items-center justify-center font-sans select-none text-slate-100">
      {/* 9:16 Portrait Mobile Game Shell (Full-screen on phones, crisp 9:16 portrait frame on desktop) */}
      <div className="relative w-full h-dvh sm:h-[min(96dvh,860px)] sm:w-auto sm:max-w-full sm:aspect-[9/16] sm:rounded-[26px] sm:border sm:border-slate-700/70 sm:shadow-[0_24px_80px_rgba(0,0,0,0.9)] overflow-hidden bg-slate-950 flex flex-col">
        {/* Top Portrait HUD */}
        <header className="relative z-20 shrink-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-lg">
          {/* Row 1: Portrait, Name, HP & Quick Actions */}
          <div className="flex items-center justify-between gap-2 px-2.5 py-1.5">
            {/* Left: Xiao Xue Portrait & HP */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-cyan-400/70 shadow-[0_0_10px_rgba(56,189,248,0.25)] bg-slate-800 shrink-0">
                <img
                  src={avatarImgUrl}
                  alt="小雪立繪"
                  className="w-full h-full object-cover object-top"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 text-xs leading-tight">
                  <span className="font-bold text-sm text-white shrink-0">小雪</span>
                  <span className="text-slate-500" aria-hidden="true">·</span>
                  <span className="text-[11px] text-cyan-300 font-medium truncate">
                    {levelConfig.name} {levelConfig.mapWidth}×{levelConfig.mapHeight}
                  </span>
                </div>
                {/* HP Bar */}
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                      style={{ width: `${Math.max(0, Math.min(100, (playerStats.hp / playerStats.maxHp) * 100))}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-emerald-400 tabular-nums">
                    {playerStats.hp}/{playerStats.maxHp}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleReturnToMenu}
                className="flex items-center gap-1 px-2 py-1.5 min-h-[36px] rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/70 text-[11px] font-medium transition-colors cursor-pointer"
                title="更換難度"
              >
                <Home className="w-3.5 h-3.5 text-cyan-400" />
                <span>難度</span>
              </button>

              <button
                onClick={toggleSound}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title={isMuted ? '開啟音效' : '靜音'}
                aria-label={isMuted ? '開啟音效' : '靜音'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              </button>

              <button
                onClick={() => setShowHelpModal(true)}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="操作與規則說明"
                aria-label="操作與規則說明"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowRestartConfirm(true)}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="重新生成當前地圖"
                aria-label="重新生成當前地圖"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Row 2: Always-Visible Mobile Stats Strip */}
          <div className="grid grid-cols-4 border-t border-slate-800/80 bg-slate-950/60 px-2 py-1 text-[11px]">
            <div className="flex items-center justify-center gap-1">
              <Sword className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="text-slate-400">攻</span>
              <span className="font-mono font-bold text-amber-300 tabular-nums">{effectiveStats.attack}</span>
              {playerStats.attackBonus > 0 && (
                <span className="text-[10px] text-amber-400/80 font-mono tabular-nums">+{playerStats.attackBonus}</span>
              )}
            </div>

            <div className="flex items-center justify-center gap-1 border-l border-slate-800/70">
              <Shield className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="text-slate-400">防</span>
              <span className="font-mono font-bold text-cyan-300 tabular-nums">{effectiveStats.defense}</span>
              {playerStats.defenseBonus > 0 && (
                <span className="text-[10px] text-cyan-400/80 font-mono tabular-nums">+{playerStats.defenseBonus}</span>
              )}
            </div>

            <div className="flex items-center justify-center gap-1 border-l border-slate-800/70">
              <Sparkles className="w-3 h-3 text-yellow-400 shrink-0" />
              <span className="text-slate-400">寶箱</span>
              <span className="font-mono font-bold text-yellow-300 tabular-nums">
                {openedChestsCount}/{totalChestsCount}
              </span>
            </div>

            <div className="flex items-center justify-center gap-1 border-l border-slate-800/70">
              <Compass className="w-3 h-3 text-indigo-400 shrink-0" />
              <span className="text-slate-400">回合</span>
              <span className="font-mono font-bold text-indigo-300 tabular-nums">{turns}</span>
            </div>
          </div>
        </header>

        {/* Main 9:16 Dungeon Canvas Viewport (Unobstructed) */}
        <div className="relative flex-1 min-h-0 w-full overflow-hidden bg-slate-950">
          <canvas ref={canvasRef} className="block w-full h-full touch-none" />

          {/* Screen Hurt Red Flash Vignette */}
          {screenFlashRed && (
            <div className="pointer-events-none absolute inset-0 z-30 bg-rose-600/35 border-[8px] border-rose-500 shadow-[inset_0_0_50px_rgba(225,29,72,0.8)] animate-pulse" />
          )}

          {/* Compact Mobile & Desktop Event Ticker (Top of Canvas) */}
          {logs.length > 0 && (
            <div className="pointer-events-none absolute top-2 left-2 right-2 z-10 flex flex-col gap-0.5 bg-slate-950/70 backdrop-blur-sm px-2.5 py-1.5 rounded-xl border border-slate-800/70 text-[11px] shadow-md">
              {logs.slice(0, 2).map((log, idx) => (
                <div
                  key={log.id}
                  className={`truncate ${idx === 1 ? 'opacity-65 text-[10px]' : ''} ${
                    log.type === 'danger'
                      ? 'text-rose-400'
                      : log.type === 'loot'
                      ? 'text-amber-300'
                      : log.type === 'spell'
                      ? 'text-cyan-300 font-medium'
                      : 'text-slate-200'
                  }`}
                >
                  {log.message}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Five Elements Sacred Beast Skill Bar (Always Visible in Thumb Reach) */}
        <section className="relative z-20 shrink-0 py-1.5 px-2 bg-slate-900/95 backdrop-blur-md border-t border-slate-800">
          <div className="grid grid-cols-5 gap-1.5 w-full">
            {/* 1. Wood: Azure Dragon (木・青龍) */}
            <button
              onClick={() => handleSkillButtonClick('azureDragon')}
              className={`relative px-1 py-1.5 min-h-[54px] rounded-xl border text-xs flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                spellsState.azureDragon.charged
                  ? 'bg-gradient-to-b from-emerald-600 to-emerald-950 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)] active:scale-95'
                  : 'bg-slate-900/90 hover:bg-slate-800/90 border-emerald-900/50 text-slate-300'
              }`}
              title="木・青龍 (點擊查看詳情)"
            >
              <div className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-400 whitespace-nowrap">
                <Heart className="w-3 h-3 fill-current shrink-0" />
                <span>青龍</span>
              </div>
              <span className="text-[9px] text-slate-300 whitespace-nowrap">回復全滿</span>
              <span
                className={`text-[9px] px-1 rounded font-mono whitespace-nowrap ${
                  spellsState.azureDragon.charged
                    ? 'bg-emerald-400 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {spellsState.azureDragon.charged ? '就緒' : '未充'}
              </span>
              {spellsState.azureDragon.charged && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              )}
            </button>

            {/* 2. Metal: White Tiger (金・白虎) */}
            <button
              onClick={() => handleSkillButtonClick('whiteTiger')}
              className={`relative px-1 py-1.5 min-h-[54px] rounded-xl border text-xs flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                spellsState.whiteTiger.charged
                  ? 'bg-gradient-to-b from-amber-600 to-amber-950 border-amber-300 text-white shadow-[0_0_12px_rgba(245,158,11,0.5)] active:scale-95'
                  : 'bg-slate-900/90 hover:bg-slate-800/90 border-amber-900/50 text-slate-300'
              }`}
              title="金・白虎 (點擊查看詳情)"
            >
              <div className="flex items-center gap-0.5 text-[11px] font-bold text-amber-400 whitespace-nowrap">
                <Crosshair className="w-3 h-3 shrink-0" />
                <span>白虎</span>
              </div>
              <span className="text-[9px] text-slate-300 whitespace-nowrap">狂攻+10</span>
              <span
                className={`text-[9px] px-1 rounded font-mono whitespace-nowrap ${
                  spellsState.whiteTiger.charged
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {spellsState.whiteTiger.charged ? '就緒' : '未充'}
              </span>
              {spellsState.whiteTiger.charged && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
              )}
            </button>

            {/* 3. Water: Black Tortoise (水・玄武) */}
            <button
              onClick={() => handleSkillButtonClick('blackTortoise')}
              className={`relative px-1 py-1.5 min-h-[54px] rounded-xl border text-xs flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                spellsState.blackTortoise.charged
                  ? 'bg-gradient-to-b from-cyan-600 to-cyan-950 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)] active:scale-95'
                  : 'bg-slate-900/90 hover:bg-slate-800/90 border-cyan-900/50 text-slate-300'
              }`}
              title="水・玄武 (點擊查看詳情)"
            >
              <div className="flex items-center gap-0.5 text-[11px] font-bold text-cyan-400 whitespace-nowrap">
                <Shield className="w-3 h-3 fill-current shrink-0" />
                <span>玄武</span>
              </div>
              <span className="text-[9px] text-slate-300 whitespace-nowrap">金剛+10</span>
              <span
                className={`text-[9px] px-1 rounded font-mono whitespace-nowrap ${
                  spellsState.blackTortoise.charged
                    ? 'bg-cyan-400 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {spellsState.blackTortoise.charged ? '就緒' : '未充'}
              </span>
              {spellsState.blackTortoise.charged && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
              )}
            </button>

            {/* 4. Fire: Vermilion Bird (火・朱雀) */}
            <button
              onClick={() => handleSkillButtonClick('vermilionBird')}
              className={`relative px-1 py-1.5 min-h-[54px] rounded-xl border text-xs flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                spellsState.vermilionBird.charged
                  ? 'bg-gradient-to-b from-rose-600 to-rose-950 border-rose-400 text-white shadow-[0_0_12px_rgba(244,63,94,0.5)] active:scale-95'
                  : 'bg-slate-900/90 hover:bg-slate-800/90 border-rose-900/50 text-slate-300'
              }`}
              title="火・朱雀 (點擊查看詳情)"
            >
              <div className="flex items-center gap-0.5 text-[11px] font-bold text-rose-400 whitespace-nowrap">
                <Flame className="w-3 h-3 fill-current shrink-0" />
                <span>朱雀</span>
              </div>
              <span className="text-[9px] text-slate-300 whitespace-nowrap">3×3爆破</span>
              <span
                className={`text-[9px] px-1 rounded font-mono whitespace-nowrap ${
                  spellsState.vermilionBird.charged
                    ? 'bg-rose-400 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {spellsState.vermilionBird.charged ? '就緒' : '未充'}
              </span>
              {spellsState.vermilionBird.charged && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-400 rounded-full animate-ping" />
              )}
            </button>

            {/* 5. Earth: Yellow Dragon (土・黃龍) */}
            <button
              onClick={() => handleSkillButtonClick('yellowDragon')}
              className={`relative px-1 py-1.5 min-h-[54px] rounded-xl border text-xs flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                spellsState.yellowDragon.charged
                  ? 'bg-gradient-to-b from-yellow-600 to-yellow-950 border-yellow-300 text-white shadow-[0_0_12px_rgba(234,179,8,0.5)] active:scale-95'
                  : 'bg-slate-900/90 hover:bg-slate-800/90 border-yellow-900/50 text-slate-300'
              }`}
              title="土・黃龍 (點擊查看詳情)"
            >
              <div className="flex items-center gap-0.5 text-[11px] font-bold text-yellow-400 whitespace-nowrap">
                <Mountain className="w-3 h-3 shrink-0" />
                <span>黃龍</span>
              </div>
              <span className="text-[9px] text-slate-300 whitespace-nowrap">5格貫穿</span>
              <span
                className={`text-[9px] px-1 rounded font-mono whitespace-nowrap ${
                  spellsState.yellowDragon.charged
                    ? 'bg-yellow-400 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {spellsState.yellowDragon.charged ? '就緒' : '未充'}
              </span>
              {spellsState.yellowDragon.charged && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
              )}
            </button>
          </div>
        </section>

        {/* Dedicated Portrait Thumb Control Deck (Always Visible, Zero Canvas Occlusion) */}
        <TouchControls
          onMove={handleMove}
          onAttack={handleAttack}
          onInteract={handleInteract}
          canInteract={interactive !== null}
          hasTargetInFront={hasTargetInFront}
          facing={playerFacing}
          interactLabel={
            interactive?.type === 'vortex'
              ? '踏入時空漩渦'
              : interactive?.type === 'grand_chest'
              ? '開啟終極寶箱'
              : '開啟寶箱'
          }
        />

        {/* Skill Confirmation Modal */}
        <SkillConfirmationModal
          spell={pendingSpellConfirm}
          onConfirm={handleConfirmSpellCast}
          onCancel={handleCancelSpellCast}
        />

        {/* Uncharged Skill Info Modal */}
        {unchargedSkillInfo && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-700 p-5 text-slate-200 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-300">五行神獸必殺技</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-amber-400 font-mono">靈力未充能</span>
                </div>
                <button
                  onClick={() => setUnchargedSkillInfo(null)}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  aria-label="關閉"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-300 shrink-0">
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

              <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs leading-relaxed mb-4">
                <div>
                  <span className="text-slate-400 block font-semibold mb-0.5">必殺技威力</span>
                  <span className="text-cyan-200 font-medium">{unchargedSkillInfo.description}</span>
                </div>
                <div className="border-t border-slate-800/80 pt-2">
                  <span className="text-slate-400 block font-semibold mb-0.5">如何喚醒充能？</span>
                  <span className="text-amber-300">
                    探索古遺跡迷宮並開啟寶箱，有機率獲得對應神獸靈力充能！充能完成後按鈕將亮起光芒，點擊即可確認發動。
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

        {/* Restart Confirmation Modal (Replaces window.confirm for clean mobile/iframe experience) */}
        {showRestartConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-xs bg-slate-900 rounded-2xl border border-slate-700 p-5 text-slate-200 shadow-2xl text-center">
              <div className="mx-auto mb-3 w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">重新生成地圖？</h3>
              <p className="text-xs text-slate-400 mb-5">
                確定要放棄目前進度，重新隨機生成【{levelConfig.name}】地圖嗎？
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setShowRestartConfirm(false)}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700 cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    setShowRestartConfirm(false);
                    initGame(currentLevel);
                  }}
                  className="py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold cursor-pointer"
                >
                  確定重來
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Difficulty Select Modal */}
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
          <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-700 p-5 text-slate-200 shadow-2xl max-h-[90%] flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-cyan-400" />
                  《幻變古遺跡》探索指南
                </h3>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  aria-label="關閉"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs leading-relaxed text-slate-300 overflow-y-auto pr-1 flex-1">
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-cyan-300 block mb-1">一、直覺觸控與按鍵操作</span>
                  使用下方十字方向鍵移動、右側【御劍】攻擊正前方一格敵人。面對寶箱或漩渦時點擊中央亮起按鈕即可互動。（電腦亦支援 WASD / 方向鍵、J / 空白鍵、E / Enter、數字鍵 1~5）
                </div>

                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-amber-300 block mb-1">二、純粹 Roguelike 核心</span>
                  無飢餓度、無背包管理、無貨幣商店。專注探索迷宮、誅殺怪物與守護 Boss、收集寶箱強化攻防、斬滅太古巨龍通關。
                </div>

                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-emerald-300 block mb-1">三、自然生命恢復</span>
                  每次有效行動後，若當回合未受傷且脫離戰鬥 3 回合以上，每回合自然恢復 2 點生命。
                </div>

                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-yellow-300 block mb-1">四、五行必殺技卡片確認</span>
                  開箱獲得充能後按鈕亮起。點擊彈出確認卡片（遊戲暫停），點擊【發動】才扣除充能與消耗 1 回合；點擊【取消】保留充能不扣回合。
                </div>
              </div>

              <button
                onClick={() => setShowHelpModal(false)}
                className="mt-4 w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-colors cursor-pointer shrink-0"
              >
                明白，重返探索
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
