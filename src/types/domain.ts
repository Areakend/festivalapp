/**
 * Domain types mirroring the Supabase schema.
 * TODO(phase 2): generate these from the DB with `supabase gen types typescript`.
 */

export type FestivalStatus = 'attended' | 'planned' | 'wishlist' | 'favorite';
export type PlaylistStatus = 'pending' | 'preview' | 'created' | 'failed';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  country: string | null;
  preferred_language: 'en' | 'fr' | 'nl' | 'de' | 'es';
  favorite_genres: string[];
  created_at: string;
  updated_at: string;
}

export interface Festival {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  country: string;
  city: string | null;
  venue: string | null;
  latitude: number | null;
  longitude: number | null;
  genres: string[];
  number_of_stages: number | null;
  capacity: number | null;
  first_year: number | null;
  is_active: boolean;
  best_djmag_rank: number | null;
  official_website: string | null;
  cover_image_url: string | null;
}

export interface FestivalEdition {
  id: string;
  festival_id: string;
  year: number;
  start_date: string | null;
  end_date: string | null;
  lineup_published: boolean;
  poster_image_url: string | null;
}

export interface Artist {
  id: string;
  name: string;
  spotify_artist_id: string | null;
  genres: string[];
}

export interface DjMagRanking {
  id: string;
  festival_id: string;
  year: number;
  rank_position: number;
}

export interface UserFestivalStatus {
  id: string;
  user_id: string;
  festival_id: string;
  status: FestivalStatus;
}

export interface UserAttendance {
  id: string;
  user_id: string;
  festival_id: string;
  edition_id: string | null;
  attended_year: number;
  notes: string | null;
}

export interface Review {
  id: string;
  user_id: string;
  festival_id: string;
  edition_id: string | null;
  year: number | null;
  overall_rating: number;
  comment: string | null;
  lineup_rating: number | null;
  production_rating: number | null;
  side_quest_rating: number | null;
  organization_rating: number | null;
  atmosphere_rating: number | null;
  value_rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface FestivalCommunityStats {
  festival_id: string;
  avg_rating: number;
  rating_count: number;
  bayesian_score: number;
}

export interface GeneratedPlaylist {
  id: string;
  user_id: string;
  festival_id: string;
  edition_id: string | null;
  spotify_playlist_id: string | null;
  playlist_name: string;
  total_artists: number;
  matched_artists: number;
  total_tracks: number;
  status: PlaylistStatus;
}
