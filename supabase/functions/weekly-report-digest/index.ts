import { createClient } from 'jsr:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';

const DIGEST_RECIPIENT = 'mainstage.app.contact@gmail.com';

/**
 * Weekly summary of content_reports, emailed to the operator. Reports have
 * no admin UI and no automated action — this is the only thing that
 * surfaces them at all, so it fires unconditionally (including "0 this
 * week") as a liveness signal: a week with no email at all should read as
 * "something broke", not "nothing to report". Triggered by pg_cron, not by
 * app users — see the migration that schedules it.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: reports, error } = await supabase
      .from('content_reports')
      .select(
        `id, reason, created_at,
         reporter:profiles!content_reports_reporter_id_fkey(display_name),
         reported:profiles!content_reports_reported_user_id_fkey(display_name),
         review:reviews(comment, festival:festivals(name))`,
      )
      .gte('created_at', since)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const rows = reports ?? [];
    const html =
      rows.length === 0
        ? '<p>No reports this week.</p>'
        : `<ul>${rows
            .map((r) => {
              const reporter = (r.reporter as unknown as { display_name: string } | null)?.display_name ?? '—';
              const reported = (r.reported as unknown as { display_name: string } | null)?.display_name ?? '—';
              const review = r.review as unknown as {
                comment: string | null;
                festival: { name: string } | null;
              } | null;
              const context = review
                ? ` on a review of <b>${review.festival?.name ?? '—'}</b>${review.comment ? `: "${review.comment.slice(0, 200)}"` : ''}`
                : '';
              const date = new Date(r.created_at).toLocaleString('en-GB', { timeZone: 'UTC' });
              return `<li><b>${reporter}</b> reported <b>${reported}</b>${context} — ${r.reason} (${date} UTC)</li>`;
            })
            .join('')}</ul>`;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Mainstage <onboarding@resend.dev>',
        to: DIGEST_RECIPIENT,
        subject: `Mainstage — ${rows.length} report(s) this week`,
        html,
      }),
    });
    if (!emailResponse.ok) {
      throw new Error(`Resend send failed (${emailResponse.status}): ${await emailResponse.text()}`);
    }

    return new Response(JSON.stringify({ success: true, count: rows.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
