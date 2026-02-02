-- CHECK DATA EXISTENCE
-- Run this to see if data actually exists in the tables

SELECT 
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  (SELECT COUNT(*) FROM public.inquiries) as total_inquiries,
  (SELECT COUNT(*) FROM public.inquiries WHERE commission_status = 'Pending') as pending_commissions;
