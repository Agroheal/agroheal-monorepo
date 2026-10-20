# Agent Workflow & Execution Rules

## 1. Git Workflow & Verification Protocol
1. **Intelligent Local Commits**:
   - Only commit at intelligent intervals (after completing a coherent logical unit of work, discreet feature, or bug fix). Avoid noisy micro-commits.
   - Write clear, descriptive commit messages documenting what was added or resolved.

2. **Push Only on Explicit User Instruction**:
   - NEVER execute `git push` autonomously.
   - Only execute `git push` when the user explicitly instructs: "push", "final push", or provides approval.

3. **Mandatory Build & Typecheck Gate (Push Only)**:
   - Typecheck, linting, tests, and build checks are to be executed ONLY together with pushing when the user explicitly says "push". Never waste time running heavy typechecks on minor iterative steps.
   - Before executing any `git push`, ALWAYS run and verify:
     - `npm run web:typecheck` (must exit with code 0, 0 errors).
     - `npm run admin:typecheck` (must exit with code 0, 0 errors).
   - Never push if there is a compiler error or broken build.

## 2. Session Memory & Activity Tracking Protocol
- **Activity & Context Anchor**:
  - Always reference the authoritative tracking document (`../agroheal-server/docs/ROADMAP_AND_TRACKER.md` or workspace history) and built-in conversation memory at the start of tasks and after compactions.
  - In the event of context collapse, compaction, or handoff, use this structured anchor to immediately retrace where we are, what has been completed, and exactly where we are going.

## 3. Documentation Maintenance Protocol
- **Accurate & Up-to-Date Docs**:
  - Keep authoritative documentation (`TODO.md`, tracker files) updated whenever significant architectural decisions or milestone items are completed.
  - Do NOT modify or update docs if there is no genuine necessity.

## 4. Direct Database Edits & Financial Ledger Protocol
- **Mandatory Financial Invariants for Manual Credits**:
  - Whenever manually provisioning or editing member activations (Green Cards, Starter Packages, Farm Slots, Product Orders) directly in the database, NEVER stop at inserting records into `transactions`, `orders`, or `slot_subscriptions`.
  - ALWAYS execute the complete double-entry financial distributions into `wallet_ledger`:
    1. **Direct Sponsor Referral & Slot Commission**: Credit the direct sponsor with their statutory bonus (`REFERRAL_BONUS`, `SLOT_BONUS`, `MATRIX_COMMISSION`).
    2. **Core Driver Growth Pool**: Credit Core Drivers with statutory bonus (`CORE_DRIVER_BONUS`): the 7 Founding Drivers (Elijah, Esther, Taiwo, David, Fortune, Tony, Nathaniel) with ₦50 each, and Juliana Chikaodi Obinwanne with ₦25 (effective from October 1, 2026).
    3. **Atomic Balance Updates**: Compute each recipient's `balance_after` dynamically (`current_available_balance + amount`) to maintain zero ledger leakage and strict solvency parity.
    4. **Historical Timestamp Invariant**: When catching or reconciling past transactions, ALWAYS stamp records with `created_at = tx.created_at` (never `NOW()`) so timestamps and receipts match when the member actually paid.
    5. **Deterministic Reference Standard & Idempotency Pre-Check**:
       - Every credit entry MUST use an immutable, deterministic composite reference:
         - Core Driver: `GC-<cardNo>-CD-<driverUserId>`
         - Sponsor Referral: `TX<txId>-REF-<sponsorUserId>`
         - Sponsor Slot Commission: `TX<txId>-SLOT-<sponsorUserId>`
         - Product Commission: `ORD<orderId>-COMM-L<lvl>-<recipientUserId>`
       - ALWAYS check for existing entries using `SELECT 1 FROM wallet_ledger WHERE user_id = $1 AND category = $2 AND (reference_id = $3 OR reference_id = $4)` before inserting to guarantee zero duplicate credits.
## 5. Strict Content & Copy Fidelity Protocol
- **Zero Unsolicited Text/Copy**:
  - NEVER introduce unrequested text, marketing copy, speculative claims, promotional blurbs, or unauthorized headings, rules, or tier requirements that the user did not explicitly ask for.
  - NEVER write marketing copy or invent explanatory text on your own.
  - Implement only the exact labels, headings, and business logic instructed by the user without editorial embellishment.
## 6. Admin Dashboard Synchronization Protocol
- Whenever updates or new entities/roles/tiers are introduced across the system (e.g., new partners, core roles, commission structures), ALWAYS check and update corresponding views, lists, metrics, and actions in the Admin Dashboard to reflect them accurately.

## 7. Component & Logic Reusability Protocol
- Always prioritize building and reusing shared components, utilities, and queries across the frontend and backend. Avoid ad-hoc duplicates; reuse existing abstractions whenever possible.

## 8. Deduplication & Entity Counting Invariant (Never Blindly COUNT(*) on Transactions)
- **Raw Transactions Webhook/Retry Multiplicity**:
  - Payment gateway webhooks (Paystack/Flutterwave) and `SYSTEM_RECONCILIATION_CRON` sweeps generate multiple transaction rows for the same checkout attempt (e.g., 104 raw Combo transaction rows belong to only 70 distinct activated members).
  - **NEVER** use `COUNT(*)` on `transactions` alone as a proxy for distinct member activations, issued cards, or earned bonuses.
  - **ALWAYS** enforce `COUNT(DISTINCT user_id)` or verify against concrete provisioned records (`profiles.has_greencard`, `slot_subscriptions`, `orders`).
  - **Statutory Ledger Cross-Check**: Every member activation triggers exactly 1 statutory sponsor bonus and 1 set of Core Driver Growth credits. Discrepancies between raw transaction counts and distinct Core Driver bonus events must immediately be flagged as webhook/cron transaction duplicates, not uncredited members.

## 9. Modern vs. Legacy Isolation Protocol (Zero Gingertown / Zero Legacy Infiltration)
- The modern active AgroHeal system MUST remain strictly decoupled from Gingertown and legacy migration records.
- In all active platform financial audits, ledger reports, and metrics, ALWAYS enforce `is_legacy = false` and `project_category NOT ILIKE '%ginger%'`.
- NEVER introduce legacy Gingertown balances, transactions, or legacy referrers into modern active financial analyses.

