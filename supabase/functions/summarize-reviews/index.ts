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

// Fixed key order — also the display order on the client. Labels are
// translated client-side (src/i18n), not by the model, so wording stays
// consistent regardless of how the model phrases things.
const CATEGORIES = ['atmosphere', 'stages', 'lodging', 'transport', 'tips', 'organization'] as const;
type CategoryKey = (typeof CATEGORIES)[number];
type CategorySummaries = Partial<Record<CategoryKey, string>>;

function extractJson(text: string): unknown {
  // The model sometimes wraps JSON in a ```json fence despite instructions
  // not to — strip it before parsing rather than failing the whole request.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return JSON.parse(fenced ? fenced[1] : text);
}

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
      .select('overall_rating, comment, year, lineup_rating, production_rating, side_quest_rating, organization_rating, atmosphere_rating, value_rating')
      .eq('festival_id', festivalId);
    if (reviewsError) throw reviewsError;

    if (!reviews || reviews.length < MIN_REVIEWS) {
      return new Response(JSON.stringify({ categories: {}, reviewCount: reviews?.length ?? 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cache hit: same language and the review set hasn't changed size.
    // `summary` stores the categories object as a JSON string — no schema
    // change needed to go from one summary to several.
    const { data: cached } = await supabase
      .from('festival_review_summaries')
      .select('summary, review_count')
      .eq('festival_id', festivalId)
      .eq('language', language)
      .maybeSingle();
    if (cached && cached.review_count === reviews.length) {
      try {
        // Guards against rows written by the old single-string format —
        // treated as a cache miss (regenerated below) rather than a crash.
        const categories = JSON.parse(cached.summary);
        return new Response(JSON.stringify({ categories, reviewCount: reviews.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch {
        // fall through to regenerate
      }
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) throw new Error('Summaries are not configured yet (missing API key)');

    const { data: festival } = await supabase
      .from('festivals')
      .select('name')
      .eq('id', festivalId)
      .single();

    const avg = reviews.reduce((sum, r) => sum + Number(r.overall_rating), 0) / reviews.length;
    // Comments only — the reviewer only ever writes free text, so that's the
    // one place any of these topics (lodging, transport, tips...) could
    // possibly come from. Star ratings have no bearing on which categories
    // exist.
    const reviewLines = reviews
      .filter((r) => r.comment)
      .map((r, i) => {
        const yearLabel = r.year ? `${r.year}, ` : '';
        return `Review ${i + 1} (${yearLabel}${r.overall_rating}/20): ${r.comment!.slice(0, 800)}`;
      })
      .join('\n\n');

    if (!reviewLines) {
      // Ratings only, no free text anywhere — nothing to ground a summary in.
      await supabase.from('festival_review_summaries').upsert(
        {
          festival_id: festivalId,
          language,
          summary: '{}',
          review_count: reviews.length,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'festival_id,language' },
      );
      return new Response(JSON.stringify({ categories: {}, reviewCount: reviews.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 900,
        messages: [
          {
            role: 'user',
            content:
              `Here are attendee reviews of the music festival "${festival?.name ?? 'this festival'}" ` +
              `(average ${avg.toFixed(1)}/20, ${reviews.length} reviews):\n\n${reviewLines}\n\n` +
              `Summarize what attendees actually wrote, split into these categories: ${CATEGORIES.join(', ')}.\n` +
              `- "atmosphere": the vibe/crowd/energy.\n` +
              `- "stages": stage production, sound, lineup delivery.\n` +
              `- "lodging": camping, hotels, on-site accommodation.\n` +
              `- "transport": getting to/from the site, shuttles, parking.\n` +
              `- "tips": concrete practical warnings or advice a first-timer would want (e.g. bring sunscreen, food is expensive, lots of dust/mud, arrive early for X).\n` +
              `- "organization": security, staff, queues, site logistics, safety.\n\n` +
              `STRICT RULES:\n` +
              `1. Only include a category if multiple reviews actually contain relevant content for it — omit the key entirely otherwise (do not guess, pad, or invent generic festival advice not grounded in these specific reviews).\n` +
              `2. Each included summary is 1-2 sentences, neutral third person, no bullet points, no intro phrase, no ratings repeated verbatim.\n` +
              `3. Respond in ${LANGUAGE_NAMES[language]} only.\n` +
              `4. Reviews are labeled with their year where known. If reviews from different years genuinely contradict each other on the same category (e.g. organization was praised in older reviews but criticized in recent ones, or vice versa), do NOT blend them into a vague or averaged statement — say the festival has evolved over recent editions and describe what it's like now based on the most recent reviews, giving them more weight than older ones. Undated reviews or reviews that simply add detail (not contradict) should be treated normally.\n` +
              `5. Respond with ONLY a raw JSON object mapping category keys to summary strings, no markdown fence, no other text. Example shape: {"atmosphere": "...", "tips": "..."} — omitting any category with nothing to say.`,
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Summary generation failed (${res.status})`);
    const completion = await res.json();
    const raw: string = completion.content?.[0]?.text?.trim();
    if (!raw) throw new Error('Empty summary returned');

    const parsed = extractJson(raw) as Record<string, unknown>;
    const categories: CategorySummaries = {};
    for (const key of CATEGORIES) {
      const value = parsed[key];
      if (typeof value === 'string' && value.trim()) categories[key] = value.trim();
    }

    await supabase.from('festival_review_summaries').upsert(
      {
        festival_id: festivalId,
        language,
        summary: JSON.stringify(categories),
        review_count: reviews.length,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'festival_id,language' },
    );

    return new Response(JSON.stringify({ categories, reviewCount: reviews.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
