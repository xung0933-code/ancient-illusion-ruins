/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CameraSystem } from './CameraSystem';
import {
  AnimationParticle,
  Chest,
  Direction,
  FloatingText,
  FlyingSwordAnimation,
  GroundTileType,
  Monster,
  ObstacleType,
  PlayerStats,
  Position,
  SpellVisualEffect,
} from './types';
import { spriteManager } from './SpriteManager';

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private camera: CameraSystem;

  constructor(ctx: CanvasRenderingContext2D, camera: CameraSystem) {
    this.ctx = ctx;
    this.camera = camera;
  }

  public clear(width: number, height: number) {
    this.ctx.fillStyle = '#0b0f19'; // Deep mysterious ancient ruins void
    this.ctx.fillRect(0, 0, width, height);
  }

  // Draw Ground Layer (Clear, bright, walkable ancient paved floor tiles)
  public renderGround(
    ground: GroundTileType[][],
    mapWidth: number,
    mapHeight: number
  ) {
    const ts = this.camera.tileSize;

    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        if (!this.camera.isTileVisible(x, y)) continue;

        const screen = this.camera.tileToScreen(x, y);
        const tileType = ground[y][x];

        // Draw base ground with clear, readable walkable tones
        switch (tileType) {
          case 'stone': {
            // Weathered ancient stone pavers
            const isAlt = (x + y) % 2 === 0;
            this.ctx.fillStyle = isAlt ? '#333e52' : '#39465c';
            this.ctx.fillRect(screen.x, screen.y, ts, ts);

            // Inner paver slab highlight & border
            this.ctx.fillStyle = isAlt ? '#3a475d' : '#404e67';
            this.ctx.fillRect(screen.x + 2, screen.y + 2, ts - 4, ts - 4);

            // Carved subtle floor rune lines
            this.ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(screen.x + 2, screen.y + 2, ts - 4, ts - 4);

            // Tiny ancient stone floor crack/detail
            if ((x * 7 + y * 13) % 5 === 0) {
              this.ctx.strokeStyle = 'rgba(30, 41, 59, 0.6)';
              this.ctx.beginPath();
              this.ctx.moveTo(screen.x + ts * 0.3, screen.y + ts * 0.25);
              this.ctx.lineTo(screen.x + ts * 0.5, screen.y + ts * 0.55);
              this.ctx.lineTo(screen.x + ts * 0.7, screen.y + ts * 0.6);
              this.ctx.stroke();
            }
            break;
          }
          case 'moss_stone': {
            // Ancient mossy stone paver
            const isAlt = (x + y) % 2 === 0;
            this.ctx.fillStyle = isAlt ? '#2d3d36' : '#33473f';
            this.ctx.fillRect(screen.x, screen.y, ts, ts);

            this.ctx.fillStyle = isAlt ? '#354b42' : '#3c544a';
            this.ctx.fillRect(screen.x + 2, screen.y + 2, ts - 4, ts - 4);

            this.ctx.strokeStyle = 'rgba(74, 222, 128, 0.25)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(screen.x + 2, screen.y + 2, ts - 4, ts - 4);

            // Soft green moss patches
            this.ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
            this.ctx.beginPath();
            this.ctx.arc(screen.x + ts * 0.35, screen.y + ts * 0.4, ts * 0.2, 0, Math.PI * 2);
            this.ctx.arc(screen.x + ts * 0.7, screen.y + ts * 0.65, ts * 0.15, 0, Math.PI * 2);
            this.ctx.fill();
            break;
          }
          case 'dirt': {
            // Compacted ancient courtyard earth with embedded stone cobbles
            const isAlt = (x + y) % 2 === 0;
            this.ctx.fillStyle = isAlt ? '#45382e' : '#4d3f34';
            this.ctx.fillRect(screen.x, screen.y, ts, ts);

            this.ctx.fillStyle = isAlt ? '#4f4136' : '#57493c';
            this.ctx.fillRect(screen.x + 2, screen.y + 2, ts - 4, ts - 4);

            // Cobble stone dots
            this.ctx.fillStyle = 'rgba(120, 113, 108, 0.4)';
            this.ctx.beginPath();
            this.ctx.arc(screen.x + ts * 0.3, screen.y + ts * 0.3, 3, 0, Math.PI * 2);
            this.ctx.arc(screen.x + ts * 0.65, screen.y + ts * 0.4, 2.5, 0, Math.PI * 2);
            this.ctx.arc(screen.x + ts * 0.45, screen.y + ts * 0.7, 3.5, 0, Math.PI * 2);
            this.ctx.fill();
            break;
          }
          case 'grass': {
            // Overgrown ancient ruins grass lawn
            const isAlt = (x + y) % 2 === 0;
            this.ctx.fillStyle = isAlt ? '#254432' : '#2c4d39';
            this.ctx.fillRect(screen.x, screen.y, ts, ts);

            this.ctx.fillStyle = isAlt ? '#2e543e' : '#355f46';
            this.ctx.fillRect(screen.x + 2, screen.y + 2, ts - 4, ts - 4);

            // Small wildflower and grass blade highlights
            this.ctx.fillStyle = 'rgba(187, 247, 208, 0.5)';
            this.ctx.fillRect(screen.x + ts * 0.25, screen.y + ts * 0.3, 2, 4);
            this.ctx.fillRect(screen.x + ts * 0.7, screen.y + ts * 0.6, 2, 4);
            break;
          }
        }

        // Distinct subtle dark floor grid line to make each step and walkability 100% crisp
        this.ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(screen.x, screen.y, ts, ts);
      }
    }
  }

  // Draw Obstacles Layer (Unmistakable 3D vertical physical barriers with distinct height and shadows)
  public renderObstacles(
    obstacles: (ObstacleType | null)[][],
    mapWidth: number,
    mapHeight: number,
    now: number
  ) {
    const ts = this.camera.tileSize;

    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const obs = obstacles[y][x];
        if (!obs || !this.camera.isTileVisible(x, y)) continue;

        const screen = this.camera.tileToScreen(x, y);
        const isBorder = x === 0 || y === 0 || x === mapWidth - 1 || y === mapHeight - 1;

        switch (obs) {
          case 'wall': {
            // 1. Dark Cast Shadow onto the ground
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            this.ctx.fillRect(screen.x, screen.y + ts * 0.7, ts, ts * 0.35);

            // 2. Vertical Wall Front Face (Stacked ancient dark granite megaliths)
            this.ctx.fillStyle = isBorder ? '#0f172a' : '#171e2e';
            this.ctx.fillRect(screen.x, screen.y + ts * 0.2, ts, ts * 0.8);

            // Masonry brick coursing lines on front face
            this.ctx.strokeStyle = '#283347';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            // Horizontal brick seam
            this.ctx.moveTo(screen.x, screen.y + ts * 0.55);
            this.ctx.lineTo(screen.x + ts, screen.y + ts * 0.55);
            // Vertical mortar joints
            this.ctx.moveTo(screen.x + ts * 0.5, screen.y + ts * 0.2);
            this.ctx.lineTo(screen.x + ts * 0.5, screen.y + ts * 0.55);
            this.ctx.moveTo(screen.x + ts * 0.25, screen.y + ts * 0.55);
            this.ctx.lineTo(screen.x + ts * 0.25, screen.y + ts);
            this.ctx.moveTo(screen.x + ts * 0.75, screen.y + ts * 0.55);
            this.ctx.lineTo(screen.x + ts * 0.75, screen.y + ts);
            this.ctx.stroke();

            // 3. Wall Top Cap (Bright elevated stone surface - 3D depth)
            const topGrad = this.ctx.createLinearGradient(screen.x, screen.y, screen.x, screen.y + ts * 0.25);
            topGrad.addColorStop(0, isBorder ? '#334155' : '#475569');
            topGrad.addColorStop(1, isBorder ? '#1e293b' : '#334155');
            this.ctx.fillStyle = topGrad;
            this.ctx.fillRect(screen.x, screen.y - ts * 0.08, ts, ts * 0.28);

            // Bright top ledge highlight
            this.ctx.strokeStyle = isBorder ? '#64748b' : '#94a3b8';
            this.ctx.lineWidth = 1.5;
            this.ctx.strokeRect(screen.x + 1, screen.y - ts * 0.08, ts - 2, ts * 0.28);

            // Impassable warning rune or ivy on wall
            if (!isBorder && (x * 3 + y * 7) % 4 === 0) {
              // Climbing ancient ivy
              this.ctx.fillStyle = '#166534';
              this.ctx.beginPath();
              this.ctx.arc(screen.x + ts * 0.3, screen.y + ts * 0.7, 4, 0, Math.PI * 2);
              this.ctx.arc(screen.x + ts * 0.4, screen.y + ts * 0.5, 3.5, 0, Math.PI * 2);
              this.ctx.arc(screen.x + ts * 0.25, screen.y + ts * 0.4, 3, 0, Math.PI * 2);
              this.ctx.fill();
            }

            if (isBorder) {
              // Outer boundary seal rune
              this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
              this.ctx.lineWidth = 1;
              this.ctx.beginPath();
              this.ctx.moveTo(screen.x, screen.y);
              this.ctx.lineTo(screen.x + ts, screen.y + ts * 0.2);
              this.ctx.stroke();
            }
            break;
          }
          case 'ruins_pillar': {
            const cx = screen.x + ts / 2;
            const cy = screen.y + ts / 2;

            // 1. Broad Ground Shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.beginPath();
            this.ctx.ellipse(cx + ts * 0.1, cy + ts * 0.38, ts * 0.4, ts * 0.16, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // 2. Pillar Base Pedestal
            this.ctx.fillStyle = '#1e293b';
            this.ctx.beginPath();
            this.ctx.roundRect(cx - ts * 0.32, cy + ts * 0.2, ts * 0.64, ts * 0.2, 3);
            this.ctx.fill();

            // 3. Tall Cylindrical Column (Rises up above tile)
            const shaftGrad = this.ctx.createLinearGradient(cx - ts * 0.25, cy, cx + ts * 0.25, cy);
            shaftGrad.addColorStop(0, '#1e293b');
            shaftGrad.addColorStop(0.3, '#475569');
            shaftGrad.addColorStop(0.7, '#64748b');
            shaftGrad.addColorStop(1, '#0f172a');
            this.ctx.fillStyle = shaftGrad;
            this.ctx.fillRect(cx - ts * 0.25, screen.y - ts * 0.15, ts * 0.5, ts * 0.85);

            // Vertical fluting lines on column
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(cx - ts * 0.1, screen.y - ts * 0.15);
            this.ctx.lineTo(cx - ts * 0.1, cy + ts * 0.2);
            this.ctx.moveTo(cx + ts * 0.1, screen.y - ts * 0.15);
            this.ctx.lineTo(cx + ts * 0.1, cy + ts * 0.2);
            this.ctx.stroke();

            // 4. Broken Capital on Top
            this.ctx.fillStyle = '#94a3b8';
            this.ctx.beginPath();
            this.ctx.roundRect(cx - ts * 0.3, screen.y - ts * 0.22, ts * 0.6, ts * 0.12, 3);
            this.ctx.fill();

            // Glowing azure rune ring
            const pulse = (Math.sin(now * 0.004 + x + y) + 1) * 0.5;
            this.ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 + pulse * 0.5})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.ellipse(cx, cy - ts * 0.05, ts * 0.24, ts * 0.07, 0, 0, Math.PI * 2);
            this.ctx.stroke();
            break;
          }
          case 'ancient_tree': {
            const cx = screen.x + ts / 2;
            const cy = screen.y + ts / 2;

            // 1. Sprawling Ground Shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.beginPath();
            this.ctx.ellipse(cx, cy + ts * 0.38, ts * 0.45, ts * 0.2, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // 2. Tree Roots & Gnarled Trunk
            this.ctx.fillStyle = '#3e2723';
            this.ctx.beginPath();
            // Roots spreading
            this.ctx.moveTo(cx - ts * 0.3, cy + ts * 0.4);
            this.ctx.lineTo(cx - ts * 0.15, cy + ts * 0.1);
            this.ctx.lineTo(cx + ts * 0.15, cy + ts * 0.1);
            this.ctx.lineTo(cx + ts * 0.3, cy + ts * 0.4);
            this.ctx.closePath();
            this.ctx.fill();

            // Main trunk
            this.ctx.fillStyle = '#4e342e';
            this.ctx.fillRect(cx - ts * 0.15, cy - ts * 0.1, ts * 0.3, ts * 0.35);

            // 3. Dense 3D Spirit Canopy (Extends upward)
            // Back layer (dark)
            this.ctx.fillStyle = '#064e3b';
            this.ctx.beginPath();
            this.ctx.arc(cx, cy - ts * 0.2, ts * 0.45, 0, Math.PI * 2);
            this.ctx.fill();

            // Middle layer
            this.ctx.fillStyle = '#047857';
            this.ctx.beginPath();
            this.ctx.arc(cx - ts * 0.1, cy - ts * 0.32, ts * 0.32, 0, Math.PI * 2);
            this.ctx.arc(cx + ts * 0.15, cy - ts * 0.28, ts * 0.3, 0, Math.PI * 2);
            this.ctx.fill();

            // Top highlight layer
            this.ctx.fillStyle = '#10b981';
            this.ctx.beginPath();
            this.ctx.arc(cx, cy - ts * 0.4, ts * 0.25, 0, Math.PI * 2);
            this.ctx.fill();

            // Spirit blossom glowing particles
            this.ctx.fillStyle = 'rgba(253, 230, 138, 0.85)';
            this.ctx.beginPath();
            this.ctx.arc(cx + ts * 0.12, cy - ts * 0.25, 2.5, 0, Math.PI * 2);
            this.ctx.arc(cx - ts * 0.2, cy - ts * 0.35, 2, 0, Math.PI * 2);
            this.ctx.arc(cx + ts * 0.05, cy - ts * 0.48, 2, 0, Math.PI * 2);
            this.ctx.fill();
            break;
          }
          case 'rock': {
            const cx = screen.x + ts / 2;
            const cy = screen.y + ts / 2;

            // 1. Angular Ground Shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.beginPath();
            this.ctx.ellipse(cx + 4, cy + ts * 0.36, ts * 0.4, ts * 0.18, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // 2. Jagged Boulder Facets (High-contrast 3D stone faces)
            // Dark shadow side
            this.ctx.fillStyle = '#1e293b';
            this.ctx.beginPath();
            this.ctx.moveTo(cx - ts * 0.38, cy + ts * 0.32);
            this.ctx.lineTo(cx - ts * 0.1, cy - ts * 0.28);
            this.ctx.lineTo(cx, cy + ts * 0.32);
            this.ctx.closePath();
            this.ctx.fill();

            // Main midtone face
            this.ctx.fillStyle = '#334155';
            this.ctx.beginPath();
            this.ctx.moveTo(cx - ts * 0.1, cy - ts * 0.28);
            this.ctx.lineTo(cx + ts * 0.25, cy - ts * 0.15);
            this.ctx.lineTo(cx + ts * 0.35, cy + ts * 0.32);
            this.ctx.lineTo(cx, cy + ts * 0.32);
            this.ctx.closePath();
            this.ctx.fill();

            // Top highlight ridge
            this.ctx.fillStyle = '#64748b';
            this.ctx.beginPath();
            this.ctx.moveTo(cx - ts * 0.1, cy - ts * 0.28);
            this.ctx.lineTo(cx + ts * 0.15, cy - ts * 0.25);
            this.ctx.lineTo(cx + ts * 0.25, cy - ts * 0.15);
            this.ctx.closePath();
            this.ctx.fill();

            // Sharp edge highlights
            this.ctx.strokeStyle = '#94a3b8';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(cx - ts * 0.1, cy - ts * 0.28);
            this.ctx.lineTo(cx, cy + ts * 0.32);
            this.ctx.lineTo(cx + ts * 0.25, cy - ts * 0.15);
            this.ctx.stroke();
            break;
          }
        }
      }
    }
  }

  // Draw Normal & Grand Chests
  public renderChests(chests: Chest[], grandChest: Chest, now: number) {
    const ts = this.camera.tileSize;
    const allChests = [...chests, grandChest];

    for (const chest of allChests) {
      if (!this.camera.isTileVisible(chest.x, chest.y)) continue;
      const screen = this.camera.tileToScreen(chest.x, chest.y);
      const cx = screen.x + ts / 2;
      const cy = screen.y + ts / 2;

      // Ground shadow
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      this.ctx.beginPath();
      this.ctx.ellipse(cx, cy + ts * 0.35, ts * 0.38, ts * 0.15, 0, 0, Math.PI * 2);
      this.ctx.fill();

      if (chest.isGrand) {
        // Grand Final Chest
        this.renderGrandChest(screen.x, screen.y, ts, chest, now);
      } else {
        // Normal Chest
        this.renderNormalChest(screen.x, screen.y, ts, chest, now);
      }
    }
  }

  private renderNormalChest(sx: number, sy: number, ts: number, chest: Chest, now: number) {
    const cx = sx + ts / 2;
    const cy = sy + ts / 2;

    if (chest.isOpened) {
      // Opened chest
      this.ctx.fillStyle = '#78350f';
      this.ctx.fillRect(cx - ts * 0.35, cy, ts * 0.7, ts * 0.35);

      // Open lid angled back
      this.ctx.fillStyle = '#b45309';
      this.ctx.fillRect(cx - ts * 0.38, cy - ts * 0.25, ts * 0.76, ts * 0.2);

      // Golden inner glow
      this.ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
      this.ctx.beginPath();
      this.ctx.arc(cx, cy + ts * 0.05, ts * 0.25, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      // Closed chest
      const baseGrad = this.ctx.createLinearGradient(cx - ts * 0.35, sy, cx + ts * 0.35, sy);
      baseGrad.addColorStop(0, '#78350f');
      baseGrad.addColorStop(0.5, '#b45309');
      baseGrad.addColorStop(1, '#78350f');

      this.ctx.fillStyle = baseGrad;
      this.ctx.fillRect(cx - ts * 0.35, cy - ts * 0.1, ts * 0.7, ts * 0.45);

      // Chest lid
      this.ctx.fillStyle = '#d97706';
      this.ctx.beginPath();
      this.ctx.roundRect(cx - ts * 0.37, cy - ts * 0.28, ts * 0.74, ts * 0.24, 4);
      this.ctx.fill();

      // Gold bands
      this.ctx.fillStyle = '#f59e0b';
      this.ctx.fillRect(cx - ts * 0.25, cy - ts * 0.28, ts * 0.08, ts * 0.6);
      this.ctx.fillRect(cx + ts * 0.17, cy - ts * 0.28, ts * 0.08, ts * 0.6);

      // Lock status
      if (chest.isLocked) {
        // Red glowing seal chain
        const pulse = (Math.sin(now * 0.005) + 1) * 0.5;
        this.ctx.strokeStyle = `rgba(239, 68, 68, ${0.6 + pulse * 0.4})`;
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, ts * 0.22, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        // Unlocked golden keyhole
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Sparkle indicators that chest is ready to open!
        const sparkPhase = (now * 0.004) % (Math.PI * 2);
        this.ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(cx + Math.cos(sparkPhase) * (ts * 0.3), cy + Math.sin(sparkPhase) * (ts * 0.2), 2.5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  private renderGrandChest(sx: number, sy: number, ts: number, chest: Chest, now: number) {
    const cx = sx + ts / 2;
    const cy = sy + ts / 2;

    // Grand mystic circle under chest
    const pulse = (Math.sin(now * 0.004) + 1) * 0.5;
    this.ctx.strokeStyle = chest.isLocked
      ? `rgba(168, 85, 247, ${0.5 + pulse * 0.4})`
      : `rgba(234, 179, 8, ${0.7 + pulse * 0.3})`;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy + ts * 0.1, ts * 0.55, 0, Math.PI * 2);
    this.ctx.stroke();

    if (chest.isOpened) {
      // Render Space-Time Vortex emerging from the grand chest!
      this.renderSpaceTimeVortex(cx, cy, ts, now);
    } else {
      // Grand Chest Body (Ornate ancient jade & gold)
      const grad = this.ctx.createLinearGradient(cx - ts * 0.45, sy, cx + ts * 0.45, sy);
      grad.addColorStop(0, '#064e3b');
      grad.addColorStop(0.5, '#047857');
      grad.addColorStop(1, '#064e3b');

      this.ctx.fillStyle = grad;
      this.ctx.fillRect(cx - ts * 0.42, cy - ts * 0.15, ts * 0.84, ts * 0.52);

      // Grand lid with celestial gold rim
      this.ctx.fillStyle = '#059669';
      this.ctx.beginPath();
      this.ctx.roundRect(cx - ts * 0.45, cy - ts * 0.38, ts * 0.9, ts * 0.3, 6);
      this.ctx.fill();

      this.ctx.strokeStyle = '#f59e0b';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Dragon seal crest on chest
      this.ctx.fillStyle = chest.isLocked ? '#a855f7' : '#fbbf24';
      this.ctx.beginPath();
      this.ctx.arc(cx, cy - ts * 0.05, 7, 0, Math.PI * 2);
      this.ctx.fill();

      // Runic seal barrier if locked
      if (chest.isLocked) {
        this.ctx.strokeStyle = 'rgba(192, 132, 252, 0.8)';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, ts * 0.48, ts * 0.35, 0, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }
  }

  // Render Space-Time Vortex (時空漩渦)
  public renderSpaceTimeVortex(cx: number, cy: number, ts: number, now: number) {
    const angle = now * 0.003;
    const radius = ts * 0.65;

    // Outer cosmic glow
    const grad = this.ctx.createRadialGradient(cx, cy, 2, cx, cy, radius * 1.2);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(0.2, 'rgba(56, 189, 248, 0.8)');
    grad.addColorStop(0.5, 'rgba(147, 51, 234, 0.7)');
    grad.addColorStop(0.8, 'rgba(236, 72, 153, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius * 1.2, 0, Math.PI * 2);
    this.ctx.fill();

    // Swirling spiral arms
    for (let arm = 0; arm < 4; arm++) {
      const armAngle = angle + (arm * Math.PI) / 2;
      this.ctx.strokeStyle = arm % 2 === 0 ? 'rgba(56, 189, 248, 0.9)' : 'rgba(234, 179, 8, 0.9)';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      for (let r = 5; r <= radius; r += 4) {
        const theta = armAngle + r * 0.08;
        const px = cx + Math.cos(theta) * r;
        const py = cy + Math.sin(theta) * r;
        if (r === 5) this.ctx.moveTo(px, py);
        else this.ctx.lineTo(px, py);
      }
      this.ctx.stroke();
    }

    // Portal core
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    this.ctx.fill();
  }

  // Render Monsters & Bosses
  public renderMonsters(monsters: Monster[], now: number) {
    const ts = this.camera.tileSize;

    for (const m of monsters) {
      if (m.isDead || !this.camera.isTileVisible(m.x, m.y)) continue;
      const screen = this.camera.tileToScreen(m.x, m.y);
      const cx = screen.x + ts / 2;
      const cy = screen.y + ts / 2;

      // Ground shadow
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.beginPath();
      this.ctx.ellipse(cx, cy + ts * 0.35, ts * (m.type === 'finalBoss' ? 0.48 : 0.32), ts * 0.16, 0, 0, Math.PI * 2);
      this.ctx.fill();

      if (m.type === 'normal') {
        this.renderNormalMonster(cx, cy, ts, m, now);
      } else if (m.type === 'chestBoss') {
        this.renderChestBoss(cx, cy, ts, m, now);
      } else if (m.type === 'finalBoss') {
        this.renderFinalBoss(cx, cy, ts, m, now);
      }

      // Overhead HP Bar
      this.renderEntityHpBar(cx, screen.y - 6, ts * 0.8, m.hp, m.maxHp, m.type);
    }
  }

  private renderNormalMonster(cx: number, cy: number, ts: number, m: Monster, now: number) {
    const bob = Math.sin(now * 0.005 + m.x) * 3;

    // Shadow Wraith body
    this.ctx.fillStyle = '#4c1d95'; // dark purple
    this.ctx.beginPath();
    this.ctx.arc(cx, cy - ts * 0.05 + bob, ts * 0.28, 0, Math.PI * 2);
    this.ctx.fill();

    // Ghostly wisps
    this.ctx.fillStyle = '#6d28d9';
    this.ctx.beginPath();
    this.ctx.moveTo(cx - ts * 0.25, cy + bob);
    this.ctx.quadraticCurveTo(cx - ts * 0.3, cy + ts * 0.3 + bob, cx, cy + ts * 0.3 + bob);
    this.ctx.quadraticCurveTo(cx + ts * 0.3, cy + ts * 0.3 + bob, cx + ts * 0.25, cy + bob);
    this.ctx.fill();

    // Glowing eyes
    this.ctx.fillStyle = '#f43f5e';
    const eyeOffset = m.facing === 'LEFT' ? -4 : m.facing === 'RIGHT' ? 4 : 0;
    this.ctx.beginPath();
    this.ctx.arc(cx - 5 + eyeOffset, cy - ts * 0.08 + bob, 2.5, 0, Math.PI * 2);
    this.ctx.arc(cx + 5 + eyeOffset, cy - ts * 0.08 + bob, 2.5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private renderChestBoss(cx: number, cy: number, ts: number, m: Monster, now: number) {
    const bob = Math.sin(now * 0.004 + m.y) * 2;

    // Imposing ancient stone guardian
    this.ctx.fillStyle = '#7f1d1d'; // Crimson guardian armor
    this.ctx.beginPath();
    this.ctx.roundRect(cx - ts * 0.32, cy - ts * 0.2 + bob, ts * 0.64, ts * 0.5, 6);
    this.ctx.fill();

    // Shoulder plates
    this.ctx.fillStyle = '#b91c1c';
    this.ctx.fillRect(cx - ts * 0.42, cy - ts * 0.2 + bob, ts * 0.18, ts * 0.25);
    this.ctx.fillRect(cx + ts * 0.24, cy - ts * 0.2 + bob, ts * 0.18, ts * 0.25);

    // Horned helmet
    this.ctx.fillStyle = '#991b1b';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy - ts * 0.22 + bob, ts * 0.2, 0, Math.PI * 2);
    this.ctx.fill();

    // Horns
    this.ctx.strokeStyle = '#f59e0b';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(cx - ts * 0.15, cy - ts * 0.25 + bob);
    this.ctx.lineTo(cx - ts * 0.32, cy - ts * 0.42 + bob);
    this.ctx.moveTo(cx + ts * 0.15, cy - ts * 0.25 + bob);
    this.ctx.lineTo(cx + ts * 0.32, cy - ts * 0.42 + bob);
    this.ctx.stroke();

    // Molten visor eyes
    this.ctx.fillStyle = '#fef08a';
    this.ctx.fillRect(cx - 7, cy - ts * 0.24 + bob, 14, 4);

    // Guardian aura ring
    this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy + ts * 0.05 + bob, ts * 0.45, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  private renderFinalBoss(cx: number, cy: number, ts: number, m: Monster, now: number) {
    const bob = Math.sin(now * 0.003) * 4;

    // Celestial Chaos Dragon
    // Dragon aura
    const pulse = (Math.sin(now * 0.004) + 1) * 0.5;
    const auraGrad = this.ctx.createRadialGradient(cx, cy + bob, ts * 0.2, cx, cy + bob, ts * 0.7);
    auraGrad.addColorStop(0, 'rgba(147, 51, 234, 0.4)');
    auraGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    this.ctx.fillStyle = auraGrad;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy + bob, ts * 0.7, 0, Math.PI * 2);
    this.ctx.fill();

    // Wings
    const wingFlap = Math.sin(now * 0.006) * 0.15;
    this.ctx.fillStyle = '#4a044e';
    // Left wing
    this.ctx.beginPath();
    this.ctx.moveTo(cx - ts * 0.2, cy - ts * 0.1 + bob);
    this.ctx.lineTo(cx - ts * 0.65, cy - ts * 0.4 + bob + wingFlap * ts);
    this.ctx.lineTo(cx - ts * 0.45, cy + ts * 0.1 + bob);
    this.ctx.fill();
    // Right wing
    this.ctx.beginPath();
    this.ctx.moveTo(cx + ts * 0.2, cy - ts * 0.1 + bob);
    this.ctx.lineTo(cx + ts * 0.65, cy - ts * 0.4 + bob + wingFlap * ts);
    this.ctx.lineTo(cx + ts * 0.45, cy + ts * 0.1 + bob);
    this.ctx.fill();

    // Dragon scale body
    this.ctx.fillStyle = '#581c87';
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy + bob, ts * 0.38, ts * 0.32, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Dragon Head
    this.ctx.fillStyle = '#6b21a8';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy - ts * 0.22 + bob, ts * 0.24, 0, Math.PI * 2);
    this.ctx.fill();

    // Golden Dragon Horns
    this.ctx.strokeStyle = '#eab308';
    this.ctx.lineWidth = 3.5;
    this.ctx.beginPath();
    this.ctx.moveTo(cx - ts * 0.1, cy - ts * 0.32 + bob);
    this.ctx.quadraticCurveTo(cx - ts * 0.35, cy - ts * 0.55 + bob, cx - ts * 0.25, cy - ts * 0.65 + bob);
    this.ctx.moveTo(cx + ts * 0.1, cy - ts * 0.32 + bob);
    this.ctx.quadraticCurveTo(cx + ts * 0.35, cy - ts * 0.55 + bob, cx + ts * 0.25, cy - ts * 0.65 + bob);
    this.ctx.stroke();

    // Dragon glowing eyes
    this.ctx.fillStyle = '#facc15';
    this.ctx.beginPath();
    this.ctx.arc(cx - 7, cy - ts * 0.22 + bob, 3.5, 0, Math.PI * 2);
    this.ctx.arc(cx + 7, cy - ts * 0.22 + bob, 3.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Name badge indicator
    this.ctx.fillStyle = 'rgba(234, 179, 8, 0.9)';
    this.ctx.font = 'bold 11px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('👑 太古終極 BOSS', cx, cy - ts * 0.48 + bob);
  }

  private renderEntityHpBar(cx: number, sy: number, barWidth: number, hp: number, maxHp: number, type: string) {
    const isPlayer = type === 'player';
    const barHeight = type === 'finalBoss' ? 6 : (isPlayer ? 5 : 4);
    const ratio = Math.max(0, Math.min(1, hp / maxHp));

    // Background
    this.ctx.fillStyle = isPlayer ? 'rgba(15, 23, 42, 0.88)' : 'rgba(0, 0, 0, 0.65)';
    this.ctx.fillRect(cx - barWidth / 2, sy, barWidth, barHeight);

    // HP Fill
    let fill = '#10b981'; // Green
    if (ratio < 0.3) fill = '#ef4444'; // Red
    else if (ratio < 0.6) fill = '#f59e0b'; // Amber

    this.ctx.fillStyle = fill;
    this.ctx.fillRect(cx - barWidth / 2, sy, barWidth * ratio, barHeight);

    // Border
    this.ctx.strokeStyle = isPlayer ? 'rgba(56, 189, 248, 0.85)' : 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(cx - barWidth / 2, sy, barWidth, barHeight);
  }

  // Render Xiao Xue (Heroine with twin flying swords and flowing robe)
  // Render Xiao Xue (Heroine with full 4-directional appearance: UP back, DOWN front, LEFT profile, RIGHT profile)
  public renderPlayer(
    playerPos: Position,
    facing: Direction,
    playerStats: PlayerStats,
    now: number,
    flyingSwords: FlyingSwordAnimation[],
    hasTargetInFront: boolean = false,
    lastHurtTimestamp: number = 0
  ) {
    const ts = this.camera.tileSize;
    const screen = this.camera.tileToScreen(playerPos.x, playerPos.y);
    const cx = screen.x + ts / 2;
    const cy = screen.y + ts / 2;
    const idleBob = Math.sin(now * 0.005) * 2;

    // 0. Directional Front-Tile Reticle (Clear indicator of facing and strike range)
    let frontX = playerPos.x;
    let frontY = playerPos.y;
    if (facing === 'UP') frontY -= 1;
    if (facing === 'DOWN') frontY += 1;
    if (facing === 'LEFT') frontX -= 1;
    if (facing === 'RIGHT') frontX += 1;

    const frontScreen = this.camera.tileToScreen(frontX, frontY);
    const cornerSize = 7;
    const pulse = (Math.sin(now * 0.008) + 1) * 0.5;

    this.ctx.save();
    this.ctx.lineWidth = hasTargetInFront ? 2 : 1.5;
    this.ctx.strokeStyle = hasTargetInFront
      ? `rgba(239, 68, 68, ${0.7 + pulse * 0.3})`
      : 'rgba(56, 189, 248, 0.4)';

    // Four corner brackets on the front tile
    this.ctx.beginPath();
    // Top-left
    this.ctx.moveTo(frontScreen.x + cornerSize, frontScreen.y + 1);
    this.ctx.lineTo(frontScreen.x + 1, frontScreen.y + 1);
    this.ctx.lineTo(frontScreen.x + 1, frontScreen.y + cornerSize);
    // Top-right
    this.ctx.moveTo(frontScreen.x + ts - cornerSize, frontScreen.y + 1);
    this.ctx.lineTo(frontScreen.x + ts - 1, frontScreen.y + 1);
    this.ctx.lineTo(frontScreen.x + ts - 1, frontScreen.y + cornerSize);
    // Bottom-left
    this.ctx.moveTo(frontScreen.x + cornerSize, frontScreen.y + ts - 1);
    this.ctx.lineTo(frontScreen.x + 1, frontScreen.y + ts - 1);
    this.ctx.lineTo(frontScreen.x + 1, frontScreen.y + ts - cornerSize);
    // Bottom-right
    this.ctx.moveTo(frontScreen.x + ts - cornerSize, frontScreen.y + ts - 1);
    this.ctx.lineTo(frontScreen.x + ts - 1, frontScreen.y + ts - 1);
    this.ctx.lineTo(frontScreen.x + ts - 1, frontScreen.y + ts - cornerSize);
    this.ctx.stroke();

    // Small sword aim pip in center if enemy is targeted
    if (hasTargetInFront) {
      this.ctx.fillStyle = '#ef4444';
      this.ctx.beginPath();
      this.ctx.arc(frontScreen.x + ts / 2, frontScreen.y + ts / 2, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();

    // 1. Ground Shadow under Xiao Xue
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy + ts * 0.38, ts * 0.32, ts * 0.14, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // 2. Twin Hovering Flying Swords (Rendered behind or beside depending on facing)
    const activeSwordAnim = flyingSwords.length > 0;
    if (!activeSwordAnim) {
      this.renderHoveringSwords(cx, cy, ts, facing, now, idleBob);
    }

    // 3. Hurt State Animation: Invulnerability flicker & red flash when damaged
    const isHurtFlicker = now - lastHurtTimestamp < 600;
    let hurtAlpha = 1.0;
    if (isHurtFlicker) {
      // Rapid flicker between 0.3 and 1.0 every 75ms
      const step = Math.floor((now - lastHurtTimestamp) / 75);
      hurtAlpha = step % 2 === 0 ? 0.35 : 1.0;
    }

    this.ctx.save();
    this.ctx.globalAlpha = hurtAlpha;
    if (isHurtFlicker) {
      this.ctx.shadowColor = 'rgba(239, 68, 68, 0.9)';
      this.ctx.shadowBlur = 12;
    }

    // 4. Render 4-Directional Xiao Xue Character Sprite (Front, Back, and Mirrored Side)
    const spriteDrawn = spriteManager.draw(this.ctx, cx, cy, ts, facing, idleBob);
    if (!spriteDrawn) {
      // Graceful fallback while sprites finish decoding
      switch (facing) {
        case 'UP':
          this.renderXiaoXueBack(cx, cy, ts, idleBob);
          break;
        case 'DOWN':
          this.renderXiaoXueFront(cx, cy, ts, idleBob);
          break;
        case 'LEFT':
          this.renderXiaoXueProfile(cx, cy, ts, idleBob, 'LEFT');
          break;
        case 'RIGHT':
          this.renderXiaoXueProfile(cx, cy, ts, idleBob, 'RIGHT');
          break;
      }
    }
    this.ctx.restore();

    // 5. Active Buff Auras
    const hasAtkBuff = playerStats.buffs.some(b => b.type === 'attack');
    const hasDefBuff = playerStats.buffs.some(b => b.type === 'defense');

    if (hasAtkBuff) {
      // Golden tiger aura
      this.ctx.strokeStyle = 'rgba(250, 204, 21, 0.75)';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy + idleBob, ts * 0.44, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    if (hasDefBuff) {
      // Hexagonal Tortoise shield aura
      this.renderHexagonShield(cx, cy + idleBob, ts * 0.46, now);
    }

    // 5. Xiao Xue Foot-Level HP Bar (Positioned cleanly below her feet to keep her body completely visible)
    const playerHpY = cy + ts * 0.42;
    this.renderEntityHpBar(cx, playerHpY, ts * 0.75, playerStats.hp, playerStats.maxHp, 'player');
  }

  // --- Xiao Xue Facing UP (Back View: walking away, showing full flowing hair & back robe) ---
  private renderXiaoXueBack(cx: number, cy: number, ts: number, idleBob: number) {
    // Lower silk skirt (flowing down)
    const hemGrad = this.ctx.createLinearGradient(cx - ts * 0.25, cy, cx + ts * 0.25, cy + ts * 0.4);
    hemGrad.addColorStop(0, '#f8fafc');
    hemGrad.addColorStop(0.6, '#e0f2fe');
    hemGrad.addColorStop(1, '#7dd3fc');

    this.ctx.fillStyle = hemGrad;
    this.ctx.beginPath();
    this.ctx.moveTo(cx - ts * 0.14, cy - ts * 0.05 + idleBob);
    this.ctx.lineTo(cx - ts * 0.3, cy + ts * 0.36 + idleBob);
    this.ctx.lineTo(cx + ts * 0.3, cy + ts * 0.36 + idleBob);
    this.ctx.lineTo(cx + ts * 0.14, cy - ts * 0.05 + idleBob);
    this.ctx.closePath();
    this.ctx.fill();

    // Upper robe back & azure shoulder capelet
    this.ctx.fillStyle = '#f1f5f9';
    this.ctx.fillRect(cx - ts * 0.16, cy - ts * 0.22 + idleBob, ts * 0.32, ts * 0.24);

    this.ctx.fillStyle = '#0284c7'; // Azure shoulder capelet on back
    this.ctx.beginPath();
    this.ctx.moveTo(cx - ts * 0.18, cy - ts * 0.22 + idleBob);
    this.ctx.lineTo(cx, cy - ts * 0.08 + idleBob);
    this.ctx.lineTo(cx + ts * 0.18, cy - ts * 0.22 + idleBob);
    this.ctx.lineTo(cx + ts * 0.15, cy - ts * 0.02 + idleBob);
    this.ctx.lineTo(cx - ts * 0.15, cy - ts * 0.02 + idleBob);
    this.ctx.closePath();
    this.ctx.fill();

    // Back waist sash & long streaming ribbons
    this.ctx.fillStyle = '#0369a1';
    this.ctx.fillRect(cx - ts * 0.12, cy - ts * 0.02 + idleBob, ts * 0.24, 4);

    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(cx - 3, cy + 2 + idleBob);
    this.ctx.lineTo(cx - 5, cy + ts * 0.35 + idleBob);
    this.ctx.moveTo(cx + 3, cy + 2 + idleBob);
    this.ctx.lineTo(cx + 5, cy + ts * 0.35 + idleBob);
    this.ctx.stroke();

    // Long luscious black hair cascading down the entire back
    this.ctx.fillStyle = '#090d16'; // Deep jet black
    this.ctx.beginPath();
    this.ctx.moveTo(cx - ts * 0.12, cy - ts * 0.32 + idleBob);
    this.ctx.lineTo(cx - ts * 0.1, cy + ts * 0.15 + idleBob);
    this.ctx.lineTo(cx, cy + ts * 0.22 + idleBob);
    this.ctx.lineTo(cx + ts * 0.1, cy + ts * 0.15 + idleBob);
    this.ctx.lineTo(cx + ts * 0.12, cy - ts * 0.32 + idleBob);
    this.ctx.closePath();
    this.ctx.fill();

    // High hair bun & green jade hairpin
    this.ctx.beginPath();
    this.ctx.arc(cx, cy - ts * 0.44 + idleBob, ts * 0.08, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#34d399'; // Emerald jade hairpin
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();
    this.ctx.moveTo(cx - ts * 0.14, cy - ts * 0.45 + idleBob);
    this.ctx.lineTo(cx + ts * 0.14, cy - ts * 0.45 + idleBob);
    this.ctx.stroke();
  }

  // --- Xiao Xue Facing DOWN (Front View: facing player with luminous face, eyes, forehead mark & robes) ---
  private renderXiaoXueFront(cx: number, cy: number, ts: number, idleBob: number) {
    // 1. Long Back Hair (Drawn BEHIND body and shoulders)
    this.ctx.fillStyle = '#090d16'; // Deep black
    this.ctx.beginPath();
    // Flowing locks on left and right behind shoulders
    this.ctx.moveTo(cx - ts * 0.16, cy - ts * 0.28 + idleBob);
    this.ctx.lineTo(cx - ts * 0.22, cy + ts * 0.18 + idleBob);
    this.ctx.lineTo(cx - ts * 0.12, cy + ts * 0.2 + idleBob);
    this.ctx.lineTo(cx - ts * 0.08, cy - ts * 0.1 + idleBob);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(cx + ts * 0.16, cy - ts * 0.28 + idleBob);
    this.ctx.lineTo(cx + ts * 0.22, cy + ts * 0.18 + idleBob);
    this.ctx.lineTo(cx + ts * 0.12, cy + ts * 0.2 + idleBob);
    this.ctx.lineTo(cx + ts * 0.08, cy - ts * 0.1 + idleBob);
    this.ctx.closePath();
    this.ctx.fill();

    // 2. Lower silk skirt (Front view with slit showing immortal white boot)
    const hemGrad = this.ctx.createLinearGradient(cx - ts * 0.25, cy, cx + ts * 0.25, cy + ts * 0.4);
    hemGrad.addColorStop(0, '#ffffff');
    hemGrad.addColorStop(0.5, '#e0f2fe');
    hemGrad.addColorStop(1, '#38bdf8');

    this.ctx.fillStyle = hemGrad;
    this.ctx.beginPath();
    this.ctx.moveTo(cx - ts * 0.14, cy - ts * 0.05 + idleBob);
    this.ctx.lineTo(cx - ts * 0.28, cy + ts * 0.35 + idleBob);
    this.ctx.lineTo(cx + ts * 0.28, cy + ts * 0.35 + idleBob);
    this.ctx.lineTo(cx + ts * 0.14, cy - ts * 0.05 + idleBob);
    this.ctx.closePath();
    this.ctx.fill();

    // Skirt hemline gracefully covering feet (no artificial block)

    // 3. Upper Robe (White silk with azure crossover collar lapels)
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.roundRect(cx - ts * 0.15, cy - ts * 0.22 + idleBob, ts * 0.3, ts * 0.24, 3);
    this.ctx.fill();

    // Cross-collar sky blue lapel trim
    this.ctx.strokeStyle = '#0284c7';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(cx - ts * 0.13, cy - ts * 0.2 + idleBob);
    this.ctx.lineTo(cx + 2, cy - ts * 0.06 + idleBob);
    this.ctx.stroke();

    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(cx + ts * 0.13, cy - ts * 0.2 + idleBob);
    this.ctx.lineTo(cx - 2, cy - ts * 0.06 + idleBob);
    this.ctx.stroke();

    // Waist sash & Turquoise jade pendant
    this.ctx.fillStyle = '#0284c7';
    this.ctx.fillRect(cx - ts * 0.13, cy - ts * 0.04 + idleBob, ts * 0.26, 4);

    this.ctx.fillStyle = '#34d399'; // Jade pendant
    this.ctx.beginPath();
    this.ctx.arc(cx, cy + ts * 0.01 + idleBob, 3.5, 0, Math.PI * 2);
    this.ctx.fill();

    // 4. Head & Fair Skin Face (Luminous, clearly forward-facing!)
    this.ctx.fillStyle = '#ffe4e6'; // Rosy fair immortal skin
    this.ctx.beginPath();
    this.ctx.arc(cx, cy - ts * 0.28 + idleBob, ts * 0.15, 0, Math.PI * 2);
    this.ctx.fill();

    // Soft rosy blush cheeks
    this.ctx.fillStyle = 'rgba(251, 113, 133, 0.45)';
    this.ctx.beginPath();
    this.ctx.arc(cx - ts * 0.09, cy - ts * 0.26 + idleBob, 3.5, 0, Math.PI * 2);
    this.ctx.arc(cx + ts * 0.09, cy - ts * 0.26 + idleBob, 3.5, 0, Math.PI * 2);
    this.ctx.fill();

    // 5. Hair Bun & Jade Hairpin on Top
    this.ctx.fillStyle = '#090d16';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy - ts * 0.44 + idleBob, ts * 0.08, 0, Math.PI * 2);
    this.ctx.fill();

    // Emerald jade hairpin
    this.ctx.strokeStyle = '#34d399';
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();
    this.ctx.moveTo(cx - ts * 0.15, cy - ts * 0.45 + idleBob);
    this.ctx.lineTo(cx + ts * 0.15, cy - ts * 0.45 + idleBob);
    this.ctx.stroke();

    // Side bangs framing the face (leaving center face open & visible)
    this.ctx.fillStyle = '#090d16';
    // Left bang
    this.ctx.beginPath();
    this.ctx.moveTo(cx - ts * 0.15, cy - ts * 0.38 + idleBob);
    this.ctx.quadraticCurveTo(cx - ts * 0.12, cy - ts * 0.28 + idleBob, cx - ts * 0.11, cy - ts * 0.18 + idleBob);
    this.ctx.lineTo(cx - ts * 0.15, cy - ts * 0.18 + idleBob);
    this.ctx.closePath();
    this.ctx.fill();

    // Right bang
    this.ctx.beginPath();
    this.ctx.moveTo(cx + ts * 0.15, cy - ts * 0.38 + idleBob);
    this.ctx.quadraticCurveTo(cx + ts * 0.12, cy - ts * 0.28 + idleBob, cx + ts * 0.11, cy - ts * 0.18 + idleBob);
    this.ctx.lineTo(cx + ts * 0.15, cy - ts * 0.18 + idleBob);
    this.ctx.closePath();
    this.ctx.fill();

    // 6. Iconic Forehead Red Blossom Mark (花鈿 - from original portrait image)
    this.ctx.fillStyle = '#e11d48';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy - ts * 0.35 + idleBob, 2, 0, Math.PI * 2);
    this.ctx.fill();

    // 7. Large Clear Expressive Eyes looking straight at player
    // Left eye
    this.ctx.fillStyle = '#090d16';
    this.ctx.beginPath();
    this.ctx.ellipse(cx - ts * 0.06, cy - ts * 0.29 + idleBob, 2.5, 3.2, 0, 0, Math.PI * 2);
    this.ctx.fill();
    // Eye white reflection glint (gives life to eyes)
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(cx - ts * 0.065, cy - ts * 0.3 + idleBob, 1, 0, Math.PI * 2);
    this.ctx.fill();

    // Right eye
    this.ctx.fillStyle = '#090d16';
    this.ctx.beginPath();
    this.ctx.ellipse(cx + ts * 0.06, cy - ts * 0.29 + idleBob, 2.5, 3.2, 0, 0, Math.PI * 2);
    this.ctx.fill();
    // Eye white reflection glint
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(cx + ts * 0.055, cy - ts * 0.3 + idleBob, 1, 0, Math.PI * 2);
    this.ctx.fill();

    // Delicate dark eyebrows
    this.ctx.strokeStyle = '#1e293b';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(cx - ts * 0.09, cy - ts * 0.33 + idleBob);
    this.ctx.lineTo(cx - ts * 0.03, cy - ts * 0.33 + idleBob);
    this.ctx.moveTo(cx + ts * 0.03, cy - ts * 0.33 + idleBob);
    this.ctx.lineTo(cx + ts * 0.09, cy - ts * 0.33 + idleBob);
    this.ctx.stroke();

    // 8. Pretty Coral Lips (Sweet smile)
    this.ctx.fillStyle = '#f43f5e';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy - ts * 0.23 + idleBob, 2.5, 0, Math.PI);
    this.ctx.fill();
  }

  // --- Xiao Xue Profile (LEFT or RIGHT) ---
  private renderXiaoXueProfile(
    cx: number,
    cy: number,
    ts: number,
    idleBob: number,
    dir: 'LEFT' | 'RIGHT'
  ) {
    const isLeft = dir === 'LEFT';
    const sign = isLeft ? -1 : 1;

    // Skirt flowing in profile (flowing back opposite to movement direction)
    const hemGrad = this.ctx.createLinearGradient(cx - sign * ts * 0.2, cy, cx + sign * ts * 0.2, cy + ts * 0.4);
    hemGrad.addColorStop(0, '#f8fafc');
    hemGrad.addColorStop(0.5, '#e0f2fe');
    hemGrad.addColorStop(1, '#38bdf8');

    this.ctx.fillStyle = hemGrad;
    this.ctx.beginPath();
    this.ctx.moveTo(cx + sign * ts * 0.1, cy - ts * 0.05 + idleBob);
    this.ctx.lineTo(cx + sign * ts * 0.24, cy + ts * 0.35 + idleBob);
    this.ctx.lineTo(cx - sign * ts * 0.28, cy + ts * 0.35 + idleBob);
    this.ctx.lineTo(cx - sign * ts * 0.1, cy - ts * 0.05 + idleBob);
    this.ctx.closePath();
    this.ctx.fill();

    // Torso in profile
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.roundRect(cx - ts * 0.1, cy - ts * 0.22 + idleBob, ts * 0.2, ts * 0.24, 3);
    this.ctx.fill();

    // Flowing sleeve pointing in facing direction
    this.ctx.fillStyle = '#e0f2fe';
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - ts * 0.18 + idleBob);
    this.ctx.lineTo(cx + sign * ts * 0.22, cy - ts * 0.06 + idleBob);
    this.ctx.lineTo(cx + sign * ts * 0.12, cy + ts * 0.08 + idleBob);
    this.ctx.lineTo(cx, cy - ts * 0.05 + idleBob);
    this.ctx.closePath();
    this.ctx.fill();

    // Profile Head & Face
    this.ctx.fillStyle = '#fff1f2';
    this.ctx.beginPath();
    // Nose / Chin pointing in facing direction
    this.ctx.moveTo(cx, cy - ts * 0.4 + idleBob);
    this.ctx.lineTo(cx + sign * ts * 0.14, cy - ts * 0.3 + idleBob); // Nose
    this.ctx.lineTo(cx + sign * ts * 0.12, cy - ts * 0.24 + idleBob); // Chin
    this.ctx.lineTo(cx - sign * ts * 0.08, cy - ts * 0.24 + idleBob);
    this.ctx.lineTo(cx - sign * ts * 0.08, cy - ts * 0.4 + idleBob);
    this.ctx.closePath();
    this.ctx.fill();

    // Hair bun angled backward
    this.ctx.fillStyle = '#090d16';
    this.ctx.beginPath();
    this.ctx.arc(cx - sign * ts * 0.06, cy - ts * 0.42 + idleBob, ts * 0.07, 0, Math.PI * 2);
    this.ctx.fill();

    // Long hair ponytail billowing backwards opposite to facing direction
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - ts * 0.38 + idleBob);
    this.ctx.quadraticCurveTo(cx - sign * ts * 0.28, cy - ts * 0.2 + idleBob, cx - sign * ts * 0.26, cy + ts * 0.15 + idleBob);
    this.ctx.lineTo(cx - sign * ts * 0.15, cy + ts * 0.15 + idleBob);
    this.ctx.quadraticCurveTo(cx - sign * ts * 0.15, cy - ts * 0.25 + idleBob, cx - sign * ts * 0.05, cy - ts * 0.35 + idleBob);
    this.ctx.closePath();
    this.ctx.fill();

    // Jade hairpin angled
    this.ctx.strokeStyle = '#34d399';
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();
    this.ctx.moveTo(cx + sign * ts * 0.02, cy - ts * 0.46 + idleBob);
    this.ctx.lineTo(cx - sign * ts * 0.16, cy - ts * 0.38 + idleBob);
    this.ctx.stroke();

    // Eye looking forward in facing direction
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(cx + sign * ts * 0.06, cy - ts * 0.32 + idleBob, 2.5, 3);
  }

  // Adaptive Hovering Flying Swords (Tailored to Xiao Xue's 4-direction stance with enlarged celestial blades)
  private renderHoveringSwords(
    cx: number,
    cy: number,
    ts: number,
    facing: Direction,
    now: number,
    idleBob: number
  ) {
    const swordBob = Math.sin(now * 0.007) * 3.5;
    let swordPositions: { x: number; y: number; angle: number }[] = [];

    switch (facing) {
      case 'DOWN':
        // Front view: Swords hover behind her shoulders, tilted outward in an elegant '八' framing angle
        swordPositions = [
          { x: cx - ts * 0.42, y: cy - ts * 0.36 + idleBob + swordBob, angle: -0.22 }, // Left sword tilted outward
          { x: cx + ts * 0.42, y: cy - ts * 0.36 + idleBob - swordBob, angle: 0.22 },  // Right sword tilted outward
        ];
        break;
      case 'UP':
        // Back view: Swords hover higher above shoulder blades, canted gently to frame hair
        swordPositions = [
          { x: cx - ts * 0.32, y: cy - ts * 0.46 + idleBob + swordBob, angle: -0.15 },
          { x: cx + ts * 0.32, y: cy - ts * 0.46 + idleBob - swordBob, angle: 0.15 },
        ];
        break;
      case 'RIGHT':
        // Side view facing right: Swords echelon behind her back on the left, tilted forward-upwards
        swordPositions = [
          { x: cx - ts * 0.32, y: cy - ts * 0.38 + idleBob + swordBob, angle: -0.42 }, // Inner primary sword
          { x: cx - ts * 0.50, y: cy - ts * 0.22 + idleBob - swordBob, angle: -0.34 }, // Outer secondary sword
        ];
        break;
      case 'LEFT':
        // Side view facing left: Swords echelon behind her back on the right, tilted forward-upwards
        swordPositions = [
          { x: cx + ts * 0.32, y: cy - ts * 0.38 + idleBob + swordBob, angle: 0.42 },  // Inner primary sword
          { x: cx + ts * 0.50, y: cy - ts * 0.22 + idleBob - swordBob, angle: 0.34 },  // Outer secondary sword
        ];
        break;
    }

    swordPositions.forEach((pos, idx) => {
      this.renderCultivationSword(pos.x, pos.y, pos.angle, ts, now, idx);
    });
  }

  // Render a single high-grade celestial flying sword with spiritual aura, fuller line, and tassel
  private renderCultivationSword(
    x: number,
    y: number,
    angle: number,
    ts: number,
    now: number,
    idx: number
  ) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(angle);

    // 1. Spiritual Sword Cyan Aura / Glow (仙劍護體劍芒)
    const auraPulse = Math.sin(now * 0.008 + idx * 2.0) * 0.2 + 0.8;
    this.ctx.save();
    this.ctx.shadowColor = '#38bdf8';
    this.ctx.shadowBlur = 12 * auraPulse;

    // Glowing ethereal blade sheath
    const auraGrad = this.ctx.createLinearGradient(0, -ts * 0.52, 0, ts * 0.12);
    auraGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    auraGrad.addColorStop(0.3, 'rgba(56, 189, 248, 0.7)');
    auraGrad.addColorStop(0.8, 'rgba(2, 132, 199, 0.4)');
    auraGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');

    this.ctx.fillStyle = auraGrad;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -ts * 0.52);
    this.ctx.lineTo(6, ts * 0.08);
    this.ctx.lineTo(-6, ts * 0.08);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();

    // 2. High-Grade Celestial Flying Sword Body (修仙靈劍本體)
    // Blade: Length approx ts * 0.56 (2x former size), sharp double-edged geometry
    const bladeGrad = this.ctx.createLinearGradient(0, -ts * 0.50, 0, ts * 0.06);
    bladeGrad.addColorStop(0, '#ffffff'); // Pure white glint at point
    bladeGrad.addColorStop(0.3, '#e0f2fe');
    bladeGrad.addColorStop(0.7, '#38bdf8');
    bladeGrad.addColorStop(1, '#0284c7');

    this.ctx.fillStyle = bladeGrad;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -ts * 0.48);      // Sharp needle tip
    this.ctx.lineTo(4.5, ts * 0.06);     // Right base of blade
    this.ctx.lineTo(0, ts * 0.08);       // Central tang indent
    this.ctx.lineTo(-4.5, ts * 0.06);    // Left base of blade
    this.ctx.closePath();
    this.ctx.fill();

    // Central Fuller / Spiritual Meridian Line (劍脊流光線)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.lineWidth = 1.2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -ts * 0.45);
    this.ctx.lineTo(0, ts * 0.06);
    this.ctx.stroke();

    // 3. Ornate Winged Sword Guard (金絲飛翼劍格)
    this.ctx.fillStyle = '#fbbf24'; // Warm gold
    this.ctx.beginPath();
    this.ctx.moveTo(-7.5, ts * 0.06);
    this.ctx.lineTo(0, ts * 0.045);
    this.ctx.lineTo(7.5, ts * 0.06);
    this.ctx.lineTo(6, ts * 0.095);
    this.ctx.lineTo(0, ts * 0.08);
    this.ctx.lineTo(-6, ts * 0.095);
    this.ctx.closePath();
    this.ctx.fill();

    // Guard core jewel (碧玉/靈晶)
    this.ctx.fillStyle = '#06b6d4';
    this.ctx.beginPath();
    this.ctx.arc(0, ts * 0.07, 1.8, 0, Math.PI * 2);
    this.ctx.fill();

    // 4. Grip / Hilt (墨玉劍柄)
    this.ctx.fillStyle = '#1e293b';
    this.ctx.fillRect(-1.5, ts * 0.095, 3, 8);

    // 5. Pommel with Spirit Ring & Floating Azure Tassel (劍首流蘇)
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.beginPath();
    this.ctx.arc(0, ts * 0.095 + 8, 2.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Flowing tassel fluttering in spiritual breeze
    const sway = Math.sin(now * 0.006 + idx * 1.5) * 4;
    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    this.ctx.lineWidth = 1.2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, ts * 0.095 + 10);
    this.ctx.quadraticCurveTo(sway * 0.5, ts * 0.095 + 16, sway, ts * 0.095 + 22);
    this.ctx.stroke();

    this.ctx.restore();
  }

  // Draw Flying Sword Attack Animation (Melee 1-tile strike & return)
  public renderFlyingSwords(swords: FlyingSwordAnimation[], now: number) {
    const ts = this.camera.tileSize;

    for (const anim of swords) {
      const startScreen = this.camera.tileToScreen(anim.startX, anim.startY);
      const targetScreen = this.camera.tileToScreen(anim.targetX, anim.targetY);

      const sx = startScreen.x + ts / 2;
      const sy = startScreen.y + ts / 2;
      const tx = targetScreen.x + ts / 2;
      const ty = targetScreen.y + ts / 2;

      // Current sword position based on phase and progress
      let curX: number, curY: number;
      if (anim.phase === 'forward') {
        curX = sx + (tx - sx) * anim.progress;
        curY = sy + (ty - sy) * anim.progress;
      } else {
        curX = tx + (sx - tx) * anim.progress;
        curY = ty + (sy - ty) * anim.progress;
      }

      const angle = Math.atan2(ty - sy, tx - sx) + Math.PI / 2;

      // Render Twin Flying Swords darting together
      [-6, 6].forEach(offset => {
        const perpX = Math.cos(angle) * offset;
        const perpY = Math.sin(angle) * offset;

        this.ctx.save();
        this.ctx.translate(curX + perpX, curY + perpY);
        this.ctx.rotate(angle);

        // Blade trail
        this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, ts * 0.4);
        this.ctx.lineTo(0, -ts * 0.3);
        this.ctx.stroke();

        // Glowing sword
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -ts * 0.35);
        this.ctx.lineTo(4, 0);
        this.ctx.lineTo(-4, 0);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
      });

      // Hit sparks if reached target
      if (anim.phase === 'forward' && anim.progress > 0.8) {
        this.ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
        for (let i = 0; i < 5; i++) {
          const spAngle = Math.random() * Math.PI * 2;
          const spDist = Math.random() * ts * 0.4;
          this.ctx.fillRect(tx + Math.cos(spAngle) * spDist, ty + Math.sin(spAngle) * spDist, 3, 3);
        }
      }
    }
  }

  // Render Spell Visual Effects
  public renderSpellEffects(effects: SpellVisualEffect[], now: number) {
    const ts = this.camera.tileSize;

    for (const eff of effects) {
      const elapsed = now - eff.createdAt;
      const progress = Math.min(1, elapsed / eff.duration);
      const alpha = 1 - progress;

      for (const tile of eff.tiles) {
        if (!this.camera.isTileVisible(tile.x, tile.y)) continue;
        const screen = this.camera.tileToScreen(tile.x, tile.y);
        const cx = screen.x + ts / 2;
        const cy = screen.y + ts / 2;

        if (eff.type === 'fire_aoe') {
          // Vermilion Bird 3x3 Fire Explosion
          const grad = this.ctx.createRadialGradient(cx, cy, 2, cx, cy, ts * 0.6);
          grad.addColorStop(0, `rgba(254, 240, 138, ${alpha})`);
          grad.addColorStop(0.4, `rgba(249, 115, 22, ${alpha * 0.8})`);
          grad.addColorStop(0.8, `rgba(239, 68, 68, ${alpha * 0.6})`);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          this.ctx.fillStyle = grad;
          this.ctx.beginPath();
          this.ctx.arc(cx, cy, ts * 0.6 * (0.8 + progress * 0.5), 0, Math.PI * 2);
          this.ctx.fill();
        } else if (eff.type === 'earth_beam') {
          // Yellow Dragon Piercing Earth Beam
          this.ctx.fillStyle = `rgba(234, 179, 8, ${alpha * 0.7})`;
          this.ctx.fillRect(screen.x + 4, screen.y + 4, ts - 8, ts - 8);

          // Golden dragon rune
          this.ctx.strokeStyle = `rgba(253, 224, 71, ${alpha})`;
          this.ctx.lineWidth = 2.5;
          this.ctx.beginPath();
          this.ctx.arc(cx, cy, ts * 0.35, 0, Math.PI * 2);
          this.ctx.stroke();
        } else if (eff.type === 'heal') {
          // Azure Dragon Vitality Leaves & Healing Pillar
          this.ctx.fillStyle = `rgba(52, 211, 153, ${alpha * 0.6})`;
          this.ctx.beginPath();
          this.ctx.arc(cx, cy - (1 - progress) * ts, ts * 0.4, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (eff.type === 'monster_slash') {
          // Vicious Monster Claw/Slash Strike on Player
          this.ctx.save();
          this.ctx.strokeStyle = `rgba(244, 63, 94, ${alpha * 0.95})`;
          this.ctx.lineWidth = 3.5;
          this.ctx.lineCap = 'round';
          // 3 diagonal crimson claw scratches
          const cutOffsets = [-ts * 0.22, 0, ts * 0.22];
          cutOffsets.forEach(offset => {
            this.ctx.beginPath();
            this.ctx.moveTo(cx - ts * 0.32 + offset, cy - ts * 0.32);
            this.ctx.lineTo(cx + ts * 0.32 + offset, cy + ts * 0.32);
            this.ctx.stroke();
          });

          // Impact blood spark burst
          this.ctx.fillStyle = `rgba(255, 228, 230, ${alpha})`;
          this.ctx.beginPath();
          this.ctx.arc(cx, cy, ts * 0.2 * (1 - progress * 0.4), 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.restore();
        }
      }
    }
  }

  // Floating Combat Damage / Heal Text
  public renderFloatingTexts(texts: FloatingText[], now: number) {
    this.ctx.save();
    this.ctx.font = 'bold 15px sans-serif';
    this.ctx.textAlign = 'center';

    for (const item of texts) {
      const elapsed = now - item.createdAt;
      const progress = Math.min(1, elapsed / item.lifeTime);
      const alpha = 1 - progress;

      const screen = this.camera.worldToScreen(item.x, item.y - progress * 32);

      this.ctx.fillStyle = item.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      this.ctx.shadowBlur = 4;
      this.ctx.fillText(item.text, screen.x, screen.y);
    }
    this.ctx.restore();
  }

  // Hexagon Shield for Black Tortoise defense buff
  private renderHexagonShield(cx: number, cy: number, radius: number, now: number) {
    const pulse = (Math.sin(now * 0.005) + 1) * 0.5;
    this.ctx.strokeStyle = `rgba(56, 189, 248, ${0.5 + pulse * 0.3})`;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const px = cx + Math.cos(a) * radius;
      const py = cy + Math.sin(a) * radius;
      if (i === 0) this.ctx.moveTo(px, py);
      else this.ctx.lineTo(px, py);
    }
    this.ctx.closePath();
    this.ctx.stroke();
  }
}
