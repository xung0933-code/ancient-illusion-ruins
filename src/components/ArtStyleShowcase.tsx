/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Palette, CheckCircle2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { spriteManager } from '../game/SpriteManager';
import battlemapStoneUrl from '../assets/images/battlemap/stone_tile.jpg';
import battlemapGrassUrl from '../assets/images/battlemap/grass_tile.jpg';
import battlemapPillarUrl from '../assets/images/battlemap/ruins_pillar.png';
import battlemapTreeUrl from '../assets/images/battlemap/ancient_tree.png';
import battlemapWallUrl from '../assets/images/battlemap/ruins_wall.png';

export type PreviewStyleId =
  | 'battlemap_hd'
  | 'classic'
  | 'jade_xianxia'
  | 'astral_sanctum'
  | 'weathered_ruins'
  | 'amber_autumn';

interface StyleDefinition {
  id: PreviewStyleId;
  badge: string;
  name: string;
  subtitle: string;
  description: string;
  frameClass: string;
  badgeClass: string;
}

type BattlemapAssetKey = 'stone' | 'grass' | 'pillar' | 'tree' | 'wall';
const battlemapImages: Partial<Record<BattlemapAssetKey, HTMLImageElement>> = {};
let battlemapLoadedCount = 0;

if (typeof window !== 'undefined') {
  const entries: Array<[BattlemapAssetKey, string]> = [
    ['stone', battlemapStoneUrl],
    ['grass', battlemapGrassUrl],
    ['pillar', battlemapPillarUrl],
    ['tree', battlemapTreeUrl],
    ['wall', battlemapWallUrl],
  ];
  for (const [key, url] of entries) {
    const img = new Image();
    img.onload = () => {
      battlemapLoadedCount++;
    };
    img.src = url;
    battlemapImages[key] = img;
  }
}

function areBattlemapImagesReady(): boolean {
  return (
    battlemapLoadedCount >= 5 ||
    (['stone', 'grass', 'pillar', 'tree', 'wall'] as BattlemapAssetKey[]).every(
      (k) => battlemapImages[k]?.complete && (battlemapImages[k]?.naturalWidth || 0) > 0
    )
  );
}

const STYLE_DEFINITIONS: StyleDefinition[] = [
  {
    id: 'battlemap_hd',
    badge: 'NEW · 第 3 張實繪原型試作',
    name: '高清手繪戰棋秘境風（貼圖試作）',
    subtitle: '手繪墨線石磚 × 繁茂森林草地 × 靈紋斷柱 × 光斑網格',
    description: '依您指定的第 3 張原型新繪製的 5 格真實貼圖樣本（含投影與林間光斑效果），保留小雪立繪同框比對。',
    frameClass: 'border-lime-400/65 bg-gradient-to-b from-emerald-950/55 via-slate-900/95 to-stone-950',
    badgeClass: 'bg-lime-400/20 text-lime-200 border-lime-400/60',
  },
  {
    id: 'classic',
    badge: '目前套用中（對照基準）',
    name: '現行原版・幾何遺跡',
    subtitle: '簡潔深藍石板 × 高辨識度幾何方塊',
    description: '目前遊戲中使用的畫法，方便您直接對照下方各風格的差異。',
    frameClass: 'border-slate-700/90 bg-slate-950/80',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-600/70',
  },
  {
    id: 'jade_xianxia',
    badge: '風格 A1 · 國風仙俠推薦',
    name: '青蓮仙境・玉石水墨風',
    subtitle: '溫潤青白玉磚 × 淡金雲紋 × 翠竹靈蓮',
    description: '色調清雅通透，與小雪的水藍白仙裙與金飾最為融洽，呈現古風仙門秘境質感。',
    frameClass: 'border-teal-400/50 bg-gradient-to-b from-slate-900/95 to-teal-950/35',
    badgeClass: 'bg-teal-500/20 text-teal-200 border-teal-400/50',
  },
  {
    id: 'astral_sanctum',
    badge: '風格 A2 · 高對比護眼',
    name: '星穹秘殿・玄青靈脈風',
    subtitle: '深玄武岩磚 × 藍紫靈脈光絲 × 螢光幽林',
    description: '深色地面襯托明亮主角與飛劍／怪物血條，手機長時間遊玩不刺眼且科技仙氣兼具。',
    frameClass: 'border-cyan-400/50 bg-gradient-to-b from-slate-950 to-indigo-950/45',
    badgeClass: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50',
  },
  {
    id: 'weathered_ruins',
    badge: '風格 A3 · 奇幻地下城',
    name: '歲月古剎・暖砂苔蘚風',
    subtitle: '風化裂紋石磚 × 蔓藤斷柱 × 粗獷砌石牆',
    description: '最接近傳統 RPG 迷宮與奇幻地牢的斑駁厚重感，強化石縫陰影、青苔與立體景深。',
    frameClass: 'border-emerald-500/45 bg-gradient-to-b from-stone-900/90 to-emerald-950/30',
    badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/50',
  },
  {
    id: 'amber_autumn',
    badge: '風格 A4 · 冷暖撞色',
    name: '琥珀秘境・金秋神木風',
    subtitle: '古銅邊石板 × 金紅秋葉神木 × 暖棕岩壁',
    description: '以溫暖金秋色調襯托小雪一身冷色冰藍服飾，強烈的冷暖對比讓角色一眼鎖定焦點。',
    frameClass: 'border-amber-400/50 bg-gradient-to-b from-stone-950 to-amber-950/35',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/50',
  },
];

