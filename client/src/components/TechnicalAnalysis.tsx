import type { PortfolioAnalysis } from "@/lib/analysis";
import { Target, TrendingUp, TrendingDown, Minus, AlertCircle, CircleCheck, AlertTriangle, Circle } from "lucide-react";

export function TechnicalAnalysis({ analysis }: { analysis: PortfolioAnalysis }) {
  const { technicalAnalysis } = analysis;

  return (
    <div className="space-y-5">
      {/* Moving Average Status */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          icon={<TrendingUp className="w-4 h-4" />}
          title="50日均线上方"
          tickers={technicalAnalysis.aboveSMA50}
          total={analysis.positions.length}
          color="emerald"
        />
        <StatCard 
          icon={<TrendingUp className="w-4 h-4" />}
          title="200日均线上方"
          tickers={technicalAnalysis.aboveSMA200}
          total={analysis.positions.length}
          color="blue"
        />
      </div>

      {/* 52-Week High/Low */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          icon={<Target className="w-4 h-4" />}
          title="接近52周新高 (5%)"
          tickers={technicalAnalysis.nearYearHigh}
          total={analysis.positions.length}
          color="emerald"
        />
        <StatCard 
          icon={<Minus className="w-4 h-4" />}
          title="接近52周新低 (20%)"
          tickers={technicalAnalysis.nearYearLow}
          total={analysis.positions.length}
          color="red"
        />
      </div>

      {/* Individual Stock Analysis */}
      <div>
        <h3 className="text-sm font-medium mb-3">个股技术分析</h3>
        <div className="space-y-2">
          {technicalAnalysis.smaAnalysis.map((item) => (
            <StockAnalysisRow 
              key={item.ticker} 
              item={item} 
              yearHighLow={technicalAnalysis.yearHighLowAnalysis.find(y => y.ticker === item.ticker)}
            />
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          * 债券类标的不参与技术指标溢出标识<br/>
          🔴 超出双均线上方 | 🟡 接近上方边界(5%) | 🟢 低于双均线下方 | ⚪ 接近下方边界(5%)
        </p>
      </div>
    </div>
  );
}

function StatCard({ 
  icon, 
  title, 
  tickers, 
  total,
  color 
}: { 
  icon: React.ReactNode; 
  title: string; 
  tickers: string[]; 
  total: number;
  color: string;
}) {
  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
    red: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  };
  
  const c = colorClasses[color] || colorClasses.emerald;
  
  return (
    <div className={`p-3 rounded-lg ${c.bg} border ${c.border}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={c.text}>{icon}</span>
        <span className="text-xs text-muted-foreground">{title}</span>
      </div>
      <p className="text-2xl font-semibold mb-1">
        {tickers.length}<span className="text-xs text-muted-foreground font-normal">/{total}</span>
      </p>
      <div className="flex flex-wrap gap-1">
        {tickers.slice(0, 4).map(t => (
          <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded ${c.bg} ${c.text}`}>
            {t}
          </span>
        ))}
        {tickers.length > 4 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            +{tickers.length - 4}
          </span>
        )}
      </div>
    </div>
  );
}

