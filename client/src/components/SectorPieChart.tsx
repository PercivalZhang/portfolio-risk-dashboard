import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { PortfolioAnalysis } from "@/lib/analysis";
import { AlertTriangle } from "lucide-react";

const COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444", "#06b6d4", "#f97316", "#ec4899", "#84cc16", "#6366f1"];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      name: string;
      value: number;
      tickers: string[];
      sector: string;
    };
  }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        style={{
          backgroundColor: "hsl(220, 18%, 10%)",
          border: "1px solid hsl(220, 12%, 20%)",
          borderRadius: "8px",
          padding: "8px 12px",
          fontSize: "12px",
          color: "hsl(210, 20%, 92%)",
          maxWidth: "200px",
        }}
      >
        <p style={{ fontWeight: 600, marginBottom: "4px" }}>{data.name}</p>
        <p style={{ color: "hsl(215, 12%, 70%)", marginBottom: "4px" }}>
          占比: <span style={{ color: "hsl(210, 20%, 92%)", fontWeight: 500 }}>{data.value.toFixed(1)}%</span>
        </p>
        <p style={{ color: "hsl(215, 12%, 60%)", fontSize: "11px", marginBottom: "2px" }}>包含股票:</p>
        <p style={{ fontSize: "11px", wordBreak: "break-all", lineHeight: "1.4" }}>
          {data.tickers.join(", ")}
        </p>
      </div>
    );
  }
  return null;
}

export function SectorPieChart({ analysis }: { analysis: PortfolioAnalysis }) {
  const data = analysis.sectorBreakdown.map((s, i) => ({
    name: s.sectorCN,
    value: parseFloat(s.pct.toFixed(2)),
    tickers: s.tickers,
    sector: s.sector,
    fill: COLORS[i % COLORS.length],
    warning: s.warning,
  }));

  const warningSectors = analysis.sectorBreakdown.filter(s => s.warning);

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="w-full lg:w-1/2 h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} opacity={entry.warning ? 1 : 0.75} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 space-y-1.5">
        {data.map((s, i) => (
          <div 
            key={i} 
            className="flex items-center justify-between text-xs group cursor-pointer" 
            data-testid={`sector-${i}`}
            title={`包含: ${s.tickers.join(", ")}`}
          >
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.fill }} />
              <span className={s.warning ? "text-amber-400 font-semibold" : "text-foreground"}>{s.name}</span>
              {s.warning && <AlertTriangle className="w-3 h-3 text-amber-400" />}
            </div>
            <div className="text-right">
              <span className={`tabular-nums font-medium ${s.warning ? "text-amber-400" : "text-muted-foreground"}`}>
                {s.value.toFixed(1)}%
              </span>
              <span className="text-[10px] text-muted-foreground/60 ml-1 group-hover:text-muted-foreground transition-colors">
                ({s.tickers.length}只)
              </span>
            </div>
          </div>
        ))}

        {warningSectors.length > 0 && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="font-semibold">行业集中度警告</span>
            </div>
            <p className="text-xs text-amber-400/80 mt-1">
              {warningSectors.map(s => s.sectorCN).join("、")} 超过 30% 阈值，建议分散配置
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