const TILE_LABELS = ['石板・小雪', '草地苔原', '古蹟石柱', '靈氣古樹', '遺跡壁牆'];

function drawStyleSampleStrip(canvas: HTMLCanvasElement, styleId: PreviewStyleId) {
  const ts = 46;
  const gap = 8;
  const padX = 10;
  const topY = 36; // Generous headroom for Xiao Xue sprite and tall tree/pillar silhouettes
  const padBottom = 8;

  const logicalW = padX * 2 + ts * 5 + gap * 4;
  const logicalH = topY + ts + padBottom;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(logicalW * dpr);
  canvas.height = Math.round(logicalH * dpr);
  canvas.style.width = '100%';
  canvas.style.height = 'auto';

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.scale(dpr, dpr);

  // Subtle dark showcase backdrop behind the 5 sample tiles
  ctx.fillStyle = '#070b14';
  ctx.fillRect(0, 0, logicalW, logicalH);

  const tileX = (idx: number) => padX + idx * (ts + gap);

  // Special Render Path for NEW Row: HD Hand-Drawn Battlemap Sprites (3rd Reference Prototype)
  if (styleId === 'battlemap_hd') {
    const stoneImg = battlemapImages.stone;
    const grassImg = battlemapImages.grass;
    const pillarImg = battlemapImages.pillar;
    const treeImg = battlemapImages.tree;
    const wallImg = battlemapImages.wall;

    const drawGridLineAndDapple = (sx: number, sy: number, withWarmSpot: boolean) => {
      if (withWarmSpot) {
        const sunGrad = ctx.createRadialGradient(
          sx + ts * 0.45,
          sy + ts * 0.4,
          2,
          sx + ts * 0.45,
          sy + ts * 0.4,
          ts * 0.72
        );
        sunGrad.addColorStop(0, 'rgba(254, 249, 195, 0.24)');
        sunGrad.addColorStop(1, 'rgba(254, 249, 195, 0)');
        ctx.fillStyle = sunGrad;
        ctx.fillRect(sx, sy, ts, ts);
      }
      // Fine battlemap tactical grid overlay
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.48)';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 0.5, sy + 0.5, ts - 1, ts - 1);
    };

    // 1. Stone floor + Xiao Xue
    const x1 = tileX(0);
    if (stoneImg && stoneImg.complete && stoneImg.naturalWidth > 0) {
      ctx.drawImage(stoneImg, x1, topY, ts, ts);
    } else {
      ctx.fillStyle = '#5c4d3c';
      ctx.fillRect(x1, topY, ts, ts);
    }
    drawGridLineAndDapple(x1, topY, true);
    const cx1 = x1 + ts / 2;
    const cy1 = topY + ts / 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(cx1, cy1 + ts * 0.36, ts * 0.31, ts * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    spriteManager.draw(ctx, cx1, cy1, ts, 'DOWN', 0);

    // 2. Grass turf
    const x2 = tileX(1);
    if (grassImg && grassImg.complete && grassImg.naturalWidth > 0) {
      ctx.drawImage(grassImg, x2, topY, ts, ts);
    } else {
      ctx.fillStyle = '#2e5c31';
      ctx.fillRect(x2, topY, ts, ts);
    }
    drawGridLineAndDapple(x2, topY, true);

    // 3. Stone floor + Ancient Glowing Rune Pillar
    const x3 = tileX(2);
    if (stoneImg && stoneImg.complete && stoneImg.naturalWidth > 0) {
      ctx.drawImage(stoneImg, x3, topY, ts, ts);
    }
    drawGridLineAndDapple(x3, topY, false);
    const cx3 = x3 + ts / 2;
    const cy3 = topY + ts / 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
    ctx.beginPath();
    ctx.ellipse(cx3 + 3, cy3 + ts * 0.35, ts * 0.42, ts * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    if (pillarImg && pillarImg.complete && pillarImg.naturalWidth > 0) {
      const pw = ts * 0.94;
      const ph = pw * (pillarImg.naturalHeight / pillarImg.naturalWidth);
      ctx.drawImage(pillarImg, cx3 - pw / 2, topY + ts * 0.92 - ph, pw, ph);
    }

    // 4. Grass + Ancient Lush Tree
    const x4 = tileX(3);
    if (grassImg && grassImg.complete && grassImg.naturalWidth > 0) {
      ctx.drawImage(grassImg, x4, topY, ts, ts);
    }
    drawGridLineAndDapple(x4, topY, false);
    const cx4 = x4 + ts / 2;
    const cy4 = topY + ts / 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.beginPath();
    ctx.ellipse(cx4 + 3, cy4 + ts * 0.33, ts * 0.44, ts * 0.17, 0, 0, Math.PI * 2);
    ctx.fill();
    if (treeImg && treeImg.complete && treeImg.naturalWidth > 0) {
      const th = ts * 1.46;
      const tw = th * (treeImg.naturalWidth / treeImg.naturalHeight);
      ctx.drawImage(treeImg, cx4 - tw / 2, topY + ts * 0.92 - th, tw, th);
    }

    // 5. Grass base + Mossy Ruin Wall Block
    const x5 = tileX(4);
    if (grassImg && grassImg.complete && grassImg.naturalWidth > 0) {
      ctx.drawImage(grassImg, x5, topY, ts, ts);
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x5 + 1, topY + ts * 0.72, ts - 2, ts * 0.3);
    if (wallImg && wallImg.complete && wallImg.naturalWidth > 0) {
      const ww = ts * 0.98;
      const wh = ww * (wallImg.naturalHeight / wallImg.naturalWidth);
      ctx.drawImage(wallImg, x5 + (ts - ww) / 2, topY + ts * 0.98 - wh, ww, wh);
    }

    ctx.restore();
    return;
  }

  // Helper: Draw base ground tile per style
  const drawStoneTile = (sx: number, sy: number, variant: number) => {
    switch (styleId) {
      case 'classic': {
        ctx.fillStyle = variant % 2 === 0 ? '#333e52' : '#39465c';
        ctx.fillRect(sx, sy, ts, ts);
        ctx.fillStyle = variant % 2 === 0 ? '#3a475d' : '#404e67';
        ctx.fillRect(sx + 2, sy + 2, ts - 4, ts - 4);
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.45)';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx + 2, sy + 2, ts - 4, ts - 4);
        break;
      }
      case 'jade_xianxia': {
        const grad = ctx.createLinearGradient(sx, sy, sx + ts, sy + ts);
        grad.addColorStop(0, '#4f6d7a');
        grad.addColorStop(1, '#3b5663');
        ctx.fillStyle = grad;
        ctx.fillRect(sx, sy, ts, ts);
        // Inner jade inlay border
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx + 3, sy + 3, ts - 6, ts - 6);
        // Corner cloud-knot gold accents
        ctx.strokeStyle = 'rgba(253, 230, 138, 0.42)';
        ctx.strokeRect(sx + 6, sy + 6, ts - 12, ts - 12);
        // Delicate ink-wash fissure
        ctx.strokeStyle = 'rgba(20, 40, 50, 0.32)';
        ctx.beginPath();
        ctx.moveTo(sx + ts * 0.2, sy + ts * 0.72);
        ctx.lineTo(sx + ts * 0.48, sy + ts * 0.58);
        ctx.stroke();
        break;
      }
      case 'astral_sanctum': {
        ctx.fillStyle = variant % 2 === 0 ? '#141c2c' : '#182236';
        ctx.fillRect(sx, sy, ts, ts);
        ctx.fillStyle = '#1b263b';
        ctx.fillRect(sx + 2, sy + 2, ts - 4, ts - 4);
        // Glowing ley-line rune channels
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.38)';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx + 4, sy + 4, ts - 8, ts - 8);
        ctx.beginPath();
        ctx.moveTo(sx + 4, sy + ts / 2);
        ctx.lineTo(sx + ts * 0.35, sy + ts / 2);
        ctx.moveTo(sx + ts * 0.65, sy + ts / 2);
        ctx.lineTo(sx + ts - 4, sy + ts / 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(125, 211, 252, 0.5)';
        ctx.beginPath();
        ctx.arc(sx + ts / 2, sy + ts / 2, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'weathered_ruins': {
        ctx.fillStyle = '#4c463d';
        ctx.fillRect(sx, sy, ts, ts);
        // Uneven flagstone slabs
        ctx.fillStyle = '#5c5448';
        ctx.fillRect(sx + 2, sy + 2, ts * 0.54, ts * 0.48);
        ctx.fillStyle = '#524b40';
        ctx.fillRect(sx + ts * 0.58, sy + 2, ts * 0.38, ts * 0.56);
        ctx.fillRect(sx + 2, sy + ts * 0.54, ts * 0.44, ts * 0.42);
        ctx.fillStyle = '#645b4e';
        ctx.fillRect(sx + ts * 0.5, sy + ts * 0.62, ts * 0.46, ts * 0.34);
        // Mossy grout patches
        ctx.fillStyle = 'rgba(74, 222, 128, 0.28)';
        ctx.beginPath();
        ctx.arc(sx + ts * 0.56, sy + ts * 0.52, 5, 0, Math.PI * 2);
        ctx.arc(sx + ts * 0.25, sy + ts * 0.85, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'amber_autumn': {
        ctx.fillStyle = '#3f352c';
        ctx.fillRect(sx, sy, ts, ts);
        ctx.fillStyle = '#4a3e33';
        ctx.fillRect(sx + 2, sy + 2, ts - 4, ts - 4);
        ctx.strokeStyle = 'rgba(217, 119, 6, 0.42)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(sx + 3, sy + 3, ts - 6, ts - 6);
        // Subtle bronze corner rivets
        ctx.fillStyle = 'rgba(245, 158, 11, 0.55)';
        ctx.fillRect(sx + 5, sy + 5, 2, 2);
        ctx.fillRect(sx + ts - 7, sy + 5, 2, 2);
        ctx.fillRect(sx + 5, sy + ts - 7, 2, 2);
        ctx.fillRect(sx + ts - 7, sy + ts - 7, 2, 2);
        break;
      }
    }

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy, ts, ts);
  };

  const drawGrassTile = (sx: number, sy: number) => {
    switch (styleId) {
      case 'classic': {
        ctx.fillStyle = '#254432';
        ctx.fillRect(sx, sy, ts, ts);
        ctx.fillStyle = '#2e543e';
        ctx.fillRect(sx + 2, sy + 2, ts - 4, ts - 4);
        ctx.fillStyle = 'rgba(187, 247, 208, 0.5)';
        ctx.fillRect(sx + ts * 0.25, sy + ts * 0.3, 2, 4);
        ctx.fillRect(sx + ts * 0.7, sy + ts * 0.6, 2, 4);
        break;
      }
      case 'jade_xianxia': {
        const gGrad = ctx.createRadialGradient(sx + ts / 2, sy + ts / 2, 4, sx + ts / 2, sy + ts / 2, ts * 0.7);
        gGrad.addColorStop(0, '#2d6a5b');
        gGrad.addColorStop(1, '#1e4a42');
        ctx.fillStyle = gGrad;
        ctx.fillRect(sx, sy, ts, ts);
        // Delicate grass blades & white spirit blossoms
        ctx.strokeStyle = '#6ee7b7';
        ctx.lineWidth = 1.2;
        for (const [bx, by] of [[0.25, 0.7], [0.7, 0.45], [0.45, 0.8]]) {
          ctx.beginPath();
          ctx.moveTo(sx + ts * bx, sy + ts * by);
          ctx.lineTo(sx + ts * bx - 2, sy + ts * by - 6);
          ctx.moveTo(sx + ts * bx, sy + ts * by);
          ctx.lineTo(sx + ts * bx + 3, sy + ts * by - 5);
          ctx.stroke();
        }
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(sx + ts * 0.3, sy + ts * 0.3, 2.5, 0, Math.PI * 2);
        ctx.arc(sx + ts * 0.72, sy + ts * 0.7, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'astral_sanctum': {
        ctx.fillStyle = '#132a33';
        ctx.fillRect(sx, sy, ts, ts);
        ctx.fillStyle = '#183640';
        ctx.fillRect(sx + 2, sy + 2, ts - 4, ts - 4);
        // Luminescent grass tufts & spores
        ctx.strokeStyle = '#2dd4bf';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(sx + ts * 0.3, sy + ts * 0.65);
        ctx.lineTo(sx + ts * 0.25, sy + ts * 0.45);
        ctx.moveTo(sx + ts * 0.65, sy + ts * 0.75);
        ctx.lineTo(sx + ts * 0.7, sy + ts * 0.55);
        ctx.stroke();
        ctx.fillStyle = 'rgba(103, 232, 249, 0.85)';
        ctx.beginPath();
        ctx.arc(sx + ts * 0.32, sy + ts * 0.3, 2, 0, Math.PI * 2);
        ctx.arc(sx + ts * 0.75, sy + ts * 0.35, 1.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'weathered_ruins': {
        ctx.fillStyle = '#2b3f28';
        ctx.fillRect(sx, sy, ts, ts);
        ctx.fillStyle = '#365031';
        ctx.fillRect(sx + 2, sy + 2, ts - 4, ts - 4);
        // Embedded broken paving stone in grass
        ctx.fillStyle = '#5c5448';
        ctx.beginPath();
        ctx.roundRect(sx + ts * 0.48, sy + ts * 0.45, ts * 0.32, ts * 0.26, 3);
        ctx.fill();
        ctx.fillStyle = '#a3e635';
        ctx.fillRect(sx + ts * 0.22, sy + ts * 0.32, 2, 5);
        ctx.fillRect(sx + ts * 0.28, sy + ts * 0.36, 2, 4);
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(sx + ts * 0.25, sy + ts * 0.72, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'amber_autumn': {
        ctx.fillStyle = '#47361f';
        ctx.fillRect(sx, sy, ts, ts);
        ctx.fillStyle = '#594225';
        ctx.fillRect(sx + 2, sy + 2, ts - 4, ts - 4);
        // Golden autumn grass & fallen maple petals
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(sx + ts * 0.3, sy + ts * 0.65);
        ctx.lineTo(sx + ts * 0.25, sy + ts * 0.48);
        ctx.moveTo(sx + ts * 0.68, sy + ts * 0.68);
        ctx.lineTo(sx + ts * 0.74, sy + ts * 0.5);
        ctx.stroke();
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.ellipse(sx + ts * 0.48, sy + ts * 0.32, 3, 1.8, 0.5, 0, Math.PI * 2);
        ctx.ellipse(sx + ts * 0.7, sy + ts * 0.78, 2.5, 1.5, -0.4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy, ts, ts);
  };

  // --- TILE 1: Stone Floor + Xiao Xue Standing Preview ---
  const x1 = tileX(0);
  drawStoneTile(x1, topY, 0);
  const cx1 = x1 + ts / 2;
  const cy1 = topY + ts / 2;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
  ctx.beginPath();
  ctx.ellipse(cx1, cy1 + ts * 0.36, ts * 0.3, ts * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();
  spriteManager.draw(ctx, cx1, cy1, ts, 'DOWN', 0);

  // --- TILE 2: Grass / Moss Tile ---
  const x2 = tileX(1);
  drawGrassTile(x2, topY);

  // --- TILE 3: Ancient Pillar on Stone ---
  const x3 = tileX(2);
  drawStoneTile(x3, topY, 1);
  const cx3 = x3 + ts / 2;
  const cy3 = topY + ts / 2;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.ellipse(cx3 + 3, cy3 + ts * 0.38, ts * 0.38, ts * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  if (styleId === 'classic') {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(cx3 - ts * 0.32, cy3 + ts * 0.2, ts * 0.64, ts * 0.2, 3);
    ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.fillRect(cx3 - ts * 0.24, topY - ts * 0.14, ts * 0.48, ts * 0.82);
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.roundRect(cx3 - ts * 0.29, topY - ts * 0.2, ts * 0.58, ts * 0.12, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(cx3, cy3 - ts * 0.04, ts * 0.22, ts * 0.07, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (styleId === 'jade_xianxia') {
    // White-jade dragon pillar + floating lotus spirit orb
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.roundRect(cx3 - ts * 0.33, cy3 + ts * 0.18, ts * 0.66, ts * 0.22, 4);
    ctx.fill();
    const pGrad = ctx.createLinearGradient(cx3 - ts * 0.22, 0, cx3 + ts * 0.22, 0);
    pGrad.addColorStop(0, '#94a3b8');
    pGrad.addColorStop(0.4, '#e2e8f0');
    pGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = pGrad;
    ctx.fillRect(cx3 - ts * 0.22, topY - ts * 0.14, ts * 0.44, ts * 0.82);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.3;
    ctx.strokeRect(cx3 - ts * 0.22, topY + ts * 0.04, ts * 0.44, ts * 0.12);
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.roundRect(cx3 - ts * 0.3, topY - ts * 0.22, ts * 0.6, ts * 0.12, 3);
    ctx.fill();
    // Floating cyan lotus orb
    ctx.fillStyle = '#5eead4';
    ctx.beginPath();
    ctx.arc(cx3, topY - ts * 0.36, 4.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (styleId === 'astral_sanctum') {
    // Obsidian obelisk pillar with cyan glowing glyph strip
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx3 - ts * 0.32, cy3 + ts * 0.18, ts * 0.64, ts * 0.22);
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(cx3 - ts * 0.24, cy3 + ts * 0.2);
    ctx.lineTo(cx3 - ts * 0.17, topY - ts * 0.25);
    ctx.lineTo(cx3, topY - ts * 0.42);
    ctx.lineTo(cx3 + ts * 0.17, topY - ts * 0.25);
    ctx.lineTo(cx3 + ts * 0.24, cy3 + ts * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx3, topY - ts * 0.25);
    ctx.lineTo(cx3, cy3 + ts * 0.1);
    ctx.stroke();
  } else if (styleId === 'weathered_ruins') {
    // Cracked sandstone column with creeping ivy
    ctx.fillStyle = '#57534e';
    ctx.fillRect(cx3 - ts * 0.32, cy3 + ts * 0.18, ts * 0.64, ts * 0.22);
    const rGrad = ctx.createLinearGradient(cx3 - ts * 0.24, 0, cx3 + ts * 0.24, 0);
    rGrad.addColorStop(0, '#57534e');
    rGrad.addColorStop(0.5, '#a8a29e');
    rGrad.addColorStop(1, '#44403c');
    ctx.fillStyle = rGrad;
    ctx.fillRect(cx3 - ts * 0.23, topY - ts * 0.1, ts * 0.46, ts * 0.78);
    ctx.fillStyle = '#78716c';
    ctx.fillRect(cx3 - ts * 0.28, topY - ts * 0.16, ts * 0.56, ts * 0.1);
    // Creeping green vines
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx3 - ts * 0.2, cy3 + ts * 0.2);
    ctx.quadraticCurveTo(cx3 + ts * 0.12, cy3, cx3 - ts * 0.15, topY - ts * 0.05);
    ctx.stroke();
  } else if (styleId === 'amber_autumn') {
    // Dark stone pillar with ancient bronze bands
    ctx.fillStyle = '#292524';
    ctx.fillRect(cx3 - ts * 0.32, cy3 + ts * 0.18, ts * 0.64, ts * 0.22);
    ctx.fillStyle = '#57534e';
    ctx.fillRect(cx3 - ts * 0.22, topY - ts * 0.15, ts * 0.44, ts * 0.83);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(cx3 - ts * 0.26, topY - ts * 0.2, ts * 0.52, ts * 0.12);
    ctx.fillRect(cx3 - ts * 0.24, cy3 - ts * 0.02, ts * 0.48, ts * 0.09);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(cx3, cy3 - ts * 0.18, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- TILE 4: Ancient Spirit Tree on Grass ---
  const x4 = tileX(3);
  drawGrassTile(x4, topY);
  const cx4 = x4 + ts / 2;
  const cy4 = topY + ts / 2;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
  ctx.beginPath();
  ctx.ellipse(cx4, cy4 + ts * 0.36, ts * 0.4, ts * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  // Trunk
  ctx.fillStyle = styleId === 'astral_sanctum' ? '#312e81' : '#4e342e';
  ctx.fillRect(cx4 - ts * 0.13, cy4 - ts * 0.05, ts * 0.26, ts * 0.4);

  const canopyPalette: Record<Exclude<PreviewStyleId, 'battlemap_hd'>, [string, string, string, string]> = {
    classic: ['#064e3b', '#047857', '#10b981', '#fde68a'],
    jade_xianxia: ['#0f766e', '#14b8a6', '#5eead4', '#fef08a'],
    astral_sanctum: ['#1e1b4b', '#312e81', '#38bdf8', '#a5f3fc'],
    weathered_ruins: ['#14532d', '#15803d', '#4ade80', '#fef08a'],
    amber_autumn: ['#7c2d12', '#c2410c', '#f59e0b', '#fef08a'],
  };
  const [cDark, cMid, cTop, cSpark] = canopyPalette[styleId];
  ctx.fillStyle = cDark;
  ctx.beginPath();
  ctx.arc(cx4, cy4 - ts * 0.22, ts * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cMid;
  ctx.beginPath();
  ctx.arc(cx4 - ts * 0.1, cy4 - ts * 0.34, ts * 0.28, 0, Math.PI * 2);
  ctx.arc(cx4 + ts * 0.14, cy4 - ts * 0.3, ts * 0.26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cTop;
  ctx.beginPath();
  ctx.arc(cx4, cy4 - ts * 0.42, ts * 0.21, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cSpark;
  ctx.beginPath();
  ctx.arc(cx4 + ts * 0.12, cy4 - ts * 0.3, 2.2, 0, Math.PI * 2);
  ctx.arc(cx4 - ts * 0.16, cy4 - ts * 0.42, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // --- TILE 5: Ancient Wall ---
  const x5 = tileX(4);
  const wallPalettes: Record<Exclude<PreviewStyleId, 'battlemap_hd'>, { front: string; seam: string; top1: string; top2: string; edge: string }> = {
    classic: { front: '#171e2e', seam: '#283347', top1: '#475569', top2: '#334155', edge: '#94a3b8' },
    jade_xianxia: { front: '#334155', seam: '#64748b', top1: '#cbd5e1', top2: '#94a3b8', edge: '#fde68a' },
    astral_sanctum: { front: '#0f172a', seam: '#1e293b', top1: '#334155', top2: '#1e293b', edge: '#38bdf8' },
    weathered_ruins: { front: '#44403c', seam: '#292524', top1: '#78716c', top2: '#57534e', edge: '#d6d3d1' },
    amber_autumn: { front: '#292524', seam: '#44403c', top1: '#78350f', top2: '#451a03', edge: '#f59e0b' },
  };
  const wp = wallPalettes[styleId];
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x5, topY + ts * 0.72, ts, ts * 0.32);
  ctx.fillStyle = wp.front;
  ctx.fillRect(x5, topY + ts * 0.18, ts, ts * 0.82);
  ctx.strokeStyle = wp.seam;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x5, topY + ts * 0.55);
  ctx.lineTo(x5 + ts, topY + ts * 0.55);
  ctx.moveTo(x5 + ts * 0.5, topY + ts * 0.18);
  ctx.lineTo(x5 + ts * 0.5, topY + ts * 0.55);
  ctx.moveTo(x5 + ts * 0.25, topY + ts * 0.55);
  ctx.lineTo(x5 + ts * 0.25, topY + ts);
  ctx.moveTo(x5 + ts * 0.75, topY + ts * 0.55);
  ctx.lineTo(x5 + ts * 0.75, topY + ts);
  ctx.stroke();

  const wTop = ctx.createLinearGradient(x5, topY - 4, x5, topY + ts * 0.22);
  wTop.addColorStop(0, wp.top1);
  wTop.addColorStop(1, wp.top2);
  ctx.fillStyle = wTop;
  ctx.fillRect(x5, topY - ts * 0.08, ts, ts * 0.28);
  ctx.strokeStyle = wp.edge;
  ctx.lineWidth = 1.3;
  ctx.strokeRect(x5 + 1, topY - ts * 0.08, ts - 2, ts * 0.28);

  if (styleId === 'weathered_ruins') {
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(x5 + ts * 0.28, topY + ts * 0.65, 3.5, 0, Math.PI * 2);
    ctx.arc(x5 + ts * 0.38, topY + ts * 0.45, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (styleId === 'astral_sanctum') {
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x5 + ts / 2, topY + ts * 0.58, 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

const StyleSampleCanvas: React.FC<{ styleId: PreviewStyleId; spriteTick: number }> = ({
  styleId,
  spriteTick,
}) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      drawStyleSampleStrip(ref.current, styleId);
    }
  }, [styleId, spriteTick]);

  return (
    <div className="rounded-xl overflow-hidden border border-slate-800/90 bg-[#070b14] p-1">
      <canvas ref={ref} className="block w-full h-auto" />
      <div className="grid grid-cols-5 gap-1 pt-1 pb-0.5 text-center text-[9px] text-slate-400">
        {TILE_LABELS.map((label) => (
          <span key={label} className="truncate">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

interface ArtStyleShowcaseProps {
  selectedPreviewId: PreviewStyleId;
  onSelectPreview: (id: PreviewStyleId) => void;
}

export const ArtStyleShowcase: React.FC<ArtStyleShowcaseProps> = ({
  selectedPreviewId,
  onSelectPreview,
}) => {
  const [spriteTick, setSpriteTick] = useState<number>(0);

  // Ensure Xiao Xue sprite and battlemap tile textures trigger clean redraw once loaded
  useEffect(() => {
    if (spriteManager.isReady('DOWN') && areBattlemapImagesReady()) return;
    const timer = window.setInterval(() => {
      setSpriteTick((t) => t + 1);
      if (spriteManager.isReady('DOWN') && areBattlemapImagesReady()) {
        window.clearInterval(timer);
      }
    }, 120);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="space-y-3">
      <div className="bg-cyan-950/35 border border-cyan-500/30 rounded-xl p-2.5 text-[11px] leading-relaxed text-cyan-100/90 flex items-start gap-2">
        <Palette className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-cyan-200 block">
            地圖方塊美術風格預覽範本（保留小雪形象）
          </span>
          擷取遊戲中的「石板＋小雪、草地、石柱、古樹、壁牆」5 格同框對照。您可先點選比較偏好，選定方向後即可正式實裝並延伸為玩家自訂主題！
        </div>
      </div>

      <div className="space-y-2.5">
        {STYLE_DEFINITIONS.map((style) => {
          const isSelected = selectedPreviewId === style.id;
          return (
            <div
              key={style.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectPreview(style.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPreview(style.id);
                }
              }}
              className={`rounded-2xl border p-2.5 transition-all cursor-pointer ${
                style.frameClass
              } ${
                isSelected
                  ? 'ring-2 ring-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.28)]'
                  : 'hover:border-slate-500'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${style.badgeClass}`}
                    >
                      {style.badge}
                    </span>
                    <span className="text-xs font-bold text-white">{style.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{style.subtitle}</p>
                </div>

                <span
                  className={`shrink-0 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg border ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-300'
                      : 'bg-slate-900/80 text-slate-400 border-slate-700'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>已標記偏好</span>
                    </>
                  ) : (
                    <span>預選比較</span>
                  )}
                </span>
              </div>

              <StyleSampleCanvas styleId={style.id} spriteTick={spriteTick} />

              <p className="text-[10px] leading-relaxed text-slate-300/90 mt-1.5">
                {style.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Stored 3 Style Reference Blueprints */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5 space-y-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-lime-400" />
            <span>專案已收錄參考原型（共 3 張）</span>
          </span>
          <span className="text-lime-300 font-semibold">目前採用：第 3 張</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
            <img
              src="./assets/style_references/ref1_pixel_forest.png"
              alt="參考圖1 像素森林"
              className="w-full h-14 object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="text-[9px] text-slate-400 text-center py-0.5 truncate px-1">
              1. 像素森林
            </div>
          </div>
          <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
            <img
              src="./assets/style_references/ref2_pixel_dungeon.png"
              alt="參考圖2 像素地牢"
              className="w-full h-14 object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="text-[9px] text-slate-400 text-center py-0.5 truncate px-1">
              2. 像素地牢
            </div>
          </div>
          <div className="rounded-lg overflow-hidden border-2 border-lime-400/80 bg-slate-900 shadow-[0_0_10px_rgba(163,230,53,0.22)]">
            <img
              src="./assets/style_references/ref3_hd_battlemap_active.png"
              alt="參考圖3 手繪戰棋原型"
              className="w-full h-14 object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="text-[9px] text-lime-300 font-bold text-center py-0.5 truncate px-1">
              3. 手繪戰棋（原型）
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 text-[10px] text-slate-400 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>
          目前主遊戲畫面仍維持「現行原版」，請先檢視最上方新增的「高清手繪戰棋秘境風」貼圖列，滿意後再套用到整張遺跡地圖！
        </span>
      </div>
    </div>
  );
};
