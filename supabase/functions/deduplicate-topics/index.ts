import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topics } = await req.json();
    
    if (!topics || topics.length === 0) {
      return new Response(
        JSON.stringify({ success: true, data: { mergedTopics: [] } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    console.log(`Deduplicating ${topics.length} topics`);

    const topicsList = topics.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n');

    const prompt = `You are an expert at semantic similarity analysis. Your task is to identify topics that are semantically equivalent and should be merged.

TOPICS TO ANALYZE:
${topicsList}

INSTRUCTIONS:
1. Group topics that refer to the SAME underlying issue/request/feedback
2. Similar phrasings should be merged:
   - "Delivery guy was rude" = "Delivery partner rude" = "Delivery person impolite"
   - "Food arrived cold" = "Cold food" = "Food not hot"
   - "App crashes" = "App crashing" = "Application crash"
3. Choose the most CANONICAL (clear, concise) name for each group
4. Single topics that don't have duplicates should still be included

Return a JSON object with this exact structure:
{
  "mergedTopics": [
    {
      "canonical": "Delivery partner rude",
      "variants": ["Delivery guy was rude", "Delivery person impolite", "Rude delivery boy"]
    },
    {
      "canonical": "App crashing",
      "variants": []
    }
  ]
}

If a topic has no variants (is unique), its variants array should be empty.`;

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
            content: 'You are a semantic similarity expert. Always return valid JSON. Be aggressive in merging similar topics.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
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

    // Parse JSON from response
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    try {
      const parsed = JSON.parse(jsonStr);
      const mergedCount = parsed.mergedTopics?.filter((t: any) => t.variants?.length > 0).length || 0;
      console.log(`Merged ${mergedCount} duplicate topic groups`);
      
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
    console.error('Error in deduplicate-topics:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
