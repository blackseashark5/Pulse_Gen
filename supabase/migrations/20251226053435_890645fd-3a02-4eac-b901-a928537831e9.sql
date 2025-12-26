-- Create table for storing analysis reports
CREATE TABLE public.analysis_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id TEXT NOT NULL,
  app_name TEXT NOT NULL,
  target_date DATE NOT NULL,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  total_reviews_analyzed INTEGER NOT NULL DEFAULT 0,
  new_topics_discovered INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for storing topics within reports
CREATE TABLE public.report_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.analysis_reports(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('issue', 'request', 'feedback')),
  total_count INTEGER NOT NULL DEFAULT 0,
  trend TEXT NOT NULL CHECK (trend IN ('up', 'down', 'stable')),
  trend_percentage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for storing daily frequencies for each topic
CREATE TABLE public.topic_frequencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.report_topics(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  frequency INTEGER NOT NULL DEFAULT 0,
  UNIQUE(topic_id, date)
);

-- Create table for custom seed topics
CREATE TABLE public.custom_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('issue', 'request', 'feedback')),
  app_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.analysis_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_frequencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_topics ENABLE ROW LEVEL SECURITY;

-- Create public access policies (for demo purposes - no auth required)
CREATE POLICY "Allow public read access to analysis_reports" 
ON public.analysis_reports 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to analysis_reports" 
ON public.analysis_reports 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public delete access to analysis_reports" 
ON public.analysis_reports 
FOR DELETE 
USING (true);

CREATE POLICY "Allow public read access to report_topics" 
ON public.report_topics 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to report_topics" 
ON public.report_topics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public delete access to report_topics" 
ON public.report_topics 
FOR DELETE 
USING (true);

CREATE POLICY "Allow public read access to topic_frequencies" 
ON public.topic_frequencies 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to topic_frequencies" 
ON public.topic_frequencies 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public delete access to topic_frequencies" 
ON public.topic_frequencies 
FOR DELETE 
USING (true);

CREATE POLICY "Allow public read access to custom_topics" 
ON public.custom_topics 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to custom_topics" 
ON public.custom_topics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to custom_topics" 
ON public.custom_topics 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to custom_topics" 
ON public.custom_topics 
FOR DELETE 
USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_analysis_reports_app_id ON public.analysis_reports(app_id);
CREATE INDEX idx_analysis_reports_created_at ON public.analysis_reports(created_at DESC);
CREATE INDEX idx_report_topics_report_id ON public.report_topics(report_id);
CREATE INDEX idx_topic_frequencies_topic_id ON public.topic_frequencies(topic_id);
CREATE INDEX idx_custom_topics_app_id ON public.custom_topics(app_id);