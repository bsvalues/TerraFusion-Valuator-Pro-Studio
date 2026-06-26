Orchestrator

This script runs an end-to-end local pipeline for the repo: inventory, installs, build/tests, basic security scans, perf harness, and produces an execution report.

Run:

```bash
python tools/orchestrator/orchestrator.py
```

Outputs are written to `tools/orchestrator/artifacts/execution-report.json` and logs under `tools/orchestrator/logs`.
