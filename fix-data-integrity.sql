-- MASTER DATA FIX SCRIPT
-- Run this in Supabase SQL Editor to fix all data inconsistencies

-- 1. Fix Missing Initials (Required for AWB)
UPDATE public.profiles
SET initials = UPPER(SUBSTRING(full_name FROM 1 FOR 2))
WHERE initials IS NULL OR initials = '';

-- 2. Fix Null Approval Status
-- Users with NULL approval won't show up in "Pending List"
-- We set them to FALSE so Admin can see and approve them
UPDATE public.profiles
SET approved = FALSE
WHERE approved IS NULL;

-- 3. Fix Null Roles (Default to 'sales')
UPDATE public.profiles
SET role = 'sales'
WHERE role IS NULL;

-- 4. Verify Results
SELECT 
    count(*) as total_users,
    count(*) filter (where initials is not null) as with_initials,
    count(*) filter (where approved is false) as pending_approval
FROM public.profiles;
