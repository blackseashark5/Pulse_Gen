import { cn } from '@/lib/utils';
import { AlertTriangle, MessageSquarePlus, ThumbsUp, LayoutGrid } from 'lucide-react';

type CategoryFilterValue = 'all' | 'issue' | 'request' | 'feedback';

interface CategoryFilterProps {
  value: CategoryFilterValue;
  onChange: (value: CategoryFilterValue) => void;
  counts: { issues: number; requests: number; feedback: number };
}

const filterOptions: { value: CategoryFilterValue; label: string; icon: React.ReactNode; colorClass: string }[] = [
  { 
    value: 'all', 
    label: 'All', 
    icon: <LayoutGrid className="h-4 w-4" />,
    colorClass: 'text-primary border-primary/50 bg-primary/10'
  },
  { 
    value: 'issue', 
    label: 'Issues', 
    icon: <AlertTriangle className="h-4 w-4" />,
    colorClass: 'text-danger border-danger/50 bg-danger/10'
  },
  { 
    value: 'request', 
    label: 'Requests', 
    icon: <MessageSquarePlus className="h-4 w-4" />,
    colorClass: 'text-warning border-warning/50 bg-warning/10'
  },
  { 
    value: 'feedback', 
    label: 'Feedback', 
    icon: <ThumbsUp className="h-4 w-4" />,
    colorClass: 'text-success border-success/50 bg-success/10'
  },
];

export function CategoryFilter({ value, onChange, counts }: CategoryFilterProps) {
  const getCount = (filterValue: CategoryFilterValue): number => {
    if (filterValue === 'all') return counts.issues + counts.requests + counts.feedback;
    if (filterValue === 'issue') return counts.issues;
    if (filterValue === 'request') return counts.requests;
    return counts.feedback;
  };

  return (
    <div className="flex gap-2">
      {filterOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200',
            value === option.value
              ? option.colorClass
              : 'border-border bg-card text-muted-foreground hover:bg-secondary'
          )}
        >
          {option.icon}
          <span className="text-sm font-medium">{option.label}</span>
          <span className={cn(
            'text-xs font-mono px-1.5 py-0.5 rounded-md',
            value === option.value ? 'bg-background/30' : 'bg-muted'
          )}>
            {getCount(option.value)}
          </span>
        </button>
      ))}
    </div>
  );
}
