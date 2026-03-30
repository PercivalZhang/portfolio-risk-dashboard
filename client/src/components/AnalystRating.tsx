import type { Grades } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface AnalystRatingProps {
  grades?: Grades;
}

// Get consensus color
function getConsensusColor(consensus: string): string {
  switch (consensus) {
    case 'Strong Buy':
      return 'bg-emerald-600 hover:bg-emerald-700 text-white';
    case 'Buy':
      return 'bg-emerald-500 hover:bg-emerald-600 text-white';
    case 'Hold':
      return 'bg-amber-500 hover:bg-amber-600 text-white';
    case 'Sell':
      return 'bg-orange-500 hover:bg-orange-600 text-white';
    case 'Strong Sell':
      return 'bg-red-600 hover:bg-red-700 text-white';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

// Get consensus label
function getConsensusLabel(consensus: string): string {
  switch (consensus) {
    case 'Strong Buy':
      return '强烈买入';
    case 'Buy':
      return '买入';
    case 'Hold':
      return '持有';
    case 'Sell':
      return '卖出';
    case 'Strong Sell':
      return '强烈卖出';
    default:
      return '暂无评级';
  }
}

export function AnalystRating({ grades }: AnalystRatingProps) {
  if (!grades) {
    return (
      <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
        <p className="text-sm text-muted-foreground">暂无分析师评级数据</p>
      </div>
    );
  }

  const total = grades.strongBuy + grades.buy + grades.hold + grades.sell + grades.strongSell;
  
  if (total === 0) {
    return (
      <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
        <p className="text-sm text-muted-foreground">暂无分析师评级数据</p>
      </div>
    );
  }

  const data = [
    { label: 'Strong Buy', value: grades.strongBuy, color: 'bg-emerald-600', textColor: 'text-emerald-600' },
    { label: 'Buy', value: grades.buy, color: 'bg-emerald-400', textColor: 'text-emerald-400' },
    { label: 'Hold', value: grades.hold, color: 'bg-amber-500', textColor: 'text-amber-500' },
    { label: 'Sell', value: grades.sell, color: 'bg-orange-500', textColor: 'text-orange-500' },
    { label: 'Strong Sell', value: grades.strongSell, color: 'bg-red-600', textColor: 'text-red-600' },
  ];

  return (
    <div className="space-y-4">
      {/* Consensus Badge */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">分析师共识</span>
        <Badge 
          className={`text-sm px-3 py-1 ${getConsensusColor(grades.consensus)}`}
        >
          {getConsensusLabel(grades.consensus)}
        </Badge>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="space-y-2">
        {data.map((item) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground w-20">{item.label}</span>
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className={`font-medium w-8 ${item.textColor}`}>{item.value}</span>
                  <span className="text-muted-foreground w-12 text-right">{percentage.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total and Last Updated */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
        <span>总计: {total} 位分析师</span>
        <span>更新于: {new Date(grades.lastUpdated).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
