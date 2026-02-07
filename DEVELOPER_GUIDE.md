# ATR Sales PWA - Developer Guide & Architecture Manual

> **Last Updated**: 2026-02-06
> **Version**: 1.0 (Modular Monolith Transition Phase)

## 1. Introduction
This application is a **Progressive Web App (PWA)** built for ATR Express sales teams. It is designed as a "Mobile-First" CRM to track Inquiries, Revenue, and Commissions.

**Key Tech Stack:**
*   **Frontend**: React (Vite), Tailwind CSS.
*   **Backend**: Supabase (PostgreSQL, Auth, RLS).
*   **Hosting**: Vercel.

---

## 2. System Architecture: "Modular Monolith"

We are transitioning from a generic structure (`src/pages`) to a **Feature-Based Structure** (`src/features`). This ensures that as the app grows (adding Finance, Documents, etc.), the code remains organized.

### Core Directory Structure
```
src/
├── components/       # Shared UI (Buttons, Inputs, Logos)
├── lib/              # Supabase Client & Utils
├── features/         # BUSINESS LOGIC MODULES
│   ├── auth/         # Login, Register, Password Reset
│   ├── sales/        # Inquiry Form, Leads, Dashboard (Revenue)
│   ├── commission/   # Commission Lists, Calculations, Approvals
│   ├── performance/  # Leaderboard (Ranking)
│   └── ui/           # Layouts (Sidebar, Navbar)
└── App.jsx           # Main Router
```

### "Data vs Logic" Rule
*   **Logic (Rumus/Code)**: Stored in **Vercel/Code** inside `services/` folder of each feature.
    *   *Example*: `commissionRules.js`, `calculator.js`.
*   **Data (Angka/Variables)**: Stored in **Supabase Database**.
    *   *Example*: `rate_cards` (Harga), `commission_rates` (Persentase).
*   **Reason**: Administrators must be able to change prices/rates *without* deploying new code.

---

## 3. Database & Security

### Row Level Security (RLS) - CRITICAL
This app is **Multi-Tenant**.
*   **Sales User**: Can ONLY see their *own* data.
    *   Policy: `auth.uid() == user_id`
*   **Admin**: Can see ALL data.
    *   Policy: `auth.email() IN ('aditatrexpress@gmail.com', ...)`

> ⚠️ **WARNING**: Never turn off RLS. If you need to fetch global data (e.g., Leaderboard), use a secure RPC function or a specific Admin Policy, do not disable RLS globally.

---

## 4. Key Workflows

### A. Sales & Revenue (Current: Manual Input)
*   **Location**: `features/sales/InquiryForm.jsx`
*   **Process**: Sales inputs "Revenue" (IDR) and "Estimated GP" (IDR) manually.
*   **Future Upgrade**: Will integrate with `features/pricing/` to auto-calculate these numbers based on Origin/Destination/Weight.

### B. Commission Management
*   **Location**: `features/commission/`
*   **Calculation**:
    *   Currently: `GP * Fixed %` (Hardcoded in logic).
    *   Future: `CommissionRuleService` will fetch rules from DB.
*   **Status**: `Unpaid` -> `Paid`. Only Admin can toggle this.

### C. Tracking (Hybrid)
*   **Internal**: `tracking_events` table (DB) for internal updates.
*   **External**: Links to `atrexinternational.com` (Google System) or Courier APIs.
*   **Future**: Hybrid System where we sync internal events with Courier APIs (UPS/DHL) for Fuel Surcharge updates.

---

## 5. Future Roadmap (The "Microservice-Ready" Plan)

These modules are planned and fit into the `src/features/` slots:

1.  **Pricing Engine (`features/pricing/`)**
    *   **Hybrid Calculator**: Uses local DB for Base Rates (Contract Price) + API/DB for Fuel Surcharge.
    *   **Goal**: Replace manual revenue input with auto-calculation.

2.  **Document Generator (`features/documents/`)**
    *   **AWB Copy**: Template for printing labels.
    *   **Commercial Invoice**: Template for customs docs.

3.  **Finance Module (`features/finance/`)**
    *   **Billing**: Generating invoices for customers.
    *   **Payment**: Integration with Midtrans/Xendit (concept).

---

## 6. How to Deploy
1.  **Code**: Push to GitHub `main` branch.
2.  **Auto-Deploy**: Vercel triggers build automatically.
3.  **Database**: Any SQL schema changes must be run in Supabase SQL Editor.
