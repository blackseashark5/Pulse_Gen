import { useState, useCallback } from 'react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { 
  Review, 
  TopicFrequency, 
  AnalysisReport, 
  ProcessingStatus,
  SEED_TOPICS,
  SUPPORTED_APPS
} from '@/types/review';
import { generateReviewsForDate } from '@/lib/reviewGenerator';
import { analyzeReviews, deduplicateTopics, buildAnalysisReport } from '@/lib/api/analysis';
import { loadCustomTopics, mergeTopicsWithCustom } from '@/lib/api/customTopics';
import { saveReport } from '@/lib/api/reports';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useReviewAnalysis() {
  const [status, setStatus] = useState<ProcessingStatus>({
    status: 'idle',
    message: '',
    progress: 0,
  });
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const { toast } = useToast();

  const scrapeRealReviews = async (
    appId: string, 
    packageName: string, 
    startDate: string, 
    endDate: string
  ): Promise<Review[]> => {
    const { data, error } = await supabase.functions.invoke('scrape-reviews', {
      body: { appId, packageName, startDate, endDate },
    });

    if (error) {
      console.error('Scraping error:', error);
      throw new Error('Failed to scrape reviews from Play Store');
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Scraping failed');
    }

    return data.data?.reviews || [];
  };

  const analyzeApp = useCallback(async (
    appId: string, 
    targetDate: Date,
    useRealData: boolean = false
  ) => {
    try {
      setReport(null);
      
      // Calculate date range (T-30 to T)
      const startDate = subDays(targetDate, 30);
      const dateRange = eachDayOfInterval({ start: startDate, end: targetDate });
      const dateStrings = dateRange.map(d => format(d, 'yyyy-MM-dd'));
      
      // Load custom topics
      const customTopics = await loadCustomTopics(appId);
      const allSeedTopics = mergeTopicsWithCustom(customTopics);

      // Get app info
      const appInfo = SUPPORTED_APPS.find(a => a.id === appId);
      
      // Step 1: Fetch or generate reviews
      let allReviews: Review[] = [];
      
      if (useRealData && appInfo) {
        setStatus({
          status: 'fetching',
          message: 'Scraping reviews from Google Play Store...',
          progress: 10,
        });

        try {
          const scrapedReviews = await scrapeRealReviews(
            appId,
            appInfo.packageName,
            format(startDate, 'yyyy-MM-dd'),
            format(targetDate, 'yyyy-MM-dd')
          );
          
          if (scrapedReviews.length > 0) {
            allReviews = scrapedReviews;
            toast({
              title: 'Live Data',
              description: `Scraped ${scrapedReviews.length} reviews from Play Store.`,
            });
          } else {
            // Fall back to mock data if scraping returns no results
            toast({
              title: 'Using Mock Data',
              description: 'No reviews found, falling back to simulated data.',
            });
            useRealData = false;
          }
        } catch (scrapeError) {
          console.error('Scraping failed:', scrapeError);
          toast({
            title: 'Scraping Failed',
            description: 'Using simulated data instead.',
            variant: 'destructive',
          });
          useRealData = false;
        }
      }
      
      if (!useRealData || allReviews.length === 0) {
        setStatus({
          status: 'fetching',
          message: 'Generating simulated reviews...',
          progress: 5,
        });
        
        for (let i = 0; i < dateRange.length; i++) {
          const date = dateRange[i];
          const dateStr = format(date, 'yyyy-MM-dd');
          
          setStatus({
            status: 'fetching',
            message: `Generating reviews for ${format(date, 'MMM d, yyyy')}...`,
            progress: 5 + Math.floor((i / dateRange.length) * 25),
            currentDate: dateStr,
          });
          
          const dailyReviews = generateReviewsForDate(appId, date);
          allReviews.push(...dailyReviews);
          
          await new Promise(r => setTimeout(r, 30));
        }
      }
      
      // Step 2: Analyze reviews in batches using AI
      setStatus({
        status: 'analyzing',
        message: 'Analyzing reviews with AI agent...',
        progress: 35,
      });
      
      // Group reviews by date for analysis
      const reviewsByDate = new Map<string, Review[]>();
      for (const review of allReviews) {
        const existing = reviewsByDate.get(review.date) || [];
        existing.push(review);
        reviewsByDate.set(review.date, existing);
      }
      
      // Track all discovered topics and their frequencies
      const topicAnalyses = new Map<string, { 
        category: string; 
        frequencies: Record<string, number>;
      }>();
      
      let newTopicsCount = 0;
      const existingTopics: string[] = allSeedTopics.map(t => t.topic);
      
      // Analyze each day's reviews
      let dateIndex = 0;
      for (const [dateStr, reviews] of reviewsByDate) {
        setStatus({
          status: 'analyzing',
          message: `Analyzing ${reviews.length} reviews for ${dateStr}...`,
          progress: 35 + Math.floor((dateIndex / reviewsByDate.size) * 35),
          currentDate: dateStr,
        });
        
        const result = await analyzeReviews({
          reviews,
          seedTopics: allSeedTopics,
          existingTopics,
        });
        
        if (result.success && result.data) {
          for (const topicResult of result.data.topics) {
            if (!topicAnalyses.has(topicResult.topic)) {
              topicAnalyses.set(topicResult.topic, {
                category: topicResult.category,
                frequencies: {},
              });
              existingTopics.push(topicResult.topic);
              
              if (topicResult.isNewTopic) {
                newTopicsCount++;
              }
            }
            
            const analysis = topicAnalyses.get(topicResult.topic)!;
            analysis.frequencies[dateStr] = (analysis.frequencies[dateStr] || 0) + 
              topicResult.matchedReviews.length;
          }
        }
        
        dateIndex++;
        await new Promise(r => setTimeout(r, 100));
      }
      
      // Step 3: Deduplicate topics
      setStatus({
        status: 'deduplicating',
        message: 'Deduplicating similar topics...',
        progress: 75,
      });
      
      const allTopics = Array.from(topicAnalyses.keys());
      const dedupeResult = await deduplicateTopics(allTopics);
      
      if (dedupeResult.success && dedupeResult.data) {
        for (const merged of dedupeResult.data.mergedTopics) {
          if (merged.variants.length > 0) {
            const canonicalAnalysis = topicAnalyses.get(merged.canonical);
            
            for (const variant of merged.variants) {
              const variantAnalysis = topicAnalyses.get(variant);
              if (variantAnalysis && canonicalAnalysis) {
                for (const [date, count] of Object.entries(variantAnalysis.frequencies)) {
                  canonicalAnalysis.frequencies[date] = 
                    (canonicalAnalysis.frequencies[date] || 0) + count;
                }
                topicAnalyses.delete(variant);
              }
            }
          }
        }
      }
      
      setStatus({
        status: 'complete',
        message: 'Saving report...',
        progress: 95,
      });
      
      // Build final report
      const finalReport = buildAnalysisReport(
        topicAnalyses,
        dateStrings,
        appId,
        format(targetDate, 'yyyy-MM-dd'),
        allReviews.length,
        newTopicsCount
      );
      
      // Save to database
      const reportId = await saveReport(finalReport);
      if (reportId) {
        finalReport.id = reportId;
      }
      
      setStatus({
        status: 'complete',
        message: 'Analysis complete!',
        progress: 100,
      });
      
      setReport(finalReport);
      
      toast({
        title: 'Analysis Complete',
        description: `Analyzed ${allReviews.length} reviews and identified ${finalReport.topics.length} topics.`,
      });
      
    } catch (error) {
      console.error('Analysis failed:', error);
      setStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Analysis failed',
        progress: 0,
      });
      
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const reset = useCallback(() => {
    setStatus({ status: 'idle', message: '', progress: 0 });
    setReport(null);
  }, []);

  const setReportFromHistory = useCallback((loadedReport: AnalysisReport) => {
    setReport(loadedReport);
    setStatus({ status: 'complete', message: 'Report loaded from history', progress: 100 });
  }, []);

  return {
    status,
    report,
    analyzeApp,
    reset,
    setReportFromHistory,
  };
}
