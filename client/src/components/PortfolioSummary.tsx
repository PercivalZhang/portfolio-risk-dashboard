import type { PortfolioAnalysis } from "@/lib/analysis";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Shield } from "lucide-react";

export function PortfolioSummary({ analysis }: { analysis: PortfolioAnalysis }) {
  const kpis = [
    {
      label: "总市值",
      value: `$${analysis.totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      icon: <DollarSign className="w-4 h-4" />,
      color: "text-foreground",
    },
    {
      label: "总盈亏",
      value: `${analysis.totalPnL >= 0 ? "+" : ""}$${Math.abs(analysis.totalPnL).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      sub: `${analysis.totalPnLPct >= 0 ? "+" : ""}${analysis.totalPnLPct.toFixed(2)}%`,
      icon: analysis.totalPnL >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />,
      color: analysis.totalPnL >= 0 ? "text-emerald-400" : "text-red-400",
    },
    {
      label: "组合贝塔",
      value: analysis.portfolioBeta.toFixed(2),
      sub: "vs S&P 500",
      icon: <BarChart3 className="w-4 h-4" />,
      color: analysis.portfolioBeta > 1.3 ? "text-red-400" : analysis.portfolioBeta < 0.8 ? "text-emerald-400" : "text-foreground",
    },
    {
      label: "多元化评分",
      value: `${analysis.diversificationScore}`,
      sub: "/100",
      icon: <Shield className="w-4 h-4" />,
      color: analysis.diversificationScore >= 70 ? "text-emerald-400" : analysis.diversificationScore >= 50 ? "text-amber-400" : "text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="portfolio-summary">
      {kpis.map((kpi, i) => (
        <div key={i} className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-muted-foreground">{kpi.icon}</span>
            <span className="text-xs text-muted-foreground">{kpi.label}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-xl font-bold tabular-nums ${kpi.color}`}>{kpi.value}</span>
            {kpi.sub && <span className="text-xs text-muted-foreground">{kpi.sub}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
