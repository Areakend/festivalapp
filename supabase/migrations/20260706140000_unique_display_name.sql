-- Sign-up now collects a username up front (stored in display_name, same
-- field shown/edited on the profile screen) — enforce case-insensitive
-- uniqueness at the DB level as a safety net behind the client-side check.

create unique index profiles_display_name_lower_idx on public.profiles (lower(display_name));
