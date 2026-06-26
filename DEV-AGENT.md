DEV Agent Checklist

Purpose: concise checklist for a solo developer working with agents.

- Branching:
  - Create a short-lived feature branch: `feature/<ticket>-short-desc`.
- Define scope:
  - Write a 1-2 sentence task description and acceptance criteria.
  - Specify files/paths the agent may modify.
- Run before agent:
  - `git status` clean working tree
  - Run relevant unit tests locally
- Agent run:
  - Provide prompt + success criteria (tests that must pass).
  - Ask agent to run tests and return outputs.
- Review:
  - Inspect diffs for logic, security, and PII exposure.
  - Run `cargo test` / `npm run build` locally.
- Commit & push:
  - Use human-written commit message summarizing intent and important notes.
  - Open PR with rationale and link to agent prompt.
- CI & merge:
  - Ensure CI passes lint/tests; require one human reviewer for sensitive code.
- Post-merge:
  - Run integration/smoke tests and monitor logs for regressions.

Tips:
- Limit agent edits to small, well-scoped files.
- Require unit tests as acceptance criteria.
- Keep secrets out of prompts.
