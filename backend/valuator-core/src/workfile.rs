use serde::{Deserialize, Serialize};

/// UAD quality rating: Q1 (best) through Q6 (worst).
pub type UadQuality = String;

/// UAD condition rating: C1 (new) through C6 (severely damaged/failed).
pub type UadCondition = String;

/// Full UAD workfile subject — mirrors C# WorkfileSubject.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct WorkfileSubject {
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub zip: Option<String>,
    pub county: Option<String>,
    pub legal_desc: Option<String>,
    pub apn: Option<String>,
    pub tax_year: Option<String>,
    pub re_taxes: Option<f64>,
    /// UAD occupancy: "O" = Owner, "T" = Tenant, "V" = Vacant
    pub occupancy: Option<String>,
    pub sale_price: Option<f64>,
    pub sale_date: Option<String>,
    pub gla: Option<i32>,
    pub year_built: Option<i32>,
    pub effective_age: Option<i32>,
    pub site_area: Option<String>,
    pub view: Option<String>,
    pub quality: Option<UadQuality>,
    pub condition: Option<UadCondition>,
    pub bsmt_area: Option<i32>,
    pub bsmt_finished: Option<i32>,
    pub rooms: Option<i32>,
    pub bedrooms: Option<i32>,
    pub baths: Option<i32>,
    pub half_baths: Option<i32>,
}

/// Single comparable sale entry — mirrors C# WorkfileComp.
/// Adjustment lines follow FNMA 1004 grid order.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct WorkfileComp {
    pub address: Option<String>,
    pub sale_price: Option<f64>,
    pub sale_date: Option<String>,
    pub gla: Option<i32>,
    pub year_built: Option<i32>,
    pub view: Option<String>,
    pub quality: Option<UadQuality>,
    pub condition: Option<UadCondition>,
    // Per-line grid adjustments (positive = comp inferior to subject)
    pub adj_location: Option<f64>,
    pub adj_site: Option<f64>,
    pub adj_view: Option<f64>,
    pub adj_quality: Option<f64>,
    pub adj_condition: Option<f64>,
    pub adj_bsmt: Option<f64>,
    pub adj_garage: Option<f64>,
    pub adj_gla: Option<f64>,
    pub adj_other: Option<f64>,
    /// Computed net adjustment (sum of adj_* lines)
    pub net_adj: Option<f64>,
    /// Adjusted sale price = sale_price + net_adj
    pub adj_sale_price: Option<f64>,
}

/// Reconciliation section — mirrors C# WorkfileReconciliation.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct WorkfileReconciliation {
    pub final_value: Option<f64>,
    pub effective_date: Option<String>,
    pub appraiser_name: Option<String>,
    pub license_num: Option<String>,
}

/// Top-level workfile — canonical appraisal data container.
/// Exactly 3 comparables required for FNMA 1004.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkfileDef {
    pub id: Option<String>,
    pub contract_id: Option<String>,
    pub subject: WorkfileSubject,
    /// FNMA 1004 requires exactly 3 comparables.
    pub comparables: Vec<WorkfileComp>,
    pub reconciliation: WorkfileReconciliation,
    /// GeoJSON polygon drawn by appraiser for neighborhood delineation.
    /// Stored as raw JSON; embedded in map addendum PDF.
    pub neighborhood_geojson: Option<serde_json::Value>,
}

impl Default for WorkfileDef {
    fn default() -> Self {
        Self {
            id: None,
            contract_id: None,
            subject: WorkfileSubject::default(),
            comparables: vec![
                WorkfileComp::default(),
                WorkfileComp::default(),
                WorkfileComp::default(),
            ],
            reconciliation: WorkfileReconciliation::default(),
            neighborhood_geojson: None,
        }
    }
}

impl WorkfileComp {
    /// Recompute net_adj and adj_sale_price from individual adjustment lines.
    pub fn recompute_adjustments(&mut self) {
        let net = [
            self.adj_location,
            self.adj_site,
            self.adj_view,
            self.adj_quality,
            self.adj_condition,
            self.adj_bsmt,
            self.adj_garage,
            self.adj_gla,
            self.adj_other,
        ]
        .iter()
        .filter_map(|v| *v)
        .sum::<f64>();
        self.net_adj = Some(net);
        if let Some(sp) = self.sale_price {
            self.adj_sale_price = Some(sp + net);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_workfile_has_three_comps() {
        let wf = WorkfileDef::default();
        assert_eq!(wf.comparables.len(), 3);
    }

    #[test]
    fn recompute_adjustments_sums_lines() {
        let mut comp = WorkfileComp {
            sale_price: Some(500_000.0),
            adj_gla: Some(5_000.0),
            adj_location: Some(-10_000.0),
            ..Default::default()
        };
        comp.recompute_adjustments();
        assert_eq!(comp.net_adj, Some(-5_000.0));
        assert_eq!(comp.adj_sale_price, Some(495_000.0));
    }

    #[test]
    fn workfile_serializes_to_json() {
        let wf = WorkfileDef::default();
        let json = serde_json::to_string(&wf).unwrap();
        assert!(json.contains("comparables"));
        assert!(json.contains("subject"));
    }
}
