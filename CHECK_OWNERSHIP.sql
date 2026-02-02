-- CHECK OWNERSHIP
-- Who owns these 21 records?

SELECT 
  p.full_name,
  p.email,
  p.id as profile_id,
  COUNT(i.id) as inquiry_count
FROM public.inquiries i
LEFT JOIN public.profiles p ON i.user_id = p.id
GROUP BY p.full_name, p.email, p.id;
