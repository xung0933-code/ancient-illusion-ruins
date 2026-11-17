/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import stoneTileUrl from '../assets/images/battlemap/stone_tile.jpg';
import grassTileUrl from '../assets/images/battlemap/grass_tile.jpg';
import ruinsPillarUrl from '../assets/images/battlemap/ruins_pillar.png';
import ancientTreeUrl from '../assets/images/battlemap/ancient_tree.png';
import ruinsWallUrl from '../assets/images/battlemap/ruins_wall.png';

export type BattlemapTextureKey = 'stone' | 'grass' | 'pillar' | 'tree' | 'wall';

interface CachedTexture {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

class BattlemapTextureManager {
  private caches: Partial<Record<BattlemapTextureKey, CachedTexture>> = {};
  private loadedCount = 0;

  constructor() {
    this.loadTexture('stone', stoneTileUrl, 128);
    this.loadTexture('grass', grassTileUrl, 128);
    this.loadTexture('pillar', ruinsPillarUrl, 160);
    this.loadTexture('tree', ancientTreeUrl, 192);
    this.loadTexture('wall', ruinsWallUrl, 160);
  }

  private loadTexture(key: BattlemapTextureKey, url: string, maxDim: number) {
    if (typeof window === 'undefined') return;

    const img = new Image();
    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) return;

        const scale = Math.min(1, maxDim / Math.max(w, h));
        const targetW = Math.max(1, Math.round(w * scale));
        const targetH = Math.max(1, Math.round(h * scale));

        const offscreen = document.createElement('canvas');
        offscreen.width = targetW;
        offscreen.height = targetH;
        const ctx = offscreen.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetW, targetH);
        }

        this.caches[key] = {
          canvas: offscreen,
          width: targetW,
          height: targetH,
        };
        this.loadedCount++;
      } catch (err) {
        console.warn(`Failed to cache battlemap texture ${key}:`, err);
      }
    };
    img.src = url;
  }

  public isAllReady(): boolean {
    return this.loadedCount >= 5;
  }

  public get(key: BattlemapTextureKey): CachedTexture | null {
    return this.caches[key] ?? null;
  }
}

export const battlemapTextures = new BattlemapTextureManager();
