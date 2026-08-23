import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { functionsErrorMessage } from '@/lib/functions';
import { useSessionStore } from '@/features/auth/session-store';

/**
 * UGC moderation (Google Play requirement): report objectionable
 * content, block users, delete one's own account. Reports are
 * write-only from the client — they're reviewed via the dashboard.
 */

/** Ids of users the signed-in user has blocked (used to filter reviews). */
export function useMyBlockedIds() {
  const userId = useSessionStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['my-blocked-ids', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('user_blocks').select('blocked_id');
      if (error) throw error;
      return new Set((data as { blocked_id: string }[]).map((b) => b.blocked_id));
    },
  });
}

export interface BlockedUser {
  blockId: string;
  profile: { id: string; display_name: string; avatar_url: string | null };
}

/** Full profiles of blocked users, for the "manage blocked users" screen. */
export function useMyBlockedUsers() {
  const userId = useSessionStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['my-blocked-users', userId],
    enabled: !!userId,
    queryFn: async (): Promise<BlockedUser[]> => {
      const { data, error } = await supabase
        .from('user_blocks')
        .select('id, profile:profiles!user_blocks_blocked_id_fkey(id, display_name, avatar_url)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (
        data as unknown as {
          id: string;
          profile: { id: string; display_name: string; avatar_url: string | null };
        }[]
      ).map((row) => ({ blockId: row.id, profile: row.profile }));
    },
  });
}

export function useReportReview() {
  const userId = useSessionStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async ({ reviewId, reportedUserId }: { reviewId: string; reportedUserId: string }) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase.from('content_reports').insert({
        reporter_id: userId,
        review_id: reviewId,
        reported_user_id: reportedUserId,
      });
      if (error) throw error;
    },
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async ({ blockedId, blocked }: { blockedId: string; blocked: boolean }) => {
      if (!userId) throw new Error('Not signed in');
      if (blocked) {
        const { error } = await supabase
          .from('user_blocks')
          .delete()
          .eq('blocker_id', userId)
          .eq('blocked_id', blockedId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_blocks')
          .insert({ blocker_id: userId, blocked_id: blockedId });
        if (error) throw error;
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-blocked-ids'] });
      void queryClient.invalidateQueries({ queryKey: ['my-blocked-users'] });
    },
  });
}

/**
 * Deletes the account server-side (auth user + cascade over all data),
 * then ends the local session. The caller navigates away on success.
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) throw new Error(await functionsErrorMessage(error));
      await supabase.auth.signOut();
    },
  });
}
