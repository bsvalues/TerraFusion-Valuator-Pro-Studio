---
name: Agent Task
about: Use this template when creating a task for an AI agent to perform
---

## Goal

Describe the goal you want the agent to accomplish.

## Context

Provide links to relevant files, docs, and the `PROMPT-TEMPLATE.md`.

See the canonical prompt guide: [PROMPT-TEMPLATE.md](PROMPT-TEMPLATE.md)

## Constraints

List constraints (security, PII, resource limits).

## Expected Outputs

- Files to modify/create
- Tests to add/update
- Any commands to run locally

## Agent Prompt

Paste the exact prompt you plan to use with the agent.

Commands the agent should run (for local verification):
```
# run backend tests
cargo test

# build frontend
cd frontend/valuator-studio && npm ci && npm run build
```
