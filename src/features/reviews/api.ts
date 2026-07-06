import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/features/auth/session-store';
import type { Review } from '@/types/domain';

export type ReviewWithAuthor = Review & {
  profiles: { display_name: string; avatar_url: string | null } | null;
};

export type ReviewSort = 'newest' | 'highest';

/** Public reviews of a festival with author names (profiles are world-readable). */
export function useFestivalReviews(festivalId: string | undefined, sort: ReviewSort) {
  return useQuery({
    queryKey: ['reviews', festivalId, sort],
    enabled: !!festivalId,
    queryFn: async () => {
      const query = supabase
        .from('reviews')
        .select('*, profiles(display_name, avatar_url)')
        .eq('festival_id', festivalId!);
      const sorted =
        sort === 'newest'
          ? query.order('created_at', { ascending: false })
          : query.order('overall_rating', { ascending: false });
      const { data, error } = await sorted;
      if (error) throw error;
      return data as ReviewWithAuthor[];
    },
  });
}

/** The signed-in user's review for a festival (one per festival in the MVP). */
export function useMyReview(festivalId: string | undefined) {
  const userId = useSessionStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['my-review', festivalId, userId],
    enabled: !!festivalId && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('festival_id', festivalId!)
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Review | null;
    },
  });
}

export interface ReviewInput {
  festivalId: string;
  year: number | null;
  overall_rating: number;
  comment: string | null;
  lineup_rating: number | null;
  production_rating: number | null;
  side_quest_rating: number | null;
  organization_rating: number | null;
  atmosphere_rating: number | null;
  value_rating: number | null;
}

/** Create or update the user's review (checked against the existing one). */
export function useUpsertReview() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);

  return useMutation({
    mutationFn: async ({ festivalId, ...ratings }: ReviewInput) => {
      if (!userId) throw new Error('Not signed in');
      const { data: existing, error: findError } = await supabase
        .from('reviews')
        .select('id')
        .eq('festival_id', festivalId)
        .eq('user_id', userId)
        .maybeSingle();
      if (findError) throw findError;

      const { error } = existing
        ? await supabase.from('reviews').update(ratings).eq('id', existing.id)
        : await supabase
            .from('reviews')
            .insert({ user_id: userId, festival_id: festivalId, ...ratings });
      if (error) throw error;
    },
    onSettled: (_data, _err, { festivalId }) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', festivalId] });
      queryClient.invalidateQueries({ queryKey: ['my-review', festivalId] });
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['festivals'] }); // community stats changed
      queryClient.invalidateQueries({ queryKey: ['festival'] });
    },
  });
}

export const REVIEW_SUMMARY_CATEGORIES = [
  'atmosphere',
  'stages',
  'lodging',
  'transport',
  'tips',
  'organization',
] as const;
export type ReviewSummaryCategory = (typeof REVIEW_SUMMARY_CATEGORIES)[number];
export type ReviewSummaryCategories = Partial<Record<ReviewSummaryCategory, string>>;

/**
 * AI summary of a festival's community reviews, split by topic (Google-Maps
 * style but per-category). The Edge Function caches per (festival,
 * language) and only regenerates when the review count changes; `enabled`
 * avoids pointless calls when there are too few reviews to summarize. A
 * category is only present in the result if the model found actual
 * grounded content for it — never padded with generic advice.
 */
export function useReviewSummary(
  festivalId: string | undefined,
  language: string,
  reviewCount: number,
) {
  return useQuery({
    queryKey: ['review-summary', festivalId, language, reviewCount],
    enabled: !!festivalId && reviewCount >= 2,
    staleTime: 60 * 60_000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<{
        categories: ReviewSummaryCategories;
        reviewCount: number;
      }>('summarize-reviews', { body: { festivalId, language } });
      if (error) throw error;
      return data!;
    },
  });
}

/** Delete the signed-in user's review (RLS restricts to own rows). */
export function useDeleteReview() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);

  return useMutation({
    mutationFn: async ({ reviewId }: { reviewId: string; festivalId: string }) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
      if (error) throw error;
    },
    onSettled: (_data, _err, { festivalId }) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', festivalId] });
      queryClient.invalidateQueries({ queryKey: ['my-review', festivalId] });
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['festivals'] }); // community stats changed
      queryClient.invalidateQueries({ queryKey: ['festival'] });
    },
  });
}

/** All reviews written by the signed-in user (profile stats). */
export function useMyReviews() {
  const userId = useSessionStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['my-reviews', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', userId!);
      if (error) throw error;
      return data as Review[];
    },
  });
}
