# 🔍 Diagnostic Guide - User ID Still Changing

## Problem
User_id masih ter-claim ke admin meskipun sudah ada code `user_id: inquiry.user_id` di AdminQuickEdit.jsx

## Possible Root Causes

### 1. Browser Cache Issue
Frontend code lama masih ter-cache di browser.

**Solution:**
```
1. Buka browser Console (F12)
2. Klik kanan pada Refresh button
3. Pilih "Empty Cache and Hard Reload"
4. Atau: Ctrl + Shift + Delete → Clear cache
```

### 2. Vercel Deployment Belum Selesai
Deployment masih dalam proses.

**Check:**
- Go to: https://vercel.com/dashboard
- Wait for "Ready" status (~2 min)

### 3. inquiry.user_id Undefined/Null
Component menerima inquiry object tapi user_id-nya kosong.

**Check Console Logs:**
Setelah deployment selesai dan cache cleared, test lagi:
1. Login as Admin
2. Open browser Console (F12)
3. Edit revenue via pencil icon
4. Look for log: `🔍 DEBUG AdminQuickEdit:`
5. Check if `currentUserId` has value

**Expected Output:**
```javascript
🔍 DEBUG AdminQuickEdit: {
    inquiryId: "xxx-xxx-xxx",
    customerName: "PT Test",
    currentUserId: "abc-123-def",  // ← Should NOT be null!
    willPreserveUserId: "abc-123-def"
}
✅ UPDATE success - user_id should be preserved
```

**If currentUserId is null:**
→ Problem: inquiry object tidak punya user_id
→ Need to check where AdminQuickEdit is called

### 4. Database Trigger Overwriting
Ada trigger di database yang overwrite user_id setelah UPDATE.

**Check in Supabase:**
```sql
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'inquiries'
AND action_statement LIKE '%user_id%';
```

**If found trigger:**
→ Drop the trigger

### 5. RLS Policy Blocking
RLS policy blocking UPDATE dengan user_id yang berbeda.

**Check in Supabase:**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'inquiries';
```

**Quick Test - Disable RLS:**
```sql
ALTER TABLE inquiries DISABLE ROW LEVEL SECURITY;
```

## Next Steps

**Step 1: Wait for Deployment** (~2 min)
- Check Vercel dashboard

**Step 2: Clear Browser Cache**
- Hard reload (Ctrl + Shift + R)

**Step 3: Test & Check Console**
- Edit revenue
- Screenshot console logs
- Share screenshot

**Step 4: If Still Failing**
- Run diagnostic SQL queries above
- Check for triggers/RLS issues

---

## Quick Test SQL

Run this in Supabase to manually test:

```sql
-- Get a recent inquiry
SELECT id, customer_name, user_id, est_revenue 
FROM inquiries 
ORDER BY created_at DESC 
LIMIT 1;

-- Try manual UPDATE (replace ID)
UPDATE inquiries
SET est_revenue = 999999,
    user_id = user_id  -- Explicitly preserve
WHERE id = 'PASTE_ID_HERE';

-- Check if user_id changed
SELECT id, customer_name, user_id, est_revenue 
FROM inquiries 
WHERE id = 'PASTE_ID_HERE';
```

If manual SQL works but frontend doesn't → Frontend issue
If manual SQL also changes user_id → Database trigger issue
