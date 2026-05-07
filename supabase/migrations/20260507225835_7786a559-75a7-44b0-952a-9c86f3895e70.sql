ALTER TYPE public.timeline_item_type ADD VALUE IF NOT EXISTS 'hotel';
ALTER TABLE public.tour_timeline_items ADD COLUMN IF NOT EXISTS end_date date;