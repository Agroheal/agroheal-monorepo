# AgroHeal Financial & Farm Group Discrepancy Audit Report

**Date:** September 7, 2026  
**Audit Scope:** Cross-reconciliation of Supabase online payments (`checkout`, `slot_subscriptions`), member profiles (`profiles`), and physical farm bag allocations (`farm_records`, `farm_groups`).  
**Auditor / Engineering Team:** AgroHeal Core Engineering  

---

## Executive Summary

A comprehensive financial and slot balancing audit was executed against the production database to prepare for final reconciliation, dividend automation, and system launch.

The audit revealed **three major categories of operational & financial discrepancies** requiring founder clarification, alongside **one database structural issue (duplicate farm group names)** that initially disguised members as being in deficit when their allocations were actually split across duplicate group entries.

### Total Discrepancy Overview
* **Unbacked Surplus Bags on Farms:** **+1,636 physical bags** allocated without matching online payment records across 5 primary accounts.
* **Ghost / Offline-Only Allocations:** **125 physical bags** allocated to profiles with **₦0 recorded online payments**.
* **Unassigned Paid Cash:** **18 paying members** with **60 slots** representing **₦61,600** in verified cash paid online, but with **0 bags allocated** on any farm group.
* **Duplicate Farm Group Names:** At least 4 farm groups exist as twin records in the database with different naming conventions, splitting members' allocations.

---

## Category 1: Massive Unbacked Bag Surpluses (Bags on Farm >> Online Paid Slots)

These members have hundreds more physical bags allocated on farm records than they have recorded payments/subscriptions online.

### Breakdown Table

| Member Name | Member Email | Phone | Online Slots Paid | Total Online Cash (₦) | Physical Bags on Farm | Unbacked Surplus Bags | Recorded Setup Fees (₦) | Recorded Support Fees (₦) | Farm Groups Involved |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Bankole Motunrayo** | `bankolemotunrayo84@gmail.com` | 08099740613 | 475 | ₦485,000 | **911** | **+436 Bags** | ₦227,500 | ₦92,500 | Sustenance Farm (10), SUSTENANCE FARMING (901) |
| **Taofik Oyekan** | `oyekantaofikg@gmail.com` | 08099740613 | 281 | ₦292,000 | **713** | **+432 Bags** | ₦945,000 | ₦201,000 | Sustenance Farm (11), SUSTENANCE FARMING (702) |
| **Oyekan Taofik** *(Duplicate Profile)* | `oyekantaofiky@yahoo.co.uk` | 09051835772 | 239 | ₦239,000 | **717** | **+478 Bags** | ₦836,500 | ₦119,500 | SUSTENANCE FARMING (717) |
| **Arinola Odulana** | `arinodu@gmail.com` | 08033254944 | 115 | ₦115,000 | **345** | **+230 Bags** | ₦402,500 | ₦57,500 | Gingertown Pioneers (45), Pioneers' farm (300) |
| **Olaitan Otulana** | `moy_otulana@yahoo.com` | 08023354337 | 31 | ₦30,500 | **91** | **+60 Bags** | ₦108,500 | ₦15,500 | Gingertown Pioneers (31), Pioneers' farm (60) |
| **TOTALS** | — | — | **1,141** | **₦1,161,500** | **2,777** | **+1,636 Bags** | **₦2,520,000** | **₦486,000** | — |

### Questions & Founder Actions Required:
1. **Did these members pay offline via direct bank transfers?**  
   If yes, admin recorded their physical bags into `farm_records` directly without creating the corresponding verified `checkout` / `slot_subscriptions` records. We need the transaction receipts/dates to create matching subscription records in the database so that their dividend shares compute accurately.
2. **Was Oyekan Taofik's account duplicated?**  
   `oyekantaofikg@gmail.com` (281 slots online / 713 bags) and `oyekantaofiky@yahoo.co.uk` (239 slots online / 717 bags) share the same last name and phone numbers. Do both accounts belong to the same person, and are the bag counts duplicated?
3. **Were setup and support fees paid in full?**  
   Note that setup fees of over ₦2.5M are logged for these accounts in `farm_records`. The spreadsheet must confirm if these figures represent actual received cash.

---

## Category 2: Ghost & Zero-Payment Profiles with Physical Bags

These accounts have **₦0 recorded online payments**, yet physical mushroom bags are officially assigned to them in the database.

### Breakdown Table

