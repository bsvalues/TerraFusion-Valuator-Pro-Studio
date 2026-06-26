import React, { useState } from 'react';
import Head from 'next/head';

// Dynamic import of tauri wrapper to avoid server-side errors
let tauriDb: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  tauriDb = require('../src/lib/tauri-db');
} catch (e) {
  tauriDb = null;
}

export default function TauriKVPage() {
  const [key, setKey] = useState('example');
  const [value, setValue] = useState('hello');
  const [result, setResult] = useState<string | null>(null);
  const [keys, setKeys] = useState<string[]>([]);

  const setKV = async () => {
    if (!tauriDb) return setResult('Tauri not available');
    await tauriDb.setKV(key, value);
    setResult('ok');
  };

  const getKV = async () => {
    if (!tauriDb) return setResult('Tauri not available');
    const v = await tauriDb.getKV(key);
    setResult(v ?? 'null');
  };

  const delKV = async () => {
    if (!tauriDb) return setResult('Tauri not available');
    if (tauriDb.deleteKV) {
      await tauriDb.deleteKV(key);
      setResult('deleted');
    } else {
      setResult('delete not available');
    }
  };

  const list = async () => {
    if (!tauriDb) return setResult('Tauri not available');
    const ks = await (tauriDb.listKeys ? tauriDb.listKeys() : []);
    setKeys(ks || []);
  };

  return (
    <div style={{ padding: 24 }}>
      <Head>
        <title>Tauri KV Example</title>
      </Head>
      <h1>Tauri KV Example</h1>
      <div style={{ marginBottom: 8 }}>
        <label>Key: </label>
        <input value={key} onChange={(e) => setKey(e.target.value)} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Value: </label>
        <input value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={setKV}>Set</button>
        <button onClick={getKV}>Get</button>
        <button onClick={delKV}>Delete</button>
        <button onClick={list}>List Keys</button>
      </div>
      <div>
        <strong>Result:</strong> {result}
      </div>
      <div>
        <strong>Keys:</strong>
        <ul>
          {keys.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
