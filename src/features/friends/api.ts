import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/features/auth/session-store';
import type { Profile, Review, UserFestivalStatus } from '@/types/domain';

export interface PublicProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  country: string | null;
}

interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted';
  requester: PublicProfile;
  addressee: PublicProfile;
}

export interface FriendsData {
  friends: { friendshipId: string; profile: PublicProfile }[];
  incoming: { friendshipId: string; profile: PublicProfile }[];
  outgoing: { friendshipId: string; profile: PublicProfile }[];
}

const FRIEND_SELECT =
  '*, requester:profiles!friendships_requester_id_fkey(id, display_name, avatar_url, country), addressee:profiles!friendships_addressee_id_fkey(id, display_name, avatar_url, country)';

export function useFriendships() {
  const userId = useSessionStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['friendships', userId],
    enabled: !!userId,
    queryFn: async (): Promise<FriendsData> => {
      const { data, error } = await supabase.from('friendships').select(FRIEND_SELECT);
      if (error) throw error;
      const rows = data as unknown as FriendshipRow[];

      const other = (row: FriendshipRow) =>
        row.requester_id === userId ? row.addressee : row.requester;

      return {
        friends: rows
          .filter((r) => r.status === 'accepted')
          .map((r) => ({ friendshipId: r.id, profile: other(r) })),
        incoming: rows
          .filter((r) => r.status === 'pending' && r.addressee_id === userId)
          .map((r) => ({ friendshipId: r.id, profile: r.requester })),
        outgoing: rows
          .filter((r) => r.status === 'pending' && r.requester_id === userId)
          .map((r) => ({ friendshipId: r.id, profile: r.addressee })),
      };
    },
  });
}

/** Search public profiles by display name (excludes self). */
export function useSearchUsers(query: string) {
  const userId = useSessionStore((s) => s.session?.user.id);
  const trimmed = query.trim();
  return useQuery({
    queryKey: ['user-search', trimmed],
    enabled: trimmed.length >= 2 && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, country')
        .ilike('display_name', `%${trimmed}%`)
        .neq('id', userId!)
        .limit(10);
      if (error) throw error;
      return data as PublicProfile[];
    },
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async (addresseeId: string) => {
      const { error } = await supabase
        .from('friendships')
        .insert({ requester_id: userId!, addressee_id: addresseeId });
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['friendships'] }),
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['friendships'] }),
  });
}

export function useRemoveFriendship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['friendships'] }),
  });
}

export interface FriendProfileData {
  profile: Profile;
  statuses: UserFestivalStatus[]; // readable thanks to the friends RLS policy
  reviews: Review[]; // public
}

export function useFriendProfile(friendId: string | undefined) {
  return useQuery({
    queryKey: ['friend-profile', friendId],
    enabled: !!friendId,
    queryFn: async (): Promise<FriendProfileData> => {
      const [profile, statuses, reviews] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', friendId!).single(),
        supabase.from('user_festival_statuses').select('*').eq('user_id', friendId!),
        supabase.from('reviews').select('*').eq('user_id', friendId!),
      ]);
      if (profile.error) throw profile.error;
      if (statuses.error) throw statuses.error;
      if (reviews.error) throw reviews.error;
      return {
        profile: profile.data as Profile,
        statuses: (statuses.data ?? []) as UserFestivalStatus[],
        reviews: (reviews.data ?? []) as Review[],
      };
    },
  });
}