| Member Name | Email | Phone | Online Slots Paid | Total Online Cash | Physical Bags on Farm | Farm Group Allocated |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **Lola Yusuf** | `lolabimyusuf@gmail.com` | *MISSING* | 0 | ₦0 | **60** | Pioneers' farm |
| **Unregistered Profile** | `oluwasolapeo@gmail.com` | *MISSING* | 0 | ₦0 | **40** | Pioneers' farm |
| **Maria Ojedayo** | `ngmojedayo@gmail.com` | 08060639558 | 0 | ₦0 | **20** | Pioneers' farm |
| **CHUKWUKA AZOWENUNEBI** | `truprice7@gmail.com` | 07032459872 | 0 | ₦0 | **5** | LAND OF GOSHEN MUSHROOMS VILLAGE. |
| **TOTALS** | — | — | **0** | **₦0** | **125** | — |

### Questions & Founder Actions Required:
1. Are these legitimate offline cooperative investors who paid cash outside the website? If so, what amount in Naira was paid, and what receipt references exist?
2. If any of these are abandoned placeholders or test entries, should their 125 physical bags be de-allocated and reclaimed?

---

## Category 3: 18 Floating Unassigned Paying Members (Paid Online, 0 Bags on Farm)

These 18 members completed payment online, but **no farm group has ever been assigned to them** in `farm_records`.

### Breakdown Table

| Member Name | Member Email | Phone | Member ID | Online Slots | Total Cash Paid (₦) | Avg Unit Price (₦) | Physical Bags on Farm |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Oluwadamilola Ayoola** | `temidamayo1207@gmail.com` | 07076774269 | AGC-00032-2026 | 10 | ₦10,000 | 1,000.00 | 0 |
| **Olayinka Adewunmi** | `yinkaadewunmi4rel@gmail.com` | 08023242500 | No ID Assigned | 10 | ₦10,000 | 1,000.00 | 0 |
| **Ayoola oluwatosin** | `ajikeinioluwa5900@gmail.com` | 07040595900 | No ID Assigned | 10 | ₦10,000 | 1,000.00 | 0 |
| **Odinaka Peter** *(Test Shared Phone)* | `odinakauchechukwu72@gmail.com` | 08051346872 | No ID Assigned | 6 | ₦1,400 | 233.33 | 0 |
| **Kehinde Adesanya Osiname** | `kehindeosiname@gmail.com` | 08028356168 | No ID Assigned | 5 | ₦10,000 | 2,000.00 | 0 |
| **Davy Kanye** *(Test Shared Phone)* | `davykanye@gmail.com` | 08051346872 | No ID Assigned | 4 | ₦400 | 100.00 | 0 |
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
| **John Doe** *(Test Account)* | `fluterheal@yopmail.com` | 08051346872 | No ID Assigned | 1 | ₦100 | 100.00 | 0 |
| **habbey harrison** *(Test Account)* | `harbey@yopmail.com` | *MISSING* | No ID Assigned | 1 | ₦100 | 100.00 | 0 |
| **TOTALS** | — | — | — | **60** | **₦61,600** | — | **0** |

### Founder Actions Required:
1. Which farm group should the genuine paying members (e.g. Oluwadamilola Ayoola, Olayinka Adewunmi, Ayoola Oluwatosin, Kehinde Osiname, etc.) be assigned to?
2. Purge the disposable/test accounts (`fluterheal@yopmail.com`, `harbey@yopmail.com`, `davykanye@gmail.com`, `odinakauchechukwu72@gmail.com`) before launch.

---

## Category 4: Duplicate & Split Farm Group Fragmentation (The "Apparent Deficits")

In the initial per-group query, dozens of members showed deficits. Cross-group analysis proved that **the members were not short on bags**; rather, the database contained duplicate farm groups with slight variations in spelling/casing, and the admin had recorded partial bags in each.

When both entries are combined, the numbers **balance 100% perfectly**:

### 1. Gingertown Farm Pioneers + Pioneers' farm
* **Oyebukunola Kogbe:** 290 online slots = 50 (Gingertown) + 240 (Pioneers) = **290 bags** (0 variance)
* **Oyinlola Ilo:** 270 online slots = 50 (Gingertown) + 220 (Pioneers) = **270 bags** (0 variance)
* **AYOOLA Oluwagbemiga:** 196 online slots = 90 (Gingertown) + 106 (Pioneers) = **196 bags** (0 variance)
* **Olutoyin Agboola:** 130 online slots = 10 (Gingertown) + 120 (Pioneers) = **130 bags** (0 variance)
* **Fola Oworu:** 50 online slots = 20 (Gingertown) + 30 (Pioneers) = **50 bags** (0 variance)
* **Temitope Kogbe:** 40 online slots = 20 (Gingertown) + 20 (Pioneers) = **40 bags** (0 variance)
* **Oluwatosin Adenle:** 40 online slots = 20 (Gingertown) + 20 (Pioneers) = **40 bags** (0 variance)
* **George Alao:** 25 online slots = 5 (Gingertown) + 20 (Pioneers) = **25 bags** (0 variance)
* **Arin Ifekoya:** 19 online slots = 10 (Gingertown) + 9 (Pioneers) = **19 bags** (0 variance)

