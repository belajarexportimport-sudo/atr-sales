-- AUTO-GENERATE MISSING INITIALS
-- This script generates 2-letter initials for all users who don't have them.
-- Example: "Adit Express" -> "AE", "Rifai" -> "RI"

UPDATE public.profiles
SET initials = UPPER(SUBSTRING(full_name FROM 1 FOR 2))
WHERE initials IS NULL OR initials = '';

-- Optional: Create a function to do this automatically on signup?
-- For now, running this script fixes current users.

SELECT id, full_name, initials FROM public.profiles;
