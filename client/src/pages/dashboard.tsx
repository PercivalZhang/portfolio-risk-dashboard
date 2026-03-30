import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { analyzePortfolio } from "@/lib/analysis";
import type { Holding } from "@shared/schema";
import { HoldingsInput } from "@/components/HoldingsInput";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { CorrelationMatrix } from "@/components/CorrelationMatrix";
import { SectorPieChart } from "@/components/SectorPieChart";
import { DrawdownAnalysis } from "@/components/DrawdownAnalysis";
import { RiskContribution } from "@/components/RiskContribution";
import { BetaAnalysis } from "@/components/BetaAnalysis";
import { DiversificationScore } from "@/components/DiversificationScore";
import { SelloffGroups } from "@/components/SelloffGroups";
import { TechnicalAnalysis } from "@/components/TechnicalAnalysis";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import { Shield, TrendingDown, PieChart, Activity, BarChart3, Target, AlertTriangle, TrendingUp } from "lucide-react";
import { useMemo } from "react";

export default function Dashboard() {
  const { data: holdings = [], isLoading } = useQuery<Holding[]>({
    queryKey: ["/api/holdings"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/holdings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holdings"] });
    },
  });

  const analysis = useMemo(() => analyzePortfolio(holdings), [holdings]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">Portfolio Risk Analyzer</h1>
              <p className="text-xs text-muted-foreground">投资组合风险分析仪表板</p>
            </div>
          </div>
          {analysis && (
            <div className="flex items-center gap-4 text-xs tabular-nums">
              <div>
                <span className="text-muted-foreground">总市值</span>
                <span className="ml-2 font-semibold">${analysis.totalValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              </div>
              <div>
                <span className="text-muted-foreground">盈亏</span>
                <span className={`ml-2 font-semibold ${analysis.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {analysis.totalPnL >= 0 ? "+" : ""}{analysis.totalPnLPct.toFixed(2)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Holdings Input */}
        <HoldingsInput holdings={holdings} onDelete={(id) => deleteMutation.mutate(id)} />

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        {!isLoading && !analysis && (
          <div className="text-center py-20">
            <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">添加持仓后开始分析</p>
            <p className="text-muted-foreground/60 text-xs mt-1">输入股票代号、股数和成本价格</p>
          </div>
        )}

        {analysis && (
          <>
            <PortfolioSummary analysis={analysis} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SectionCard icon={<Activity className="w-4 h-4" />} title="相关性矩阵" subtitle="Correlation Matrix">
                  <CorrelationMatrix analysis={analysis} />
                </SectionCard>
              </div>
              <div>
                <SectionCard icon={<AlertTriangle className="w-4 h-4" />} title="抛售联动分组" subtitle="Selloff Groups">
                  <SelloffGroups analysis={analysis} />
                </SectionCard>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SectionCard icon={<PieChart className="w-4 h-4" />} title="行业集中度" subtitle="Sector Concentration">
                <SectorPieChart analysis={analysis} />
              </SectionCard>
              <SectionCard icon={<TrendingDown className="w-4 h-4" />} title="回撤分析" subtitle="Drawdown Analysis">
                <DrawdownAnalysis analysis={analysis} />
              </SectionCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SectionCard icon={<Target className="w-4 h-4" />} title="风险贡献" subtitle="Risk Contribution">
                <RiskContribution analysis={analysis} />
              </SectionCard>
              <SectionCard icon={<BarChart3 className="w-4 h-4" />} title="贝塔值分析" subtitle="Beta vs S&P 500">
                <BetaAnalysis analysis={analysis} />
              </SectionCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SectionCard icon={<TrendingUp className="w-4 h-4" />} title="技术分析" subtitle="Technical Analysis">
                <TechnicalAnalysis analysis={analysis} />
              </SectionCard>
              <SectionCard icon={<Shield className="w-4 h-4" />} title="多元化评分" subtitle="Diversification Score">
                <DiversificationScore analysis={analysis} />
              </SectionCard>
            </div>
          </>
        )}

        <PerplexityAttribution />
      </main>
    </div>
  );
}

function SectionCard({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5" data-testid={`section-${subtitle.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="text-primary">{icon}</div>
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
