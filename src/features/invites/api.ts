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
      const { error } = await supabase.from('festival_invites').insert({
        festival_id: input.festivalId,
        edition_id: input.editionId,
        inviter_id: userId!,
        invitee_id: input.inviteeId,
      });
      if (error) throw error;
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
      const { error } = await supabase
        .from('festival_invites')
        .update({ status: input.accept ? 'accepted' : 'declined' })
        .eq('id', input.inviteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['festival-invites', userId] });
    },
  });
}