function StockAnalysisRow({ 
  item, 
  yearHighLow 
}: { 
  item: { ticker: string; sector: string; industry?: string; sma50: number | null; sma200: number | null; priceToSMA50: number | null; priceToSMA200: number | null };
  yearHighLow?: { ticker: string; priceToYearHigh: number; priceToYearLow: number };
}) {
  const signals: string[] = [];
  
  // Check if this is a bond-type stock (ignore overflow rules for bonds)
  const isBond = item.industry?.toLowerCase().includes('bond') || 
                 item.sector?.toLowerCase().includes('bond') ||
                 item.industry?.toLowerCase().includes('fixed income') ||
                 item.sector?.toLowerCase().includes('fixed income');
  
  // Determine overflow status relative to SMA50 and SMA200
  const p50 = item.priceToSMA50 ?? 0;
  const p200 = item.priceToSMA200 ?? 0;
  
  const isAboveSMA50 = p50 > 0;
  const isAboveSMA200 = p200 > 0;
  const isBelowSMA50 = p50 < 0;
  const isBelowSMA200 = p200 < 0;
  
  // Near boundary threshold: 5%
  const NEAR_THRESHOLD = 5;
  
  // Overflow above both SMAs (red alert) - only for non-bond stocks
  const isOverflowAbove = !isBond && isAboveSMA50 && isAboveSMA200;
  // Near above boundary (within 5% above either SMA) - yellow warning
  const isNearAbove = !isBond && !isOverflowAbove && (
    (isAboveSMA50 && p50 < NEAR_THRESHOLD) || 
    (isAboveSMA200 && p200 < NEAR_THRESHOLD)
  );
  
  // Overflow below both SMAs (green) - only for non-bond stocks  
  const isOverflowBelow = !isBond && isBelowSMA50 && isBelowSMA200;
  // Near below boundary (within 5% below either SMA) - light green
  const isNearBelow = !isBond && !isOverflowBelow && (
    (isBelowSMA50 && p50 > -NEAR_THRESHOLD) || 
    (isBelowSMA200 && p200 > -NEAR_THRESHOLD)
  );
  
  if (isAboveSMA50) signals.push("高于50日线");
  else if (item.priceToSMA50 !== null && item.priceToSMA50 < -5) signals.push("低于50日线");
  
  if (isAboveSMA200) signals.push("高于200日线");
  
  if (yearHighLow) {
    if (yearHighLow.priceToYearHigh > -5) signals.push("接近新高");
    if (yearHighLow.priceToYearLow < 20) signals.push("接近低位");
  }

  // Determine row background color
  const rowBgClass = isOverflowAbove 
    ? 'bg-red-500/10 border-red-500/30' 
    : isNearAbove 
      ? 'bg-amber-500/10 border-amber-500/30'
      : isOverflowBelow 
        ? 'bg-emerald-500/10 border-emerald-500/30' 
        : isNearBelow
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : 'bg-muted/30 border-border/50';

  return (
    <div className={`flex items-center justify-between p-2 rounded text-xs border ${rowBgClass}`}>
      <div className="flex items-center gap-2">
        {/* Overflow indicator icons - only for non-bond stocks */}
        {isOverflowAbove && (
          <AlertCircle className="w-4 h-4 text-red-500" title="价格高于50日和200日均线区间" />
        )}
        {isNearAbove && (
          <AlertTriangle className="w-4 h-4 text-amber-500" title="价格接近上方边界（5%以内）" />
        )}
        {isOverflowBelow && (
          <CircleCheck className="w-4 h-4 text-emerald-500" title="价格低于50日和200日均线区间" />
        )}
        {isNearBelow && (
          <Circle className="w-4 h-4 text-emerald-500/80" title="价格接近下方边界（5%以内）" />
        )}
        {isBond && (
          <span className="text-[10px] text-muted-foreground px-1 py-0.5 bg-muted rounded" title="债券类标的">BOND</span>
        )}
        <span className="font-medium w-16">{item.ticker}</span>
      </div>
      <div className="flex items-center gap-3 flex-1">
        {item.priceToSMA50 !== null && (
          <span className={item.priceToSMA50 > 0 ? "text-emerald-400" : "text-red-400"}>
            50日: {item.priceToSMA50 > 0 ? "+" : ""}{item.priceToSMA50.toFixed(1)}%
          </span>
        )}
        {item.priceToSMA200 !== null && (
          <span className={item.priceToSMA200 > 0 ? "text-emerald-400" : "text-red-400"}>
            200日: {item.priceToSMA200 > 0 ? "+" : ""}{item.priceToSMA200.toFixed(1)}%
          </span>
        )}
        {yearHighLow && (
          <>
            <span className={yearHighLow.priceToYearHigh > -5 ? "text-emerald-400" : "text-muted-foreground"}>
              52周高: {yearHighLow.priceToYearHigh.toFixed(1)}%
            </span>
            <span className={yearHighLow.priceToYearLow < 20 ? "text-red-400" : "text-muted-foreground"}>
              52周低: +{yearHighLow.priceToYearLow.toFixed(1)}%
            </span>
          </>
        )}
      </div>
      {signals.length > 0 && (
        <div className="flex gap-1">
          {signals.map((s, i) => (
            <span key={i} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]">
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
