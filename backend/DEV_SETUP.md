# Backend Development Environment Setup

This guide covers setting up the Rust development environment for TerraFusion Valuator Pro Studio backend services on Windows.

## Prerequisites

- **Rust** (via Rustup): [https://rustup.rs/](https://rustup.rs/)
- **MSYS2** with MinGW-w64 toolchain (for GNU ABI) **OR** Visual Studio Build Tools (for MSVC ABI)

## Quick Start (Recommended: GNU Toolchain via MSYS2)

### 1. Install MSYS2

Download and extract MSYS2:

```powershell
# Download MSYS2 installer
Invoke-WebRequest -Uri https://mirror.msys2.org/distrib/x86_64/msys2-base-x86_64-20240727.sfx.exe -OutFile "$env:TEMP\msys2.exe"

# Extract to C:\msys64
& "$env:TEMP\msys2.exe" -y -oC:\
```

### 2. Initialize MSYS2 and Install MinGW Toolchain

```powershell
# Update package database
C:\msys64\usr\bin\bash.exe -lc "pacman -Sy --noconfirm"

# Install MinGW-w64 GCC and binutils (includes dlltool, ar, etc.)
C:\msys64\usr\bin\bash.exe -lc "pacman -S --needed --noconfirm base-devel mingw-w64-x86_64-toolchain"
```

### 3. Add MinGW to PATH (Session)

For the current PowerShell session:

```powershell
$env:Path += ";C:\msys64\mingw64\bin"
```

To persist across sessions, add `C:\msys64\mingw64\bin` to your **System Environment Variables** > **Path**.

### 4. Configure Rust Toolchain

```powershell
# Set GNU ABI as default
rustup default stable-x86_64-pc-windows-gnu

# Verify
rustup show
```

### 5. Verify Setup

```powershell
# Check toolchain availability
where.exe dlltool
where.exe gcc

# Build and test a crate
cd backend\valuator-core
cargo test
```

Expected output: Tests compile and pass successfully.

---

## Alternative: MSVC Toolchain (Windows Native)

If you prefer the MSVC linker (recommended for deployment builds):

### 1. Install Visual Studio Build Tools

Download and run the [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022) installer, then select:

- **Desktop development with C++** workload
- Individual components:
  - `MSVC v143 - VS 2022 C++ x64/x86 build tools`
  - `Windows 10/11 SDK`

### 2. Configure Rust Toolchain

```powershell
rustup default stable-x86_64-pc-windows-msvc
```

### 3. Test

```powershell
cd backend\valuator-core
cargo test
```

---

## Common Issues

### `dlltool.exe` not found (GNU)

**Cause:** MinGW binutils not in PATH.

**Fix:**

```powershell
$env:Path += ";C:\msys64\mingw64\bin"
```

### `link.exe` not found (MSVC)

**Cause:** Visual Studio Build Tools C++ components not installed or not in PATH.

**Fix:**

1. Re-run VS Build Tools installer (see above).
2. Manually add MSVC linker to PATH (example):

```powershell
$msvcVer = (Get-ChildItem "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC" | Select-Object -First 1).Name
$env:Path += ";C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\$msvcVer\bin\Hostx64\x64"
```

### Switching Toolchains

```powershell
# Switch to GNU
rustup default stable-x86_64-pc-windows-gnu
cargo clean

# Switch to MSVC
rustup default stable-x86_64-pc-windows-msvc
cargo clean
```

Always run `cargo clean` after switching to avoid linker/ABI mismatches.

---

## Development Workflow

### Running Tests

```powershell
# All tests in a crate
cargo test

# Specific test
cargo test smoke_estimate_value

# With output
cargo test -- --nocapture
```

### Building Services

```powershell
# Development build
cargo build

# Release build (optimized)
cargo build --release

# Build specific service
cd backend\valuator-api
cargo build
```

### Code Formatting and Linting

```powershell
# Format all code
cargo fmt --all

# Check formatting
cargo fmt --all -- --check

# Run Clippy lints
cargo clippy --all-targets --all-features -- -D warnings
```

---

## Project Structure

```
backend/
├── ai-engine/          # AI-powered valuation insights
├── auth-service/       # Authentication and authorization
├── data-engine/        # Data ingestion and processing
├── qc-engine/          # Quality control and validation
├── valuator-api/       # REST API gateway
└── valuator-core/      # Core valuation logic (library crate)
```

Each service is a standalone Rust crate. `valuator-core` is a shared library used by the services.

---

## Next Steps

- Review the [Architecture Overview](../docs/ARCHITECTURE_OVERVIEW.md)
- Read the [Developer Documentation](../docs/DEVELOPER_DOCUMENTATION.md)
- Check out [AI Engine API Docs](../docs/AI_ENGINE_API_DOCUMENTATION.md)

---

## Troubleshooting

For environment-specific issues:

- **Rust Toolchain:** Run `rustup show` and `rustc --version` to verify installation.
- **PATH Issues:** Use `where.exe <tool>` (PowerShell) or `which <tool>` (bash) to check availability.
- **Antivirus/Firewall:** Some corporate environments block compiler tools; whitelist `C:\msys64\` and Rust installation directories.

For crate-specific build errors, see `Cargo.toml` in each service directory for dependency requirements.

---

**Last Updated:** November 17, 2025  
**Tested Environment:** Windows 11, Rust 1.91.1, MSYS2 2024-07-27
