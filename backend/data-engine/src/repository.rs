use crate::error::DataError;
use crate::models::*;
use async_trait::async_trait;
use chrono::Utc;
use log::{error, info};
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use uuid::Uuid;

/// Repository trait for property data access
#[async_trait]
pub trait PropertyRepository: Send + Sync {
    async fn create(&self, req: CreatePropertyRequest, owner_id: Option<Uuid>) -> Result<Property, DataError>;
    async fn get_by_id(&self, id: Uuid) -> Result<Property, DataError>;
    async fn get_by_parcel(&self, parcel_id: &str) -> Result<Property, DataError>;
    async fn update(&self, id: Uuid, req: UpdatePropertyRequest) -> Result<Property, DataError>;
    async fn delete(&self, id: Uuid) -> Result<(), DataError>;
    async fn search(&self, criteria: PropertySearchCriteria) -> Result<PaginatedResponse<Property>, DataError>;
}

/// Repository trait for valuation orders
#[async_trait]
pub trait OrderRepository: Send + Sync {
    async fn create(&self, req: CreateOrderRequest, user_id: Uuid) -> Result<ValuationOrder, DataError>;
    async fn get_by_id(&self, id: Uuid) -> Result<ValuationOrder, DataError>;
    async fn get_by_user(&self, user_id: Uuid) -> Result<Vec<ValuationOrder>, DataError>;
    async fn update_status(&self, id: Uuid, status: OrderStatus) -> Result<ValuationOrder, DataError>;
    async fn assign_appraiser(&self, id: Uuid, appraiser_id: Uuid) -> Result<ValuationOrder, DataError>;
}

/// Repository trait for valuation results
#[async_trait]
pub trait ValuationRepository: Send + Sync {
    async fn save(&self, order_id: Uuid, result: &valuator_core::model::ValuationResult) -> Result<ValuationResult, DataError>;
    async fn get_by_order(&self, order_id: Uuid) -> Result<Option<ValuationResult>, DataError>;
    async fn get_history(&self, property_id: Uuid) -> Result<Vec<ValuationResult>, DataError>;
}

/// PostgreSQL implementation
pub struct PgRepository {
    pool: PgPool,
}

impl PgRepository {
    pub async fn new(database_url: &str) -> Result<Self, DataError> {
        info!("Connecting to database...");

        let pool = PgPoolOptions::new()
            .max_connections(10)
            .connect(database_url)
            .await
            .map_err(|e| DataError::Connection(e.to_string()))?;

        info!("Database connection established");

        Ok(Self { pool })
    }

    pub fn pool(&self) -> &PgPool {
        &self.pool
    }

