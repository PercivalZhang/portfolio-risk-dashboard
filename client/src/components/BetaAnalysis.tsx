import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import type { PortfolioAnalysis } from "@/lib/analysis";

export function BetaAnalysis({ analysis }: { analysis: PortfolioAnalysis }) {
  const data = analysis.betas.map(b => ({
    ticker: b.ticker,
    beta: parseFloat(b.beta.toFixed(2)),
    weighted: parseFloat(b.weightedBeta.toFixed(3)),
  }));

  return (
    <div className="space-y-4">
      {/* Beta bar chart */}
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 5, right: 5, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,12%,16%)" vertical={false} />
            <XAxis dataKey="ticker" tick={{ fontSize: 10, fill: "hsl(215,12%,52%)" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(215,12%,52%)" }} domain={[0, "auto"]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 10%)",
                border: "1px solid hsl(220, 12%, 20%)",
                borderRadius: "8px",
                fontSize: "11px",
                color: "hsl(210, 20%, 92%)",
              }}
              formatter={(v: number, name: string) => [
                v.toFixed(2),
                name === "beta" ? "个股贝塔" : "加权贡献",
              ]}
            />
            <ReferenceLine y={1} stroke="hsl(215,12%,40%)" strokeDasharray="3 3" label={{ value: "S&P 500 (β=1.0)", fill: "hsl(215,12%,52%)", fontSize: 10, position: "insideTopRight" }} />
            <Bar dataKey="beta" radius={[4, 4, 0, 0]} barSize={28}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.beta > 1.3 ? "#ef4444" : entry.beta > 1.0 ? "#f59e0b" : "#22c55e"} opacity={0.75} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Portfolio beta summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">组合加权贝塔</p>
          <p className={`text-xl font-bold tabular-nums mt-1 ${
            analysis.portfolioBeta > 1.3 ? "text-red-400" : analysis.portfolioBeta > 1.0 ? "text-amber-400" : "text-emerald-400"
          }`}>
            {analysis.portfolioBeta.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">含义</p>
          <p className="text-xs text-foreground mt-2">
            {analysis.portfolioBeta > 1.3
              ? "组合波动显著高于大盘，下跌时承受更大损失"
              : analysis.portfolioBeta > 1.0
              ? "组合略高于大盘波动，风险适中"
              : "组合波动低于大盘，偏防御性配置"
            }
          </p>
        </div>
      </div>

      {/* Beta breakdown table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">代号</th>
              <th className="text-right py-1.5 px-2 text-muted-foreground font-medium">贝塔</th>
              <th className="text-right py-1.5 px-2 text-muted-foreground font-medium">加权贡献</th>
            </tr>
          </thead>
          <tbody>
            {analysis.betas.map((b, i) => (
              <tr key={i} className="border-b border-border/30">
                <td className="py-1.5 px-2 font-semibold">{b.ticker}</td>
                <td className={`py-1.5 px-2 text-right tabular-nums ${b.beta > 1.3 ? "text-red-400" : b.beta > 1.0 ? "text-amber-400" : "text-emerald-400"}`}>
                  {b.beta.toFixed(2)}
                </td>
                <td className="py-1.5 px-2 text-right tabular-nums text-muted-foreground">
                  {b.weightedBeta.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
