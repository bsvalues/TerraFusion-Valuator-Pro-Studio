#!/usr/bin/env python3
"""Orchestrator: run repo inventory, installs, builds/tests, security scan, perf, and summarize.

Usage: python tools/orchestrator/orchestrator.py
"""
import os
import sys
import subprocess
import json
import shutil
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ARTIFACTS = os.path.join(ROOT, 'artifacts')
LOGS = os.path.join(ROOT, 'logs')
REPO_ROOT = os.path.abspath(os.path.join(ROOT, '..'))

os.makedirs(ARTIFACTS, exist_ok=True)
os.makedirs(LOGS, exist_ok=True)

PY = sys.executable


def run(cmd, cwd=None, capture=True, shell=False):
    start = datetime.utcnow()
    try:
        if capture:
            p = subprocess.run(cmd, cwd=cwd, shell=shell, check=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
            out = p.stdout
        else:
            p = subprocess.run(cmd, cwd=cwd, shell=shell, check=True)
            out = ''
        status = 'ok'
    except subprocess.CalledProcessError as e:
        out = getattr(e, 'output', str(e))
        status = 'fail'
    end = datetime.utcnow()
    return {'cmd': cmd if not shell else cmd, 'cwd': cwd, 'status': status, 'output': out, 'start': start.isoformat(), 'end': end.isoformat()}


def repo_explorer():
    out = {}
    # list files
    r = run(['git', 'ls-files'], cwd=REPO_ROOT)
    files = r['output'].splitlines() if r['status']=='ok' else []
    out['files_count'] = len(files)
    # changes
    diff_cmd = ['git', 'diff', '--name-only', 'origin/main...HEAD']
    d = run(diff_cmd, cwd=REPO_ROOT)
    if d['status'] != 'ok':
        d = run(['git', 'diff', '--name-only', 'HEAD~1..HEAD'], cwd=REPO_ROOT)
    changed = d['output'].splitlines() if d['status']=='ok' else []
    out['changed'] = changed
    out['files_sample'] = files[:200]
    path = os.path.join(ARTIFACTS, 'inventory.json')
    with open(path, 'w', encoding='utf-8') as fh:
        json.dump(out, fh, indent=2)
    return r


def install_backend():
    path = os.path.join(REPO_ROOT, 'backend', 'auth-service')
    if not os.path.isdir(path):
        return {'skipped': True}
    return run([ 'cargo', 'fetch' ], cwd=path)


def install_frontend():
    path = os.path.join(REPO_ROOT, 'frontend', 'valuator-studio')
    if not os.path.isdir(path):
        return {'skipped': True}
    return run([ sys.executable, '-m', 'pip', '--version' ], cwd=path) if False else run(['npm', 'ci', '--no-audit', '--no-fund'], cwd=path)


def install_tauri():
    path = os.path.join(REPO_ROOT, 'frontend', 'src-tauri')
    if not os.path.isdir(path):
        return {'skipped': True}
    return run(['cargo', 'fetch'], cwd=path)


def backend_test():
    path = os.path.join(REPO_ROOT, 'backend', 'auth-service')
    if not os.path.isdir(path):
        return {'skipped': True}
    return run(['cargo', 'test', '--color', 'never'], cwd=path)


def frontend_build():
    path = os.path.join(REPO_ROOT, 'frontend', 'valuator-studio')
    if not os.path.isdir(path):
        return {'skipped': True}
    return run(['npm', 'run', 'build'], cwd=path)


def tauri_test_build():
    path = os.path.join(REPO_ROOT, 'frontend', 'src-tauri')
    if not os.path.isdir(path):
        return {'skipped': True}
    r1 = run(['cargo', 'test'], cwd=path)
    r2 = run(['cargo', 'build', '--release'], cwd=path)
    return {'test': r1, 'build': r2}


def security_scan():
    # lightweight grep for likely secrets
    patterns = ['AWS_SECRET', 'AWS_ACCESS', 'BEGIN RSA PRIVATE KEY', 'PRIVATE KEY', 'PASSWORD', 'SECRET']
    hits = []
    for p in patterns:
        r = run(['git', 'grep', '-n', '-I', p], cwd=REPO_ROOT, shell=False)
        if r['status']=='ok' and r['output'].strip():
            hits.append({'pattern': p, 'matches': r['output'].splitlines()})
    path = os.path.join(ARTIFACTS, 'security_scan.json')
    with open(path, 'w', encoding='utf-8') as fh:
        json.dump(hits, fh, indent=2)
    return {'hits': len(hits), 'details': hits}


def perf_run():
    # use the CLI created earlier
    cli = os.path.join(REPO_ROOT, 'tools', 'cli', 'cli.py')
    if not os.path.exists(cli):
        return {'skipped': True}
    cmd = [sys.executable, cli, 'perf', 'run', '--rows', '1000', '--iterations', '3', '--warmup', '1', '--shell']
    return run(cmd, cwd=REPO_ROOT)


def summarize(results):
    summary = {}
    summary['timestamp'] = datetime.utcnow().isoformat()
    summary['results'] = results
    out = os.path.join(ARTIFACTS, 'execution-report.json')
    with open(out, 'w', encoding='utf-8') as fh:
        json.dump(summary, fh, indent=2)
    return out


def main():
    print('Starting orchestrator...')
    results = {}
    print('Repo explorer...')
    results['repo_explorer'] = repo_explorer()

    print('Installing dependencies in parallel...')
    with ThreadPoolExecutor(max_workers=3) as ex:
        futures = {
            ex.submit(install_backend): 'install_backend',
            ex.submit(install_frontend): 'install_frontend',
            ex.submit(install_tauri): 'install_tauri'
        }
        for fut in as_completed(futures):
            key = futures[fut]
            try:
                results[key] = fut.result()
            except Exception as e:
                results[key] = {'status': 'error', 'error': str(e)}

    print('Running builds/tests in parallel...')
    with ThreadPoolExecutor(max_workers=3) as ex:
        futures = {
            ex.submit(backend_test): 'backend_test',
            ex.submit(frontend_build): 'frontend_build',
            ex.submit(tauri_test_build): 'tauri_test_build'
        }
        for fut in as_completed(futures):
            key = futures[fut]
            try:
                results[key] = fut.result()
            except Exception as e:
                results[key] = {'status': 'error', 'error': str(e)}

    print('Running security scan...')
    results['security_scan'] = security_scan()

    print('Running perf harness...')
    results['perf'] = perf_run()

    print('Summarizing...')
    report = summarize(results)
    print('Report written to', report)

    print('Orchestrator completed')

if __name__ == '__main__':
    main()
