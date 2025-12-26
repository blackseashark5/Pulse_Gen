import { AnalysisReport } from '@/types/review';
import { FileText, Tag, Sparkles, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ReportStatsProps {
  report: AnalysisReport;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
}

function StatCard({ icon, label, value, subtext }: StatCardProps) {
  return (
    <div className="glass-card rounded-lg p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-foreground font-mono">{value}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
    </div>
  );
}

export function ReportStats({ report }: ReportStatsProps) {
  const issueCount = report.topics.filter(t => t.category === 'issue').length;
  const requestCount = report.topics.filter(t => t.category === 'request').length;
  const feedbackCount = report.topics.filter(t => t.category === 'feedback').length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<FileText className="h-4 w-4" />}
        label="Reviews Analyzed"
        value={report.totalReviewsAnalyzed.toLocaleString()}
        subtext={`${report.dateRange.length} days`}
      />
      <StatCard
        icon={<Tag className="h-4 w-4" />}
        label="Topics Identified"
        value={report.topics.length}
        subtext={`${issueCount} issues, ${requestCount} requests, ${feedbackCount} feedback`}
      />
      <StatCard
        icon={<Sparkles className="h-4 w-4" />}
        label="New Topics"
        value={report.newTopicsDiscovered}
        subtext="Discovered this period"
      />
      <StatCard
        icon={<Clock className="h-4 w-4" />}
        label="Generated"
        value={format(parseISO(report.generatedAt), 'HH:mm')}
        subtext={format(parseISO(report.generatedAt), 'MMM d, yyyy')}
      />
    </div>
  );
}
