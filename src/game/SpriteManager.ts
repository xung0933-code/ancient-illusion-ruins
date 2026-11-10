/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Direction } from './types';
import frontImgUrl from '../assets/images/xiaoxue_front.png';
import backImgUrl from '../assets/images/xiaoxue_back.png';
import sideImgUrl from '../assets/images/xiaoxue_side.png';

class SpriteManager {
  private canvases: {
    front: HTMLCanvasElement | null;
    back: HTMLCanvasElement | null;
    side: HTMLCanvasElement | null;
  } = {
    front: null,
    back: null,
    side: null,
  };

  private loaded: {
    front: boolean;
    back: boolean;
    side: boolean;
  } = {
    front: false,
    back: false,
    side: false,
  };

  constructor() {
    this.loadSprite('front', frontImgUrl, './assets/xiaoxue/xiaoxue_front.png');
    this.loadSprite('back', backImgUrl, './assets/xiaoxue/xiaoxue_back.png');
    this.loadSprite('side', sideImgUrl, './assets/xiaoxue/xiaoxue_side.png');
  }

  private loadSprite(key: 'front' | 'back' | 'side', primaryUrl: string, fallbackUrl: string) {
    if (typeof window === 'undefined') return;

    const img = new Image();
    img.onload = () => {
      try {
        const aspect = img.naturalWidth / img.naturalHeight;
        const targetH = 380;
        const targetW = Math.round(targetH * aspect);

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetW, targetH);
        }
        this.canvases[key] = canvas;
        this.loaded[key] = true;
      } catch (e) {
        console.warn(`Failed to process sprite for ${key}:`, e);
      }
    };

    img.onerror = () => {
      if (img.src !== fallbackUrl) {
        img.src = fallbackUrl;
      }
    };

    img.src = primaryUrl;
  }


  public isReady(facing: Direction): boolean {
    if (facing === 'DOWN') return this.loaded.front;
    if (facing === 'UP') return this.loaded.back;
    if (facing === 'RIGHT' || facing === 'LEFT') return this.loaded.side;
    return false;
  }

  /**
   * Render Xiao Xue sprite directly to the 2D canvas context
   */
  public draw(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    ts: number,
    facing: Direction,
    idleBob: number
  ): boolean {
    let canvas: HTMLCanvasElement | null = null;
    let flipX = false;

    if (facing === 'DOWN') {
      canvas = this.canvases.front;
    } else if (facing === 'UP') {
      canvas = this.canvases.back;
    } else if (facing === 'RIGHT') {
      canvas = this.canvases.side;
    } else if (facing === 'LEFT') {
      canvas = this.canvases.side;
      flipX = true; // Horizontal mirror
    }

    if (!canvas) return false;

    // Sprite dimensions: elegant tall proportion (approx 1.55x tile size height)
    const targetHeight = ts * 1.55;
    const aspect = canvas.width / canvas.height;
    const targetWidth = targetHeight * aspect;

    // Stand with feet placed right on the tile ground shadow
    const drawX = -targetWidth / 2;
    const drawY = cy + ts * 0.35 + idleBob - targetHeight;

    ctx.save();
    ctx.translate(cx, 0);

    if (flipX) {
      ctx.scale(-1, 1);
    }

    ctx.drawImage(canvas, drawX, drawY, targetWidth, targetHeight);
    ctx.restore();

    return true;
  }
}

export const spriteManager = new SpriteManager();
