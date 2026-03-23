Agent Prompt Template

Use this template when asking an agent to make code changes.

---
Task Title: One-line summary

Context: Brief repo context, relevant files/paths

Objective: What to implement or fix (1-2 sentences)

Constraints:
- Files allowed to edit: list paths
- Do not modify: list paths
- Security / privacy constraints

Acceptance Criteria:
- Tests to run and expected results (`cargo test`, `npm run build`, etc.)
- Lint/type checks required
- Any manual verification steps

Commands to run (for you to verify):
```
# build
cargo test
npm run build
```

Commit message guidance:
- Short summary line
- One-sentence rationale
- Reference ticket/issue if present

Example:
Task Title: Add `update_profile` endpoint
Context: auth-service, files `src/handlers.rs`, `src/models.rs`
Objective: Add `update_profile` handler to accept partial profile updates and persist them.
Constraints: Only touch `handlers.rs` and `models.rs`. Add tests in `handlers.rs`.
Acceptance Criteria: `cargo test` passes; `me` endpoint returns updated fields.

---
