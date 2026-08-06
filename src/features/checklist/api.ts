import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';

import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/features/auth/session-store';
import type { ChecklistItemRow } from '@/types/domain';

export function useChecklistItems(festivalId: string | undefined) {
  const userId = useSessionStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['checklist-items', festivalId, userId],
    enabled: !!festivalId && !!userId,
    queryFn: async (): Promise<ChecklistItemRow[]> => {
      const { data, error } = await supabase
        .from('user_checklist_items')
        .select('*')
        .eq('festival_id', festivalId!);
      if (error) throw error;
      return data as ChecklistItemRow[];
    },
  });
}

/** Creates or updates one item's checked state (also used to persist a toggle's value). */
export function useSetChecklistItem() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async (input: {
      festivalId: string;
      itemKey: string;
      label: string;
      isChecked: boolean;
      isCustom?: boolean;
    }) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase.from('user_checklist_items').upsert(
        {
          user_id: userId,
          festival_id: input.festivalId,
          item_key: input.itemKey,
          label: input.label,
          is_checked: input.isChecked,
          is_custom: input.isCustom ?? false,
        },
        { onConflict: 'user_id,festival_id,item_key' },
      );
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['checklist-items', variables.festivalId] });
    },
  });
}

export function useRemoveChecklistItem() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async ({ festivalId, itemKey }: { festivalId: string; itemKey: string }) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase
        .from('user_checklist_items')
        .delete()
        .eq('user_id', userId)
        .eq('festival_id', festivalId)
        .eq('item_key', itemKey);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['checklist-items', variables.festivalId] });
    },
  });
}

export function generateCustomItemKey(): string {
  return `custom:${Crypto.randomUUID()}`;
}
