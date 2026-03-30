import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

interface RefreshProgressProps {
  open: boolean;
  total: number;
  current: number;
  currentTicker: string;
  results: { ticker: string; success: boolean; price?: number }[];
}

export function RefreshProgress({ open, total, current, currentTicker, results }: RefreshProgressProps) {
  const progress = total > 0 ? Math.round((current / total) * 100) : 0;
  
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            刷新行情数据
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">总体进度</span>
              <span className="font-medium">{current}/{total}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="text-right text-xs text-muted-foreground">{progress}%</div>
          </div>
          
          {/* Current status */}
          {currentTicker && current < total && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>正在获取 {currentTicker}...</span>
            </div>
          )}
          
          {/* Results list */}
          <div className="max-h-[200px] overflow-y-auto space-y-1">
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`flex items-center justify-between text-xs p-2 rounded ${
                  result.success ? 'bg-emerald-500/10' : 'bg-red-500/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                  )}
                  <span className="font-medium">{result.ticker}</span>
                </div>
                <span className={result.success ? 'text-emerald-400' : 'text-red-400'}>
                  {result.success && result.price 
                    ? `$${result.price.toFixed(2)}` 
                    : result.success 
                      ? '成功' 
                      : '失败'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
