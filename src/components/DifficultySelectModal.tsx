/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameLevelId } from '../game/types';
import { Compass, Sparkles, Sword, Play, X } from 'lucide-react';

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
      borderClass: 'border-emerald-500/40 hover:border-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]',
      btnGradient: 'from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950',
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
      borderClass: 'border-sky-500/50 hover:border-sky-400 hover:shadow-[0_0_35px_rgba(56,189,248,0.35)]',
      btnGradient: 'from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950',
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
      borderClass: 'border-amber-500/50 hover:border-amber-400 hover:shadow-[0_0_40px_rgba(245,158,11,0.35)]',
      btnGradient: 'from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950',
      tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900/95 border border-slate-700/80 rounded-3xl p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="關閉"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 text-center sm:text-left">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-cyan-400/80 shadow-[0_0_20px_rgba(56,189,248,0.3)] bg-slate-800 shrink-0">
            <img
              src="/public/assets/aistudio/_____3_be38311a.png"
              alt="小雪"
              className="w-full h-full object-cover object-top"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-medium mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>隨機迷宮難度選擇</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">選擇探索難度進入遺跡</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              選擇相應級別將隨機生成全新古遺跡地圖。遊戲進行中不會有誤觸換圖按鈕。
            </p>
          </div>
        </div>

        {/* 3 Difficulty Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {levels.map(lvl => {
            const isCurrent = currentLevel === lvl.id;
            return (
              <div
                key={lvl.id}
                className={`relative flex flex-col justify-between p-5 rounded-2xl border bg-gradient-to-b ${lvl.bgGradient} ${lvl.borderClass} transition-all duration-300`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${lvl.tagColor}`}>
                      {lvl.badge}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{lvl.size}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    {lvl.name}
                    {isCurrent && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-normal">
                        當前
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4 min-h-[36px]">
                    {lvl.description}
                  </p>

                  <div className="space-y-1 bg-black/40 rounded-xl p-3 border border-white/5 text-xs font-mono mb-5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                        <Compass className="w-3.5 h-3.5 text-indigo-400" />
                        地圖規模
                      </span>
                      <span className="text-slate-200">{lvl.totalTiles}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                        守護寶箱
                      </span>
                      <span className="text-yellow-300 font-bold">{lvl.chests} 個</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                        <Sword className="w-3.5 h-3.5 text-rose-400" />
                        普通妖魔
                      </span>
                      <span className="text-rose-300 font-bold">{lvl.monsters} 隻</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectLevel(lvl.id)}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r ${lvl.btnGradient} shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer`}
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
