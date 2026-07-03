import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/features/auth/session-store';
import type { Profile } from '@/types/domain';

export function useMyProfile() {
  const userId = useSessionStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);

  return useMutation({
    mutationFn: async (patch: Partial<Pick<Profile, 'display_name' | 'country' | 'preferred_language' | 'favorite_genres'>>) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
}

/** Latest DJ Mag year available in the rankings table (2026 today). */
export function useDjMagTop100() {
  return useQuery({
    queryKey: ['djmag-top100'],
    queryFn: async () => {
      const { data: latest, error: yearError } = await supabase
        .from('djmag_rankings')
        .select('year')
        .order('year', { ascending: false })
        .limit(1)
        .single();
      if (yearError) throw yearError;

      const { data, error } = await supabase
        .from('djmag_rankings')
        .select('rank_position, year, festivals(*)')
        .eq('year', latest.year)
        .order('rank_position');
      if (error) throw error;
      return { year: latest.year as number, entries: data as unknown as DjMagEntry[] };
    },
  });
}

export interface DjMagEntry {
  rank_position: number;
  year: number;
  festivals: {
    id: string;
    name: string;
    slug: string;
    country: string;
    best_djmag_rank: number | null;
  };
}
