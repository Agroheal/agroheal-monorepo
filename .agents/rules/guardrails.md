# AgroHeal Development Guardrails & Rules (Milestones 1–4)

1. **Implementation Plan Alignment:**
   - Follow `implementation_plan.md` faithfully from Milestone 1 through Milestone 4.
   - Target completion: Milestone 4.

2. **Irreversible Action Safeguards:**
   - NEVER drop tables, truncate databases, or execute destructive data purges without explicit user permission.
   - All migrations and operations must be additive, backward-compatible, and non-destructive.

3. **Git & Commit Strategy:**
   - All work stays on the `dev` branch across both `agroheal-fe` and `agroheal-server`.
   - Commit at logical intervals (e.g. after completing each phase/feature).
   - **DO NOT PUSH** until Milestone 4 is fully completed, verified, and accepted.
   - Always run the production build (`build`) before committing to verify zero syntax, lint, or type errors.

4. **Testing & Verification Standards:**
   - Write comprehensive unit and integration tests for every new module and service.
   - Run tests and guarantee 100% passing status before declaring any phase complete.
   - Visually test UI components in Chrome browser to verify layout, responsiveness, and interactions.

5. **Design & Aesthetics Excellence:**
   - High-fidelity UI: Emerald & gold metallic accents, glassmorphism, smooth micro-animations.
   - No placeholder images or broken states.

6. **Operational Directives & Post-Launch Reminders:**
   - Remind user to send formal agreement.
   - Hosting: Frontend on Render (Static Sites, 100% free), DB & Auth on Supabase, Express Server on Railway (unified env variables for dev and staging).
   - Ingest clean financial records from farm coordinators to replace historical dirty data.
   - Reconcile orphaned / no-referral accounts and audit remainder of database prior to launch.
   - **FOUNDER REVIEW TODO**: Founders must thoroughly review all customer-facing website copy across marketing and dashboard pages, with highest priority on the legal governance suite (`/legal`, `/privacy`, `/terms`, LEAP Group Farming Agreement, 5x7 matrix rules, and biological risk disclosures) prior to public launch.

7. **Strict Content & Feature Boundary (User Approval Required):**
   - **NEVER** invent, fabricate, assume, or add new business content, dummy job postings, pricing packages, feature mockups, or speculative functionality without explicit prior user approval.
   - If content or specifications are missing or unspecified, present a clean, neutral state (e.g. "not actively hiring", "coming soon", or contact inquiry) and ask the user for the actual copy or requirement rather than making up details.

8. **Authoritative Business Logic Source of Truth:**
   - `docs/BUSINESS_LOGIC.md` is the single authoritative source of truth for all compensation calculations, 7-level product commission engine (40% ceiling), farm slot allocations, farm production cycles, and policy resolutions. All code and documentation must strictly conform to this file.

9. **Database Environment Isolation (CRITICAL):**
   - Whenever the user asks to seed data, create test records, or test functionality, this **MUST ALWAYS** be executed against the **Development/Staging Database** (or local mocks), **NEVER the Production Database**.
   - The Production Database (`ptowfacejneezksyhntk`) is reserved exclusively for live data audits, schema fixes approved by the user, and official verified migrations. Under no circumstances should test or mock records be written to Production.

