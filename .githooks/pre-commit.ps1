# DEV-AGENT pre-commit hook (PowerShell)
Write-Host "`n=== DEV-AGENT Checklist Reminder ===`n" -ForegroundColor Cyan
Write-Host "- Branching: Use feature/<ticket>-short-desc"
Write-Host "- Provide a clear Task Title, Context, Objective, Constraints, Acceptance Criteria"
Write-Host "- Ensure tests pass locally: run 'cargo test' and/or 'npm run build'"
Write-Host "- Reference PROMPT-TEMPLATE.md in PR description when delegating to agents"
Write-Host "- Keep secrets out of prompts and commits"
Write-Host "`nSee DEV-AGENT.md and PROMPT-TEMPLATE.md for details.`n"
Write-Host "If you want to skip this reminder, commit with --no-verify." -ForegroundColor Yellow
exit 0
