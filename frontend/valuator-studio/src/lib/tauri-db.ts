export async function setKV(key: string, value: string): Promise<void> {
  try {
    const mod = await import('@tauri-apps/api/core');
    await mod.invoke('set_kv', { key, value });
  } catch (e) {
    throw new Error('Tauri API not available');
  }
}

export async function getKV(key: string): Promise<string | null> {
  try {
    const mod = await import('@tauri-apps/api/core');
    const res = await mod.invoke('get_kv', { key });
    return res as string | null;
  } catch (e) {
    throw new Error('Tauri API not available');
  }
}

export async function deleteKV(key: string): Promise<void> {
  try {
    const mod = await import('@tauri-apps/api/core');
    await mod.invoke('delete_kv', { key });
  } catch (e) {
    throw new Error('Tauri API not available');
  }
}

export async function listKeys(): Promise<string[] | null> {
  try {
    const mod = await import('@tauri-apps/api/core');
    const res = await mod.invoke('list_keys');
    return res as string[];
  } catch (e) {
    throw new Error('Tauri API not available');
  }
}
