# AgroHeal Development & Enhancement TODO

## High Priority (Immediate / ASAP)
- [ ] **Downloadable Digital Green Card (PDF / PNG & Apple/Google Wallet)**:
  - Add "Download Card" button on `/dashboard/profile/green-card` and `/verify-card/:memberId`.
  - Client-side or edge-generated high-resolution downloadable asset (PDF and PNG) containing:
    - Member Full Name
    - Member ID (`GC-YYYY-XXXXX` / `AGC-XXXX-XXXX`)
    - Activation Date & Expiry (Lifetime)
    - Dynamic QR code pointing to `https://agroheal.org/verify-card/:memberId`
    - Security holographic watermark and AgroHeal official seal.

- [ ] **Plug Course & Green Card Access Security Leaks**:
  - Update `RequireSubscription.tsx` to strictly check `.eq("plan", "green_card")` and `.eq("status", "active")` with valid expiration date.
  - In `Checkout.tsx`, stop auto-granting free Green Card subscriptions when a user buys a farm slot without paying the ₦2,000 registration fee.
  - Tighten RLS on `subscriptions` table so regular users cannot insert/update active subscriptions from client-side JavaScript.
  - Update `courses.service.ts` to require a verified active `plan = 'green_card'` rather than just any non-null `member_id`.

- [ ] **Overhaul & Elevate Digital Green Card (AGC) Graphic Design**:
  - **Visual Aesthetics**:
    - Add realistic physical card textures (brushed dark emerald substrate, micro-embossed grain).
    - Incorporate holographic AgroHeal emblem foil with reflective metallic sheen.
    - Add embossed metallic gold/silver lettering for member name and AGC identification code (`AGC-XXXX-XXXX`).
    - Add EMV smart micro-chip iconography with gold contact pads.
  - **Interactive Dynamics**:
    - Enhance interactive 3D card tilt/perspective on mouse move and device gyro orientation.
    - Smooth card flip animation to reveal QR verification code, cooperative terms summary, and security holographic watermark.

- [ ] **Automated Multi-Channel Notification Engine (In-App Bell / SMS / WhatsApp / Email)**:
  - **Coordinator Slot Purchase Alerts**: Instant real-time alerts when a member purchases and is assigned slots in their farm cluster.
  - **Harvest Close & Dividend Payout Alerts**: Automated alerts to verified slot owners when a harvest cycle closes and funds post to wallets.
  - **MLM Commission & Spillover Alerts**: Push/SMS/Email notifications when direct bonuses or matrix commissions are earned.
  - **Treasury & Withdrawal Status Alerts**: Instant notifications when bank withdrawal requests are queued, approved by Solvency Shield, and disbursed.
  - **Monthly PQV Qualification Reminders**: Gentle nudge alerts before month-end for members nearing the ₦5,000 PQV threshold.

---

## Outstanding Items From Founder / Boss Chat (Mrs. Esther Adetayo)
- [ ] **Cooperative & Church Group Bulk Onboarding (Deferred Pending Discussion with Mrs. Esther)**:
  - *Governance & Organizational Protection*: Ensure no single individual has unilateral autonomy or withdrawal control over a registered group's capital/dividends. Design an organizational protection mechanism (e.g. dual-authorization or coordinator-locked distribution) without over-complicating architecture.
  - Support consolidated group onboarding where a cooperative/church pays a single lump sum for registrations + slots.
  - Admin/coordinator bulk upload tool to generate individual member accounts with automated 5×7 matrix placement under designated sponsor links.
- [ ] **Dedicated Core Drivers Dashboard & Accrual Hub (Super Admin Only Initially)**:
  - Accessible strictly to `super_admin` initially; Super Admin can later toggle access for specific individuals or driver groups via permissions.
  - Dedicated portal view for the 6 Core Drivers (Esther, Taiwo, David, Elijah, +2 others).
  - Track ₦50/card growth bonus allocations (15% pool of ₦2,000 registration = ₦300 total split among 6 drivers).
  - Direct withdrawal trigger with ₦2,000 minimum threshold.
- [ ] **E-Commerce Produce Provenance (State, LGA, Group Farm)**:
  - Tag produce listings with source farm cluster, LGA, and State so buyers can choose food items closest to them.
- [ ] **Reconciliation & Roster Alignment (Dr. Kogbe & Taofik Oyekan Groups)**:
  - Resolve Arinola's slot allocation: ₦995,000 total (100 mushroom slots @ ₦500k + 15 ginger slots @ ₦495k, previously misrecorded as ₦90k).
  - Resolve Oluwagbemiga Ayoola (`oluyoola@gmail.com`): 90 ginger slots + 106 mushroom slots = 196 total (dashboard displayed 146).
  - Prof. Ayoola's 2 daughters: 10 slots each (20 slots total) on Pioneers farm.
  - Taofik Oyekan Sustenance Mushroom (876 slots) & Gingertown (26 slots) rosters.

---

## Active Roadmap & Progression (Completed)
- [x] Integrate Intelligent "Stubborn" Next-Step Progression Modal (Green Card → Farm Slot → 5 Directs).
- [x] Matrix Directs + 1 level unlocking rule applied across all calculation & modal surfaces.
- [x] Admin Programmable Next-Step Modal Configuration via `system_configs`.
- [x] Unified Calculator / Simulation Shell across Producer Network and Consumer Network.
- [x] Sidebar Brand Header & integrated profile logout controls.
- [x] Multi-level 5×7 Producer Network and 3-Tier Consumer Network matrix logic.

---

## Future Architecture & Enhancements (TODO for Later)
- [ ] **Group Farm Assignment Mechanism: Dynamic Auto-Assign Resolver vs. Farm Group Embedded in Referral URL**:
  - **Option A (Dynamic Auto-Assign Resolver)**:
    - When a new member purchases a farm slot, the backend resolver checks the sponsor's group farm and assigns the member to the sponsor's first unfilled/unmaxed cluster (up to the 1,000-slot cap).
    - If the sponsor's current farm cluster is full (1,000 slots), automatically roll over and allocate into the next active cluster within the same community or region.
  - **Option B (Farm Group Embedded in Referral URL)**:
    - Enable farm-specific referral links (e.g., `https://agroheal.org/signup?ref=CODE&farm=sustenance-mushroom` or `https://agroheal.org/farm/:farmSlug?ref=CODE`).
    - Explicitly locks the invited member into that specific farm group upon registration and slot checkout, eliminating ambiguity for community leaders.
  - **Hybrid Resolution Strategy**:
    - If `farm` query parameter exists in the signup/checkout URL, bind directly to that specific farm group (Option B).
    - If `farm` parameter is omitted, fall back to the dynamic auto-assignment resolver following the sponsor's lineage (Option A).

