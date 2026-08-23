import { createClient } from 'jsr:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';

const DIGEST_RECIPIENT = 'mainstage.app.contact@gmail.com';

// Display names and review comments are user-controlled — interpolating
// them into the email's HTML unescaped would let a crafted name or comment
// inject markup (or worse) into whatever renders this in the operator's
// inbox. Only the festival name skips this: it's catalog data, never
// user-supplied.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
              const reporter = escapeHtml(
                (r.reporter as unknown as { display_name: string } | null)?.display_name ?? '—',
              );
              const reported = escapeHtml(
                (r.reported as unknown as { display_name: string } | null)?.display_name ?? '—',
              );
              const review = r.review as unknown as {
                comment: string | null;
                festival: { name: string } | null;
              } | null;
              const context = review
                ? ` on a review of <b>${escapeHtml(review.festival?.name ?? '—')}</b>${review.comment ? `: "${escapeHtml(review.comment.slice(0, 200))}"` : ''}`
                : '';
              const date = new Date(r.created_at).toLocaleString('en-GB', { timeZone: 'UTC' });
              return `<li><b>${reporter}</b> reported <b>${reported}</b>${context} — ${escapeHtml(r.reason)} (${date} UTC)</li>`;
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
