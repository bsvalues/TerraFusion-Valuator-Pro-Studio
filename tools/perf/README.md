Performance Benchmark Harness

Purpose
- Provide a lightweight, reproducible harness for benchmarking `tf-forge` operations.
- Generate synthetic datasets and run a target command repeatedly to measure runtimes and regressions.

Files
- `generate_synthetic_data.py` — create CSV test datasets with configurable size.
- `benchmark_runner.py` — runs a specified command repeatedly, measures timings, and prints basic statistics.

Quick start

1. Create test data (example: 10000 rows):

```bash
python tools/perf/generate_synthetic_data.py --rows 10000 --out /tmp/synth.csv
```

2. Run benchmark (example: run `cargo run --manifest-path backend/total-forge/Cargo.toml --release -- ...`):

```bash
python tools/perf/benchmark_runner.py --command "cargo run --bin tf-forge --release -- process /tmp/synth.csv" --iterations 5
```

Notes
- `benchmark_runner.py` measures wall-clock times and reports min/median/mean/max.
- Integrate into CI as a perf job later; keep datasets and warmup runs stable for regression detection.

CI Integration

- A GitHub Actions workflow `perf-benchmark.yml` runs the harness daily and on demand.
- The workflow generates a synthetic CSV and runs the benchmark, then uploads `ci_synth.csv` and `ci_benchmark.log` as artifacts.
- To run locally (same as CI):

```bash
python tools/perf/generate_synthetic_data.py --rows 1000 --out tools/perf/ci_synth.csv
python tools/perf/benchmark_runner.py --command "python tools/perf/generate_synthetic_data.py --rows 1000 --out tools/perf/ci_synth.csv" --iterations 3 --warmup 1 --shell
```

CI notes:
- Keep dataset sizes modest in CI to keep runs fast; run larger datasets in scheduled/regression jobs.
- Save baseline timings externally (e.g., a metrics store) to detect regressions in subsequent runs.
