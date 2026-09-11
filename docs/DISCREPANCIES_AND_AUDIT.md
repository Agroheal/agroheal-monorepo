# AGROHEAL DISCREPANCIES, AUDIT LOG & RECONCILIATION

*Comprehensive record of architectural specification resolutions, legacy codebase corrections, and production database financial reconciliation audits.*

---

## PART 1: ARCHITECTURAL SPECIFICATION DISCREPANCIES & RESOLUTIONS

This section tracks discovered contradictions between legacy prototype code and the authoritative **PRD v1.2**, **SRS v1.2**, and **48-Slide Deck**.

### 1. "Leased" Farm Slots vs. Cooperative Production Units
- **Legacy Phrasing:** Prototype code referred to farm slots as "leased" under landlord-tenant terminology.
- **Authoritative Resolution:** Farm slots are **cooperative agricultural production units**, not passive investments or leases. Slots represent units of physical substrate bags, operational infrastructure, and shared harvest rights under the LEAP framework. Phrasing throughout `Legal.tsx`, marketing copy, and database schemas updated accordingly.

### 2. The 10× Cycle 2+ Waterfall Ambiguity
- **Ambiguity:** An early deck slide inadvertently divided total farm net returns by 10 instead of computing returns per slot, suggesting a 10× variance in owner payouts.
- **Authoritative Resolution:** Biological yield math confirms the per-slot model: each ₦5,000 slot operates 4 mature fruiting bags yielding 4kg fresh mushrooms per quarter @ ₦2,500/kg = ₦10,000 gross revenue. After ₦4,000 continuation cost, the ₦6,000 distributable balance yields **40% (₦2,400) per slot** to the slot owner.

### 3. Farm Slots Wrongly Treated as Monthly Recurring Subscriptions
- **Legacy Bug:** Prototype code treated farm slots like recurring monthly SaaS billing (`slot_subscriptions.next_payment_date`, `months_farm_setup` ₦5,000/mo).
- **Authoritative Resolution:** A farm slot is a **one-time ₦5,000 production unit per cycle** (Cycle 1 is 3 months; Cycle 2+ is quarterly). There is zero monthly slot maintenance fee. Monthly network qualification is achieved through ₦5,000 **PQV** (product sales/purchases), completely separate from slot ownership.

### 4. Admin Offline Registration Fee Bug (₦1,000 vs ₦2,000)
- **Legacy Bug:** The admin offline green card modal in `MembersPage.tsx` prompted for ₦1,000 instead of ₦2,000.
- **Authoritative Resolution:** Corrected to ₦2,000 across all admin dialogs, automated verification endpoints, and ledger audit logging.

### 5. Missing Flutterwave Webhook Listener
- **Legacy Issue:** Payments completed via Flutterwave occasionally failed to credit wallets because the server lacked an HMAC-verified webhook endpoint.
- **Authoritative Resolution:** Added `/api/v1/webhooks/flutterwave` with `verif-hash` validation to guarantee idempotent credit for all incoming payment events.

---

## PART 2: PRODUCTION DATABASE FINANCIAL & FARM GROUP AUDIT

*Empirical cross-reconciliation of Supabase online payments (`checkout`, `slot_subscriptions`), member profiles (`profiles`), and physical farm bag allocations (`farm_records`, `farm_groups`) executed against production.*

### Executive Summary
The audit revealed three operational discrepancies requiring founder review, alongside one database duplicate naming issue that split members' allocations across duplicate farm entries.

### Total Discrepancy Overview
- **Unbacked Surplus Bags on Farms:** **+1,636 physical bags** allocated without matching online payment records across 5 primary accounts.
- **Ghost / Offline-Only Allocations:** **125 physical bags** allocated to profiles with **₦0 recorded online payments**.
- **Unassigned Paid Cash:** **18 paying members** with **60 slots** representing **₦61,600** in verified cash paid online, but with **0 bags allocated** on any farm group.
- **Duplicate Farm Group Names:** 4 farm groups existed as twin records with slight spelling differences, splitting members' allocations.

