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
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMove,
  onAttack,
  onInteract,
  canInteract,
  interactLabel,
}) => {
  return (
    <div className="md:hidden fixed bottom-20 left-0 right-0 px-4 pointer-events-none flex justify-between items-end z-20">
      {/* Virtual D-Pad (Left side) */}
      <div className="pointer-events-auto bg-slate-900/70 backdrop-blur-md p-2 rounded-3xl border border-slate-700/50 shadow-2xl">
        <div className="grid grid-cols-3 gap-1.5 w-36 h-36">
          <div />
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onMove('UP');
            }}
            onClick={() => onMove('UP')}
            className="flex items-center justify-center rounded-xl bg-slate-800/80 active:bg-cyan-600/80 text-slate-200 border border-slate-700/60 shadow transition-colors"
            aria-label="向上移動"
          >
            <ChevronUp className="w-7 h-7" />
          </button>
          <div />

          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onMove('LEFT');
            }}
            onClick={() => onMove('LEFT')}
            className="flex items-center justify-center rounded-xl bg-slate-800/80 active:bg-cyan-600/80 text-slate-200 border border-slate-700/60 shadow transition-colors"
            aria-label="向左移動"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <div className="flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-slate-600/60" />
          </div>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onMove('RIGHT');
            }}
            onClick={() => onMove('RIGHT')}
            className="flex items-center justify-center rounded-xl bg-slate-800/80 active:bg-cyan-600/80 text-slate-200 border border-slate-700/60 shadow transition-colors"
            aria-label="向右移動"
          >
            <ChevronRight className="w-7 h-7" />
          </button>

          <div />
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onMove('DOWN');
            }}
            onClick={() => onMove('DOWN')}
            className="flex items-center justify-center rounded-xl bg-slate-800/80 active:bg-cyan-600/80 text-slate-200 border border-slate-700/60 shadow transition-colors"
            aria-label="向下移動"
          >
            <ChevronDown className="w-7 h-7" />
          </button>
          <div />
        </div>
      </div>

      {/* Action Buttons (Right side) */}
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {/* Contextual Interact Button */}
        {canInteract && (
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onInteract();
            }}
            onClick={onInteract}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 active:scale-95 text-slate-950 font-bold text-xs shadow-lg border border-amber-300 flex items-center gap-1.5 animate-bounce"
          >
            <Sparkles className="w-4 h-4" />
            {interactLabel}
          </button>
        )}

        {/* Attack Button (Flying Sword Melee) */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onAttack();
          }}
          onClick={onAttack}
          className="w-18 h-18 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 active:scale-95 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] border-2 border-cyan-300/80 flex flex-col items-center justify-center gap-0.5"
          aria-label="御劍攻擊"
        >
          <Sword className="w-7 h-7" />
          <span className="text-[10px] font-semibold tracking-wider">御劍</span>
        </button>
      </div>
    </div>
  );
};
