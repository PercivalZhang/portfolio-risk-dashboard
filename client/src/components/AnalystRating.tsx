import type { Grades } from "@shared/schema";

interface AnalystRatingProps {
  grades?: Grades;
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
    { label: '强烈买入', value: grades.strongBuy, color: 'bg-emerald-600', textColor: 'text-emerald-600' },
    { label: '买入', value: grades.buy, color: 'bg-emerald-400', textColor: 'text-emerald-500' },
    { label: '持有', value: grades.hold, color: 'bg-amber-500', textColor: 'text-amber-500' },
    { label: '卖出', value: grades.sell, color: 'bg-orange-500', textColor: 'text-orange-500' },
    { label: '强烈卖出', value: grades.strongSell, color: 'bg-red-600', textColor: 'text-red-600' },
  ];

  // 找出最大值用于计算比例
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="space-y-3">
      {/* 标题 */}
      <h4 className="text-sm font-medium">分析师评级分布</h4>

      {/* 横向柱状图 - 自适应宽度布局 */}
      <div className="space-y-2">
        {data.map((item) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          const barWidth = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          
          return (
            <div key={item.label} className="flex items-center gap-3 text-left">
              {/* 标签 - 固定宽度左对齐 */}
              <div className="text-xs text-muted-foreground w-14 shrink-0">
                {item.label}
              </div>
              
              {/* 进度条 - 自适应铺满剩余空间 */}
              <div className="flex-1 h-4 bg-muted/50 rounded-full overflow-hidden relative">
                <div 
                  className={`h-full ${item.color} transition-all duration-500 ease-out rounded-full`}
                  style={{ width: `${barWidth}%` }}
                />
                {/* 数值显示 */}
                {item.value > 0 && (
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white drop-shadow">
                    {item.value}
                  </span>
                )}
              </div>
              
              {/* 百分比 - 固定宽度 */}
              <div className="w-10 shrink-0">
                <span className={`text-xs ${item.textColor} font-medium`}>
                  {percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 统计信息 */}
      <p className="text-xs text-muted-foreground pt-1">
        共 {total} 位分析师 · 更新于 {new Date(grades.lastUpdated).toLocaleDateString()}
      </p>
    </div>
  );
}
