import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { History, Trash2, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SavedReport, loadReports, loadFullReport, deleteReport } from '@/lib/api/reports';
import { AnalysisReport, SUPPORTED_APPS } from '@/types/review';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ReportHistoryProps {
  onLoadReport: (report: AnalysisReport) => void;
}

export function ReportHistory({ onLoadReport }: ReportHistoryProps) {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingReportId, setLoadingReportId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadAllReports();
    }
  }, [isOpen]);

  const loadAllReports = async () => {
    setIsLoading(true);
    const data = await loadReports();
    setReports(data);
    setIsLoading(false);
  };

  const handleLoad = async (reportId: string) => {
    setLoadingReportId(reportId);
    const fullReport = await loadFullReport(reportId);
    setLoadingReportId(null);

    if (fullReport) {
      onLoadReport(fullReport);
      setIsOpen(false);
      toast({
        title: 'Report Loaded',
        description: 'Previous analysis has been loaded.',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to load report.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await deleteReport(reportId);
    if (success) {
      setReports(reports.filter(r => r.id !== reportId));
      toast({
        title: 'Report Deleted',
        description: 'Analysis report has been removed.',
      });
    }
  };

  const getAppIcon = (appId: string) => {
    const app = SUPPORTED_APPS.find(a => a.id === appId);
    return app?.icon || '📱';
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="glass" size="sm">
          <History className="h-4 w-4 mr-2" />
          History
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] bg-card border-border">
        <SheetHeader>
          <SheetTitle>Analysis History</SheetTitle>
          <SheetDescription>
            View and load previous analysis reports.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No saved reports yet.</p>
              <p className="text-sm">Completed analyses will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3 pr-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className={cn(
                    'p-4 rounded-lg border border-border bg-secondary/30',
                    'hover:border-primary/50 hover:bg-secondary/50 transition-all cursor-pointer',
                    loadingReportId === report.id && 'opacity-50 pointer-events-none'
                  )}
                  onClick={() => handleLoad(report.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getAppIcon(report.app_id)}</span>
                      <div>
                        <p className="font-medium">{report.app_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          Target: {format(parseISO(report.target_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {loadingReportId === report.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoad(report.id);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-danger"
                            onClick={(e) => handleDelete(report.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Badge variant="outline" className="text-xs">
                      {report.total_reviews_analyzed} reviews
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {report.new_topics_discovered} new topics
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(parseISO(report.created_at), 'MMM d, yyyy · HH:mm')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
