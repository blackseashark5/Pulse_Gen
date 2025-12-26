import { useMemo } from 'react';
import { AnalysisReport } from '@/types/review';
import { format, parseISO } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface TrendChartProps {
  report: AnalysisReport;
  topN?: number;
}

const CHART_COLORS = [
  'hsl(217, 91%, 60%)',  // Primary blue
  'hsl(142, 76%, 45%)',  // Success green
  'hsl(38, 92%, 50%)',   // Warning orange
  'hsl(280, 87%, 65%)',  // Purple
  'hsl(0, 84%, 60%)',    // Danger red
  'hsl(199, 89%, 48%)',  // Info cyan
];

export function TrendChart({ report, topN = 5 }: TrendChartProps) {
  const chartData = useMemo(() => {
    // Get top N topics by total count
    const topTopics = [...report.topics]
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, topN);

    // Build data for each date
    return report.dateRange.map(date => {
      const point: Record<string, any> = {
        date: format(parseISO(date), 'MMM d'),
        fullDate: date,
      };
      
      for (const topic of topTopics) {
        point[topic.topic] = topic.frequencies[date] || 0;
      }
      
      return point;
    });
  }, [report, topN]);

  const topTopicNames = useMemo(() => {
    return [...report.topics]
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, topN)
      .map(t => t.topic);
  }, [report.topics, topN]);

  if (report.topics.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No data available for chart
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 16%)" />
        <XAxis 
          dataKey="date" 
          stroke="hsl(215, 20%, 55%)"
          fontSize={12}
          tickLine={false}
        />
        <YAxis 
          stroke="hsl(215, 20%, 55%)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(222, 47%, 10%)',
            border: '1px solid hsl(222, 47%, 16%)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          labelStyle={{ color: 'hsl(210, 40%, 96%)' }}
        />
        <Legend 
          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
        />
        {topTopicNames.map((topic, idx) => (
          <Line
            key={topic}
            type="monotone"
            dataKey={topic}
            stroke={CHART_COLORS[idx % CHART_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
