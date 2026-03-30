import { useState } from "react";
import type { PortfolioAnalysis } from "@/lib/analysis";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

function getCorrelationColor(value: number): string {
  if (value >= 0.7) return "bg-red-500/80";
  if (value >= 0.5) return "bg-amber-500/50";
  if (value >= 0.3) return "bg-amber-500/25";
  if (value >= 0) return "bg-emerald-500/20";
  return "bg-blue-500/30";
}

function getCorrelationTextColor(value: number): string {
  if (value >= 0.7) return "text-red-300 font-bold";
  if (value >= 0.5) return "text-amber-300";
  return "text-foreground/70";
}

export function CorrelationMatrix({ analysis }: { analysis: PortfolioAnalysis }) {
  return (
    <Tabs defaultValue="sector" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="sector">板块相关性</TabsTrigger>
        <TabsTrigger value="industry">行业相关性</TabsTrigger>
      </TabsList>
      
      <TabsContent value="sector">
        <SectorCorrelationMatrix analysis={analysis} />
      </TabsContent>
      
      <TabsContent value="industry">
        <IndustryCorrelationMatrix analysis={analysis} />
      </TabsContent>
    </Tabs>
  );
}

function SectorCorrelationMatrix({ analysis }: { analysis: PortfolioAnalysis }) {
  const { tickers, matrix } = analysis.correlationMatrix;
  const n = tickers.length;

  if (n === 0) return null;
  if (n > 12) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">持仓较多，仅展示高风险配对 (相关系数 &gt; 0.7)</p>
        <HighRiskPairsList analysis={analysis} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">基于市场板块（抛售联动组）的相关性分析</p>
      <TooltipProvider delayDuration={100}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-16" />
                {tickers.map(t => (
                  <th key={t} className="text-center text-xs font-medium text-muted-foreground p-1 min-w-[52px]">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickers.map((t1, i) => (
                <tr key={t1}>
                  <td className="text-xs font-medium text-muted-foreground pr-2 text-right">{t1}</td>
                  {tickers.map((t2, j) => {
                    const val = matrix[i][j];
                    const isHighRisk = val > 0.7 && i !== j;
                    const isDiagonal = i === j;
                    return (
                      <td key={t2} className="p-0.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`correlation-cell rounded-md text-center text-xs tabular-nums py-2 px-1 cursor-default
                                ${isDiagonal ? "bg-foreground/10" : getCorrelationColor(val)}
                                ${isHighRisk ? "ring-1 ring-red-400/60" : ""}
                              `}
                            >
                              <span className={isDiagonal ? "text-muted-foreground" : getCorrelationTextColor(val)}>
                                {val.toFixed(2)}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-popover border-border text-xs">
                            <p>{t1} × {t2}: {val.toFixed(3)}</p>
                            {isHighRisk && <p className="text-red-400 font-semibold">高风险配对</p>}
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TooltipProvider>

      {analysis.highRiskPairs.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-red-400 mb-2">高风险配对 (相关系数 &gt; 0.7)</p>
          <HighRiskPairsList analysis={analysis} />
        </div>
      )}
    </div>
  );
}

function IndustryCorrelationMatrix({ analysis }: { analysis: PortfolioAnalysis }) {
  const { tickers, matrix, industries } = analysis.industryCorrelationMatrix;
  const n = tickers.length;

  if (n === 0) return null;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">基于细分行业分类的相关性分析（融合板块与行业数据）</p>
      
      {/* Industry breakdown summary */}
      {analysis.industryBreakdown.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">行业分布</p>
          <div className="flex flex-wrap gap-2">
            {analysis.industryBreakdown.map((item, i) => (
              <div 
                key={i} 
                className="text-xs bg-muted/50 rounded-full px-2 py-1 border border-border/50"
                title={`${item.tickers.join(", ")}: $${item.totalValue.toLocaleString()}`}
              >
                <span className="font-medium">{item.industry || "未知行业"}</span>
                <span className="text-muted-foreground ml-1">({item.tickers.length}) {item.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {n > 12 ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">持仓较多，仅展示行业高风险配对 (相关系数 &gt; 0.75)</p>
          <IndustryHighRiskPairsList analysis={analysis} />
        </div>
      ) : (
        <>
          <TooltipProvider delayDuration={100}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="w-20" />
                    {tickers.map((t, idx) => (
                      <th key={t} className="text-center text-xs font-medium text-muted-foreground p-1 min-w-[52px]">
                        <div>{t}</div>
                        <div className="text-[10px] text-muted-foreground/70 truncate max-w-[60px]">
                          {industries[idx] || "-"}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickers.map((t1, i) => (
                    <tr key={t1}>
                      <td className="text-xs font-medium text-muted-foreground pr-2 text-right">
                        <div>{t1}</div>
                        <div className="text-[10px] text-muted-foreground/70 truncate max-w-[70px]">
                          {industries[i] || "-"}
                        </div>
                      </td>
                      {tickers.map((t2, j) => {
                        const val = matrix[i][j];
                        const isHighRisk = val > 0.75 && i !== j;
                        const isDiagonal = i === j;
                        return (
                          <td key={t2} className="p-0.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`correlation-cell rounded-md text-center text-xs tabular-nums py-2 px-1 cursor-default
                                    ${isDiagonal ? "bg-foreground/10" : getCorrelationColor(val)}
                                    ${isHighRisk ? "ring-1 ring-red-400/60" : ""}
                                  `}
                                >
                                  <span className={isDiagonal ? "text-muted-foreground" : getCorrelationTextColor(val)}>
                                    {val.toFixed(2)}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-popover border-border text-xs max-w-[200px]">
                                <p className="font-semibold">{t1} × {t2}</p>
                                <p className="text-muted-foreground">{industries[i] || "未知"} × {industries[j] || "未知"}</p>
                                <p className="font-mono mt-1">相关系数: {val.toFixed(3)}</p>
                                {isHighRisk && <p className="text-red-400 font-semibold mt-1">⚠️ 行业高风险配对</p>}
                              </TooltipContent>
                            </Tooltip>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TooltipProvider>

          {analysis.industryHighRiskPairs.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-red-400 mb-2">行业高风险配对 (相关系数 &gt; 0.75)</p>
              <IndustryHighRiskPairsList analysis={analysis} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function HighRiskPairsList({ analysis }: { analysis: PortfolioAnalysis }) {
  const [showAll, setShowAll] = useState(false);
  const pairs = analysis.highRiskPairs;
  const hasMore = pairs.length > 2;
  const displayPairs = showAll ? pairs : pairs.slice(0, 2);
  
  return (
    <div className="space-y-1.5">
      {displayPairs.map((pair, i) => (
        <div key={i} className="flex items-center justify-between text-xs bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20" data-testid={`high-risk-pair-${i}`}>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{pair.ticker1}</span>
            <span className="text-muted-foreground">×</span>
            <span className="font-semibold">{pair.ticker2}</span>
          </div>
          <span className="text-red-400 font-bold tabular-nums">{pair.correlation.toFixed(2)}</span>
        </div>
      ))}
      {pairs.length === 0 && (
        <p className="text-xs text-emerald-400">没有高风险配对</p>
      )}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-3 h-3 mr-1" />
              收起
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3 mr-1" />
              更多 ({pairs.length - 2}条)
            </>
          )}
        </Button>
      )}
    </div>
  );
}

function IndustryHighRiskPairsList({ analysis }: { analysis: PortfolioAnalysis }) {
  const [showAll, setShowAll] = useState(false);
  const pairs = analysis.industryHighRiskPairs;
  const hasMore = pairs.length > 2;
  const displayPairs = showAll ? pairs : pairs.slice(0, 2);
  
  return (
    <div className="space-y-1.5">
      {displayPairs.map((pair, i) => (
        <div key={i} className="flex items-center justify-between text-xs bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <span className="font-semibold">{pair.ticker1}</span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{pair.ticker1Industry || "-"}</span>
            </div>
            <span className="text-muted-foreground">×</span>
            <div className="flex flex-col">
              <span className="font-semibold">{pair.ticker2}</span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{pair.ticker2Industry || "-"}</span>
            </div>
          </div>
          <span className="text-red-400 font-bold tabular-nums">{pair.correlation.toFixed(2)}</span>
        </div>
      ))}
      {pairs.length === 0 && (
        <p className="text-xs text-emerald-400">没有行业高风险配对</p>
      )}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-3 h-3 mr-1" />
              收起
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3 mr-1" />
              更多 ({pairs.length - 2}条)
            </>
          )}
        </Button>
      )}
    </div>
  );
}
