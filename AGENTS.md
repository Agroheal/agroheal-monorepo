# Agent Workflow & Execution Rules

## Git Workflow & Verification Protocol
1. **Strategic Local Commits**:
   - Always commit at strategic progress and completion points (e.g., after fixing component errors, adding client APIs, or completing UI features).
   - Write clear, descriptive commit messages documenting what was added or resolved.

2. **Push Only on Explicit User Instruction**:
   - NEVER execute `git push` autonomously.
   - Only execute `git push` when the user explicitly instructs: "push", "final push", or provides approval.

3. **Mandatory Build & Typecheck Gate**:
   - Before executing any `git push`, ALWAYS run and verify:
     - `npm run web:typecheck` (must exit with code 0, 0 errors).
     - `npm run admin:typecheck` (must exit with code 0, 0 errors).
   - Never push if there is a compiler error or broken build.
