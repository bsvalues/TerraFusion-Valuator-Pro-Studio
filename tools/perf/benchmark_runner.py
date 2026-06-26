#!/usr/bin/env python3
"""Run a target command multiple times and report timing statistics."""
import argparse
import shlex
import subprocess
import time
import statistics


def run_command(command, shell=False):
    start = time.perf_counter()
    # Use subprocess.run for reliability; allow shell if user passed a shell command string
    subprocess.run(command, shell=shell, check=True)
    end = time.perf_counter()
    return end - start


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--command", required=True, help="Command to run. Use quotes if it contains spaces.")
    p.add_argument("--iterations", type=int, default=3, help="Number of timed iterations")
    p.add_argument("--warmup", type=int, default=1, help="Warmup runs before timing")
    p.add_argument("--shell", action="store_true", help="Run command through the shell (useful on Windows)")
    args = p.parse_args()

    cmd = args.command
    if not args.shell:
        # split into list unless shell mode requested
        cmd = shlex.split(args.command)

    print(f"Warmup: {args.warmup} runs")
    for i in range(args.warmup):
        run_command(cmd, shell=args.shell)

    timings = []
    print(f"Running {args.iterations} iterations...")
    for i in range(args.iterations):
        t = run_command(cmd, shell=args.shell)
        print(f"Iter {i+1}: {t:.3f}s")
        timings.append(t)

    print("\nStats:")
    print(f"min: {min(timings):.3f}s")
    print(f"median: {statistics.median(timings):.3f}s")
    print(f"mean: {statistics.mean(timings):.3f}s")
    print(f"max: {max(timings):.3f}s")


if __name__ == '__main__':
    main()
