import type { PortfolioAnalysis } from "@/lib/analysis";

const GROUP_COLORS: Record<string, string> = {
  "Big Tech": "border-blue-500/40 bg-blue-500/10",
  "Semiconductors": "border-purple-500/40 bg-purple-500/10",
  "Financials": "border-amber-500/40 bg-amber-500/10",
  "Defensive": "border-emerald-500/40 bg-emerald-500/10",
  "Energy/Commodities": "border-orange-500/40 bg-orange-500/10",
  "High Beta Growth": "border-red-500/40 bg-red-500/10",
  "Healthcare": "border-cyan-500/40 bg-cyan-500/10",
  "Other": "border-gray-500/40 bg-gray-500/10",
};

const GROUP_LABELS: Record<string, string> = {
  "Big Tech": "大型科技",
  "Semiconductors": "半导体",
  "Financials": "金融",
  "Defensive": "防御性",
  "Energy/Commodities": "能源/大宗商品",
  "High Beta Growth": "高贝塔成长",
  "Healthcare": "医疗保健",
  "Other": "其他",
};

export function SelloffGroups({ analysis }: { analysis: PortfolioAnalysis }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">抛售时同步波动的持仓分组</p>
      {analysis.selloffGroups.map((group, i) => (
        <div
          key={i}
          className={`rounded-lg border p-3 ${GROUP_COLORS[group.group] || GROUP_COLORS["Other"]}`}
          data-testid={`selloff-group-${i}`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold">
              {GROUP_LABELS[group.group] || group.group}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              ${group.totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {group.tickers.map(t => (
              <span key={t} className="inline-block text-xs font-mono bg-background/40 rounded px-1.5 py-0.5">
                {t}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
