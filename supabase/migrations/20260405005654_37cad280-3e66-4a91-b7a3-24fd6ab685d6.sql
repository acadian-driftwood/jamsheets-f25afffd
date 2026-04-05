
ALTER TABLE public.shows
  DROP CONSTRAINT shows_tour_id_fkey,
  ADD CONSTRAINT shows_tour_id_fkey
    FOREIGN KEY (tour_id) REFERENCES public.tours(id) ON DELETE CASCADE;
