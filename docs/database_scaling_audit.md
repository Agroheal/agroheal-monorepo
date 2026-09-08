# AGROHEAL DATABASE ARCHITECTURAL & SCALING AUDIT

**Audit & Remediation Date:** Tue, 08 Sep 2026 20:15:00 GMT  
**Supabase Project ID:** `ptowfacejneezksyhntk`  
**Total Public Tables:** 19  
**Database Engine:** PostgreSQL 15+ hosted on Supabase  
**Auditor:** Antigravity AI Senior Systems Architect  
**Associated Servers:**
* **Production Express Server:** `https://agroheal-server-prod.up.railway.app`
* **Dev/Staging Express Server:** `https://agroheal-server-dev.up.railway.app`

---

## 1. EXECUTIVE SUMMARY & VERIFIED CURRENT STATE

A comprehensive structural remediation, sponsor policy realignment, and database architectural hardening have been completed.

### Verified State as of September 8, 2026:
* **Total Auth Accounts:** **539 accounts** (100% parity with backup).
  * **Marketing Leads Preserved:** 103 unconfirmed/abandoned signup leads have been preserved in `auth.users` and exported to [`docs/unconfirmed_marketing_leads.csv`](file:///c:/Users/Elijah/Desktop/AgroHeal/agroheal-fe/docs/unconfirmed_marketing_leads.csv) for newsletter engagement.
  * **Pruning Policy:** Leads will be kept active and will only be discarded if marketing newsletters fail/bounce delivery.
* **Total Public Profiles:** **539 profiles** (**100% 1-to-1 sync with Auth users**). Every registered user has a valid profile; zero broken dashboards on login.
* **Sponsor Assignment Policy (Reverted to NULL):**
  * **225 unassigned accounts** currently have `referred_by = NULL`.
  * In accordance with operational directives, no accounts are auto-assigned to Esther or default sponsors until coordinator farm group names and sponsor detail sheets arrive.
  * The trigger `handle_new_user()` leaves `referred_by = NULL` if no referral code is supplied during signup.
* **Farm Groups (Physical Consolidation):**
  * Consolidated 13 duplicate entries down to the **7 canonical physical farms**:
    1. Pioneers Farm (58 records)
    2. Goshen Farm (39 records)
    3. Favoured Farm (21 records)
    4. Sustenance Farm (16 records)
    5. Pacesetters Farm (10 records)
    6. Alpha Farm (1 record)
    7. Eagles Farm (1 record)
  * All 146 farm records preserved with zero data loss.
* **Relational Integrity & Views:**
  * Performance indexes installed across `profiles(email)`, `profiles(referred_by)`, `checkout(user_id)`, `slot_subscriptions(user_id)`, `other_payments(user_id)`.
  * `public."otherPayments"` backward-compatibility view created.
  * `public.v_user_project_status` consolidated view created for real-time project subscription checks.
  * `public.wallet_balance` column physically added and synchronized on `public.profiles`.

---

## 2. BUSINESS RULE: UNREGISTERED / UNSUBSCRIBED MEMBERS & WALLETS

### Core Policy:
> *"What about people who just registered with Agroheal but didn't subscribe for any of the projects?"*  
> **Rule:** *"Their earnings accumulate in their wallet, but they cannot withdraw until they pay for a project or use their wallet credit to pay once it reaches ₦10,000."*

### Technical Implementation:
1. **Wallet Accumulation:**
   * Unsubscribed members can share their referral link (`/signup?ref=CODE`).
   * When their referrals pay for Green Cards or slots, direct referral bonuses (₦1,000) and matrix commissions enter their wallet (`public.profiles.referral_earnings` and `public.wallet_ledger`).
2. **Withdrawal Gate:**
   * Bank withdrawals require an active project subscription (`is_project_subscribed = true`).
   * For unsubscribed members, the withdrawal button is locked with the explanatory status:
     *"Project Subscription Required: Your referral earnings accumulate safely in your wallet. Bank withdrawals unlock once you pay for a project, or once your wallet credit reaches ₦10,000 to subscribe directly using your balance."*
3. **₦10,000 Wallet Subscription Activation:**
   * When an unsubscribed member's wallet balance reaches **₦10,000**, a special action unlocks:
     **"Activate Project Subscription from Wallet Balance (₦10,000)"**
   * Handled atomically via PostgreSQL stored procedure:
     `public.subscribe_with_wallet_balance(p_user_id UUID)`:
     - Verifies `referral_earnings >= 10000`.
     - Debits ₦10,000 from wallet balance.
     - Logs double-entry transaction in `public.wallet_ledger`.
     - Inserts an active lifetime Green Card subscription in `public.subscriptions`.
     - Unlocks bank withdrawals immediately.

---

## 3. ROUTE ARCHITECTURE (PUBLIC VS PROTECTED)

### 3.1. Public Informational Routes (No Auth Required)
* `/` — Landing Page & Matrix Overview
* `/about` — About AgroHeal Mission & Story
* `/careers` — Open Job Postings & Volunteer Applications (Ogun, Lagos, Remote)
* `/legal`, `/terms`, `/privacy` — Terms of Service, Privacy Policy, Agreement
* `/login`, `/signup`, `/forgot-password`, `/reset-password` — Authentication
* `/verify-card/:memberId` — Public Digital Green Card QR Verification

### 3.2. Member Portal Routes (Session Protected — All Registered Users)
* `/dashboard` — Member Dashboard, Referral Stats, Wallet Overview
* `/dashboard/transactions` — Transaction Ledger, Dual-Wallet HUD, ₦10k Subscription Converter
* `/dashboard/compound-referrals` — 5×7 Producer-Consumer Organogram & Downline Directory
* `/dashboard/profile` — Account Profile & Password Settings
* `/dashboard/kin` — Next of Kin Details
* `/dashboard/roadmap-guide` — Step-by-step Member Roadmap Guide
* `/dashboard/legal` — In-Dashboard Legal Agreement (**Unrestricted — No Subscription Required**)

### 3.3. Paid Project Routes (Gated by `<RequireSubscription>`)
* `/dashboard/courses`, `/dashboard/courses/:slug` — Organic Agronomy LMS Classroom
* `/dashboard/slots-subscription` — Slot Management & Monthly Subscriptions
* `/dashboard/group-farm-accounts` — Group Farm Accounting Tools

---

## 4. DATABASE ARCHITECTURAL EVALUATION

### Question: *"Is the database properly architected?"*

### ✅ Strengths:
1. **100% RLS Coverage:** Row-Level Security is active on all 19 public tables (`profiles`, `checkout`, `subscriptions`, `wallet_ledger`, etc.).
2. **Privilege Escalation Protection:** Trigger `trg_prevent_role_self_escalation` prevents regular members from escalating their role to `admin` or `farm_coordinator`.
3. **Double-Entry Financial Ledger:** `public.wallet_ledger` supports immutable transaction logging (`user_id`, `amount`, `balance_after`, `category`, `status`, `reference_id`, `entry_type`).
4. **Clean Relational Foreign Keys:** Foreign keys link progress to lessons, modules to courses, and farm records to farm groups.
5. **Data Sanitization:** Phone numbers normalized to E.164 (`+234...`), emails lowercased and trimmed, duplicate farm groups merged.

### ⚠️ Recommendations for Future Scaling:
1. **Wallet Balance Derivation:**
   * Currently, `referral_earnings` and `wallet_balance` reside directly on `profiles`.
   * Stored procedure `subscribe_with_wallet_balance` safely updates both the profile and `wallet_ledger`. As transaction volume reaches tens of thousands per day, ensure all wallet mutations go through transactional RPCs to prevent race conditions.
2. **Automated Newsletter Bounce Webhook:**
   * When integrating the newsletter service (Mailchimp / Resend / Brevo), connect a webhook to auto-flag bounced emails in `profiles` and `auth.users` for automated cleanup.

---

## 5. ACTIVE OPERATIONAL REMINDERS

1. **Formal Legal Agreement:** User to send the final formal agreement text.
2. **Coordinator Roster Upload:** When coordinator sheets arrive with physical group allocations and sponsor rosters, run batch assignment for the 225 unassigned accounts (`referred_by = NULL`).
3. **Marketing Email Delivery Audit:** After sending newsletters to `docs/unconfirmed_marketing_leads.csv`, notify the team of any bouncing email addresses to prune invalid records.
