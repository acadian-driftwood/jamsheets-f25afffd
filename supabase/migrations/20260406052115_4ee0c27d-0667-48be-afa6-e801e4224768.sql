ALTER TABLE public.shows ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.tour_timeline_items ADD COLUMN sort_order integer NOT NULL DEFAULT 0;