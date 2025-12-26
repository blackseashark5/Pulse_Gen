import { supabase } from '@/integrations/supabase/client';
import { SEED_TOPICS } from '@/types/review';

export interface CustomTopic {
  id: string;
  topic: string;
  category: 'issue' | 'request' | 'feedback';
  app_id: string | null;
  is_active: boolean;
  created_at: string;
}

export async function loadCustomTopics(appId?: string): Promise<CustomTopic[]> {
  let query = supabase
    .from('custom_topics')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (appId) {
    query = query.or(`app_id.eq.${appId},app_id.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error loading custom topics:', error);
    return [];
  }

  return (data || []) as CustomTopic[];
}

export async function addCustomTopic(
  topic: string, 
  category: 'issue' | 'request' | 'feedback',
  appId?: string
): Promise<CustomTopic | null> {
  const { data, error } = await supabase
    .from('custom_topics')
    .insert({
      topic: topic.trim(),
      category,
      app_id: appId || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding custom topic:', error);
    return null;
  }

  return data as CustomTopic;
}

export async function deleteCustomTopic(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('custom_topics')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting custom topic:', error);
    return false;
  }

  return true;
}

export async function toggleCustomTopic(id: string, isActive: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('custom_topics')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) {
    console.error('Error toggling custom topic:', error);
    return false;
  }

  return true;
}

export function mergeTopicsWithCustom(customTopics: CustomTopic[]): { topic: string; category: string }[] {
  const allTopics = [...SEED_TOPICS];
  
  for (const custom of customTopics) {
    if (!allTopics.some(t => t.topic.toLowerCase() === custom.topic.toLowerCase())) {
      allTopics.push({ topic: custom.topic, category: custom.category });
    }
  }
  
  return allTopics;
}
