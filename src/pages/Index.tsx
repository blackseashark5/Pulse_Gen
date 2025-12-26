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
        <title>Ranveer Analytics | AI-Powered App Review Analysis</title>
        <meta name="description" content="Analyze Google Play Store reviews with AI. Identify trending topics, issues, and feedback from app reviews like Swiggy, Zomato, and Blinkit." />
      </Helmet>
      
      <div className="min-h-screen bg-background gradient-mesh">
        {/* Header */}
        <header className="border-b border-border/30 bg-card/60 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-6 py-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center glow-primary">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gradient-brand">
                    Ranveer Analytics
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    AI-powered review intelligence
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
        
        <main className="container mx-auto px-6 py-10">
          {/* Configuration Panel */}
          <section className="glass-card p-8 mb-10 animate-fade-in card-hover">
            <h2 className="text-xl font-semibold text-foreground mb-8 flex items-center gap-3">
              <span className="w-1 h-6 bg-primary rounded-full"></span>
              Configuration
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Data Source
                </label>
                <DataSourceToggle 
                  useRealData={useRealData} 
                  onToggle={setUseRealData} 
                />
              </div>
              <div className="flex items-end">
                <div className="flex gap-3 w-full">
                  <Button 
                    variant="default"
                    size="lg"
                    className="flex-1 glow-primary"
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
            <div className="space-y-10 animate-slide-up">
              {/* Stats */}
              <section>
                <ReportStats report={report} />
              </section>
              
              {/* Filters */}
              <section className="glass-card p-6">
                <CategoryFilter 
                  value={categoryFilter} 
                  onChange={setCategoryFilter}
                  counts={counts}
                />
              </section>
              
              {/* Charts & Table */}
              <Tabs defaultValue="table" className="w-full">
                <TabsList className="glass-card mb-6 p-1.5">
                  <TabsTrigger value="table" className="gap-2 px-6 py-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-xl transition-all">
                    <Table2 className="h-4 w-4" />
                    Trend Table
                  </TabsTrigger>
                  <TabsTrigger value="chart" className="gap-2 px-6 py-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-xl transition-all">
                    <LineChart className="h-4 w-4" />
                    Trend Chart
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="table">
                  <section className="glass-card p-8">
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold text-foreground flex items-center gap-3">
                        <span className="w-1 h-6 bg-primary rounded-full"></span>
                        Topic Frequency Matrix
                      </h2>
                      <p className="text-sm text-muted-foreground mt-2 ml-4">
                        Heatmap showing topic occurrences from T-30 to T
                      </p>
                    </div>
                    <TrendTable report={report} categoryFilter={categoryFilter} />
                  </section>
                </TabsContent>
                
                <TabsContent value="chart">
                  <section className="glass-card p-8">
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold text-foreground flex items-center gap-3">
                        <span className="w-1 h-6 bg-primary rounded-full"></span>
                        Top Topics Over Time
                      </h2>
                      <p className="text-sm text-muted-foreground mt-2 ml-4">
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
            <section className="glass-card p-16 text-center animate-fade-in">
              <div className="max-w-lg mx-auto">
                <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center mx-auto mb-8 animate-float glow-primary">
                  <BarChart3 className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Analyze
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Select an app and target date, then click "Analyze" to generate 
                  a comprehensive trend analysis report. The AI will identify topics, 
                  categorize them, and deduplicate similar issues automatically.
                </p>
                <div className="flex flex-wrap gap-3 justify-center text-sm">
                  <span className="px-4 py-2 rounded-xl bg-danger/10 text-danger border border-danger/20 font-medium">
                    Issues
                  </span>
                  <span className="px-4 py-2 rounded-xl bg-warning/10 text-warning border border-warning/20 font-medium">
                    Requests
                  </span>
                  <span className="px-4 py-2 rounded-xl bg-success/10 text-success border border-success/20 font-medium">
                    Feedback
                  </span>
                </div>
              </div>
            </section>
          )}
        </main>
        
        {/* Footer */}
        <footer className="border-t border-border/30 mt-auto">
          <div className="container mx-auto px-6 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              <span className="text-gradient-brand font-semibold">Ranveer Analytics</span>
              {' '}• Powered by AI • {useRealData ? 'Live Play Store scraping' : 'Simulated review data'}
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
