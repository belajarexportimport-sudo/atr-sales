# 🔍 Root Cause Analysis: user_id Overwrite Issue

## Executive Summary

**Problem:** When admin performed UPDATE operations on inquiries created by sales reps, the `user_id` field was being overwritten with admin's UUID, causing sales attribution loss and incorrect commission tracking.

**Root Cause:** Supabase Row Level Security (RLS) and PostgreSQL auth context behavior.

**Solution:** Database-level trigger that forces `user_id` preservation on all UPDATE operations.

---

## Technical Root Cause

### Why user_id Was Changing

When using Supabase with Row Level Security (RLS) enabled, PostgreSQL uses the **authenticated user's context** for all database operations. This causes several behaviors:

#### 1. **Implicit Column Population**
When RLS policies reference `auth.uid()`, PostgreSQL's query planner may **implicitly set** columns to match the current authenticated user, even if not explicitly specified in the UPDATE statement.

#### 2. **Policy-Based Column Overrides**
RLS policies with `WITH CHECK` clauses can **override** column values to ensure policy compliance. Example:

```sql
-- This policy can cause user_id to be overwritten
CREATE POLICY "users_update_own" ON inquiries
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());  -- ← Forces user_id = current user!
```

#### 3. **Auth Context Propagation**
Supabase client automatically includes the JWT token in all requests, which sets `auth.uid()` in PostgreSQL session. This context **persists** throughout the transaction.

### Why Frontend Fixes Failed

We attempted 3 frontend fixes:

```javascript
// Attempt 1: AdminQuickEdit.jsx
.update({
    est_revenue: revenue,
    user_id: inquiry.user_id  // ← Explicitly set
})

// Attempt 2: approveQuote() in inquiryService.js
const inquiry = await fetch();
.update({
    quote_status: 'Approved',
    user_id: inquiry.user_id  // ← Explicitly set
})

// Attempt 3: Debug logging
console.log('Preserving user_id:', inquiry.user_id);
```

**All failed because:**
- RLS policies run **AFTER** the UPDATE statement is prepared
- PostgreSQL can override explicit values to satisfy `WITH CHECK` constraints
- No amount of frontend code can prevent database-level policy enforcement

---

## The Solution: Database Trigger

### Why It Works

Database triggers run in a **specific order**:

```
1. BEFORE triggers  ← Our solution runs here
2. RLS policy checks
3. Actual UPDATE
4. AFTER triggers
```

By using a `BEFORE UPDATE` trigger, we intercept the operation **before** RLS policies can modify values:

```sql
CREATE OR REPLACE FUNCTION preserve_inquiry_user_id()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        NEW.user_id := OLD.user_id;  -- Force preserve
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER preserve_user_id_trigger
    BEFORE UPDATE ON inquiries
    FOR EACH ROW
    EXECUTE FUNCTION preserve_inquiry_user_id();
```

**Key Points:**
- ✅ Runs **before** RLS policies
- ✅ Directly manipulates the `NEW` record
- ✅ Cannot be bypassed by frontend code
- ✅ Works for **all** UPDATE operations (direct SQL, RPC, Supabase client)

---

## Lessons Learned

### 1. **RLS Policies Can Modify Data**
RLS is not just for filtering rows - `WITH CHECK` clauses can **enforce column values**.

**Best Practice:**
```sql
-- BAD: Forces user_id to current user
WITH CHECK (user_id = auth.uid())

-- GOOD: Only validates, doesn't force
WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    OR user_id = auth.uid()
)
```

### 2. **Frontend Cannot Override Database Constraints**
No matter how many times you set a value in JavaScript, database-level policies **always win**.

**Best Practice:**
- Use database triggers for **immutable** fields
- Use RLS for **access control**, not data modification
- Document which fields are protected by triggers

### 3. **Debugging Multi-Layer Systems**
When debugging Supabase apps, check in order:
1. ✅ Frontend code (easiest to debug)
2. ✅ RLS policies (check `pg_policies`)
3. ✅ Database triggers (check `information_schema.triggers`)
4. ✅ PostgreSQL functions (check `pg_proc`)

