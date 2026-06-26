## Summary

<!-- One-line summary of the change -->

## Context

<!-- Which part of the repo is affected, and why. Reference `DEV-AGENT.md` or `PROMPT-TEMPLATE.md` if an agent was used. -->

## Agent Prompt (if used)

Paste the prompt you used with the agent (or link to the issue where it lives):

```
<PASTE PROMPT HERE>
```

See the repository prompt guidance: [PROMPT-TEMPLATE.md](PROMPT-TEMPLATE.md)

## Acceptance Criteria
- [ ] Unit tests pass locally (`cargo test` / `npm test`)
- [ ] Build passes (`npm run build`)
- [ ] Lint/type checks pass
- [ ] A human reviewed and verified any auth/PII/secret changes

Commands to verify locally:
```
cargo test
npm ci
npm run build
```

## Checklist for Reviewer
- Review code diffs and tests
- Confirm acceptance criteria

