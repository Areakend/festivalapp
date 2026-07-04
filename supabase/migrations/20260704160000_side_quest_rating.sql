-- Replace the "sound quality" sub-rating with a "side quest" sub-rating
-- (extra activities beyond the music: art, workshops, camping, etc.)

alter table public.reviews rename column sound_rating to side_quest_rating;
alter table public.reviews drop constraint reviews_sound_rating_check;
alter table public.reviews
  add constraint reviews_side_quest_rating_check check (side_quest_rating between 1 and 20);