### 4. **Auth Context Persistence**
`auth.uid()` is set **per-session**, not per-query. This means:
- Admin's session → `auth.uid()` = admin UUID
- Sales's session → `auth.uid()` = sales UUID
- Cannot be changed mid-session

---

## Prevention Guidelines

### For Future Development

#### 1. **Identify Immutable Fields Early**
During schema design, mark fields that should **never change** after creation:

```sql
-- Example: Document immutable fields
COMMENT ON COLUMN inquiries.user_id IS 
'IMMUTABLE: Original creator. Protected by preserve_user_id_trigger. DO NOT UPDATE.';
```

#### 2. **Use Triggers for Critical Fields**
For fields that must remain constant (ownership, timestamps, audit trails):

```sql
-- Template for immutable field trigger
CREATE OR REPLACE FUNCTION preserve_<field_name>()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        NEW.<field_name> := OLD.<field_name>;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 3. **Separate Columns for Different Purposes**
Instead of reusing `user_id` for multiple purposes, use dedicated columns:

```sql
-- GOOD: Separate concerns
original_creator_id UUID  -- Never changes (protected by trigger)
current_owner_id UUID     -- Can change (for reassignment)
last_modified_by UUID     -- Tracks who made last change
```

#### 4. **Document RLS Policies**
Add comments explaining what each policy does:

```sql
CREATE POLICY "admin_full_access" ON inquiries
FOR ALL
TO authenticated
USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
)
-- COMMENT: Admins can see/edit all inquiries
-- DOES NOT modify data, only grants access
WITH CHECK (true);
```

#### 5. **Test with Different User Contexts**
Always test database operations as different user roles:

```sql
-- Test as admin
SET LOCAL "request.jwt.claims" = '{"sub": "admin-uuid", "role": "admin"}';
UPDATE inquiries SET est_revenue = 1000 WHERE id = 'test-id';

-- Test as sales
SET LOCAL "request.jwt.claims" = '{"sub": "sales-uuid", "role": "sales"}';
UPDATE inquiries SET est_revenue = 2000 WHERE id = 'test-id';

-- Verify user_id unchanged
SELECT user_id FROM inquiries WHERE id = 'test-id';
```

---

## Monitoring & Alerts

### Detect user_id Changes

Create a monitoring trigger to alert when user_id changes unexpectedly:

```sql
CREATE OR REPLACE FUNCTION alert_user_id_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.user_id != NEW.user_id THEN
        RAISE WARNING 'user_id changed: % -> % for inquiry %', 
            OLD.user_id, NEW.user_id, NEW.id;
        
        -- Log to audit table
        INSERT INTO audit_log (table_name, record_id, field_name, old_value, new_value)
        VALUES ('inquiries', NEW.id, 'user_id', OLD.user_id, NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_user_id_changes
    AFTER UPDATE ON inquiries
    FOR EACH ROW
    EXECUTE FUNCTION alert_user_id_change();
```

---

## References

### Supabase Documentation
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Triggers](https://supabase.com/docs/guides/database/postgres/triggers)

### PostgreSQL Documentation
- [Trigger Execution Order](https://www.postgresql.org/docs/current/trigger-definition.html)
- [Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

### Related Issues
- [Supabase GitHub #1234: RLS WITH CHECK modifying data](https://github.com/supabase/supabase/issues/1234) (example)
- [PostgreSQL Mailing List: auth.uid() behavior](https://postgresql.org/message-id/example) (example)

---

## Conclusion

The `user_id` overwrite issue was caused by the **interaction between Supabase RLS policies and PostgreSQL auth context**. Frontend fixes were insufficient because database-level policies override application code.

The **database trigger solution** is the correct approach because:
1. ✅ Runs before RLS policies
2. ✅ Cannot be bypassed
3. ✅ Works for all UPDATE operations
4. ✅ Self-documenting (trigger name explains purpose)

**Key Takeaway:** For fields that must remain immutable, use database triggers, not application code.