---

### Category 1: Massive Unbacked Bag Surpluses (Bags on Farm >> Online Paid Slots)

These members have substantially more physical bags allocated on farm records than recorded online payments:

| Member Name | Member Email | Phone | Online Slots Paid | Total Online Cash (₦) | Physical Bags on Farm | Unbacked Surplus Bags | Recorded Setup Fees (₦) | Recorded Support Fees (₦) | Farm Groups Involved |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Bankole Motunrayo** | `bankolemotunrayo84@gmail.com` | 08099740613 | 475 | ₦485,000 | **911** | **+436 Bags** | ₦227,500 | ₦92,500 | Sustenance Farm (10), SUSTENANCE FARMING (901) |
| **Taofik Oyekan** | `oyekantaofikg@gmail.com` | 08099740613 | 281 | ₦292,000 | **713** | **+432 Bags** | ₦945,000 | ₦201,000 | Sustenance Farm (11), SUSTENANCE FARMING (702) |
| **Oyekan Taofik** *(Duplicate)* | `oyekantaofiky@yahoo.co.uk` | 09051835772 | 239 | ₦239,000 | **717** | **+478 Bags** | ₦836,500 | ₦119,500 | SUSTENANCE FARMING (717) |
| **Arinola Odulana** | `arinodu@gmail.com` | 08033254944 | 115 | ₦115,000 | **345** | **+230 Bags** | ₦402,500 | ₦57,500 | Gingertown Pioneers (45), Pioneers' farm (300) |
| **Olaitan Otulana** | `moy_otulana@yahoo.com` | 08023354337 | 31 | ₦30,500 | **91** | **+60 Bags** | ₦108,500 | ₦15,500 | Gingertown Pioneers (31), Pioneers' farm (60) |
| **TOTALS** | — | — | **1,141** | **₦1,161,500** | **2,777** | **+1,636 Bags** | **₦2,520,000** | **₦486,000** | — |

#### Founder Actions Required:
1. **Offline Bank Payments:** Did these members pay offline via direct bank transfers? If yes, supply payment receipts/dates so matching subscription records can be backfilled.
2. **Duplicate Profile Check:** Confirm whether `oyekantaofikg@gmail.com` and `oyekantaofiky@yahoo.co.uk` belong to the same person and whether bag counts were duplicated.

---

### Category 2: Ghost & Zero-Payment Profiles with Physical Bags

These accounts have **₦0 recorded online payments**, yet physical mushroom bags are assigned to them in the database:

| Member Name | Email | Phone | Online Slots Paid | Total Online Cash | Physical Bags on Farm | Farm Group Allocated |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **Lola Yusuf** | `lolabimyusuf@gmail.com` | *MISSING* | 0 | ₦0 | **60** | Pioneers' farm |
| **Unregistered Profile** | `oluwasolapeo@gmail.com` | *MISSING* | 0 | ₦0 | **40** | Pioneers' farm |
| **Maria Ojedayo** | `ngmojedayo@gmail.com` | 08060639558 | 0 | ₦0 | **20** | Pioneers' farm |
| **CHUKWUKA AZOWENUNEBI** | `truprice7@gmail.com` | 07032459872 | 0 | ₦0 | **5** | LAND OF GOSHEN MUSHROOMS VILLAGE. |
| **TOTALS** | — | — | **0** | **₦0** | **125** | — |

---

### Category 3: 18 Floating Unassigned Paying Members (Paid Online, 0 Bags on Farm)

These members completed payment online, but **no farm group has ever been assigned to them** in `farm_records`:

