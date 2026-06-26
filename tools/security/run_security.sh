#!/usr/bin/env bash
set -euo pipefail
mkdir -p "$(pwd)/tools/artifacts"

echo "Running gitleaks (local)..."
if command -v gitleaks >/dev/null 2>&1; then
  gitleaks detect --report-format json --report-path tools/artifacts/gitleaks.json || true
else
  echo "gitleaks not installed; skipping. Install from https://github.com/zricethezav/gitleaks"
fi

echo "Running cargo-audit (local)..."
if command -v cargo-audit >/dev/null 2>&1; then
  cargo audit --json > tools/artifacts/cargo_audit.json || true
else
  echo "cargo-audit not installed; skipping. Install with 'cargo install cargo-audit'"
fi

echo "Running npm audit (frontend)..."
if [ -d frontend/valuator-studio ]; then
  (cd frontend/valuator-studio && npm ci --no-audit --no-fund)
  (cd frontend/valuator-studio && npm audit --json > ../../tools/artifacts/npm_audit.json) || true
fi

echo "Security scan complete. Artifacts in tools/artifacts/."
