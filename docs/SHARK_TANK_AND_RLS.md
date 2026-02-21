# Shark Tank (Open Market) & RLS Architecture

This document explains the "Shark Tank" feature and the Row Level Security (RLS) implementation that enables it, including critical safety patterns to avoid database errors.

## 🦈 What is Shark Tank?

The **Shark Tank** (internally referred to as "Open Market") is a pool of unassigned inquiries that any sales representative can "grab" to own and follow up on.

### The Workflow

1.  **Admin Inject**: An Admin creates a new Inquiry in the `InquiryFormPage` and toggles the **Shark Tank Inject** switch.
    *   Technical impact: `user_id` is set to `NULL`, and `status` is set to `Profiling`.
2.  **Shark Tank Notification**: Sales representatives see an alert on their Dashboard: "🦈 X NEW OPEN LEADS!".
3.  **Sales Grab**: A Sales rep clicks on an open lead and chooses to "Grab" it.
    *   Technical impact: `user_id` is updated to the `auth.uid()` of the sales rep, and the lead is no longer visible in the Shark Tank pool for others.

---

## 🔐 RLS Architecture

The system uses Supabase Row Level Security to strictly control data visibility.

### Policies for the `inquiries` Table

| User Role | Visibility | Logic (SQL `USING` clause) |
| :--- | :--- | :--- |
| **Admin** | **Everything** | `is_admin_safe()` |
| **Sales** | **Own + Shark Tank** | `auth.uid() = user_id OR user_id IS NULL` |

---

## ⚠️ Critical: Infinite Recursion Pitfall

### The Problem (`RECURSION_ERROR`)
If an RLS policy on Table A tries to check a user's role by querying Table A (or another table with a similar circular dependency), it triggers an **infinite recursion**.

**Example of what NOT to do:**
```sql
-- ❌ BAD: This causes recursion because 'is_admin()' 
-- queries 'profiles', which triggers the 'profiles' RLS policy again.
CREATE POLICY "Admin can see all" ON inquiries
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );
```

### The Fix: `SECURITY DEFINER` Functions
To break the recursion, we use a custom function defined with `SECURITY DEFINER`. This allows the function to bypass RLS and check the role directly.

**The Safe Pattern:**
```sql
CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS BOOLEAN AS $$
DECLARE
    u_role text;
BEGIN
    -- Query the table directly, bypassing RLS
    SELECT role INTO u_role FROM public.profiles WHERE id = auth.uid();
    RETURN (u_role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ SAFE POLICY
CREATE POLICY "admin_and_owner_select" ON inquiries 
FOR SELECT TO authenticated
USING ( auth.uid() = user_id OR is_admin_safe() );
```

---

## 🛠️ Maintenance & Troubleshooting

### Admin Dashboard is Blank
If the Admin Dashboard appears completely empty, it is almost always due to an **RLS Recursion Error** or a **Missing Profile**.

1.  **Check Recursion**: Ensure all policies use `is_admin_safe()` instead of direct subqueries.
2.  **Verify Admin Role**: Ensure the user's email is correctly mapped to `role = 'admin'` in the `profiles` table.

### Lead "Grab" Failed
Ensure the `inquiryService.grabInquiry` function is used, which performs a direct update on the `user_id` column while `user_id IS NULL`.

---

## Reference Files
- `src/services/inquiryService.js`: Logic for fetching and grabbing.
- `RESTORE_ADMIN_VISIBILITY.sql`: The primary fix script for RLS recovery.