| Member Name | Member Email | Phone | Member ID | Online Slots | Total Cash Paid (₦) | Avg Unit Price (₦) | Physical Bags on Farm |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Oluwadamilola Ayoola** | `temidamayo1207@gmail.com` | 07076774269 | AGC-00032-2026 | 10 | ₦10,000 | 1,000.00 | 0 |
| **Olayinka Adewunmi** | `yinkaadewunmi4rel@gmail.com` | 08023242500 | No ID Assigned | 10 | ₦10,000 | 1,000.00 | 0 |
| **Ayoola oluwatosin** | `ajikeinioluwa5900@gmail.com` | 07040595900 | No ID Assigned | 10 | ₦10,000 | 1,000.00 | 0 |
| **Odinaka Peter** *(Test Shared)* | `odinakauchechukwu72@gmail.com` | 08051346872 | No ID Assigned | 6 | ₦1,400 | 233.33 | 0 |
| **Kehinde Adesanya Osiname** | `kehindeosiname@gmail.com` | 08028356168 | No ID Assigned | 5 | ₦10,000 | 2,000.00 | 0 |
| **Davy Kanye** *(Test Shared)* | `davykanye@gmail.com` | 08051346872 | No ID Assigned | 4 | ₦400 | 100.00 | 0 |
| **Olubukola Adesola** | `beebolubukola@gmail.com` | *MISSING* | No ID Assigned | 2 | ₦4,000 | 2,000.00 | 0 |
| **Ngozi Isola** | `mcngolyn@gmail.com` | 08036962088 | No ID Assigned | 1 | ₦2,000 | 2,000.00 | 0 |
| **Gabrielle Raphael** | `gabrielleraph@gmail.com` | 08034539927 | No ID Assigned | 1 | ₦2,000 | 2,000.00 | 0 |
| **Mafiana Precious** | `legbefo@gmail.com` | 08023358536 | No ID Assigned | 1 | ₦2,000 | 2,000.00 | 0 |
| **Tolulope Mosaku** | `tolulopeoyerinde1@gmail.com` | 08132475408 | No ID Assigned | 1 | ₦2,000 | 2,000.00 | 0 |
| **Joshua okpole** | `okpolejoshua4@gmail.com` | 08146378674 | AGC-00006-2026 | 1 | ₦2,000 | 2,000.00 | 0 |
| **Temiloluwa aloba** | `temialob4@gmail.com` | 9076256518 | No ID Assigned | 1 | ₦2,000 | 2,000.00 | 0 |
| **Emmanuel Olamilekan** | `talkinmotivation@gmail.com` | 09056070710 | No ID Assigned | 1 | ₦2,000 | 2,000.00 | 0 |
| **DARE** | `dare0301@yahoo.com` | 08034050165 | No ID Assigned | 1 | ₦1,000 | 1,000.00 | 0 |
| **Adetayo Bola** | `adetayobola299@gmail.com` | *MISSING* | No ID Assigned | 1 | ₦500 | 500.00 | 0 |
| **John Doe** *(Test)* | `fluterheal@yopmail.com` | 08051346872 | No ID Assigned | 1 | ₦100 | 100.00 | 0 |
| **habbey harrison** *(Test)* | `harbey@yopmail.com` | *MISSING* | No ID Assigned | 1 | ₦100 | 100.00 | 0 |
| **TOTALS** | — | — | — | **60** | **₦61,600** | — | **0** |

---

### Category 4: Duplicate Farm Group Fragmentation (Resolved)

Cross-group analysis proved that members were not short on bags; rather, duplicate farm entries had split their bag allocations:
- **Pioneers Farm:** Consolidated *Gingertown Farm Pioneers* + *Pioneers' farm* (290 bags Kogbe, 270 bags Ilo, 196 bags Ayoola balanced 100%).
- **Favoured Farm:** Consolidated *Favoured Community* + *Favoured Town* (60 bags Omoyeni, 36 bags Oyebanji balanced 100%).
- **Goshen Farm:** Consolidated *GINGERTOWN LAND OF GOSHEN* + *LAND OF GOSHEN MUSHROOMS VILLAGE* (60 bags Eromosele, 60 bags Olasunkanmi balanced 100%).
- **Pacesetters Farm:** Consolidated *Pacesetter Group Farm* + *Pacesetters Group Farm* (balanced 100%).

All duplicate groups merged into canonical entries in production.
