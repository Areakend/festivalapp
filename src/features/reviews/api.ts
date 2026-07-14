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

/**
 * The signed-in user's review for a festival, scoped to a specific year —
 * one review per (user, festival, year) now, not one per festival overall
 * (see useUpsertReview). `year: null` matches the legacy "yearless" review
 * some accounts still have from before per-year reviews existed.
 */
export function useMyReview(festivalId: string | undefined, year: number | null) {
  const userId = useSessionStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['my-review', festivalId, userId, year],
    enabled: !!festivalId && !!userId,
    queryFn: async () => {
      let query = supabase
        .from('reviews')
        .select('*')
        .eq('festival_id', festivalId!)
        .eq('user_id', userId!);
      query = year == null ? query.is('year', null) : query.eq('year', year);
      const { data, error } = await query.maybeSingle();
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

/**
 * Create or update the user's review for a given year (one row per
 * user/festival/year — see the reviews_one_per_year_idx migration).
 * Picking a year with no existing review creates a brand new one instead
 * of overwriting another year's review.
 *
 * Also makes sure a matching user_attendances row exists for that year:
 * a review is inherently "I was there in year Y", so it should always
 * count toward attendance stats and unlock sharing that year — without
 * this, someone who reviews a festival without separately logging the
 * year through the attendance sheet ends up with a review nobody can
 * "share" (see share/[kind].tsx's useLastFestival, which reads
 * user_attendances, not reviews).
 */
export function useUpsertReview() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);

  return useMutation({
    mutationFn: async ({ festivalId, year, ...ratings }: ReviewInput) => {
      if (!userId) throw new Error('Not signed in');
      let findQuery = supabase
        .from('reviews')
        .select('id')
        .eq('festival_id', festivalId)
        .eq('user_id', userId);
      findQuery = year == null ? findQuery.is('year', null) : findQuery.eq('year', year);
      const { data: existing, error: findError } = await findQuery.maybeSingle();
      if (findError) throw findError;

      const { error } = existing
        ? await supabase.from('reviews').update({ year, ...ratings }).eq('id', existing.id)
        : await supabase
            .from('reviews')
            .insert({ user_id: userId, festival_id: festivalId, year, ...ratings });
      if (error) throw error;

      if (year != null) {
        const { data: existingAttendance } = await supabase
          .from('user_attendances')
          .select('id')
          .eq('user_id', userId)
          .eq('festival_id', festivalId)
          .eq('attended_year', year)
          .maybeSingle();
        if (!existingAttendance) {
          await supabase
            .from('user_attendances')
            .insert({ user_id: userId, festival_id: festivalId, attended_year: year });
        }
      }
    },
    onSettled: (_data, _err, { festivalId }) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', festivalId] });
      queryClient.invalidateQueries({ queryKey: ['my-review', festivalId] });
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['my-attendances'] });
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

/** Review ids the signed-in user has upvoted (for the ReviewCard toggle). */
export function useMyReviewVotes() {
  const userId = useSessionStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['my-review-votes', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('review_votes')
        .select('review_id')
        .eq('user_id', userId!);
      if (error) throw error;
      return new Set((data as { review_id: string }[]).map((v) => v.review_id));
    },
  });
}

/**
 * Upvote/un-upvote a review. reviews.upvote_count is trigger-maintained
 * server-side, so a refetch of the reviews list picks up the new total —
 * summarize-reviews also reads it to weigh consensus-backed reviews
 * more heavily.
 */
export function useToggleReviewVote() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async ({
      reviewId,
      festivalId,
      upvoted,
    }: {
      reviewId: string;
      festivalId: string;
      upvoted: boolean;
    }) => {
      if (!userId) throw new Error('Not signed in');
      if (upvoted) {
        const { error } = await supabase
          .from('review_votes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('review_votes')
          .insert({ review_id: reviewId, user_id: userId });
        if (error) throw error;
      }
      return festivalId;
    },
    onSettled: (_data, _err, { festivalId }) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', festivalId] });
      queryClient.invalidateQueries({ queryKey: ['my-review-votes'] });
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
