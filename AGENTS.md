# Agent Workflow & Execution Rules

## 1. Git Workflow & Verification Protocol
1. **Strategic Local Commits**:
   - Always commit at strategic progress and completion points (e.g., after fixing component errors, adding client APIs, or completing UI features).
   - Write clear, descriptive commit messages documenting what was added or resolved.

2. **Push Only on Explicit User Instruction**:
   - NEVER execute `git push` autonomously.
   - Only execute `git push` when the user explicitly instructs: "push", "final push", or provides approval.

3. **Mandatory Build & Typecheck Gate (Push Only)**:
   - Typecheck and build are to be executed ONLY when preparing to push to remote.
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
