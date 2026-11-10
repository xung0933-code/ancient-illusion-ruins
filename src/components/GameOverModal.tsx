/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, Skull, RotateCcw, ArrowRight } from 'lucide-react';
import { GameLevelId } from '../game/types';

interface GameOverModalProps {
  isVictory: boolean;
  currentLevel: GameLevelId;
  turns: number;
  monstersKilled: number;
  chestsOpened: number;
  totalChests: number;
  onRestart: (level?: GameLevelId) => void;
  onReturnToMenu?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVictory,
  currentLevel,
  turns,
  monstersKilled,
  chestsOpened,
  totalChests,
  onRestart,
  onReturnToMenu,
}) => {
  const getNextLevel = (lvl: GameLevelId): GameLevelId | null => {
    if (lvl === 'beginner') return 'intermediate';
    if (lvl === 'intermediate') return 'advanced';
    return null;
  };

  const nextLvl = getNextLevel(currentLevel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 text-center shadow-2xl ${
          isVictory
            ? 'bg-gradient-to-b from-amber-950/80 via-slate-900 to-emerald-950/80 border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.25)]'
            : 'bg-gradient-to-b from-rose-950/80 via-slate-900 to-slate-950 border-rose-500/40 shadow-[0_0_50px_rgba(239,68,68,0.2)]'
        }`}
      >
        {/* Top Portrait or Icon */}
        <div className="mx-auto mb-4 flex flex-col items-center">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center border ${
              isVictory
                ? 'bg-amber-500/10 border-amber-400 text-amber-300'
                : 'bg-rose-500/10 border-rose-400 text-rose-400'
            }`}
          >
            {isVictory ? (
              <Trophy className="w-10 h-10 animate-pulse" />
            ) : (
              <Skull className="w-10 h-10 animate-bounce" />
            )}
          </div>
        </div>

        <h2 className="text-2xl font-bold tracking-wide text-white mb-1">
          {isVictory ? '太古遺跡・傳送通關！' : '力竭道消・探索中斷'}
        </h2>

        <p className="text-sm text-slate-300 mb-6">
          {isVictory
            ? '小雪踏入終極時空漩渦，成功帶著上古傳承與神物滿載而歸！'
            : '小雪在古遺跡深處遭遇強敵重創，靈力耗盡，靜待重整旗鼓。'}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 bg-black/40 p-4 rounded-xl border border-white/5 mb-6 text-left">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">耗費回合</span>
            <span className="text-lg font-bold text-amber-300 font-mono">{turns}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">斬滅妖物</span>
            <span className="text-lg font-bold text-rose-400 font-mono">{monstersKilled}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">搜獲寶箱</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">
              {chestsOpened} / {totalChests}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          {isVictory && nextLvl && (
            <button
              onClick={() => onRestart(nextLvl)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-sm shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              進階挑戰【{nextLvl === 'intermediate' ? '中級遺跡 100×100' : '高級遺跡 150×150'}】
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onRestart(currentLevel)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            {isVictory ? '重新探索本科地圖' : '再次啟程挑戰'}
          </button>

          {onReturnToMenu && (
            <button
              onClick={onReturnToMenu}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-sm font-medium border border-slate-800 transition-colors cursor-pointer"
            >
              返回選擇難度
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
