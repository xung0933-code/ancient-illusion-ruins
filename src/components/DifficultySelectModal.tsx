/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameLevelId } from '../game/types';
import { Compass, Sparkles, Sword, Play, X } from 'lucide-react';
import avatarImgUrl from '../assets/images/xiaoxue_avatar.png';

interface DifficultySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLevel: (levelId: GameLevelId) => void;
  currentLevel: GameLevelId;
}

export const DifficultySelectModal: React.FC<DifficultySelectModalProps> = ({
  isOpen,
  onClose,
  onSelectLevel,
  currentLevel,
}) => {
  if (!isOpen) return null;

  const levels = [
    {
      id: 'beginner' as GameLevelId,
      name: '初級迷宮',
      size: '50 × 50',
      totalTiles: '2,500 格',
      chests: 3,
      monsters: 10,
      description: '通路寬闊明朗，適合熟悉飛劍御劍術與五行相生機制。',
      badge: '入門歷練',
      bgGradient: 'from-emerald-950/80 to-slate-900',
      borderClass: 'border-emerald-500/40 hover:border-emerald-400',
      btnGradient: 'from-emerald-500 to-teal-400 text-slate-950',
      tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'intermediate' as GameLevelId,
      name: '中級迷宮',
      size: '100 × 100',
      totalTiles: '10,000 格',
      chests: 10,
      monsters: 20,
      description: '遺跡結構蜿蜒多變，守護妖魔盤據，考驗走位與探圖耐心。',
      badge: '推薦挑戰',
      bgGradient: 'from-sky-950/80 to-slate-900',
      borderClass: 'border-sky-500/50 hover:border-sky-400',
      btnGradient: 'from-sky-500 to-cyan-400 text-slate-950',
      tagColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    },
    {
      id: 'advanced' as GameLevelId,
      name: '高級迷宮',
      size: '150 × 150',
      totalTiles: '22,500 格',
      chests: 20,
      monsters: 50,
      description: '太古極致廣袤秘境，五行神物遍布，直面最強太古混沌巨龍。',
      badge: '太古絕境',
      bgGradient: 'from-amber-950/80 to-slate-900',
      borderClass: 'border-amber-500/50 hover:border-amber-400',
      btnGradient: 'from-amber-500 to-yellow-400 text-slate-950',
      tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
  ];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-2xl overflow-y-auto max-h-[92%]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="關閉"
          aria-label="關閉"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pr-8">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-cyan-400/80 shadow-[0_0_16px_rgba(56,189,248,0.3)] bg-slate-800 shrink-0">
            <img
              src={avatarImgUrl}
              alt="小雪"
              className="w-full h-full object-cover object-top"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="text-[11px] text-cyan-300 font-medium">隨機迷宮難度選擇</div>
            <h2 className="text-lg font-extrabold text-white leading-tight">選擇探索難度進入遺跡</h2>
          </div>
        </div>

        {/* 3 Difficulty Selection Cards (Vertical portrait stack) */}
        <div className="grid grid-cols-1 gap-3">
          {levels.map(lvl => {
            const isCurrent = currentLevel === lvl.id;
            return (
              <div
                key={lvl.id}
                className={`relative flex flex-col p-3.5 rounded-xl border bg-gradient-to-b ${lvl.bgGradient} ${lvl.borderClass} transition-all`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{lvl.name}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${lvl.tagColor}`}>
                      {lvl.badge}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                        當前
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-slate-400 tabular-nums">{lvl.size}</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-2.5">
                  {lvl.description}
                </p>

                <div className="flex items-center justify-between bg-black/40 rounded-lg px-2.5 py-1.5 border border-white/5 text-[11px] font-mono mb-3">
                  <span className="text-slate-300 flex items-center gap-1 tabular-nums">
                    <Compass className="w-3 h-3 text-indigo-400" />
                    {lvl.totalTiles}
                  </span>
                  <span className="text-yellow-300 flex items-center gap-1 font-bold tabular-nums">
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                    {lvl.chests} 寶箱
                  </span>
                  <span className="text-rose-300 flex items-center gap-1 font-bold tabular-nums">
                    <Sword className="w-3 h-3 text-rose-400" />
                    {lvl.monsters} 妖魔
                  </span>
                </div>

                <button
                  onClick={() => onSelectLevel(lvl.id)}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r ${lvl.btnGradient} shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  {isCurrent ? '重新生成' : '進入'}{lvl.name}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
