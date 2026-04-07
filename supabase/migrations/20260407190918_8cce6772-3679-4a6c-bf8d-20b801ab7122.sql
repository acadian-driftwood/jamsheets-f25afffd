-- Fix show_schedule_items: change timestamptz to text for time-of-day strings
ALTER TABLE public.show_schedule_items 
  ALTER COLUMN starts_at TYPE text USING starts_at::text,
  ALTER COLUMN ends_at TYPE text USING ends_at::text;

-- Add timezone to shows
ALTER TABLE public.shows ADD COLUMN timezone text;

-- Add departure/arrival timezones to travel items
ALTER TABLE public.tour_timeline_items 
  ADD COLUMN departure_timezone text,
  ADD COLUMN arrival_timezone text;