import { createClient } from 'jsr:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';

const MESSAGES: Record<string, { title: string; body: (festival: string) => string }> = {
  fr: { title: 'Comment c’était ?', body: (f) => `Donne ta note pour ${f} !` },
  en: { title: 'How was it?', body: (f) => `Rate ${f} now!` },
  nl: { title: 'Hoe was het?', body: (f) => `Geef je beoordeling voor ${f}!` },
  de: { title: 'Wie war’s?', body: (f) => `Bewerte jetzt ${f}!` },
  es: { title: '¿Qué tal estuvo?', body: (f) => `¡Valora ${f} ahora!` },
};

/**
 * Daily nudge to rate a festival that finished 3 days ago and hasn't been
 * reviewed yet. rating_reminder_candidates() already excludes anyone who's
 * reviewed it or been reminded about this exact (festival, year) before —
 * this function only has to send and then record that it did. Triggered by
 * pg_cron, not by app users.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: candidates, error } = await supabase.rpc('rating_reminder_candidates');
    if (error) throw error;

    let sent = 0;
    for (const c of candidates ?? []) {
      const { data: tokens, error: tokensError } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', c.user_id);
      if (tokensError) throw tokensError;

      if (tokens && tokens.length > 0) {
        const lang = MESSAGES[c.preferred_language as string] ? c.preferred_language : 'en';
        const { title, body } = MESSAGES[lang as string]!;
        const messages = tokens.map((t) => ({
          to: t.token,
          title,
          body: body(c.festival_name as string),
          data: { type: 'rating_reminder', festivalId: c.festival_id },
        }));
        const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(messages),
        });
        if (!pushResponse.ok) {
          console.error(`Expo push send failed (${pushResponse.status}): ${await pushResponse.text()}`);
        } else {
          sent += 1;
        }
      }

      // Recorded even without a push token — no token just means this
      // particular reminder can't be delivered, not that it should be
      // retried forever on every future run.
      await supabase.from('rating_reminders_sent').insert({
        user_id: c.user_id,
        festival_id: c.festival_id,
        attended_year: c.attended_year,
      });
    }

    return new Response(JSON.stringify({ success: true, candidates: candidates?.length ?? 0, sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
