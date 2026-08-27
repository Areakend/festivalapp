import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/features/auth/session-store';
import type { PersonalEvent } from '@/types/domain';

/** The signed-in user's own custom calendar entries. */
export function useMyPersonalEvents() {
  const userId = useSessionStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['my-personal-events', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('personal_events').select('*').order('start_date');
      if (error) throw error;
      return data as PersonalEvent[];
    },
  });
}

export function useAddPersonalEvent() {
  const userId = useSessionStore((s) => s.session?.user.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; start_date: string; end_date: string | null }) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase.from('personal_events').insert({ ...input, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-personal-events'] });
    },
  });
}

export function useDeletePersonalEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('personal_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-personal-events'] });
    },
  });
}
