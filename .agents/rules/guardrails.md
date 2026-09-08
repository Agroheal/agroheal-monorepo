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
