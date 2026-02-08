# Database Triggers Documentation

## Overview

This document explains the database triggers implemented in the ATR Sales PWA to ensure data integrity.

---

## Active Triggers

### 1. `preserve_user_id_trigger`

**Purpose:** Prevents `user_id` from being modified during UPDATE operations to maintain sales attribution.

**Table:** `inquiries`

**Timing:** `BEFORE UPDATE`

**Function:** `preserve_inquiry_user_id()`

#### Why This Exists

When admin users update inquiries (e.g., approve quotes, edit revenue), Supabase's Row Level Security (RLS) can cause the `user_id` field to be overwritten with the admin's UUID. This breaks sales attribution and commission tracking.

#### How It Works

```sql
CREATE OR REPLACE FUNCTION preserve_inquiry_user_id()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Force user_id to remain unchanged
        NEW.user_id := OLD.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Execution Order:**
1. Application sends UPDATE request
2. **Trigger runs BEFORE UPDATE** ← Preserves user_id here
3. RLS policies check access
4. UPDATE executes
5. Data saved to database

#### Impact

- ✅ **Sales Attribution:** Inquiries always remain attributed to original creator
- ✅ **Commission Tracking:** Commissions calculated for correct sales rep
- ✅ **Audit Trail:** `user_id` provides accurate ownership history
- ⚠️ **Immutability:** `user_id` cannot be changed, even by admins (by design)

#### Verification

Check if trigger is active:

```sql
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'inquiries'
AND trigger_name = 'preserve_user_id_trigger';
```

Expected result: 1 row showing `BEFORE UPDATE` trigger.

#### Testing

```sql
-- Get current user_id
SELECT id, customer_name, user_id FROM inquiries LIMIT 1;

-- Try to change user_id (should fail silently)
UPDATE inquiries 
SET user_id = '00000000-0000-0000-0000-000000000000',
    est_revenue = 999999
WHERE customer_name = 'Test Company';

-- Verify user_id unchanged
SELECT id, customer_name, user_id, est_revenue FROM inquiries 
WHERE customer_name = 'Test Company';
```

**Expected:** `user_id` remains original value, `est_revenue` updated to 999999.

---

## Trigger Management

### Disable Trigger (Emergency Only)

```sql
-- Disable trigger temporarily
ALTER TABLE inquiries DISABLE TRIGGER preserve_user_id_trigger;

-- Re-enable trigger
ALTER TABLE inquiries ENABLE TRIGGER preserve_user_id_trigger;
```

⚠️ **WARNING:** Disabling this trigger will allow `user_id` to be modified, breaking sales attribution!

### Drop Trigger

```sql
-- Remove trigger completely
DROP TRIGGER IF EXISTS preserve_user_id_trigger ON inquiries;

-- Remove function
DROP FUNCTION IF EXISTS preserve_inquiry_user_id();
```

⚠️ **WARNING:** Only drop if you have an alternative solution for preserving `user_id`!

---

## Future Triggers

### Planned: `set_original_user_id_trigger`

If `original_user_id` column is added in the future:

```sql
CREATE OR REPLACE FUNCTION set_original_user_id()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.original_user_id IS NULL THEN
        NEW.original_user_id := NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_original_user_id_trigger
    BEFORE INSERT ON inquiries
    FOR EACH ROW
    EXECUTE FUNCTION set_original_user_id();
```

This would provide a separate, immutable field for tracking the original creator.

---

## Best Practices

### When to Use Triggers

✅ **Use triggers for:**
- Immutable fields (created_by, original_owner)
- Audit trails (updated_at, updated_by)
- Data integrity (prevent orphaned records)
- Calculated fields (auto-compute totals)

❌ **Don't use triggers for:**
- Business logic (use application code)
- Complex calculations (use views or functions)
- External API calls (use application code)
- User notifications (use application code)

### Naming Convention

```
<action>_<table>_<field>_trigger
```

Examples:
- `preserve_inquiry_user_id_trigger`
- `set_inquiry_original_user_trigger`
- `update_inquiry_timestamp_trigger`

### Documentation

Always document triggers with:
1. **Purpose:** Why does this trigger exist?
2. **Timing:** BEFORE/AFTER, INSERT/UPDATE/DELETE
3. **Impact:** What happens if trigger is disabled?
4. **Testing:** How to verify trigger works?

---

## Troubleshooting

### Trigger Not Firing

**Check if trigger exists:**
```sql
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'inquiries';
```

**Check if trigger is enabled:**
```sql
SELECT tgname, tgenabled FROM pg_trigger 
WHERE tgrelid = 'inquiries'::regclass;
```

`tgenabled` values:
- `O` = Enabled
- `D` = Disabled

### Trigger Causing Errors

**View trigger function source:**
```sql
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'preserve_inquiry_user_id';
```

**Check PostgreSQL logs:**
```sql
SELECT * FROM pg_stat_activity 
WHERE state = 'active';
```

---

## Related Documentation

- [Root Cause Analysis](./ROOT_CAUSE_ANALYSIS_USER_ID.md)
- [Supabase RLS Policies](./SUPABASE_RLS_POLICIES.md)
- [Database Schema](./DATABASE_SCHEMA.md)
