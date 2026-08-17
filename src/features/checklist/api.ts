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
    // Optimistic: a checklist tap (and a context toggle, which reads back
    // through the very same cache to decide what's shown) needs to feel
    // instant. Without this, the round trip made a toggle look like it did
    // nothing for about a second — easy to read as broken and tap again,
    // which then raced the first request's still-stale read of "current"
    // state and could flip it right back.
    onMutate: async (input) => {
      const queryKey = ['checklist-items', input.festivalId, userId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ChecklistItemRow[]>(queryKey);
      queryClient.setQueryData<ChecklistItemRow[]>(queryKey, (old = []) => {
        const idx = old.findIndex((i) => i.item_key === input.itemKey);
        const row: ChecklistItemRow = {
          id: idx >= 0 ? old[idx]!.id : `optimistic:${input.itemKey}`,
          user_id: userId!,
          festival_id: input.festivalId,
          item_key: input.itemKey,
          label: input.label,
          is_checked: input.isChecked,
          is_custom: input.isCustom ?? false,
          created_at: idx >= 0 ? old[idx]!.created_at : new Date().toISOString(),
        };
        if (idx < 0) return [...old, row];
        const next = [...old];
        next[idx] = row;
        return next;
      });
      return { previous, queryKey };
    },
    onError: (_error, _input, context) => {
      if (context) queryClient.setQueryData(context.queryKey, context.previous);
    },
    onSettled: (_data, _error, variables) => {
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
    onMutate: async ({ festivalId, itemKey }) => {
      const queryKey = ['checklist-items', festivalId, userId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ChecklistItemRow[]>(queryKey);
      queryClient.setQueryData<ChecklistItemRow[]>(queryKey, (old = []) =>
        old.filter((i) => i.item_key !== itemKey),
      );
      return { previous, queryKey };
    },
    onError: (_error, _input, context) => {
      if (context) queryClient.setQueryData(context.queryKey, context.previous);
    },
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['checklist-items', variables.festivalId] });
    },
  });
}

export function generateCustomItemKey(): string {
  return `custom:${Crypto.randomUUID()}`;
}
