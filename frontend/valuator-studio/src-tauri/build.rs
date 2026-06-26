fn main() {
    // Generate Tauri context during build. If tauri_build fails (icon/resource issues),
    // emit a warning instead of failing the entire build so unit tests can run locally.
    let res = std::panic::catch_unwind(|| {
        let _ = tauri_build::build();
    });
    if res.is_err() {
        println!("cargo:warning=tauri_build failed during build.rs - continuing tests");
    }
}