    /// Run database migrations
    pub async fn run_migrations(&self) -> Result<(), DataError> {
        info!("Running database migrations...");

        // Create enum types if they don't exist
        sqlx::query(r#"
            DO $$ BEGIN
                CREATE TYPE property_type AS ENUM (
                    'single_family', 'multi_family', 'condo', 'townhouse',
                    'commercial', 'land', 'industrial', 'mixed_use'
                );
            EXCEPTION WHEN duplicate_object THEN NULL;
            END $$;
        "#)
        .execute(&self.pool)
        .await
        .map_err(|e| DataError::Database(e.to_string()))?;

        sqlx::query(r#"
            DO $$ BEGIN
                CREATE TYPE order_type AS ENUM (
                    'full_appraisal', 'drive_by', 'desktop_review', 'bpo', 'avm'
                );
            EXCEPTION WHEN duplicate_object THEN NULL;
            END $$;
        "#)
        .execute(&self.pool)
        .await
        .map_err(|e| DataError::Database(e.to_string()))?;

        sqlx::query(r#"
            DO $$ BEGIN
                CREATE TYPE order_status AS ENUM (
                    'pending', 'assigned', 'in_progress', 'under_review',
                    'completed', 'cancelled', 'on_hold'
                );
            EXCEPTION WHEN duplicate_object THEN NULL;
            END $$;
        "#)
        .execute(&self.pool)
        .await
        .map_err(|e| DataError::Database(e.to_string()))?;

        // Create tables
        sqlx::query(r#"
            CREATE TABLE IF NOT EXISTS properties (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                parcel_id VARCHAR(50) UNIQUE NOT NULL,
                address VARCHAR(255) NOT NULL,
                city VARCHAR(100) NOT NULL,
                state VARCHAR(2) NOT NULL,
                zip_code VARCHAR(10) NOT NULL,
                property_type property_type NOT NULL,
                square_feet INTEGER NOT NULL,
                lot_size_sqft INTEGER,
                bedrooms SMALLINT NOT NULL,
                bathrooms SMALLINT NOT NULL,
                year_built SMALLINT NOT NULL,
                zoning VARCHAR(50),
                latitude DOUBLE PRECISION,
                longitude DOUBLE PRECISION,
                owner_id UUID,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_properties_parcel ON properties(parcel_id);
            CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(city, state, zip_code);
            CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
        "#)
        .execute(&self.pool)
        .await
        .map_err(|e| DataError::Database(e.to_string()))?;

        sqlx::query(r#"
            CREATE TABLE IF NOT EXISTS comparable_sales (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
                sale_price DOUBLE PRECISION NOT NULL,
                sale_date TIMESTAMPTZ NOT NULL,
                days_on_market INTEGER,
                listing_price DOUBLE PRECISION,
                financing_type VARCHAR(50),
                verified BOOLEAN NOT NULL DEFAULT FALSE,
                data_source VARCHAR(100) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_comp_sales_property ON comparable_sales(property_id);
            CREATE INDEX IF NOT EXISTS idx_comp_sales_date ON comparable_sales(sale_date);
        "#)
        .execute(&self.pool)
        .await
        .map_err(|e| DataError::Database(e.to_string()))?;

        sqlx::query(r#"
            CREATE TABLE IF NOT EXISTS valuation_orders (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                property_id UUID NOT NULL REFERENCES properties(id),
                user_id UUID NOT NULL,
                order_type order_type NOT NULL,
                status order_status NOT NULL DEFAULT 'pending',
                purpose VARCHAR(255) NOT NULL,
                effective_date TIMESTAMPTZ NOT NULL,
                due_date TIMESTAMPTZ,
                assigned_appraiser_id UUID,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_orders_user ON valuation_orders(user_id);
            CREATE INDEX IF NOT EXISTS idx_orders_status ON valuation_orders(status);
            CREATE INDEX IF NOT EXISTS idx_orders_property ON valuation_orders(property_id);
        "#)
        .execute(&self.pool)
        .await
        .map_err(|e| DataError::Database(e.to_string()))?;

        sqlx::query(r#"
            CREATE TABLE IF NOT EXISTS valuation_results (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                order_id UUID NOT NULL REFERENCES valuation_orders(id),
                final_value DOUBLE PRECISION NOT NULL,
                sales_indicator DOUBLE PRECISION NOT NULL,
                cost_indicator DOUBLE PRECISION NOT NULL,
                income_indicator DOUBLE PRECISION NOT NULL,
                confidence_score DOUBLE PRECISION NOT NULL DEFAULT 0.8,
                effective_date TIMESTAMPTZ NOT NULL,
                result_json JSONB NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_results_order ON valuation_results(order_id);
        "#)
        .execute(&self.pool)
        .await
        .map_err(|e| DataError::Database(e.to_string()))?;

        info!("Database migrations completed");
        Ok(())
    }
}

#[async_trait]
impl PropertyRepository for PgRepository {
    async fn create(&self, req: CreatePropertyRequest, owner_id: Option<Uuid>) -> Result<Property, DataError> {
        let now = Utc::now();
        let id = Uuid::new_v4();

        sqlx::query_as::<_, Property>(r#"
            INSERT INTO properties (
                id, parcel_id, address, city, state, zip_code, property_type,
                square_feet, lot_size_sqft, bedrooms, bathrooms, year_built,
                zoning, latitude, longitude, owner_id, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            RETURNING *
        "#)
        .bind(id)
        .bind(&req.parcel_id)
        .bind(&req.address)
        .bind(&req.city)
        .bind(&req.state)
        .bind(&req.zip_code)
        .bind(req.property_type)
        .bind(req.square_feet)
        .bind(req.lot_size_sqft)
        .bind(req.bedrooms)
        .bind(req.bathrooms)
        .bind(req.year_built)
        .bind(&req.zoning)
        .bind(req.latitude)
        .bind(req.longitude)
        .bind(owner_id)
        .bind(now)
        .bind(now)
        .fetch_one(&self.pool)
        .await
        .map_err(DataError::from)
    }

    async fn get_by_id(&self, id: Uuid) -> Result<Property, DataError> {
        sqlx::query_as::<_, Property>("SELECT * FROM properties WHERE id = $1")
            .bind(id)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| match e {
                sqlx::Error::RowNotFound => DataError::PropertyNotFound(id.to_string()),
                _ => DataError::from(e),
            })
    }

    async fn get_by_parcel(&self, parcel_id: &str) -> Result<Property, DataError> {
        sqlx::query_as::<_, Property>("SELECT * FROM properties WHERE parcel_id = $1")
            .bind(parcel_id)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| match e {
                sqlx::Error::RowNotFound => DataError::PropertyNotFound(parcel_id.to_string()),
                _ => DataError::from(e),
            })
    }

    async fn update(&self, id: Uuid, req: UpdatePropertyRequest) -> Result<Property, DataError> {
        // Get existing property
        let existing = self.get_by_id(id).await?;
        let now = Utc::now();

        sqlx::query_as::<_, Property>(r#"
            UPDATE properties SET
                address = COALESCE($2, address),
                city = COALESCE($3, city),
                state = COALESCE($4, state),
                zip_code = COALESCE($5, zip_code),
                property_type = COALESCE($6, property_type),
                square_feet = COALESCE($7, square_feet),
                lot_size_sqft = COALESCE($8, lot_size_sqft),
                bedrooms = COALESCE($9, bedrooms),
                bathrooms = COALESCE($10, bathrooms),
                year_built = COALESCE($11, year_built),
                zoning = COALESCE($12, zoning),
                latitude = COALESCE($13, latitude),
                longitude = COALESCE($14, longitude),
                updated_at = $15
            WHERE id = $1
            RETURNING *
        "#)
        .bind(id)
        .bind(req.address)
        .bind(req.city)
        .bind(req.state)
        .bind(req.zip_code)
        .bind(req.property_type)
        .bind(req.square_feet)
        .bind(req.lot_size_sqft)
        .bind(req.bedrooms)
        .bind(req.bathrooms)
        .bind(req.year_built)
        .bind(req.zoning)
        .bind(req.latitude)
        .bind(req.longitude)
        .bind(now)
        .fetch_one(&self.pool)
        .await
        .map_err(DataError::from)
    }

    async fn delete(&self, id: Uuid) -> Result<(), DataError> {
        let result = sqlx::query("DELETE FROM properties WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(DataError::from)?;

        if result.rows_affected() == 0 {
            return Err(DataError::PropertyNotFound(id.to_string()));
        }

        Ok(())
    }

    async fn search(&self, criteria: PropertySearchCriteria) -> Result<PaginatedResponse<Property>, DataError> {
        let limit = criteria.limit.unwrap_or(20).min(100);
        let offset = criteria.offset.unwrap_or(0);

        // Build dynamic query
        let mut conditions = vec!["1=1".to_string()];

        if criteria.city.is_some() {
            conditions.push(format!("city ILIKE '%' || ${} || '%'", conditions.len() + 1));
        }
        if criteria.state.is_some() {
            conditions.push(format!("state = ${}", conditions.len() + 1));
        }
        if criteria.zip_code.is_some() {
            conditions.push(format!("zip_code = ${}", conditions.len() + 1));
        }
        if criteria.property_type.is_some() {
            conditions.push(format!("property_type = ${}", conditions.len() + 1));
        }
        if criteria.min_sqft.is_some() {
            conditions.push(format!("square_feet >= ${}", conditions.len() + 1));
        }
        if criteria.max_sqft.is_some() {
            conditions.push(format!("square_feet <= ${}", conditions.len() + 1));
        }
        if criteria.min_bedrooms.is_some() {
            conditions.push(format!("bedrooms >= ${}", conditions.len() + 1));
        }
        if criteria.max_bedrooms.is_some() {
            conditions.push(format!("bedrooms <= ${}", conditions.len() + 1));
        }

        // For simplicity, using a basic query here
        // In production, use a query builder like sea-query
        let properties = sqlx::query_as::<_, Property>(
            "SELECT * FROM properties ORDER BY created_at DESC LIMIT $1 OFFSET $2"
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await
        .map_err(DataError::from)?;

        let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM properties")
            .fetch_one(&self.pool)
            .await
            .map_err(DataError::from)?;

        Ok(PaginatedResponse {
            data: properties,
            total: total.0,
            limit,
            offset,
        })
    }
}

#[async_trait]
impl OrderRepository for PgRepository {
    async fn create(&self, req: CreateOrderRequest, user_id: Uuid) -> Result<ValuationOrder, DataError> {
        let now = Utc::now();
        let id = Uuid::new_v4();

        sqlx::query_as::<_, ValuationOrder>(r#"
            INSERT INTO valuation_orders (
                id, property_id, user_id, order_type, status, purpose,
                effective_date, due_date, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9)
            RETURNING *
        "#)
        .bind(id)
        .bind(req.property_id)
        .bind(user_id)
        .bind(req.order_type)
        .bind(&req.purpose)
        .bind(req.effective_date)
        .bind(req.due_date)
        .bind(now)
        .bind(now)
        .fetch_one(&self.pool)
        .await
        .map_err(DataError::from)
    }

    async fn get_by_id(&self, id: Uuid) -> Result<ValuationOrder, DataError> {
        sqlx::query_as::<_, ValuationOrder>("SELECT * FROM valuation_orders WHERE id = $1")
            .bind(id)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| match e {
                sqlx::Error::RowNotFound => DataError::OrderNotFound(id.to_string()),
                _ => DataError::from(e),
            })
    }

    async fn get_by_user(&self, user_id: Uuid) -> Result<Vec<ValuationOrder>, DataError> {
        sqlx::query_as::<_, ValuationOrder>(
            "SELECT * FROM valuation_orders WHERE user_id = $1 ORDER BY created_at DESC"
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await
        .map_err(DataError::from)
    }

    async fn update_status(&self, id: Uuid, status: OrderStatus) -> Result<ValuationOrder, DataError> {
        sqlx::query_as::<_, ValuationOrder>(r#"
            UPDATE valuation_orders SET status = $2, updated_at = NOW()
            WHERE id = $1 RETURNING *
        "#)
        .bind(id)
        .bind(status)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => DataError::OrderNotFound(id.to_string()),
            _ => DataError::from(e),
        })
    }

    async fn assign_appraiser(&self, id: Uuid, appraiser_id: Uuid) -> Result<ValuationOrder, DataError> {
        sqlx::query_as::<_, ValuationOrder>(r#"
            UPDATE valuation_orders SET
                assigned_appraiser_id = $2,
                status = 'assigned',
                updated_at = NOW()
            WHERE id = $1 RETURNING *
        "#)
        .bind(id)
        .bind(appraiser_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => DataError::OrderNotFound(id.to_string()),
            _ => DataError::from(e),
        })
    }
}
