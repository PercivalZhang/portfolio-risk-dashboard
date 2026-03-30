import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { PortfolioAnalysis } from "@/lib/analysis";

export function DrawdownAnalysis({ analysis }: { analysis: PortfolioAnalysis }) {
  const barData = analysis.drawdowns.map(d => ({
    ticker: d.ticker,
    "1年": d.d1Y,
    "3年": d.d3Y,
    "5年": d.d5Y,
  }));

  return (
    <div className="space-y-4">
      {/* Per-position drawdown chart */}
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} layout="vertical" margin={{ left: 40, right: 10, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,12%,16%)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: "hsl(215,12%,52%)" }}
              tickFormatter={(v: number) => `${v}%`}
              domain={["dataMin", 0]}
            />
            <YAxis
              type="category"
              dataKey="ticker"
              tick={{ fontSize: 10, fill: "hsl(215,12%,52%)" }}
              width={36}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 10%)",
                border: "1px solid hsl(220, 12%, 20%)",
                borderRadius: "8px",
                fontSize: "11px",
                color: "hsl(210, 20%, 92%)",
              }}
              formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
            />
            <Bar dataKey="1年" fill="#ef4444" opacity={0.9} radius={[0, 2, 2, 0]} barSize={6} />
            <Bar dataKey="3年" fill="#f97316" opacity={0.7} radius={[0, 2, 2, 0]} barSize={6} />
            <Bar dataKey="5年" fill="#eab308" opacity={0.5} radius={[0, 2, 2, 0]} barSize={6} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs justify-center">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" />1年最大回撤</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-orange-500" />3年最大回撤</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-500" />5年最大回撤</span>
      </div>

      {/* Stress test scenarios */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        <StressCard
          title="2022 科技抛售模拟"
          value={analysis.portfolioDrawdown2022}
          description="科技-30%、半导体-38%、能源+25%"
        />
        <StressCard
          title="2020 疫情崩盘模拟"
          value={analysis.portfolioDrawdown2020}
          description="全面抛售、能源-55%、金融-38%"
        />
      </div>
    </div>
  );
}

function StressCard({ title, value, description }: { title: string; value: number; description: string }) {
  const severity = value < -25 ? "border-red-500/40 bg-red-500/10" : value < -15 ? "border-amber-500/40 bg-amber-500/10" : "border-emerald-500/40 bg-emerald-500/10";
  return (
    <div className={`rounded-lg border p-3 ${severity}`} data-testid={`stress-${title}`}>
      <p className="text-xs font-semibold mb-1">{title}</p>
      <p className={`text-lg font-bold tabular-nums ${value < -25 ? "text-red-400" : value < -15 ? "text-amber-400" : "text-emerald-400"}`}>
        {value.toFixed(1)}%
      </p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
