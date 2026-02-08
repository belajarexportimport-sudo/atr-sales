# ATR Sales PWA - Database Schema & Triggers

## Critical Database Triggers

### ⚠️ IMPORTANT: preserve_user_id_trigger

**DO NOT REMOVE THIS TRIGGER!**

This trigger prevents `user_id` from being modified during UPDATE operations, ensuring sales attribution remains correct.

**Why it exists:**
- Supabase RLS policies can overwrite `user_id` when admin users update inquiries
- Without this trigger, sales reps lose credit for their inquiries
- Commission tracking becomes incorrect

**Created:** 2026-02-08  
**Status:** ✅ Active  
**Impact:** Critical - affects sales attribution and commission calculations

**Verification:**
```sql
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'inquiries'
AND trigger_name = 'preserve_user_id_trigger';
```

**Documentation:** See `docs/DATABASE_TRIGGERS.md` for full details.

---

## Database Notes for Developers

### Immutable Fields

The following fields are **protected by triggers** and cannot be modified:

| Table | Field | Trigger | Purpose |
|-------|-------|---------|---------|
| `inquiries` | `user_id` | `preserve_user_id_trigger` | Sales attribution |

### RLS Policies

Row Level Security (RLS) is **ENABLED** on `inquiries` table.

**Admin Access:**
- Can view all inquiries
- Can update all inquiries
- `user_id` is preserved by trigger (not by RLS)

**Sales Access:**
- Can only view own inquiries (`user_id = auth.uid()`)
- Can only update own inquiries
- Cannot modify `user_id` (protected by trigger)

### Common Pitfalls

❌ **DON'T:**
```javascript
// This will NOT change user_id (trigger prevents it)
await supabase
    .from('inquiries')
    .update({ user_id: newUserId })
    .eq('id', inquiryId);
```

✅ **DO:**
```javascript
// user_id is automatically preserved
await supabase
    .from('inquiries')
    .update({ est_revenue: revenue })
    .eq('id', inquiryId);
```

### Debugging Tips

If `user_id` appears to change unexpectedly:

1. **Check trigger is active:**
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE event_object_table = 'inquiries';
   ```

2. **Check RLS policies:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'inquiries';
   ```

3. **Test manually:**
   ```sql
   UPDATE inquiries SET user_id = 'test-uuid' WHERE id = 'some-id';
   SELECT user_id FROM inquiries WHERE id = 'some-id';
   -- user_id should NOT be 'test-uuid'
   ```

---

## Migration History

### 2026-02-08: Added preserve_user_id_trigger

**Issue:** Admin updates were overwriting `user_id`, breaking sales attribution.

**Solution:** Database trigger that forces `user_id` preservation.

**Files:**
- `CREATE_PRESERVE_USER_ID_TRIGGER.sql` - Trigger creation script
- `docs/ROOT_CAUSE_ANALYSIS_USER_ID.md` - Technical explanation
- `docs/DATABASE_TRIGGERS.md` - Trigger documentation

**Testing:** Verified admin can update revenue without changing `user_id`.

---

## Contact

For questions about database triggers or schema:
- See documentation in `docs/` folder
- Check Supabase dashboard for current trigger status
- Review `ROOT_CAUSE_ANALYSIS_USER_ID.md` for technical details
