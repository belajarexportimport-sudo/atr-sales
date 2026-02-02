-- === TRANSFER DATA OWNERSHIP ===
-- Masalahnya ditemukan: Data ada di akun "arfaibow", tapi Mas login pakai "arif141022".
-- Script ini akan memindahkan data dari "arfaibow" ke "arif141022".

DO $$
DECLARE
  source_email TEXT := 'arfaibow@gmail.com';
  target_email TEXT := 'arif141022@gmail.com';
  source_id UUID;
  target_id UUID;
  moved_count INT;
BEGIN
  -- 1. Get IDs
  SELECT id INTO source_id FROM public.profiles WHERE email = source_email;
  SELECT id INTO target_id FROM public.profiles WHERE email = target_email;

  -- 2. Validate
  IF source_id IS NULL THEN
    RAISE NOTICE 'Source user (%) not found!', source_email;
    RETURN;
  END IF;

  IF target_id IS NULL THEN
    RAISE NOTICE 'Target user (%) not found!', target_email;
    RETURN;
  END IF;

  -- 3. Update Inquiries
  UPDATE public.inquiries
  SET user_id = target_id
  WHERE user_id = source_id;
  
  GET DIAGNOSTICS moved_count = ROW_COUNT;

  RAISE NOTICE 'SUCCESS: % records moved from % to %', moved_count, source_email, target_email;
END $$;
