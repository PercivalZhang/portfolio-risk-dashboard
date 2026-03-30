import type { PortfolioAnalysis } from "@/lib/analysis";
import { Shield, AlertTriangle, CheckCircle2 } from "lucide-react";

export function DiversificationScore({ analysis }: { analysis: PortfolioAnalysis }) {
  const score = analysis.diversificationScore;
  const isLow = score < 70;

  // Score gauge ring
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference * (1 - score / 100);
  const gaugeColor = score >= 70 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Score gauge */}
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(220,12%,16%)" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={gaugeColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 1s ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums" style={{ color: gaugeColor }}>{score}</span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        </div>
        <div className="mt-3 text-center">
          <p className="text-sm font-semibold" style={{ color: gaugeColor }}>
            {score >= 70 ? "良好" : score >= 50 ? "一般" : "较差"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">多元化水平</p>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground mb-3">评分构成</p>
        <ScoreBar label="行业多样性" max={25} value={Math.min(new Set(analysis.positions.map(p => p.sector)).size / 6, 1) * 25} />
        <ScoreBar label="风格分散度" max={20} value={Math.min(new Set(analysis.selloffGroups.map(g => g.group)).size / 5, 1) * 20} />
        <ScoreBar label="集中度控制" max={25} value={Math.max(0, (100 - Math.max(...analysis.sectorBreakdown.map(s => s.pct))) / 70) * 25} />
        <ScoreBar label="相关性水平" max={20} value={Math.max(0, 1 - (analysis.highRiskPairs.length > 0 ? analysis.highRiskPairs.reduce((s, p) => s + p.correlation, 0) / analysis.highRiskPairs.length : 0.3)) * 20} />
        <ScoreBar label="持仓数量" max={10} value={Math.min(analysis.positions.length / 10, 1) * 10} />
      </div>

      {/* Recommendations */}
      <div className="space-y-3">
        {isLow ? (
          <>
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold">多元化不足 — 建议优化</span>
            </div>
            {analysis.trimRecommendations.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs font-medium text-amber-400 mb-1.5">建议减持:</p>
                <div className="flex gap-2 mb-2">
                  {analysis.trimRecommendations.map(t => (
                    <span key={t} className="inline-block text-xs font-mono font-bold bg-amber-500/20 text-amber-300 rounded px-2 py-0.5">
                      {t}
                    </span>
                  ))}
                </div>
                {analysis.diversificationAdvice && (
                  <p className="text-xs text-foreground/80 leading-relaxed">{analysis.diversificationAdvice}</p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-emerald-400">多元化水平良好</p>
              <p className="text-xs text-foreground/80 mt-1">组合在行业分布、风格分散和相关性控制方面表现合理。</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ label, max, value }: { label: string; max: number; value: number }) {
  const pct = (value / max) * 100;
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-foreground/80">{value.toFixed(0)}/{max}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
