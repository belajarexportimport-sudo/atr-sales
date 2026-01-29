# ATR Express System Blueprint & Architecture

**Document Version**: 1.1
**Date**: 2026-01-29
**Purpose**: Master reference for ATR Sales CRM and Hybrid Tracking System development.

---

## 1. System Architecture Overview

The system is built as a **Progressive Web App (PWA)** using a "Serverless" architecture. This eliminates the need for managing traditional servers (VPS) while providing Enterprise-grade scalability.

### Technology Stack
*   **Frontend**: React.js (Vite) + Tailwind CSS
    *   *Why*: Fast loading, mobile-friendly (PWA), easy to maintain.
*   **Backend & Database**: Supabase (PostgreSQL)
    *   *Why*: Real-time database, built-in security (RLS), and scalable authentication.
*   **Middleware (The "Plugins")**: Supabase Edge Functions
    *   *Role*: Acts as the secure bridge between our app and external Courier APIs (FedEx/DHL/Lion). Hides API Keys and sanitizes data.

---

## 2. Module A: Sales CRM (Sales Force Automation)

**Objective**: optimize the sales process from Lead to Inquiry.

### Core Features
1.  **Lead Management**
    *   **Input**: Company Name, PIC, Phone, Industry, Status (Cold/Warm/Hot).
    *   **Smart Feature**: Automatic duplicate detection (warns if Company Name already exists).
    *   **Security**: Sales reps can only see *their own* leads (Row Level Security).
    *   **Direct Actions [NEW]**:
        *   **WhatsApp**: Click-to-chat directly with PIC (`wa.me`).
        *   **Email**: Click-to-compose (`mailto`).
        *   **Maps**: View customer address on Google Maps.

2.  **Inquiry / RFQ Management**
    *   **Integration**: Create RFQ directly from a Lead (pre-fills data).
    *   **Data Points**: Origin, Destination, Weight, Service Type, Est. Revenue/GP.
    *   **Calculations**: Auto-calculate Commission (e.g., 2% of GP).

3.  **Sales Dashboard & Activities**
    *   **Personal**: Individual performance stats (Total Revenue, Active Customers).
    *   **To-Do List [NEW]**: Automated task list based on **"Staging"** logic.
        *   *Logic Example*: If Inquiry Status = 'Proposal' for > 3 days, show "Follow Up [Customer Name]".
    *   **Leaderboard**: Anonymized ranking (e.g., "Sales A", "Sales B") for motivation.

---

## 3. Module B: Hybrid Tracking System (Operations)

**Objective**: Provide reliable tracking status to customers, with the ability to manually override vendor data when needed.

### Workflow Logic
1.  **Primary Source (Internal)**: System checks the internal `tracking_events` table first.
    *   *Scenario*: Admin inputs "Barang tiba di Gudang Jakarta". This appears at the TOP of the timeline.
2.  **Secondary Source (External)**: System provides a link/embed to the Vendor's tracking page.
    *   *Scenario*: User clicks "Verify with Vendor" for cross-checking.

---

## 4. Infrastructure & "Plugins" (Middleware)

To implement the advanced "Checklist Infrastruktur" (API Integration), we use the following setup:

### A. API Key Management (Security)
*   **Problem**: API Keys for FedEx/DHL strict cannot be put in the Frontend code.
*   **Solution**: Store in **Supabase Vault / Environment Variables**.

### B. Middleware Proxy (Supabase Edge Functions)
*   **Function**: A server-side script that runs on demand.
*   **Flow**:
    1.  App requests: `GET /track/ATR-123`.
    2.  Edge Function receives request.
    3.  Edge Function calls FedEx API using the hidden Secret Key.
    4.  **Sanitization**: Edge Function removes words like "FedEx" or "Lion Parcel" from the response.
    5.  Edge Function returns "Clean Data" to the App.

---

## 5. Deployment Strategy

*   **Frontend**: Deployed to Vercel/Netlify (Free Tier sufficient for start).
*   **Backend**: Supabase Cloud (Free Tier sufficient for < 500MB database).
*   **Distribution**:
    *   **Web**: Accessible via URL (`sales.atrexpress.co.id`).
    *   **Android**: Installed as PWA (Add to Homescreen) or wrapped as APK using Bubblewrap/TWA.
