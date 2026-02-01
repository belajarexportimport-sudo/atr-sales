-- FIX USER SIGNUP TRIGGER
-- Ensures new users are NOT auto-approved and have 'sales' role by default

-- 1. Create or Replace the Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, approved, created_at)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'sales', -- Default role
    FALSE,   -- Default approved status (Must be approved by Admin)
    NOW()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing trigger if exists (to prevent duplicates)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Re-create the Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

SELECT 'Signup trigger fixed. New users will be unapproved by default.' as status;
