#!/usr/bin/env python3
"""Tools CLI for repo: perf runs and repo label management.

Usage examples:
  python cli.py perf run --rows 100 --iterations 1 --warmup 0 --shell
  python cli.py label ensure --name needs-agent-prompt
"""
import argparse
import subprocess
import sys
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PERF_DIR = os.path.join(ROOT, 'perf')


def run_perf(args):
    gen = os.path.join(PERF_DIR, 'generate_synthetic_data.py')
    bench = os.path.join(PERF_DIR, 'benchmark_runner.py')
    if not os.path.exists(gen) or not os.path.exists(bench):
        print('Perf scripts not found under tools/perf. Ensure repository layout is intact.', file=sys.stderr)
        sys.exit(2)

    synth = os.path.join(PERF_DIR, 'cli_synth.csv')
    cmd_gen = [sys.executable, gen, '--rows', str(args.rows), '--out', synth, '--features', str(args.features)]
    print('Generating synthetic data:',' '.join(cmd_gen))
    subprocess.run(cmd_gen, check=True)

    cmd_bench = [sys.executable, bench, '--command', f"python {gen} --rows {args.rows} --out {synth}", '--iterations', str(args.iterations), '--warmup', str(args.warmup)]
    if args.shell:
        cmd_bench.append('--shell')
    print('Running benchmark:', ' '.join(cmd_bench))
    subprocess.run(cmd_bench, check=True)


def ensure_label(args):
    name = args.name
    color = args.color
    description = args.description
    # Use gh if available
    try:
        subprocess.run(['gh', 'label', 'view', name], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"Label '{name}' already exists")
        return
    except subprocess.CalledProcessError:
        pass

    print(f"Creating label '{name}' via gh CLI")
    cmd = ['gh', 'api', '--method', 'POST', f"/repos/{args.owner}/{args.repo}/labels", '-f', f"name={name}", '-f', f"color={color}", '-f', f"description={description}"]
    subprocess.run(cmd, check=True)
    print('Label created')


def main():
    parser = argparse.ArgumentParser(prog='repo-cli')
    sub = parser.add_subparsers(dest='cmd')

    perf = sub.add_parser('perf', help='Performance harness commands')
    perf_sub = perf.add_subparsers(dest='sub')
    perf_run = perf_sub.add_parser('run', help='Run perf harness')
    perf_run.add_argument('--rows', type=int, default=1000)
    perf_run.add_argument('--iterations', type=int, default=3)
    perf_run.add_argument('--warmup', type=int, default=1)
    perf_run.add_argument('--features', type=int, default=8)
    perf_run.add_argument('--shell', action='store_true')
    perf_run.set_defaults(func=run_perf)

    label = sub.add_parser('label', help='Label management')
    label_sub = label.add_subparsers(dest='sub')
    label_ensure = label_sub.add_parser('ensure', help='Ensure label exists')
    label_ensure.add_argument('--name', required=True)
    label_ensure.add_argument('--color', default='fbca04')
    label_ensure.add_argument('--description', default='')
    label_ensure.add_argument('--owner', default=os.environ.get('GITHUB_REPOSITORY_OWNER', 'bsvalues'))
    label_ensure.add_argument('--repo', default=os.environ.get('GITHUB_REPOSITORY', 'TerraFusion-Valuator-Pro-Studio').split('/',1)[-1])
    label_ensure.set_defaults(func=ensure_label)

    args = parser.parse_args()
    if not hasattr(args, 'func'):
        parser.print_help()
        sys.exit(1)
    try:
        args.func(args)
    except subprocess.CalledProcessError as e:
        print('Command failed:', e, file=sys.stderr)
        sys.exit(e.returncode)


if __name__ == '__main__':
    main()
