import { useMemo } from 'react';
import { AnalysisReport, TopicFrequency } from '@/types/review';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface TrendTableProps {
  report: AnalysisReport;
  categoryFilter: 'all' | 'issue' | 'request' | 'feedback';
}

function getHeatClass(value: number, maxValue: number): string {
  if (value === 0) return 'heat-cell-0';
  const ratio = value / maxValue;
  if (ratio > 0.66) return 'heat-cell-high';
  if (ratio > 0.33) return 'heat-cell-medium';
  return 'heat-cell-low';
}

function TrendIndicator({ trend, percentage }: { trend: 'up' | 'down' | 'stable'; percentage: number }) {
  if (trend === 'up') {
    return (
      <div className="flex items-center gap-1 text-danger">
        <TrendingUp className="h-3 w-3" />
        <span className="text-xs font-mono">+{percentage}%</span>
      </div>
    );
  }
  if (trend === 'down') {
    return (
      <div className="flex items-center gap-1 text-success">
        <TrendingDown className="h-3 w-3" />
        <span className="text-xs font-mono">-{percentage}%</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Minus className="h-3 w-3" />
      <span className="text-xs font-mono">0%</span>
    </div>
  );
}

function CategoryBadge({ category }: { category: 'issue' | 'request' | 'feedback' }) {
  const variants = {
    issue: 'bg-danger/20 text-danger border-danger/30',
    request: 'bg-warning/20 text-warning border-warning/30',
    feedback: 'bg-success/20 text-success border-success/30',
  };
  
  return (
    <Badge variant="outline" className={cn('text-[10px] uppercase', variants[category])}>
      {category}
    </Badge>
  );
}

export function TrendTable({ report, categoryFilter }: TrendTableProps) {
  const filteredTopics = useMemo(() => {
    if (categoryFilter === 'all') return report.topics;
    return report.topics.filter(t => t.category === categoryFilter);
  }, [report.topics, categoryFilter]);

  // Get max value for heatmap scaling
  const maxValue = useMemo(() => {
    let max = 0;
    for (const topic of filteredTopics) {
      for (const date of report.dateRange) {
        const val = topic.frequencies[date] || 0;
        if (val > max) max = val;
      }
    }
    return max || 1;
  }, [filteredTopics, report.dateRange]);

  // Format dates for display (show only day for compactness)
  const displayDates = useMemo(() => {
    return report.dateRange.map(date => ({
      full: date,
      display: format(parseISO(date), 'MMM d'),
      dayOnly: format(parseISO(date), 'd'),
    }));
  }, [report.dateRange]);

  if (filteredTopics.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        No topics found for the selected filter
      </div>
    );
  }

  return (
    <ScrollArea className="w-full custom-scrollbar">
      <div className="min-w-max">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="sticky left-0 bg-card z-10 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Topic
                </div>
              </TableHead>
              <TableHead className="w-[80px] text-center">Category</TableHead>
              <TableHead className="w-[60px] text-center">Total</TableHead>
              <TableHead className="w-[80px] text-center">Trend</TableHead>
              {displayDates.map(({ full, display }) => (
                <TableHead 
                  key={full} 
                  className="w-[50px] text-center font-mono text-xs px-1"
                >
                  {display}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTopics.map((topic, idx) => (
              <TableRow 
                key={topic.topic}
                className={cn(
                  'border-border/30 hover:bg-secondary/30 transition-colors',
                  idx % 2 === 0 ? 'bg-card/50' : 'bg-card/30'
                )}
              >
                <TableCell className="sticky left-0 bg-inherit z-10 font-medium">
                  {topic.topic}
                </TableCell>
                <TableCell className="text-center">
                  <CategoryBadge category={topic.category} />
                </TableCell>
                <TableCell className="text-center font-mono font-semibold text-foreground">
                  {topic.totalCount}
                </TableCell>
                <TableCell className="text-center">
                  <TrendIndicator trend={topic.trend} percentage={topic.trendPercentage} />
                </TableCell>
                {displayDates.map(({ full }) => {
                  const value = topic.frequencies[full] || 0;
                  return (
                    <TableCell 
                      key={full} 
                      className="text-center px-1"
                    >
                      <div 
                        className={cn(
                          'heat-cell w-full h-8 flex items-center justify-center font-mono text-xs',
                          getHeatClass(value, maxValue),
                          value > 0 ? 'text-foreground' : 'text-muted-foreground/50'
                        )}
                      >
                        {value}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
