-- CHECK DETAILED RLS POLICIES
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'inquiries';
