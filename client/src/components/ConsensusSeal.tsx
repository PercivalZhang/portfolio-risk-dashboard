import type { Grades } from "@shared/schema";

interface ConsensusSealProps {
  consensus: Grades['consensus'];
}

// 印章配置
const sealConfig: Record<string, {
  label: string;
  shortLabel: string;
  gradient: string;
  shadow: string;
}> = {
  'Strong Buy': {
    label: '强烈买入',
    shortLabel: '强买',
    gradient: 'from-emerald-600 via-emerald-500 to-emerald-600',
    shadow: 'shadow-emerald-900/40',
  },
  'Buy': {
    label: '买入',
    shortLabel: '买入',
    gradient: 'from-emerald-500 via-emerald-400 to-emerald-500',
    shadow: 'shadow-emerald-900/40',
  },
  'Hold': {
    label: '持有',
    shortLabel: '持有',
    gradient: 'from-amber-500 via-amber-400 to-amber-500',
    shadow: 'shadow-amber-900/40',
  },
  'Sell': {
    label: '卖出',
    shortLabel: '卖出',
    gradient: 'from-orange-500 via-orange-400 to-orange-500',
    shadow: 'shadow-orange-900/40',
  },
  'Strong Sell': {
    label: '强烈卖出',
    shortLabel: '强卖',
    gradient: 'from-red-600 via-red-500 to-red-600',
    shadow: 'shadow-red-900/40',
  },
  'N/A': {
    label: '暂无评级',
    shortLabel: '无',
    gradient: 'from-slate-500 via-slate-400 to-slate-500',
    shadow: 'shadow-slate-900/40',
  },
};

// 正式徽章 - 紧贴详情页顶部，醒目有质感
export function ConsensusWatermark({ consensus }: ConsensusSealProps) {
  const config = sealConfig[consensus] || sealConfig['N/A'];

  return (
    <div className="relative flex flex-col items-center -mt-6">
      {/* 主徽章体 */}
      <div 
        className={`
          relative
          px-5 py-2.5
          bg-gradient-to-b ${config.gradient}
          ${config.shadow}
          shadow-[0_8px_30px_rgba(0,0,0,0.35)]
          rounded-b-xl
          border-x-2 border-b-2 border-white/20
          min-w-[90px]
          text-center
          overflow-hidden
        `}
      >
        {/* 顶部高光 */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/60" />
        
        {/* 内部光泽效果 */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
        
        {/* 斜向光泽 */}
        <div className="absolute -inset-full top-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] animate-shimmer pointer-events-none" />
        
        {/* 徽章文字 */}
        <span className="
          relative z-10
          block
          text-sm font-black
          text-white
          tracking-widest
          drop-shadow-lg
          whitespace-nowrap
        ">
          {config.label}
        </span>
        
        {/* 底部装饰线 */}
        <div className="absolute bottom-1.5 left-4 right-4 h-[1px] bg-white/20 rounded-full" />
      </div>
      
      {/* 底部投影 */}
      <div className={`
        w-16 h-3 
        bg-gradient-to-b from-black/50 to-transparent 
        blur-md 
        -mt-1
        rounded-full
      `} />
    </div>
  );
}

// 小型徽章样式（用于卡片展示）
export function ConsensusSealSmall({ consensus }: ConsensusSealProps) {
  const config = sealConfig[consensus] || sealConfig['N/A'];

  return (
    <span className={`
      inline-flex items-center justify-center
      w-9 h-9 rounded-full
      bg-gradient-to-br ${config.gradient}
      text-white text-[10px] font-bold
      shadow-lg ${config.shadow}
      border border-white/20
    `}>
      {config.shortLabel}
    </span>
  );
}

// 简洁徽章样式
export function ConsensusBadge({ consensus }: ConsensusSealProps) {
  const config = sealConfig[consensus] || sealConfig['N/A'];

  return (
    <span className={`
      inline-flex items-center px-3 py-1 rounded-md text-xs font-bold
      bg-gradient-to-r ${config.gradient}
      text-white
      shadow-md ${config.shadow}
      border border-white/10
    `}>
      {config.label}
    </span>
  );
}
