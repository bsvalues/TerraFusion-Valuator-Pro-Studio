pub fn basic_qc_score(final_value: f64) -> f64 {
    if final_value <= 0.0 {
        return 0.0;
    }
    // Placeholder QC metric: logarithmic scaling
    (final_value.log10() / 6.0).min(1.0)
}
