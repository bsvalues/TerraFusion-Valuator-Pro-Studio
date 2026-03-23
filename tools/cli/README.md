Repo CLI

Provides small developer-facing commands to run the perf harness and manage repository labels.

Examples:

Run perf (local):

```bash
python tools/cli/cli.py perf run --rows 100 --iterations 1 --warmup 0 --shell
```

Ensure label exists (uses `gh`):

```bash
python tools/cli/cli.py label ensure --name needs-agent-prompt
```
