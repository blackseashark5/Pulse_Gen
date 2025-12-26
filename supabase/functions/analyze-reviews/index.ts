import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Review {
  id: string;
  date: string;
  rating: number;
  text: string;
  app: string;
  username: string;
}

interface AnalyzeRequest {
  reviews: Review[];
  seedTopics: { topic: string; category: string }[];
  existingTopics?: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reviews, seedTopics, existingTopics = [] } = await req.json() as AnalyzeRequest;
    
    if (!reviews || reviews.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No reviews provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing ${reviews.length} reviews with ${seedTopics.length} seed topics`);

    // Prepare the prompt for topic extraction
    const reviewTexts = reviews.map((r, i) => `[${i + 1}] "${r.text}"`).join('\n');
    const seedTopicsList = seedTopics.map(t => `- ${t.topic} (${t.category})`).join('\n');
    const existingTopicsList = existingTopics.length > 0 
      ? existingTopics.map(t => `- ${t}`).join('\n')
      : 'None yet';

    const prompt = `You are an expert at analyzing app reviews and categorizing them into topics. Your task is to analyze the following reviews and extract topics.

SEED TOPICS (use these as examples of the format and style):
${seedTopicsList}

EXISTING TOPICS (try to match to these first before creating new ones):
${existingTopicsList}

REVIEWS TO ANALYZE:
${reviewTexts}

INSTRUCTIONS:
1. For each review, identify the main topic being discussed
2. Topics should be SHORT (2-5 words), action-oriented phrases like "Delivery delayed", "Food quality poor", "App crashing"
3. IMPORTANT: If a review matches an existing topic semantically, use the EXACT existing topic name
4. Only create a new topic if the review discusses something genuinely different
5. Categorize each topic as: "issue" (complaints), "request" (feature requests), or "feedback" (praise/neutral)
6. Similar complaints should be merged: "Delivery guy was rude", "Delivery partner behaved badly", "Delivery person was impolite" should ALL be "Delivery partner rude"

Return a JSON object with this exact structure:
{
  "topics": [
    {
      "topic": "Topic name",
      "category": "issue|request|feedback",
      "matchedReviews": [1, 3, 7],
      "isNewTopic": false
    }
  ]
}

The matchedReviews array contains the review numbers (1-indexed) that match this topic.
Set isNewTopic to true only if this is a genuinely new topic not in the seed or existing topics.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a precise topic extraction agent. Always return valid JSON. Focus on semantic similarity to consolidate topics.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ success: false, error: 'Empty AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    try {
      const parsed = JSON.parse(jsonStr);
      console.log(`Extracted ${parsed.topics?.length || 0} topics`);
      
      return new Response(
        JSON.stringify({ success: true, data: parsed }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, content);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in analyze-reviews:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
