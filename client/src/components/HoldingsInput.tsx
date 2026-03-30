import { useState, useMemo, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RefreshProgress } from "./RefreshProgress";
import { AnalystRating } from "./AnalystRating";
import type { Holding } from "@shared/schema";
import { Plus, Trash2, RefreshCw, RotateCw, Pencil, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Helper to calculate position in range (0-1)
function normalizePosition(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

// Helper to calculate percentage from reference
function calcPercent(current: number, reference: number): number | null {
  if (!reference || reference <= 0 || !current) return null;
  return ((current - reference) / reference) * 100;
}

export function HoldingsInput({ holdings, onDelete }: { holdings: Holding[]; onDelete: (id: number) => void }) {
  const { toast } = useToast();
  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState("");
  const [costBasis, setCostBasis] = useState("");
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editShares, setEditShares] = useState("");
  const [editCostBasis, setEditCostBasis] = useState("");
  
  // Track which cards are being refreshed
  const [refreshingIds, setRefreshingIds] = useState<Set<number>>(new Set());
  // Track data updated flag for page refresh prompt
  const [dataUpdated, setDataUpdated] = useState(false);
  
  // Batch refresh progress state
  const [refreshProgress, setRefreshProgress] = useState({
    open: false,
    total: 0,
    current: 0,
    currentTicker: "",
    results: [] as { ticker: string; success: boolean; price?: number }[],
  });

  // Calculate market values for sizing
  const holdingsWithValue = useMemo(() => {
    const withValue = holdings.map(h => ({
      ...h,
      marketValue: h.currentPrice * h.shares,
    }));
    const totalValue = withValue.reduce((sum, h) => sum + h.marketValue, 0);
    return withValue.map(h => ({
      ...h,
      valueRatio: totalValue > 0 ? h.marketValue / totalValue : 0,
    }));
  }, [holdings]);

  const createMutation = useMutation({
    mutationFn: async (data: { ticker: string; shares: number; costBasis: number }) => {
      const res = await apiRequest("POST", "/api/holdings", data);
      return res.json();
    },
    onSuccess: (data: Holding) => {
      queryClient.invalidateQueries({ queryKey: ["/api/holdings"] });
      setTicker(""); setShares(""); setCostBasis("");
      const priceInfo = data.currentPrice > 0 ? ` (现价 $${data.currentPrice.toFixed(2)})` : "";
      toast({ title: `${data.name} 已添加${priceInfo}` });
    },
    onError: (e: Error) => {
      toast({ title: "添加失败", description: e.message, variant: "destructive" });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/refresh");
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/holdings"] });
      const count = data.results?.filter((r: any) => r.success).length ?? 0;
      toast({ title: `已刷新 ${count} 只股票行情` });
    },
    onError: (e: Error) => {
      toast({ title: "刷新失败", description: e.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { shares: number; costBasis: number } }) => {
      const res = await apiRequest("PUT", `/api/holdings/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holdings"] });
      setEditingId(null);
      setDataUpdated(true);
    },
    onError: (e: Error) => {
      toast({ title: "更新失败", description: e.message, variant: "destructive" });
    },
  });

  const handleAdd = () => {
    const s = parseFloat(shares);
    const c = parseFloat(costBasis);
    if (!ticker.trim() || isNaN(s) || s <= 0 || isNaN(c) || c <= 0) {
      toast({ title: "请填写完整的持仓信息", variant: "destructive" });
      return;
    }
    createMutation.mutate({ ticker: ticker.trim().toUpperCase(), shares: s, costBasis: c });
  };

  // Batch refresh with progress
  const handleBatchRefresh = useCallback(async () => {
    if (holdings.length === 0) return;
    
    setRefreshProgress({
      open: true,
      total: holdings.length,
      current: 0,
      currentTicker: "",
      results: [],
    });
    
    const results: { ticker: string; success: boolean; price?: number }[] = [];
    
    for (let i = 0; i < holdings.length; i++) {
      const holding = holdings[i];
      
      setRefreshProgress(prev => ({
        ...prev,
        current: i,
        currentTicker: holding.ticker,
      }));
      
      try {
        // Pass grades lastUpdated timestamp to determine if refresh is needed
        const gradesLastUpdated = holding.grades?.lastUpdated;
        const res = await apiRequest("POST", `/api/holdings/${holding.id}/refresh`, {
          gradesLastUpdated,
        });
        const data = await res.json();
        results.push({ 
          ticker: holding.ticker, 
          success: true, 
          price: data.currentPrice 
        });
      } catch (e: any) {
        results.push({ 
          ticker: holding.ticker, 
          success: false 
        });
      }
      
      setRefreshProgress(prev => ({
        ...prev,
        results: [...results],
      }));
      
      // Wait 200ms before next request (except for the last one)
      if (i < holdings.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    // Complete
    setRefreshProgress(prev => ({
      ...prev,
      current: holdings.length,
      currentTicker: "",
    }));
    
    // Wait a moment then close and refresh page
    setTimeout(() => {
      setRefreshProgress(prev => ({ ...prev, open: false }));
      queryClient.invalidateQueries({ queryKey: ["/api/holdings"] });
      setDataUpdated(true);
    }, 1000);
  }, [holdings]);

  const refreshSingle = async (id: number, ticker: string, gradesLastUpdated?: string) => {
    if (refreshingIds.has(id)) return;
    
    setRefreshingIds(prev => new Set(prev).add(id));
    try {
      const res = await apiRequest("POST", `/api/holdings/${id}/refresh`, {
        gradesLastUpdated,
      });
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/holdings"] });
      setDataUpdated(true);
    } catch (e: any) {
      toast({ title: "刷新失败", description: e.message, variant: "destructive" });
    } finally {
      setRefreshingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      onDelete(deletingId);
      setDeletingId(null);
      setDataUpdated(true);
    }
  };

  const startEdit = (h: Holding) => {
    setEditingId(h.id);
    setEditShares(h.shares.toString());
    setEditCostBasis(h.costBasis.toString());
  };

  const handleUpdate = (id: number) => {
    const s = parseFloat(editShares);
    const c = parseFloat(editCostBasis);
    if (isNaN(s) || s <= 0 || isNaN(c) || c <= 0) {
      toast({ title: "请输入有效的数值", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ id, data: { shares: s, costBasis: c } });
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">持仓管理</h2>
          <span className="text-xs text-muted-foreground">Portfolio Holdings</span>
        </div>
        {holdings.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isEditMode ? "default" : "outline"}
              onClick={() => setIsEditMode(!isEditMode)}
              className="h-8 px-3 text-xs gap-1.5"
            >
              <Pencil className="w-3 h-3" />
              {isEditMode ? "完成" : "编辑"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBatchRefresh}
              disabled={refreshProgress.open}
              className="h-8 px-3 text-xs gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${refreshProgress.open ? "animate-spin" : ""}`} />
              {refreshProgress.open ? "刷新中..." : "刷新行情"}
            </Button>
          </div>
        )}
      </div>

      {/* Input row */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Input
          placeholder="股票代号"
          value={ticker}
          onChange={e => setTicker(e.target.value.toUpperCase())}
          className="w-28 bg-background/50 text-sm h-9"
          onKeyDown={e => e.key === "Enter" && handleAdd()}
        />
        <Input
          placeholder="股数"
          type="number"
          value={shares}
          onChange={e => setShares(e.target.value)}
          className="w-24 bg-background/50 text-sm h-9 tabular-nums"
          onKeyDown={e => e.key === "Enter" && handleAdd()}
        />
        <Input
          placeholder="成本价"
          type="number"
          step="0.01"
          value={costBasis}
          onChange={e => setCostBasis(e.target.value)}
          className="w-24 bg-background/50 text-sm h-9 tabular-nums"
          onKeyDown={e => e.key === "Enter" && handleAdd()}
        />
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={createMutation.isPending}
          className="h-9 px-4"
        >
          {createMutation.isPending ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
          ) : (
            <Plus className="w-3.5 h-3.5 mr-1" />
          )}
          {createMutation.isPending ? "获取行情..." : "添加"}
        </Button>
      </div>

      {/* Holdings Grid - Masonry-like Layout */}
      {holdingsWithValue.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {holdingsWithValue.map(h => {
            const isPositive = (h.changePercentage ?? 0) >= 0;
            const isEditing = editingId === h.id;
            // Calculate flex basis based on market value ratio
            // Minimum 120px, maximum 50% of container
            const flexBasis = `${Math.max(15, Math.min(50, h.valueRatio * 100))}%`;
            const flexGrow = Math.max(1, Math.round(h.valueRatio * 10));
            
            return (
              <div
                key={h.id}
                className={`
                  relative rounded-xl p-3 transition-all 
                  ${isEditMode ? '' : 'cursor-pointer hover:scale-[1.02]'}
                  ${isPositive 
                    ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/30' 
                    : 'bg-gradient-to-br from-red-500/20 to-red-600/5 border border-red-500/30'}
                `}
                style={{ 
                  flex: `${flexGrow} 1 ${flexBasis}`,
                  minWidth: '140px',
                  minHeight: '100px',
                }}
                onClick={() => !isEditMode && setSelectedHolding(h)}
              >
                {/* Refresh button - edit mode only, top left */}
                {isEditMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      refreshSingle(h.id, h.ticker, h.grades?.lastUpdated);
                    }}
                    disabled={refreshingIds.has(h.id)}
                    className="absolute top-1.5 left-1.5 p-1 rounded-full hover:bg-background/50 transition-opacity z-10"
                    title="刷新行情"
                  >
                    <RotateCw className={`w-3 h-3 text-muted-foreground ${refreshingIds.has(h.id) ? 'animate-spin' : ''}`} />
                  </button>
                )}

                {/* Delete button - edit mode only, top right */}
                {isEditMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingId(h.id);
                    }}
                    className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-red-500/20 hover:bg-red-500/40 transition-colors z-10"
                    title="删除持仓"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                )}

                {/* Edit button - edit mode only, bottom right */}
                {isEditMode && !isEditing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(h);
                    }}
                    className="absolute bottom-1.5 right-1.5 p-1.5 rounded-full bg-primary/20 hover:bg-primary/40 transition-colors z-10"
                    title="修改持仓"
                  >
                    <Pencil className="w-3.5 h-3.5 text-primary" />
                  </button>
                )}

                {/* Card content - Left/Right layout */}
                {isEditing ? (
                  <div className="h-full flex flex-col justify-center gap-2 py-2" onClick={e => e.stopPropagation()}>
                    <div className="font-bold text-lg tracking-tight text-center">{h.ticker}</div>
                    <Input
                      type="number"
                      value={editShares}
                      onChange={e => setEditShares(e.target.value)}
                      className="h-7 text-xs"
                      placeholder="股数"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={editCostBasis}
                      onChange={e => setEditCostBasis(e.target.value)}
                      className="h-7 text-xs"
                      placeholder="成本价"
                    />
                    <div className="flex gap-1 mt-1">
                      <Button size="sm" className="h-7 flex-1 text-xs" onClick={() => handleUpdate(h.id)}>
                        <Check className="w-3 h-3 mr-1" />保存
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingId(null)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-row items-center gap-3">
                    {/* Left: Logo */}
                    <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-background/50 rounded-lg overflow-hidden">
                      {h.logo ? (
                        <img 
                          src={h.logo} 
                          alt={h.ticker}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-xs text-muted-foreground font-bold">{h.ticker}</div>
                      )}
                    </div>
                    
                    {/* Right: Stock Info */}
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      {/* Ticker */}
                      <div className="font-bold text-base tracking-tight truncate">{h.ticker}</div>
                      
                      {/* Price */}
                      <div className="text-xl font-semibold tabular-nums">
                        ${h.currentPrice.toFixed(2)}
                      </div>
                      
                      {/* Change */}
                      <div className={`text-xs font-medium tabular-nums ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {h.changePercentage !== undefined 
                          ? `${isPositive ? '+' : ''}${h.changePercentage.toFixed(2)}%`
                          : (h.change !== undefined ? `${h.change >= 0 ? '+' : ''}${h.change.toFixed(2)}` : '--')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              是否确认删除该持仓？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refresh Progress Dialog */}
      <RefreshProgress
        open={refreshProgress.open}
        total={refreshProgress.total}
        current={refreshProgress.current}
        currentTicker={refreshProgress.currentTicker}
        results={refreshProgress.results}
      />

      {/* Data Updated - Page Refresh Dialog */}
      <Dialog open={dataUpdated} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>数据已更新</DialogTitle>
            <DialogDescription>
              数据发生更新，需要刷新页面以显示最新信息。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => window.location.reload()}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!selectedHolding} onOpenChange={() => setSelectedHolding(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedHolding && <HoldingDetail holding={selectedHolding} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Detail view component
function HoldingDetail({ holding: h }: { holding: Holding }) {
  const pnl = h.costBasis > 0 ? ((h.currentPrice - h.costBasis) / h.costBasis) * 100 : 0;
  const isPositive = (h.changePercentage ?? 0) >= 0;
  
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          <span className="text-2xl">{h.ticker}</span>
          <span className="text-lg font-normal text-muted-foreground">{h.name}</span>
          <span className={`text-lg ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            ${h.currentPrice.toFixed(2)}
            {h.changePercentage !== undefined && ` (${isPositive ? '+' : ''}${h.changePercentage.toFixed(2)}%)`}
          </span>
        </DialogTitle>
      </DialogHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Left: Raw Data */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">基础信息</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <DataItem label="持仓股数" value={h.shares.toLocaleString()} />
            <DataItem label="成本价" value={`$${h.costBasis.toFixed(2)}`} />
            <DataItem label="盈亏" value={`${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%`} 
              valueClass={pnl >= 0 ? 'text-emerald-400' : 'text-red-400'} />
            <DataItem label="板块" value={h.sector || '--'} />
            <DataItem label="行业" value={h.industry || '--'} />
            <DataItem label="贝塔值" value={h.beta?.toFixed(2) || '--'} />
            <DataItem label="市值" value={h.marketCap ? `$${(h.marketCap / 1e9).toFixed(2)}B` : '--'} />
            <DataItem label="最后更新" value={new Date(h.lastUpdated).toLocaleString()} />
          </div>
          
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-6">价格数据</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <DataItem label="当日涨跌" value={h.change !== undefined ? `$${h.change >= 0 ? '+' : ''}${h.change.toFixed(2)}` : '--'} 
              valueClass={h.change && h.change >= 0 ? 'text-emerald-400' : 'text-red-400'} />
            <DataItem label="当日涨跌幅" value={h.changePercentage !== undefined ? `${h.changePercentage >= 0 ? '+' : ''}${h.changePercentage.toFixed(2)}%` : '--'}
              valueClass={h.changePercentage && h.changePercentage >= 0 ? 'text-emerald-400' : 'text-red-400'} />
            <DataItem label="当日最高" value={h.dayHigh ? `$${h.dayHigh.toFixed(2)}` : '--'} />
            <DataItem label="当日最低" value={h.dayLow ? `$${h.dayLow.toFixed(2)}` : '--'} />
            <DataItem label="52周最高" value={h.yearHigh ? `$${h.yearHigh.toFixed(2)}` : '--'} />
            <DataItem label="52周最低" value={h.yearLow ? `$${h.yearLow.toFixed(2)}` : '--'} />
            <DataItem label="50日均线" value={h.sma50 ? `$${h.sma50.toFixed(2)}` : '--'} />
            <DataItem label="200日均线" value={h.sma200 ? `$${h.sma200.toFixed(2)}` : '--'} />
          </div>
        </div>
        
        {/* Right: Visual Analysis */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">技术分析</h3>
          
          {/* Day Range */}
          {h.dayLow && h.dayHigh && h.dayHigh > h.dayLow && (
            <RangeBar 
              title="当日区间"
              current={h.currentPrice}
              low={h.dayLow}
              high={h.dayHigh}
              color="blue"
            />
          )}
          
          {/* 52 Week Range */}
          {h.yearLow > 0 && h.yearHigh > h.yearLow && (
            <RangeBar 
              title="52周区间"
              current={h.currentPrice}
              low={h.yearLow}
              high={h.yearHigh}
              color="purple"
              marks={[
                { label: '50日', value: h.sma50 },
                { label: '200日', value: h.sma200 },
              ]}
            />
          )}
          
          {/* Key Levels */}
          <div className="space-y-2 mt-6">
            <h4 className="text-xs text-muted-foreground">关键价位偏离</h4>
            
            {h.sma50 && h.sma50 > 0 && (
              <LevelRow 
                label="50日均线"
                value={h.sma50}
                current={h.currentPrice}
              />
            )}
            
            {h.sma200 && h.sma200 > 0 && (
              <LevelRow 
                label="200日均线"
                value={h.sma200}
                current={h.currentPrice}
              />
            )}
            
            {h.yearHigh > 0 && (
              <LevelRow 
                label="52周最高"
                value={h.yearHigh}
                current={h.currentPrice}
                isHigh
              />
            )}
            
            {h.yearLow > 0 && (
              <LevelRow 
                label="52周最低"
                value={h.yearLow}
                current={h.currentPrice}
                isLow
              />
            )}
          </div>
          
          {/* Analyst Rating */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">分析师评级</h3>
            <AnalystRating grades={h.grades} />
          </div>
        </div>
      </div>
    </>
  );
}

function DataItem({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="p-2 rounded bg-muted/50">
      <span className="text-xs text-muted-foreground block">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}

function RangeBar({ 
  title, 
  current, 
  low, 
  high, 
  color,
  marks = []
}: { 
  title: string; 
  current: number; 
  low: number; 
  high: number; 
  color: string;
  marks?: { label: string; value?: number }[];
}) {
  const position = normalizePosition(current, low, high);
  const colorClasses: Record<string, { bg: string; bar: string; text: string }> = {
    blue: { bg: 'bg-blue-500/10', bar: 'bg-blue-500', text: 'text-blue-400' },
    purple: { bg: 'bg-purple-500/10', bar: 'bg-purple-500', text: 'text-purple-400' },
    emerald: { bg: 'bg-emerald-500/10', bar: 'bg-emerald-500', text: 'text-emerald-400' },
  };
  const c = colorClasses[color] || colorClasses.blue;
  
  return (
    <div className={`p-3 rounded-lg ${c.bg} border border-${color}-500/20`}>
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-muted-foreground">{title}</span>
        <span className={`font-medium ${c.text}`}>
          ${low.toFixed(2)} - ${high.toFixed(2)}
        </span>
      </div>
      
      {/* Range bar */}
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        {/* Background gradient */}
        <div className={`absolute inset-0 opacity-20 ${c.bar}`} />
        
        {/* Marks for SMAs */}
        {marks.map((mark, i) => mark.value && mark.value >= low && mark.value <= high && (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-0.5 bg-white/50"
            style={{ left: `${normalizePosition(mark.value, low, high) * 100}%` }}
          />
        ))}
        
        {/* Current position indicator */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          style={{ left: `calc(${position * 100}% - 2px)` }}
        />
      </div>
      
      {/* Labels */}
      <div className="flex items-center justify-between text-[10px] mt-1.5">
        <span className="text-muted-foreground">低: ${low.toFixed(2)}</span>
        <div className="flex gap-2">
          {marks.map((mark, i) => mark.value && (
            <span key={i} className="text-muted-foreground">
              {mark.label}: ${mark.value.toFixed(0)}
            </span>
          ))}
        </div>
        <span className="text-muted-foreground">高: ${high.toFixed(2)}</span>
      </div>
      
      {/* Current value */}
      <div className="text-center mt-2">
        <span className={`text-sm font-semibold ${c.text}`}>
          当前: ${current.toFixed(2)} ({(position * 100).toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}

function LevelRow({ label, value, current, isHigh, isLow }: { 
  label: string; 
  value: number; 
  current: number;
  isHigh?: boolean;
  isLow?: boolean;
}) {
  const percent = calcPercent(current, value);
  if (percent === null) return null;
  
  let colorClass = 'text-muted-foreground';
  if (isHigh) {
    colorClass = percent > -5 ? 'text-emerald-400' : 'text-muted-foreground';
  } else if (isLow) {
    colorClass = percent < 20 ? 'text-red-400' : 'text-muted-foreground';
  } else {
    colorClass = percent > 0 ? 'text-emerald-400' : 'text-red-400';
  }
  
  return (
    <div className="flex items-center justify-between text-xs py-1.5 border-b border-border/50">
      <span className="text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className="tabular-nums">${value.toFixed(2)}</span>
        <span className={`ml-2 tabular-nums ${colorClass}`}>
          {percent > 0 && !isLow ? '+' : ''}{percent.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
