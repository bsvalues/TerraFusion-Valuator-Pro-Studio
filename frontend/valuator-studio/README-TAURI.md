Tauri scaffold (minimal)

How to run (requires Rust, Cargo, Node, and Tauri CLI installed):

1. Install Tauri CLI (if not installed):

```bash
cargo install tauri-cli
```

2. From the frontend folder, install Node deps and run dev:

```bash
npm ci
npm run dev
# in another terminal
npm run tauri:dev
```

3. Build production bundle:

```bash
npm run build
npm run tauri:build
```

Notes:
- This scaffold uses `rusqlite` with the `bundled` feature to provide a local SQLite DB at the application directory.
- The Rust side exposes an in-process DB via `AppState` in `src-tauri/src/main.rs`.
- For production plugins or async DB access, consider adding `tauri-plugin-sql` or an async wrapper.
