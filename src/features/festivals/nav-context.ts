import { create } from 'zustand';

interface FestivalNavContextState {
  /** Slugs of the list a festival detail screen was opened from, in
   *  display order — lets that screen swipe to the next/previous one
   *  instead of only going back. Empty when opened from anywhere else
   *  (search, an artist page, a share link…). */
  slugs: string[];
}

export const useFestivalNavContext = create<FestivalNavContextState>(() => ({ slugs: [] }));

/** Call right before navigating into a festival from an ordered list. */
export function setFestivalNavContext(slugs: string[]) {
  useFestivalNavContext.setState({ slugs });
}
