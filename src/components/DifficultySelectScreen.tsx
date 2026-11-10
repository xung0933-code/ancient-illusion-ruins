/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameLevelId } from '../game/types';
import gameConfig from '../game/game-config.json';
import { Compass, Sparkles, Shield, Sword, Play } from 'lucide-react';

interface DifficultySelectScreenProps {
  onSelectLevel: (levelId: GameLevelId) => void;
}

export const DifficultySelectScreen: React.FC<DifficultySelectScreenProps> = ({ onSelectLevel }) => {
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
      bgGradient: 'from-emerald-950/70 to-slate-900',
      borderClass: 'border-emerald-500/40 hover:border-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]',
      btnGradient: 'from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950',
      tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      accentColor: 'text-emerald-400',
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
      bgGradient: 'from-sky-950/70 to-slate-900',
      borderClass: 'border-sky-500/50 hover:border-sky-400 hover:shadow-[0_0_35px_rgba(56,189,248,0.35)]',
      btnGradient: 'from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950',
      tagColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      accentColor: 'text-sky-400',
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
      bgGradient: 'from-amber-950/70 to-slate-900',
      borderClass: 'border-amber-500/50 hover:border-amber-400 hover:shadow-[0_0_40px_rgba(245,158,11,0.35)]',
      btnGradient: 'from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950',
      tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      accentColor: 'text-amber-400',
    },
  ];

  return (
    <div className="relative w-screen h-screen overflow-y-auto bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 md:p-8 select-none">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-cyan-600/15 via-indigo-600/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-t from-emerald-600/10 to-transparent blur-3xl" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
        {/* Title & Xiao Xue Hero Banner */}
        <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 mb-8 text-center sm:text-left">
          {/* Portrait */}
          <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 border-cyan-400/80 shadow-[0_0_25px_rgba(56,189,248,0.4)] bg-slate-800 shrink-0">
            <img
              src="/public/assets/aistudio/_____3_be38311a.png"
              alt="小雪"
              className="w-full h-full object-cover object-top"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex flex-col">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-medium w-fit mx-auto sm:mx-0 mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>2D 俯視角 Roguelike 隨機迷宮探索</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-wider bg-gradient-to-r from-white via-cyan-100 to-sky-300 bg-clip-text text-transparent">
              幻變古遺跡
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-md">
              每次進入皆由古代陣法隨機生成迷宮。請選擇探索難度，直接踏入相應規模的秘境歷練。
            </p>
          </div>
        </div>

        {/* 3 Difficulty Selection Cards (Click directly enters the chosen map!) */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          {levels.map(lvl => (
            <div
              key={lvl.id}
              className={`relative flex flex-col justify-between p-5 md:p-6 rounded-2xl border bg-gradient-to-b ${lvl.bgGradient} ${lvl.borderClass} transition-all duration-300 group`}
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${lvl.tagColor}`}>
                    {lvl.badge}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{lvl.size}</span>
                </div>

                {/* Level Title */}
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  {lvl.name}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4 min-h-[36px]">
                  {lvl.description}
                </p>

                {/* Stats Breakdown */}
                <div className="space-y-1.5 bg-black/40 rounded-xl p-3 border border-white/5 text-xs font-mono mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                      <Compass className="w-3.5 h-3.5 text-indigo-400" />
                      總地圖格數
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

              {/* Direct Enter Button */}
              <button
                onClick={() => onSelectLevel(lvl.id)}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r ${lvl.btnGradient} shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer`}
              >
                <Play className="w-4 h-4 fill-current" />
                進入{lvl.name}
              </button>
            </div>
          ))}
        </div>

        {/* Quick Rules & Hotkeys Bar */}
        <div className="w-full bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800 p-4 text-xs text-slate-300 flex flex-wrap items-center justify-around gap-3 text-center">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-cyan-300">
              W A S D / 方向鍵
            </span>
            <span>四向移動</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-amber-300">
              J / 空白鍵
            </span>
            <span>飛劍御劍術 (正前一格近戰)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-emerald-300">
              E / Enter
            </span>
            <span>開箱 / 踏入時空漩渦</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-purple-300">
              1 ~ 5 鍵
            </span>
            <span>五行必殺技確認卡</span>
          </div>
        </div>
      </div>
    </div>
  );
};
