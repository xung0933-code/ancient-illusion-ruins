/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sword, Shield, Sparkles, Check } from 'lucide-react';

interface ChestRewardModalProps {
  reward: {
    type: 'attack' | 'defense' | 'spell';
    value?: number;
    spellTitle?: string;
  } | null;
  onClose: () => void;
}

export const ChestRewardModal: React.FC<ChestRewardModalProps> = ({ reward, onClose }) => {
  if (!reward) return null;

  const renderContent = () => {
    switch (reward.type) {
      case 'attack':
        return {
          icon: <Sword className="w-12 h-12 text-amber-400 animate-bounce" />,
          title: '獲得遺跡神兵煞氣！',
          desc: `基礎攻擊力永久提升 +${reward.value} 點（當次探索有效）`,
          color: 'from-amber-950 via-slate-900 to-yellow-900 border-amber-500/50',
        };
      case 'defense':
        return {
          icon: <Shield className="w-12 h-12 text-cyan-400 animate-bounce" />,
          title: '獲得玄武靈甲庇護！',
          desc: `基礎防禦力永久提升 +${reward.value} 點（當次探索有效）`,
          color: 'from-cyan-950 via-slate-900 to-sky-900 border-cyan-500/50',
        };
      case 'spell':
        return {
          icon: <Sparkles className="w-12 h-12 text-purple-400 animate-bounce" />,
          title: '五行神威共鳴！',
          desc: `必殺技【${reward.spellTitle}】已充能完畢，按鈕已亮起！`,
          color: 'from-purple-950 via-slate-900 to-indigo-900 border-purple-500/50',
        };
    }
  };

  const info = renderContent();

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm">
      <div
        className={`w-full max-w-sm bg-gradient-to-b ${info.color} rounded-2xl border p-5 text-center shadow-2xl`}
      >
        <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center">
          {info.icon}
        </div>

        <h3 className="text-lg font-bold text-white mb-2">{info.title}</h3>
        <p className="text-sm text-slate-300 mb-6 bg-black/40 p-3 rounded-xl border border-white/5">
          {info.desc}
        </p>

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          納入靈元 (繼續探索)
        </button>
      </div>
    </div>
  );
};
