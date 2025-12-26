import { supabase } from '@/integrations/supabase/client';
import { AnalysisReport, TopicFrequency } from '@/types/review';

export interface SavedReport {
  id: string;
  app_id: string;
  app_name: string;
  target_date: string;
  date_range_start: string;
  date_range_end: string;
  total_reviews_analyzed: number;
  new_topics_discovered: number;
  created_at: string;
}

export async function saveReport(report: AnalysisReport): Promise<string | null> {
  try {
    // Insert the main report
    const { data: reportData, error: reportError } = await supabase
      .from('analysis_reports')
      .insert({
        app_id: report.app,
        app_name: report.app.charAt(0).toUpperCase() + report.app.slice(1),
        target_date: report.targetDate,
        date_range_start: report.dateRange[0],
        date_range_end: report.dateRange[report.dateRange.length - 1],
        total_reviews_analyzed: report.totalReviewsAnalyzed,
        new_topics_discovered: report.newTopicsDiscovered,
      })
      .select('id')
      .single();

    if (reportError) {
      console.error('Error saving report:', reportError);
      return null;
    }

    const reportId = reportData.id;

    // Insert topics
    for (const topic of report.topics) {
      const { data: topicData, error: topicError } = await supabase
        .from('report_topics')
        .insert({
          report_id: reportId,
          topic: topic.topic,
          category: topic.category,
          total_count: topic.totalCount,
          trend: topic.trend,
          trend_percentage: topic.trendPercentage,
        })
        .select('id')
        .single();

      if (topicError) {
        console.error('Error saving topic:', topicError);
        continue;
      }

      // Insert frequencies
      const frequencies = Object.entries(topic.frequencies).map(([date, frequency]) => ({
        topic_id: topicData.id,
        date,
        frequency,
      }));

      if (frequencies.length > 0) {
        const { error: freqError } = await supabase
          .from('topic_frequencies')
          .insert(frequencies);

        if (freqError) {
          console.error('Error saving frequencies:', freqError);
        }
      }
    }

    return reportId;
  } catch (error) {
    console.error('Error saving report:', error);
    return null;
  }
}

export async function loadReports(): Promise<SavedReport[]> {
  const { data, error } = await supabase
    .from('analysis_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error loading reports:', error);
    return [];
  }

  return data || [];
}

export async function loadFullReport(reportId: string): Promise<AnalysisReport | null> {
  try {
    // Load report
    const { data: reportData, error: reportError } = await supabase
      .from('analysis_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !reportData) {
      console.error('Error loading report:', reportError);
      return null;
    }

    // Load topics
    const { data: topicsData, error: topicsError } = await supabase
      .from('report_topics')
      .select('*')
      .eq('report_id', reportId);

    if (topicsError) {
      console.error('Error loading topics:', topicsError);
      return null;
    }

    // Load frequencies for each topic
    const topics: TopicFrequency[] = [];
    for (const topic of topicsData || []) {
      const { data: freqData } = await supabase
        .from('topic_frequencies')
        .select('*')
        .eq('topic_id', topic.id);

      const frequencies: Record<string, number> = {};
      for (const freq of freqData || []) {
        frequencies[freq.date] = freq.frequency;
      }

      topics.push({
        topic: topic.topic,
        category: topic.category as 'issue' | 'request' | 'feedback',
        frequencies,
        totalCount: topic.total_count,
        trend: topic.trend as 'up' | 'down' | 'stable',
        trendPercentage: topic.trend_percentage,
      });
    }

    // Generate date range
    const startDate = new Date(reportData.date_range_start);
    const endDate = new Date(reportData.date_range_end);
    const dateRange: string[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dateRange.push(d.toISOString().split('T')[0]);
    }

    return {
      id: reportData.id,
      targetDate: reportData.target_date,
      app: reportData.app_id,
      topics,
      dateRange,
      generatedAt: reportData.created_at,
      totalReviewsAnalyzed: reportData.total_reviews_analyzed,
      newTopicsDiscovered: reportData.new_topics_discovered,
    };
  } catch (error) {
    console.error('Error loading full report:', error);
    return null;
  }
}

export async function deleteReport(reportId: string): Promise<boolean> {
  const { error } = await supabase
    .from('analysis_reports')
    .delete()
    .eq('id', reportId);

  if (error) {
    console.error('Error deleting report:', error);
    return false;
  }

  return true;
}
