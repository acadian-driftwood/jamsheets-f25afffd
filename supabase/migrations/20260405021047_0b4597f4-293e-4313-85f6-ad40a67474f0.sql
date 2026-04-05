-- Add new timeline_item_type enum values
ALTER TYPE public.timeline_item_type ADD VALUE IF NOT EXISTS 'driving';
ALTER TYPE public.timeline_item_type ADD VALUE IF NOT EXISTS 'rental_return';

-- Add travel-specific columns to tour_timeline_items
ALTER TABLE public.tour_timeline_items
  ADD COLUMN IF NOT EXISTS travel_subtype text,
  ADD COLUMN IF NOT EXISTS linked_item_id uuid REFERENCES public.tour_timeline_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS departure_location text,
  ADD COLUMN IF NOT EXISTS arrival_location text,
  ADD COLUMN IF NOT EXISTS airline text,
  ADD COLUMN IF NOT EXISTS confirmation_number text,
  ADD COLUMN IF NOT EXISTS rental_company text,
  ADD COLUMN IF NOT EXISTS traveler_name text;