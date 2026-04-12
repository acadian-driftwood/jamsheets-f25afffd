
-- Delete duplicate hotel rows, keeping only the most recent per show
DELETE FROM public.show_hotels
WHERE id NOT IN (
  SELECT DISTINCT ON (show_id) id
  FROM public.show_hotels
  ORDER BY show_id, created_at DESC
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE public.show_hotels ADD CONSTRAINT show_hotels_show_id_unique UNIQUE (show_id);
