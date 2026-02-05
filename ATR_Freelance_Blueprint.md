# ATR Sales PWA - Architecture & Implementation Plan (Freelance Model)

## 1. System Overview
**Goal:** Transform the current CRM into an "Uber-like" Open Marketplace for Logistics Sales.
**Core Concept:** Admin injects leads -> Sales Freelance compete to "Grab" -> Sales locks the lead -> Sales closes deal.

## 2. Technical Architecture

### Database Schema Updates (Supabase)

#### A. Leads Table (`leads`) - *Existing but Enhanced*
| Column | Type | Purpose |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `status` | Text | `UNASSIGNED` (New), `ASSIGNED` (Grabbed), `PROSPECTING`, `WON`, `LOST` |
| `user_id` | UUID | **Nullable**. If NULL = Open Lead (Pool). If Filled = Locked by Sales. |
| `grabbed_at` | Timestamptz | Waktu saat sales klik "Ambil". Untuk timer expiry. |
| `rating_min_tier` | Integer | (Future) Filter, e.g., only Tier 2+ can see this lead. |
| `origin` | Text | Public Info (Visible to all) |
| `destination` | Text | Public Info (Visible to all) |
| `est_weight` | Float | Public Info (Visible to all) |
| `customer_name` | Text | **HIDDEN/MASKED** for `UNASSIGNED` leads (e.g. "Manufacturing Corp"). |

#### B. Profiles Table (`profiles`) - *Enhanced*
| Column | Type | Purpose |
| :--- | :--- | :--- |
| `tier` | Text | `Bronze`, `Silver`, `Gold`. Determines access level. |
| `reputation_score` | Integer | 0-100. Dynamic score based on performance. |
| `is_suspended` | Boolean | Flag for banned users. |

### RLS Policies (Security Layer)
1.  **Open Pool Policy:**
    *   `SELECT`: Allow ALL authenticated users where `status = 'UNASSIGNED'` AND `user_tier >= lead_min_tier`.
2.  **Locked Lead Policy:**
    *   `SELECT/UPDATE`: Allow ONLY if `user_id = auth.uid()` OR `role = 'admin'`.

### Concurrency Handling (The "Race Condition" Fix)
*   **Technique:** Database Logic / RPC.
*   **Logic:**
    ```sql
    UPDATE leads
    SET user_id = :sales_id, status = 'ASSIGNED', grabbed_at = NOW()
    WHERE id = :lead_id AND user_id IS NULL;
    ```
    *   *Atomic:* Jika 2 sales klik bersamaan, database hanya akan memproses satu yang pertama masuk. Yang kedua akan gagal (Row count = 0).

---

## 3. Implementation Plan

### Phase 1: The "Pool" Foundation (MVP)
*   [ ] **Database Migration:**
    *   Allow `user_id` NULL in `leads`.
    *   Add `status` ENUM values (`UNASSIGNED`).
*   **Admin Feature:**
    *   "Inject RFQ" Form (Input Lead as Unassigned).
*   **Sales Feature:**
    *   **"Shark Tank" Tab:** List all leads where `user_id` is NULL.
    *   **"Grab" Button:** Call RPC to lock lead.
    *   **Logic:** Once grabbed, lead moves to "My Leads" tab.
    *   **Duplicate Logic:**
        *   If `Name` & `Details` match exactly -> Reject Duplicate Input.
        *   If `Details` differ slightly -> Allow but Flag for Review.

### Phase 2: Integrity & Financial Safety
*   [ ] **Payment-First Rule (MANDATORY):**
    *   **NO DP.** Wajib **FULL PAYMENT** received.
    *   **System Lock:** Disable "Approve AWB" button strictly until "Payment Status" = `PAID`. (Sales Bailout Allowed).
*   [ ] **CIPL Validation UI:**
    *   Add "Upload CIPL" at Closing Stage (Deal).
    *   Add "Final Data Input" (Weight/CommFinal) at Closing Stage.
    *   System Check: Compare `Initial RFQ` vs `Final Closing Data`.
    *   Alert Admin if deviation > 10%.

### Phase 3: Reputation System (Gamification)
*   [ ] **Rating Engine:**
    *   Auto-calculate score after every `WON` (+Points) or `LOST/EXPIRED` (-Points).
*   [ ] **Tiering Logic:**
    *   Auto-promote/demote based on score thresholds.
    *   Filter "Big Fish" leads based on Tier.

## 4. Why This Architecture is Robust?
1.  **Loosely Coupled:** Fitur "Grab" tidak mengganggu fitur "Commission" yang sudah ada.
2.  **Database-First Security:** Kita mengandalkan RLS Supabase, bukan Logic Frontend yang bisa diakali (F12).
3.  **Human-in-the-Loop:** Keputusan fatal (Banned/Sanksi) tetap di tangan Admin, sistem hanya memberi bendera (Flagging). Ini mencegah "False Positive" yang bikin sales frustrasi.
