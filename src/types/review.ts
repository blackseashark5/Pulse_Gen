export interface Review {
  id: string;
  date: string;
  rating: number;
  text: string;
  app: string;
  username: string;
}

export interface TopicFrequency {
  topic: string;
  category: 'issue' | 'request' | 'feedback';
  frequencies: Record<string, number>;
  totalCount: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface AnalysisReport {
  id: string;
  targetDate: string;
  app: string;
  topics: TopicFrequency[];
  dateRange: string[];
  generatedAt: string;
  totalReviewsAnalyzed: number;
  newTopicsDiscovered: number;
}

export interface ProcessingStatus {
  status: 'idle' | 'fetching' | 'analyzing' | 'deduplicating' | 'complete' | 'error';
  message: string;
  progress: number;
  currentDate?: string;
}

export type AppOption = {
  id: string;
  name: string;
  packageName: string;
  icon: string;
};

export const SUPPORTED_APPS: AppOption[] = [
  {
    id: 'swiggy',
    name: 'Swiggy',
    packageName: 'in.swiggy.android',
    icon: '🍔',
  },
  {
    id: 'zomato',
    name: 'Zomato',
    packageName: 'com.application.zomato',
    icon: '🍕',
  },
  {
    id: 'blinkit',
    name: 'Blinkit',
    packageName: 'com.grofers.customerapp',
    icon: '🛒',
  },
];

export const SEED_TOPICS = [
  // Issues
  { topic: 'Delivery delayed', category: 'issue' as const },
  { topic: 'Food quality poor', category: 'issue' as const },
  { topic: 'Delivery partner rude', category: 'issue' as const },
  { topic: 'App crashing', category: 'issue' as const },
  { topic: 'Payment failed', category: 'issue' as const },
  { topic: 'Wrong order delivered', category: 'issue' as const },
  { topic: 'Order cancelled', category: 'issue' as const },
  { topic: 'Refund not received', category: 'issue' as const },
  { topic: 'GPS/Location issues', category: 'issue' as const },
  { topic: 'Customer support unhelpful', category: 'issue' as const },
  
  // Requests
  { topic: 'Add more restaurants', category: 'request' as const },
  { topic: 'Reduce delivery fees', category: 'request' as const },
  { topic: 'Improve packaging', category: 'request' as const },
  { topic: 'Add dark mode', category: 'request' as const },
  { topic: 'Better discounts', category: 'request' as const },
  { topic: 'Faster delivery', category: 'request' as const },
  { topic: 'More payment options', category: 'request' as const },
  
  // Feedback
  { topic: 'Great service', category: 'feedback' as const },
  { topic: 'Fast delivery', category: 'feedback' as const },
  { topic: 'Good app experience', category: 'feedback' as const },
  { topic: 'Reasonable prices', category: 'feedback' as const },
];
