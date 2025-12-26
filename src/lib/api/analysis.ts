import { supabase } from '@/integrations/supabase/client';
import { Review, TopicFrequency, AnalysisReport } from '@/types/review';

export interface AnalyzeReviewsRequest {
  reviews: Review[];
  seedTopics: { topic: string; category: string }[];
  existingTopics?: string[];
}

export interface AnalyzeReviewsResponse {
  success: boolean;
  data?: {
    topics: Array<{
      topic: string;
      category: 'issue' | 'request' | 'feedback';
      matchedReviews: string[];
      isNewTopic: boolean;
    }>;
  };
  error?: string;
}

export interface DeduplicateTopicsRequest {
  topics: string[];
}

export interface DeduplicateTopicsResponse {
  success: boolean;
  data?: {
    mergedTopics: Array<{
      canonical: string;
      variants: string[];
    }>;
  };
  error?: string;
}

export async function analyzeReviews(
  request: AnalyzeReviewsRequest
): Promise<AnalyzeReviewsResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-reviews', {
      body: request,
    });

    if (error) {
      console.error('Error analyzing reviews:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (err) {
    console.error('Exception analyzing reviews:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    };
  }
}

export async function deduplicateTopics(
  topics: string[]
): Promise<DeduplicateTopicsResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('deduplicate-topics', {
      body: { topics },
    });

    if (error) {
      console.error('Error deduplicating topics:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (err) {
    console.error('Exception deduplicating topics:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    };
  }
}

export function buildAnalysisReport(
  topicAnalyses: Map<string, { category: string; frequencies: Record<string, number> }>,
  dateRange: string[],
  app: string,
  targetDate: string,
  totalReviews: number,
  newTopicsCount: number
): AnalysisReport {
  const topics: TopicFrequency[] = [];

  for (const [topic, data] of topicAnalyses) {
    const frequencies = data.frequencies;
    const totalCount = Object.values(frequencies).reduce((a, b) => a + b, 0);
    
    // Calculate trend (last 7 days vs previous 7 days)
    const lastWeek = dateRange.slice(-7);
    const prevWeek = dateRange.slice(-14, -7);
    
    const lastWeekSum = lastWeek.reduce((sum, date) => sum + (frequencies[date] || 0), 0);
    const prevWeekSum = prevWeek.reduce((sum, date) => sum + (frequencies[date] || 0), 0);
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let trendPercentage = 0;
    
    if (prevWeekSum > 0) {
      const change = ((lastWeekSum - prevWeekSum) / prevWeekSum) * 100;
      trendPercentage = Math.abs(Math.round(change));
      if (change > 10) trend = 'up';
      else if (change < -10) trend = 'down';
    } else if (lastWeekSum > 0) {
      trend = 'up';
      trendPercentage = 100;
    }

    topics.push({
      topic,
      category: data.category as 'issue' | 'request' | 'feedback',
      frequencies,
      totalCount,
      trend,
      trendPercentage,
    });
  }

  // Sort by total count descending
  topics.sort((a, b) => b.totalCount - a.totalCount);

  return {
    id: `report-${Date.now()}`,
    targetDate,
    app,
    topics,
    dateRange,
    generatedAt: new Date().toISOString(),
    totalReviewsAnalyzed: totalReviews,
    newTopicsDiscovered: newTopicsCount,
  };
}
