import { ProcessingStatus as ProcessingStatusType } from '@/types/review';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2, AlertCircle, Database, Brain, GitMerge } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProcessingStatusProps {
  status: ProcessingStatusType;
}

const statusIcons = {
  idle: null,
  fetching: Database,
  analyzing: Brain,
  deduplicating: GitMerge,
  complete: CheckCircle2,
  error: AlertCircle,
};

const statusColors = {
  idle: 'text-muted-foreground',
  fetching: 'text-info',
  analyzing: 'text-primary',
  deduplicating: 'text-warning',
  complete: 'text-success',
  error: 'text-danger',
};

export function ProcessingStatusDisplay({ status }: ProcessingStatusProps) {
  if (status.status === 'idle') return null;

  const Icon = statusIcons[status.status];
  const isLoading = ['fetching', 'analyzing', 'deduplicating'].includes(status.status);

  return (
    <div className="glass-card rounded-lg p-4 animate-slide-up">
      <div className="flex items-center gap-3 mb-3">
        {isLoading ? (
          <Loader2 className={cn('h-5 w-5 animate-spin', statusColors[status.status])} />
        ) : Icon ? (
          <Icon className={cn('h-5 w-5', statusColors[status.status])} />
        ) : null}
        <span className={cn('font-medium', statusColors[status.status])}>
          {status.message}
        </span>
        {status.currentDate && (
          <span className="text-sm text-muted-foreground font-mono ml-auto">
            {status.currentDate}
          </span>
        )}
      </div>
      <Progress value={status.progress} className="h-2" />
      <p className="text-xs text-muted-foreground mt-2 text-right">
        {status.progress}% complete
      </p>
    </div>
  );
}
