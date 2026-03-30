import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { PortfolioAnalysis } from "@/lib/analysis";
import { AlertTriangle } from "lucide-react";

export function RiskContribution({ analysis }: { analysis: PortfolioAnalysis }) {
  const data = analysis.riskContributions.map(r => ({
    ticker: r.ticker,
    pct: parseFloat(r.pct.toFixed(1)),
  }));

  const factorLabels: Record<string, string> = {
    interestRate: "利率敏感度",
    regulatory: "监管风险",
    singleCustomer: "单一客户依赖",
  };

  return (
    <div className="space-y-4">
      {/* Risk contribution bar chart */}
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 5, right: 5, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,12%,16%)" vertical={false} />
            <XAxis dataKey="ticker" tick={{ fontSize: 10, fill: "hsl(215,12%,52%)" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(215,12%,52%)" }} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 10%)",
                border: "1px solid hsl(220, 12%, 20%)",
                borderRadius: "8px",
                fontSize: "11px",
                color: "hsl(210, 20%, 92%)",
              }}
              formatter={(v: number) => [`${v.toFixed(1)}%`, "风险贡献"]}
            />
            <Bar dataKey="pct" radius={[4, 4, 0, 0]} barSize={28}>
              {data.map((entry, i) => (
                <Cell key={i} fill={i === 0 ? "#ef4444" : i === 1 ? "#f97316" : "#22c55e"} opacity={i === 0 ? 0.9 : 0.6} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top risk position callout */}
      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
        <div className="flex items-center gap-1.5 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span className="text-red-400 font-semibold">最大风险贡献: {analysis.topRiskPosition}</span>
          <span className="text-muted-foreground">
            ({analysis.riskContributions[0]?.pct.toFixed(1)}% 组合风险)
          </span>
        </div>
      </div>

      {/* Factor vulnerability table */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">因素脆弱性分析 (0-10)</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">代号</th>
                <th className="text-center py-1.5 px-2 text-muted-foreground font-medium">利率</th>
                <th className="text-center py-1.5 px-2 text-muted-foreground font-medium">监管</th>
                <th className="text-center py-1.5 px-2 text-muted-foreground font-medium">客户集中</th>
              </tr>
            </thead>
            <tbody>
              {analysis.factorVulnerabilities.map((f, i) => (
                <tr key={i} className="border-b border-border/30">
                  <td className="py-1.5 px-2 font-semibold">{f.ticker}</td>
                  <td className="py-1.5 px-2 text-center">
                    <FactorBadge value={f.interestRate} />
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    <FactorBadge value={f.regulatory} />
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    <FactorBadge value={f.singleCustomer} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Most vulnerable by factor */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <VulnCard label="利率最脆弱" ticker={analysis.mostVulnerable.interestRate} />
          <VulnCard label="监管最脆弱" ticker={analysis.mostVulnerable.regulatory} />
          <VulnCard label="客户集中最高" ticker={analysis.mostVulnerable.singleCustomer} />
        </div>
      </div>
    </div>
  );
}

function FactorBadge({ value }: { value: number }) {
  const color = value >= 8 ? "bg-red-500/20 text-red-400" : value >= 5 ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400";
  return (
    <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium tabular-nums ${color}`}>
      {value}
    </span>
  );
}

function VulnCard({ label, ticker }: { label: string; ticker: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-amber-400 mt-0.5">{ticker || "-"}</p>
    </div>
  );
}
