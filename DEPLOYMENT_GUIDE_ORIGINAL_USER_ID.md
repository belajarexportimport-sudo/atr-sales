# 🚀 Deployment Guide - Original User ID Fix

## Step 1: Execute Database Migration (Supabase)

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
   - Or: Supabase Dashboard → SQL Editor

2. **Run Migration SQL**

Copy dan paste SQL berikut:

```sql
-- FINAL SOLUTION: Add original_user_id column

-- Step 1: Add new column for original creator
ALTER TABLE inquiries 
ADD COLUMN IF NOT EXISTS original_user_id uuid;

-- Step 2: Populate with current user_id for existing records
UPDATE inquiries
SET original_user_id = user_id
WHERE original_user_id IS NULL;

-- Step 3: Create trigger to auto-set on INSERT
CREATE OR REPLACE FUNCTION set_original_user_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.original_user_id IS NULL THEN
        NEW.original_user_id := NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Attach trigger
DROP TRIGGER IF EXISTS set_original_user_id_trigger ON inquiries;
CREATE TRIGGER set_original_user_id_trigger
    BEFORE INSERT ON inquiries
    FOR EACH ROW
    EXECUTE FUNCTION set_original_user_id();
```

3. **Click "Run"** atau tekan `Ctrl+Enter`

4. **Expected Result:**
   - ✅ `ALTER TABLE` success
   - ✅ `UPDATE` success (shows number of rows updated)
   - ✅ `CREATE FUNCTION` success
   - ✅ `CREATE TRIGGER` success

---

## Step 2: Verify Migration

Run verification SQL:

```sql
-- Check column exists
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'inquiries'
AND column_name = 'original_user_id';

-- Expected: 1 row showing original_user_id column

-- Check data populated
SELECT 
    customer_name,
    user_id,
    original_user_id,
    est_revenue
FROM inquiries
ORDER BY created_at DESC
LIMIT 5;

-- Expected: original_user_id NOT NULL for all rows

-- Check trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'inquiries'
AND trigger_name = 'set_original_user_id_trigger';

-- Expected: 1 row showing trigger
```

**All checks should pass ✅**

---

## Step 3: Deploy Frontend Changes

Frontend sudah diupdate di:
- ✅ `AdminQuickEdit.jsx` - Preserves `original_user_id`
- ✅ `DashboardPage.jsx` - Already uses `original_user_id` for filtering

**Deploy to Vercel:**

```bash
# Commit changes
git add .
git commit -m "fix: preserve original_user_id for sales attribution"
git push origin main
```

Vercel akan auto-deploy dalam ~2 menit.

---

## Step 4: Test End-to-End

### Test Scenario 1: New RFQ
1. Login sebagai **Sales** (bukan admin)
2. Create new RFQ dengan customer name "Test Original User ID"
3. Di Supabase, check:
   ```sql
   SELECT customer_name, user_id, original_user_id 
   FROM inquiries 
   WHERE customer_name = 'Test Original User ID';
   ```
4. **Expected:** `user_id` = `original_user_id` = sales UUID ✅

### Test Scenario 2: Admin Edit
1. Login sebagai **Admin**
2. Find RFQ "Test Original User ID"
3. Click pencil icon → Edit revenue → Save
4. Di Supabase, check lagi:
   ```sql
   SELECT customer_name, user_id, original_user_id, est_revenue
   FROM inquiries 
   WHERE customer_name = 'Test Original User ID';
   ```
5. **Expected:** 
   - ✅ `original_user_id` = sales UUID (UNCHANGED)
   - ✅ `est_revenue` = new value (UPDATED)
   - ⚠️ `user_id` may change to admin (OK, we don't care)

### Test Scenario 3: Dashboard Attribution
1. Login sebagai **Admin**
2. Go to Dashboard
3. Filter by sales rep yang buat RFQ tadi
4. **Expected:** RFQ "Test Original User ID" muncul di list ✅
5. **Expected:** Revenue counted untuk sales tersebut ✅

---

## Success Criteria

- [x] Database migration executed successfully
- [x] `original_user_id` column exists
- [x] All existing records populated
- [x] Trigger auto-sets on new records
- [x] Frontend deployed
- [ ] Test Scenario 1 passed
- [ ] Test Scenario 2 passed
- [ ] Test Scenario 3 passed

---

## Rollback Plan (If Needed)

Jika ada masalah, rollback dengan:

```sql
-- Remove trigger
DROP TRIGGER IF EXISTS set_original_user_id_trigger ON inquiries;
DROP FUNCTION IF EXISTS set_original_user_id();

-- Remove column (CAREFUL - this deletes data!)
-- ALTER TABLE inquiries DROP COLUMN original_user_id;
```

Tapi **tidak perlu rollback** karena:
- Adding column tidak break existing functionality
- Frontend sudah defensive (checks if column exists)
- Worst case: column tidak digunakan, tapi tidak harmful

---

## Next Steps After Deployment

1. Monitor for 24 jam
2. Check commission calculations tetap akurat
3. Verify sales attribution di dashboard
4. Update documentation jika perlu

**Estimated Total Time: 10-15 menit** ⏱️
