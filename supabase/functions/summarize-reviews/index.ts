import { createClient } from 'jsr:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';

const SUPPORTED_LANGUAGES = ['en', 'fr', 'nl', 'de', 'es'] as const;
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'French',
  nl: 'Dutch',
  de: 'German',
  es: 'Spanish',
};
const MIN_REVIEWS = 2;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) throw new Error('Not authenticated');

    const { festivalId, language: rawLanguage } = await req.json();
    if (!festivalId) throw new Error('Missing festivalId');
    const language = SUPPORTED_LANGUAGES.includes(rawLanguage) ? rawLanguage : 'en';

    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('overall_rating, comment, lineup_rating, production_rating, side_quest_rating, organization_rating, atmosphere_rating, value_rating')
      .eq('festival_id', festivalId);
    if (reviewsError) throw reviewsError;

    if (!reviews || reviews.length < MIN_REVIEWS) {
      return new Response(JSON.stringify({ summary: null, reviewCount: reviews?.length ?? 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cache hit: same language and the review set hasn't changed size.
    const { data: cached } = await supabase
      .from('festival_review_summaries')
      .select('summary, review_count')
      .eq('festival_id', festivalId)
      .eq('language', language)
      .maybeSingle();
    if (cached && cached.review_count === reviews.length) {
      return new Response(
        JSON.stringify({ summary: cached.summary, reviewCount: reviews.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) throw new Error('Summaries are not configured yet (missing API key)');

    const { data: festival } = await supabase
      .from('festivals')
      .select('name')
      .eq('id', festivalId)
      .single();

    const avg = reviews.reduce((sum, r) => sum + Number(r.overall_rating), 0) / reviews.length;
    const reviewLines = reviews
      .map((r) => {
        const parts = [`${r.overall_rating}/20`];
        if (r.comment) parts.push(r.comment.slice(0, 600));
        return `- ${parts.join(' — ')}`;
      })
      .join('\n');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content:
              `Here are attendee reviews of the music festival "${festival?.name ?? 'this festival'}" ` +
              `(average ${avg.toFixed(1)}/20, ${reviews.length} reviews):\n\n${reviewLines}\n\n` +
              `Write a short, neutral summary of what attendees think, in the style of Google Maps review summaries: ` +
              `2-3 sentences, third person ("attendees liked..."), mention the recurring positives and negatives, ` +
              `no bullet points, no intro phrase, no ratings repeated verbatim. ` +
              `Respond in ${LANGUAGE_NAMES[language]} only.`,
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Summary generation failed (${res.status})`);
    const completion = await res.json();
    const summary: string = completion.content?.[0]?.text?.trim();
    if (!summary) throw new Error('Empty summary returned');

    await supabase.from('festival_review_summaries').upsert(
      {
        festival_id: festivalId,
        language,
        summary,
        review_count: reviews.length,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'festival_id,language' },
    );

    return new Response(JSON.stringify({ summary, reviewCount: reviews.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
