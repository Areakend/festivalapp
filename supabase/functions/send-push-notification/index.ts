import { createClient } from 'jsr:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';

/**
 * Sends a push notification for one of two app-defined events. The title
 * and body are always built server-side from data this function looks up
 * itself — the caller never supplies free text that ends up on someone
 * else's lock screen. `refId` must point to a row the caller actually owns
 * as the sender (inviter/requester) with the named recipient still pending,
 * so this can't be used to push arbitrary notifications at arbitrary users.
 */

type NotificationType = 'friend_request' | 'festival_invite';

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

    const { type, recipientUserId, refId } = (await req.json()) as {
      type: NotificationType;
      recipientUserId: string;
      refId: string;
    };
    if (!type || !recipientUserId || !refId) {
      throw new Error('Missing type, recipientUserId or refId');
    }

    const { data: sender } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();
    const senderName = sender?.display_name ?? 'Someone';

    let title: string;
    let body: string;

    if (type === 'friend_request') {
      const { data: friendship, error: friendshipError } = await supabase
        .from('friendships')
        .select('id')
        .eq('id', refId)
        .eq('requester_id', user.id)
        .eq('addressee_id', recipientUserId)
        .eq('status', 'pending')
        .maybeSingle();
      if (friendshipError) throw friendshipError;
      if (!friendship) throw new Error('No matching pending friend request from this sender');

      title = 'New friend request';
      body = `${senderName} sent you a friend request`;
    } else if (type === 'festival_invite') {
      const { data: invite, error: inviteError } = await supabase
        .from('festival_invites')
        .select('id, festival:festivals(name)')
        .eq('id', refId)
        .eq('inviter_id', user.id)
        .eq('invitee_id', recipientUserId)
        .eq('status', 'pending')
        .maybeSingle();
      if (inviteError) throw inviteError;
      if (!invite) throw new Error('No matching pending invite from this sender');

      const festivalName = (invite.festival as unknown as { name: string } | null)?.name ?? 'a festival';
      title = 'Festival invite';
      body = `${senderName} invited you to ${festivalName}`;
    } else {
      throw new Error('Unknown notification type');
    }

    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', recipientUserId);
    if (tokensError) throw tokensError;

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const messages = tokens.map((t) => ({
      to: t.token,
      title,
      body,
      data: { type, refId },
    }));

    const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
    if (!pushResponse.ok) {
      console.error(`Expo push send failed (${pushResponse.status}): ${await pushResponse.text()}`);
    }

    return new Response(JSON.stringify({ success: true, sent: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
