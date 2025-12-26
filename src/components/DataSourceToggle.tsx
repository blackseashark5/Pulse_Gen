import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Wifi, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataSourceToggleProps {
  useRealData: boolean;
  onToggle: (useReal: boolean) => void;
}

export function DataSourceToggle({ useRealData, onToggle }: DataSourceToggleProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-secondary/50 border border-border/50">
      <div className={cn(
        'flex items-center gap-2 transition-opacity',
        useRealData ? 'opacity-50' : 'opacity-100'
      )}>
        <Database className="h-4 w-4" />
        <Label htmlFor="data-source" className="text-sm cursor-pointer">
          Mock Data
        </Label>
      </div>
      <Switch
        id="data-source"
        checked={useRealData}
        onCheckedChange={onToggle}
      />
      <div className={cn(
        'flex items-center gap-2 transition-opacity',
        useRealData ? 'opacity-100' : 'opacity-50'
      )}>
        <Wifi className="h-4 w-4" />
        <Label htmlFor="data-source" className="text-sm cursor-pointer">
          Live Scraping
        </Label>
      </div>
    </div>
  );
}
