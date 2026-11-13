/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Sword, Sparkles } from 'lucide-react';
import { Direction } from '../game/types';

interface TouchControlsProps {
  onMove: (dir: Direction) => void;
  onAttack: () => void;
  onInteract: () => void;
  canInteract: boolean;
  interactLabel: string;
  hasTargetInFront?: boolean;
  facing?: Direction;
}

const FACING_LABELS: Record<Direction, string> = {
  UP: '面朝 上',
  DOWN: '面朝 下',
  LEFT: '面朝 左',
  RIGHT: '面朝 右',
};

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMove,
  onAttack,
  onInteract,
  canInteract,
  interactLabel,
  hasTargetInFront = false,
  facing = 'DOWN',
}) => {
  const handlePointerTrigger = (e: React.PointerEvent, action: () => void) => {
    e.preventDefault();
    action();
  };

  return (
    <div className="shrink-0 w-full bg-slate-950 border-t border-slate-800/90 px-6 pt-2.5 pb-[max(1.1rem,env(safe-area-inset-bottom))] select-none touch-none">
      <div className="mx-auto w-full max-w-[316px] flex items-center justify-between gap-2 h-[144px]">
        {/* Left: Inward Ergonomic Virtual D-Pad (clear of left phone edge/case) */}
        <div className="shrink-0 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow-inner">
          <div className="grid grid-cols-3 gap-1 w-[136px] h-[136px]">
            <div />
            <button
              type="button"
              onPointerDown={(e) => handlePointerTrigger(e, () => onMove('UP'))}
              className="flex items-center justify-center rounded-xl bg-slate-800 active:bg-cyan-600 text-slate-100 border border-slate-700/70 shadow active:scale-95 transition-transform cursor-pointer touch-none"
              aria-label="向上移動"
            >
              <ChevronUp className="w-6 h-6" />
            </button>
            <div />

            <button
              type="button"
              onPointerDown={(e) => handlePointerTrigger(e, () => onMove('LEFT'))}
              className="flex items-center justify-center rounded-xl bg-slate-800 active:bg-cyan-600 text-slate-100 border border-slate-700/70 shadow active:scale-95 transition-transform cursor-pointer touch-none"
              aria-label="向左移動"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
            </div>
            <button
              type="button"
              onPointerDown={(e) => handlePointerTrigger(e, () => onMove('RIGHT'))}
              className="flex items-center justify-center rounded-xl bg-slate-800 active:bg-cyan-600 text-slate-100 border border-slate-700/70 shadow active:scale-95 transition-transform cursor-pointer touch-none"
              aria-label="向右移動"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div />
            <button
              type="button"
              onPointerDown={(e) => handlePointerTrigger(e, () => onMove('DOWN'))}
              className="flex items-center justify-center rounded-xl bg-slate-800 active:bg-cyan-600 text-slate-100 border border-slate-700/70 shadow active:scale-95 transition-transform cursor-pointer touch-none"
              aria-label="向下移動"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <div />
          </div>
        </div>

        {/* Center: Compact Contextual Interact Slot (Zero layout shift) */}
        <div className="flex-1 min-w-[74px] flex flex-col items-center justify-center">
          {canInteract ? (
            <button
              type="button"
              onPointerDown={(e) => handlePointerTrigger(e, onInteract)}
              className="w-full max-w-[92px] min-h-[50px] px-2 py-2 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 active:scale-95 text-slate-950 font-bold text-[11px] shadow-[0_0_20px_rgba(245,158,11,0.45)] border border-amber-200 flex flex-col items-center justify-center gap-0.5 cursor-pointer touch-none"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="leading-tight text-center">{interactLabel}</span>
            </button>
          ) : (
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-[11px] font-medium text-slate-400 tracking-wide">
                {FACING_LABELS[facing]}
              </span>
              <span className="text-[10px] text-slate-500 leading-tight">
                {hasTargetInFront ? '前方有敵人' : '點擊移動'}
              </span>
            </div>
          )}
        </div>

        {/* Right: Inward Primary Flying Sword Attack Button (clear of right phone edge/case) */}
        <div className="shrink-0 flex items-center justify-center">
          <button
            type="button"
            onPointerDown={(e) => handlePointerTrigger(e, onAttack)}
            className={`w-[78px] h-[78px] rounded-full active:scale-95 text-white flex flex-col items-center justify-center gap-1 transition-all cursor-pointer touch-none border-2 ${
              hasTargetInFront
                ? 'bg-gradient-to-br from-rose-500 to-red-700 border-rose-300 shadow-[0_0_24px_rgba(244,63,94,0.6)]'
                : 'bg-gradient-to-br from-cyan-600 to-blue-800 border-cyan-300/80 shadow-[0_0_18px_rgba(6,182,212,0.35)]'
            }`}
            aria-label="御劍攻擊"
          >
            <Sword className="w-6 h-6" />
            <span className="text-xs font-bold tracking-wider">御劍</span>
          </button>
        </div>
      </div>
    </div>
  );
};
