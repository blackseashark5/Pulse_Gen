import { SUPPORTED_APPS, AppOption } from '@/types/review';
import { cn } from '@/lib/utils';

interface AppSelectorProps {
  selectedApp: string;
  onSelectApp: (appId: string) => void;
}

export function AppSelector({ selectedApp, onSelectApp }: AppSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-muted-foreground">
        Select App
      </label>
      <div className="flex gap-3">
        {SUPPORTED_APPS.map((app) => (
          <button
            key={app.id}
            onClick={() => onSelectApp(app.id)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200',
              'hover:border-primary/50 hover:bg-primary/5',
              selectedApp === app.id
                ? 'border-primary bg-primary/10 shadow-glow'
                : 'border-border bg-card'
            )}
          >
            <span className="text-2xl">{app.icon}</span>
            <div className="text-left">
              <p className="font-medium text-foreground">{app.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{app.packageName}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
