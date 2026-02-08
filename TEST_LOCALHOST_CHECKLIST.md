# Test Localhost - Checklist

## Status: ⏳ Fixing infinite recursion bug

### Step 1: Fix RLS Policy ⏳
- [ ] Run `FIX_INFINITE_RECURSION.sql` di Supabase
- [ ] Verify policy created (no recursion)

### Step 2: Test di Localhost ⏳
- [ ] Buka http://localhost:5174/
- [ ] Login sebagai admin
- [ ] Create new RFQ dengan revenue
- [ ] Verify revenue tersimpan di database
- [ ] Verify revenue muncul di dashboard

### Step 3: Deploy ke Vercel (Optional)
- [ ] Push code ke GitHub
- [ ] Wait for Vercel deployment
- [ ] Test di production

---

## Current Blocker:

**Infinite recursion in RLS UPDATE policy**

**Fix:** Run `FIX_INFINITE_RECURSION.sql`

**After fix:** Localhost siap untuk test!
