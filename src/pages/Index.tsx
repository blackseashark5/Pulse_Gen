import { useState } from 'react';
import { subDays } from 'date-fns';
import { Helmet } from 'react-helmet';
import { AppSelector } from '@/components/AppSelector';
import { DateSelector } from '@/components/DateSelector';
import { ProcessingStatusDisplay } from '@/components/ProcessingStatus';
import { TrendTable } from '@/components/TrendTable';
import { TrendChart } from '@/components/TrendChart';
import { ReportStats } from '@/components/ReportStats';
import { CategoryFilter } from '@/components/CategoryFilter';
import { CustomTopicsManager } from '@/components/CustomTopicsManager';
import { ReportHistory } from '@/components/ReportHistory';
import { DataSourceToggle } from '@/components/DataSourceToggle';
import { Button } from '@/components/ui/button';
import { useReviewAnalysis } from '@/hooks/useReviewAnalysis';
import { SUPPORTED_APPS } from '@/types/review';
import { Play, RotateCcw, Download, BarChart3, Table2, LineChart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Index() {
  const [selectedApp, setSelectedApp] = useState(SUPPORTED_APPS[0].id);
  const [targetDate, setTargetDate] = useState(new Date());
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'issue' | 'request' | 'feedback'>('all');
  const [useRealData, setUseRealData] = useState(false);
  
  const { status, report, analyzeApp, reset, setReportFromHistory } = useReviewAnalysis();
  
  const handleAnalyze = () => {
    analyzeApp(selectedApp, targetDate, useRealData);
  };
  
  const handleExport = () => {
    if (!report) return;
    
    const headers = ['Topic', 'Category', 'Total', 'Trend', ...report.dateRange];
    const rows = report.topics.map(topic => [
      topic.topic,
      topic.category,
      topic.totalCount.toString(),
      `${topic.trend} (${topic.trendPercentage}%)`,
      ...report.dateRange.map(date => (topic.frequencies[date] || 0).toString()),
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trend-report-${report.app}-${report.targetDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = report ? {
    issues: report.topics.filter(t => t.category === 'issue').length,
    requests: report.topics.filter(t => t.category === 'request').length,
    feedback: report.topics.filter(t => t.category === 'feedback').length,
  } : { issues: 0, requests: 0, feedback: 0 };

  return (
    <>
      <Helmet>
        <title>Review Trend Analyzer | AI-Powered App Review Analysis</title>
        <meta name="description" content="Analyze Google Play Store reviews with AI. Identify trending topics, issues, and feedback from app reviews like Swiggy, Zomato, and Blinkit." />
      </Helmet>
      
      <div className="min-h-screen bg-background gradient-mesh">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">
                    Review Trend Analyzer
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    AI-powered app review analysis
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <ReportHistory onLoadReport={setReportFromHistory} />
                <CustomTopicsManager appId={selectedApp} />
                {report && (
                  <Button variant="glass" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          {/* Configuration Panel */}
          <section className="glass-card rounded-xl p-6 mb-8 animate-fade-in">
            <h2 className="text-lg font-semibold text-foreground mb-6">Configuration</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <AppSelector 
                selectedApp={selectedApp} 
                onSelectApp={setSelectedApp} 
              />
              <DateSelector 
                date={targetDate} 
                onDateChange={setTargetDate}
                minDate={new Date('2024-06-01')}
                maxDate={new Date()}
              />
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-muted-foreground">
                  Data Source
                </label>
                <DataSourceToggle 
                  useRealData={useRealData} 
                  onToggle={setUseRealData} 
                />
              </div>
              <div className="flex items-end">
                <div className="flex gap-3">
                  <Button 
                    variant="default"
                    size="lg"
                    onClick={handleAnalyze}
                    disabled={status.status !== 'idle' && status.status !== 'complete' && status.status !== 'error'}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Analyze
                  </Button>
                  {(status.status === 'complete' || status.status === 'error') && (
                    <Button variant="outline" size="lg" onClick={reset}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>
          
          {/* Processing Status */}
          {status.status !== 'idle' && (
            <section className="mb-8">
              <ProcessingStatusDisplay status={status} />
            </section>
          )}
          
          {/* Results */}
          {report && (
            <div className="space-y-8 animate-slide-up">
              {/* Stats */}
              <section>
                <ReportStats report={report} />
              </section>
              
              {/* Filters */}
              <section className="glass-card rounded-xl p-4">
                <CategoryFilter 
                  value={categoryFilter} 
                  onChange={setCategoryFilter}
                  counts={counts}
                />
              </section>
              
              {/* Charts & Table */}
              <Tabs defaultValue="table" className="w-full">
                <TabsList className="glass-card mb-4">
                  <TabsTrigger value="table" className="gap-2">
                    <Table2 className="h-4 w-4" />
                    Trend Table
                  </TabsTrigger>
                  <TabsTrigger value="chart" className="gap-2">
                    <LineChart className="h-4 w-4" />
                    Trend Chart
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="table">
                  <section className="glass-card rounded-xl p-6">
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold text-foreground">
                        Topic Frequency Matrix
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Heatmap showing topic occurrences from T-30 to T
                      </p>
                    </div>
                    <TrendTable report={report} categoryFilter={categoryFilter} />
                  </section>
                </TabsContent>
                
                <TabsContent value="chart">
                  <section className="glass-card rounded-xl p-6">
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold text-foreground">
                        Top Topics Over Time
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Trend lines for the top 5 most frequent topics
                      </p>
                    </div>
                    <TrendChart report={report} topN={5} />
                  </section>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          {/* Empty State */}
          {!report && status.status === 'idle' && (
            <section className="glass-card rounded-xl p-12 text-center animate-fade-in">
              <div className="max-w-md mx-auto">
                <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Ready to Analyze
                </h2>
                <p className="text-muted-foreground mb-6">
                  Select an app and target date, then click "Analyze" to generate 
                  a trend analysis report. The AI agent will identify topics, categorize 
                  them, and deduplicate similar issues.
                </p>
                <div className="flex flex-wrap gap-2 justify-center text-sm text-muted-foreground">
                  <span className="px-3 py-1 rounded-full bg-danger/10 text-danger border border-danger/20">
                    Issues
                  </span>
                  <span className="px-3 py-1 rounded-full bg-warning/10 text-warning border border-warning/20">
                    Requests
                  </span>
                  <span className="px-3 py-1 rounded-full bg-success/10 text-success border border-success/20">
                    Feedback
                  </span>
                </div>
              </div>
            </section>
          )}
        </main>
        
        {/* Footer */}
        <footer className="border-t border-border/50 mt-auto">
          <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
            Powered by Agentic AI • {useRealData ? 'Live Play Store scraping via Firecrawl' : 'Simulated review data'}
          </div>
        </footer>
      </div>
    </>
  );
}