### 2. Favoured Community + Favoured Town
* **omoyeni yinka:** 60 online slots = 50 (Community) + 10 (Town) = **60 bags** (0 variance)
* **John Bola Oyebanji:** 36 online slots = 30 (Community) + 6 (Town) = **36 bags** (0 variance)
* **Abosede Adeyemo:** 30 online slots = 25 (Community) + 5 (Town) = **30 bags** (0 variance)
* **Eguasa Evelyn:** 6 online slots = 5 (Community) + 1 (Town) = **6 bags** (0 variance)
* **OnyekaOkey Udegbunam:** 6 online slots = 5 (Community) + 1 (Town) = **6 bags** (0 variance)
* **Gbadegesin Victoria:** 6 online slots = 5 (Community) + 1 (Town) = **6 bags** (0 variance)
* **Alao Timothy Adegoke:** 6 online slots = 5 (Community) + 1 (Town) = **6 bags** (0 variance)

### 3. GINGERTOWN LAND OF GOSHEN + LAND OF GOSHEN MUSHROOMS VILLAGE.
* **Samuel Eromosele:** 60 online slots = 20 (Goshen A) + 40 (Goshen B) = **60 bags** (0 variance)
* **Philip Olasunkanmi:** 60 online slots = 10 (Goshen A) + 50 (Goshen B) = **60 bags** (0 variance)
* **Aduramimo Eyinle:** 34 online slots = 5 (Goshen A) + 29 (Goshen B) = **34 bags** (0 variance)
* **Collins Ijeoma:** 25 online slots = 5 (Goshen A) + 20 (Goshen B) = **25 bags** (0 variance)
* **Sunday Ola Emmanuel OBIKOYA:** 24 online slots = 12 (Goshen A) + 12 (Goshen B) = **24 bags** (0 variance)
* **Ayodele Olasunkanmi:** 20 online slots = 10 (Goshen A) + 10 (Goshen B) = **20 bags** (0 variance)
* **Ayodele Abati:** 18 online slots = 2 (Goshen A) + 16 (Goshen B) = **18 bags** (0 variance)
* **Momoh Pearl Nkiruka:** 14 online slots = 7 (Goshen A) + 7 (Goshen B) = **14 bags** (0 variance)
* **Samson Olasunkanmi:** 9 online slots = 1 (Goshen A) + 8 (Goshen B) = **9 bags** (0 variance)
* **Adekemi Fakorede-Padonou:** 6 online slots = 2 (Goshen A) + 4 (Goshen B) = **6 bags** (0 variance)
* **Olatunde sanda:** 6 online slots = 1 (Goshen A) + 5 (Goshen B) = **6 bags** (0 variance)
* **Phoebe Titus:** 6 online slots = 1 (Goshen A) + 5 (Goshen B) = **6 bags** (0 variance)
* **OGBAH CHUKWUMA MOSES:** 4 online slots = 2 (Goshen A) + 2 (Goshen B) = **4 bags** (0 variance)

### 4. Pacesetter Group Farm + Pacesetters Group Farm
* **sinnat salami:** 6 online slots = 4 (Pacesetter) + 2 (Pacesetters) = **6 bags** (0 variance)

### Technical Action Required:
Engineering will write an idempotent database migration script to merge duplicate farm groups into canonical entries, consolidating member bag counts into single records and deleting the duplicate group IDs.

---

## Action Plan & Next Steps

1. [ ] **Founders' Review:** Founders to review Category 1 (Surpluses), Category 2 (Ghost Accounts), and Category 3 (Unassigned Paying Members).
2. [ ] **Lockdown:** Keep dashboards in Read-Only Audit Mode (`developerelijah360@gmail.com` only) so concurrent user actions do not distort balances.
3. [ ] **Farm Group Consolidation Migration:** Merge duplicate farm group IDs and combine bag records in `farm_records`.
4. [ ] **Reconciled Data Ingestion:** Once founders provide updated numbers for Categories 1, 2, and 3, execute final balance update script.
