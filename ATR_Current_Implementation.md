# Implementation Plan - Revenue & Commission Breakdown

## Goal Description
Enhance the dashboard to show detailed breakdowns for both Revenue and Commission, and fix critical bugs in Tracking.
1.  **Revenue**: Realized vs Pipeline (Already Done).
2.  **Commission**: Breakdown by Projection, Won (Unpaid), and Paid.
3.  **Tracking**: Fix invalid date display (1970 error).

## Proposed Changes

### Dashboard
#### [MODIFY] [DashboardPage.jsx](file:///c:/Users/LENOVO/.gemini/antigravity/scratch/atr-sales-pwa/src/pages/DashboardPage.jsx)
-   Update `stats` to include: `commProjection`, `commWon`, `commPaid`.
-   **UI Update**: Split Commission Card, added "Force Update" button.

### Multi-Collie & Packages (RFQ Update)
#### [NEW] [add-packages-column.sql](file:///c:/Users/LENOVO/.gemini/antigravity/scratch/atr-sales-pwa/add-packages-column.sql)
-   Alter `inquiries` table to add `packages` (JSONB) column.
-   Add `commodity` and `package_type` (if global) or store in JSON.
-   **Structure**: `packages = [{ weight, dimension, type, commodity }]`

#### [MODIFY] [InquiryFormPage.jsx](file:///c:/Users/LENOVO/.gemini/antigravity/scratch/atr-sales-pwa/src/pages/InquiryFormPage.jsx)
-   Add Dynamic List for Packages (Collies).
-   "Add Package" button.
-   Auto-sum Total Weight from packages.


### Tracking Logic
#### [MODIFY] [utils.js](file:///c:/Users/LENOVO/.gemini/antigravity/scratch/atr-sales-pwa/src/lib/utils.js)
-   Update `formatDate` to handle:
    -   Standard ISO Timestamps (fix Safari/Browser parsing by adding 'T').
    -   Legacy "Time" text format (fallback regex).
-   **Reason**: Browser `Date()` parsing is inconsistent with SQL timestamps containing spaces.

### APK Generation (PWABuilder)
#### [NEW] [assetlinks.json](file:///c:/Users/LENOVO/.gemini/antigravity/scratch/atr-sales-pwa/public/.well-known/assetlinks.json)
-   Create `.well-known` directory.
-   Add SHA-256 fingerprint from PWABuilder to enable Trusted Web Activity (remove address bar).


## Verification Plan
-   **Dashboard**: Check sums for Revenue and Commission cards.
-   **Tracking**: Verify dates show "DD MMM YYYY, HH:mm" instead of "01 Jan 1970".
