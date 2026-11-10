/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SpellConfig } from '../game/types';
import { Sparkles, Shield, Flame, Mountain, Crosshair, X, Play } from 'lucide-react';

interface SkillConfirmationModalProps {
  spell: SpellConfig | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SkillConfirmationModal: React.FC<SkillConfirmationModalProps> = ({
  spell,
  onConfirm,
  onCancel,
}) => {
  if (!spell) return null;

  const getElementTheme = (element: string) => {
    switch (element) {
      case 'wood':
        return {
          bg: 'from-emerald-950 via-slate-900 to-emerald-900',
          border: 'border-emerald-500/60',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
          icon: <Sparkles className="w-10 h-10 text-emerald-400 animate-pulse" />,
          glow: 'shadow-[0_0_35px_rgba(16,185,129,0.3)]',
          btnBg: 'bg-emerald-600 hover:bg-emerald-500 text-white',
        };
      case 'metal':
        return {
          bg: 'from-amber-950 via-slate-900 to-yellow-950',
          border: 'border-amber-400/70',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
          icon: <Crosshair className="w-10 h-10 text-amber-300 animate-pulse" />,
          glow: 'shadow-[0_0_35px_rgba(245,158,11,0.3)]',
          btnBg: 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold',
        };
      case 'water':
        return {
          bg: 'from-sky-950 via-slate-900 to-cyan-950',
          border: 'border-cyan-400/70',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
          icon: <Shield className="w-10 h-10 text-cyan-400 animate-pulse" />,
          glow: 'shadow-[0_0_35px_rgba(6,182,212,0.3)]',
          btnBg: 'bg-cyan-600 hover:bg-cyan-500 text-white',
        };
      case 'fire':
        return {
          bg: 'from-rose-950 via-slate-900 to-red-950',
          border: 'border-red-500/70',
          badge: 'bg-red-500/20 text-red-300 border-red-400/40',
          icon: <Flame className="w-10 h-10 text-red-400 animate-pulse" />,
          glow: 'shadow-[0_0_35px_rgba(239,68,68,0.35)]',
          btnBg: 'bg-red-600 hover:bg-red-500 text-white',
        };
      case 'earth':
      default:
        return {
          bg: 'from-yellow-950 via-slate-900 to-amber-950',
          border: 'border-yellow-500/70',
          badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40',
          icon: <Mountain className="w-10 h-10 text-yellow-400 animate-pulse" />,
          glow: 'shadow-[0_0_35px_rgba(234,179,8,0.35)]',
          btnBg: 'bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold',
        };
    }
  };

  const theme = getElementTheme(spell.element);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-md bg-gradient-to-b ${theme.bg} rounded-2xl border ${theme.border} ${theme.glow} p-6 text-slate-100 overflow-hidden shadow-2xl`}
      >
        {/* Subtle decorative ancient rune backdrop */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        {/* Header with Element Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${theme.badge}`}>
              五行之【{spell.elementName}】
            </span>
            <span className="text-xs text-slate-400">必殺技發動確認</span>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="關閉"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Central Card Body */}
        <div className="flex flex-col items-center text-center my-6">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 mb-4 shadow-inner">
            {theme.icon}
          </div>

          <h2 className="text-xl font-bold tracking-wide text-white mb-2">
            {spell.title}
          </h2>

          <p className="text-sm leading-relaxed text-slate-300 bg-black/30 p-4 rounded-xl border border-white/5 max-w-sm">
            {spell.description}
          </p>

          <div className="mt-4 text-xs text-amber-300/80 bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-500/20">
            ⚠️ 點擊【發動】將消耗 1 次充能並消耗 1 個遊戲回合，怪物將隨後行動。
          </div>
        </div>

        {/* Action Buttons: Strict requirement from GDD (發動 & 取消) */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onCancel}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700 transition-colors"
          >
            取消 (保留充能)
          </button>
          <button
            onClick={onConfirm}
            className={`py-2.5 px-4 rounded-xl ${theme.btnBg} text-sm font-semibold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-1.5`}
          >
            <Play className="w-4 h-4 fill-current" />
            發動必殺技
          </button>
        </div>
      </div>
    </div>
  );
};
