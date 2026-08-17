import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/features/auth/session-store';
import type { PublicProfile } from '@/features/friends/api';

interface InviteRow {
  id: string;
  festival_id: string;
  edition_id: string;
  inviter_id: string;
  invitee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  festival: { name: string; slug: string; cover_image_url: string | null };
  edition: { year: number; start_date: string | null; end_date: string | null };
  inviter: PublicProfile;
  invitee: PublicProfile;
}

export interface FestivalInvite {
  id: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  festival: { id: string; name: string; slug: string; cover_image_url: string | null };
  edition: { id: string; year: number; start_date: string | null; end_date: string | null };
  otherProfile: PublicProfile;
}

const INVITE_SELECT =
  '*, festival:festivals(name, slug, cover_image_url), edition:festival_editions(year, start_date, end_date), ' +
  'inviter:profiles!festival_invites_inviter_id_fkey(id, display_name, avatar_url, country), ' +
  'invitee:profiles!festival_invites_invitee_id_fkey(id, display_name, avatar_url, country)';

/** Invites involving the signed-in user, split into what they received and
 *  what they sent — RLS only ever returns rows where they're one side. */
export function useMyInvites() {
  const userId = useSessionStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['festival-invites', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('festival_invites')
        .select(INVITE_SELECT)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = data as unknown as InviteRow[];

      const toInvite = (r: InviteRow, otherProfile: PublicProfile): FestivalInvite => ({
        id: r.id,
        status: r.status,
        createdAt: r.created_at,
        festival: { id: r.festival_id, ...r.festival },
        edition: { id: r.edition_id, ...r.edition },
        otherProfile,
      });

      return {
        received: rows.filter((r) => r.invitee_id === userId).map((r) => toInvite(r, r.inviter)),
        sent: rows.filter((r) => r.inviter_id === userId).map((r) => toInvite(r, r.invitee)),
      };
    },
  });
}

export function useSendFestivalInvite() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async (input: { festivalId: string; editionId: string; inviteeId: string }) => {
      const { data, error } = await supabase
        .from('festival_invites')
        .insert({
          festival_id: input.festivalId,
          edition_id: input.editionId,
          inviter_id: userId!,
          invitee_id: input.inviteeId,
        })
        .select('id')
        .single();
      if (error) throw error;
      // Best-effort — see useSendFriendRequest for why this never throws.
      void supabase.functions
        .invoke('send-push-notification', {
          body: { type: 'festival_invite', recipientUserId: input.inviteeId, refId: data.id },
        })
        .catch(() => {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['festival-invites', userId] });
    },
  });
}

export function useRespondToInvite() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async (input: { inviteId: string; accept: boolean }) => {
      const { data: invite, error } = await supabase
        .from('festival_invites')
        .update({ status: input.accept ? 'accepted' : 'declined' })
        .eq('id', input.inviteId)
        .select('festival_id')
        .single();
      if (error) throw error;

      // Accepting only means something if it actually shows up as "going"
      // wherever the rest of the app looks for that (the festival page's
      // "friends here" list, Home) — both read user_festival_statuses, not
      // festival_invites, so this has to write there too. Skipped if
      // they're already 'attended': accepting an invite to a festival
      // they've already been to shouldn't relabel it as merely "planned".
      if (input.accept) {
        const { data: existing } = await supabase
          .from('user_festival_statuses')
          .select('status')
          .eq('user_id', userId!)
          .eq('festival_id', invite.festival_id);
        const statuses = new Set((existing ?? []).map((s) => s.status));
        if (!statuses.has('attended') && !statuses.has('planned')) {
          await supabase
            .from('user_festival_statuses')
            .insert({ user_id: userId!, festival_id: invite.festival_id, status: 'planned' });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['festival-invites', userId] });
      queryClient.invalidateQueries({ queryKey: ['my-statuses'] });
      queryClient.invalidateQueries({ queryKey: ['friends-festival-attendance'] });
    },
  });
}
