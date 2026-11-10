-- =============================================================================
-- MavunoSense AI — Production PostgreSQL Relational Schema DDL
-- Targeting Uasin Gishu (027) & Trans Nzoia (026) Counties, Kenya
-- Compliant with Kenya Data Protection Act (KDPA 2019) & Lacuna Fund Standards
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. ENUMS
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM (
    'SUPER_ADMIN',
    'EXTENSION_OFFICER',
    'COOPERATIVE_AGRONOMIST',
    'INSURER_UNDERWRITER',
    'FIELD_SCOUT'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE account_status_enum AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'PENDING_VERIFICATION',
    'INACTIVE'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE risk_tier_enum AS ENUM (
    'Normal',
    'Mild Stress',
    'Moderate Stress',
    'Severe Drought'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_status_enum AS ENUM (
    'CONFIRMED_TRUE_POSITIVE',
    'FALSE_ALARM',
    'RESOLVED_POST_RAIN',
    'PENDING_FIELD_VISIT'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- -----------------------------------------------------------------------------
-- 2. GEOGRAPHICAL REFERENCE HIERARCHY
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS counties (
  code VARCHAR(10) PRIMARY KEY, -- '026' (Trans Nzoia), '027' (Uasin Gishu)
  name VARCHAR(100) NOT NULL,
  capital VARCHAR(100) NOT NULL,
  agricultural_zone VARCHAR(100) NOT NULL DEFAULT 'High Potential Maize Breadbasket',
  headquarters_lat NUMERIC(9, 6) NOT NULL,
  headquarters_lon NUMERIC(9, 6) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wards (
  id SERIAL PRIMARY KEY,
  county_code VARCHAR(10) NOT NULL REFERENCES counties(code) ON DELETE RESTRICT,
  name VARCHAR(100) NOT NULL,
  sub_county VARCHAR(100) NOT NULL,
  centroid_lat NUMERIC(9, 6) NOT NULL,
  centroid_lon NUMERIC(9, 6) NOT NULL,
  area_hectares NUMERIC(10, 2) NOT NULL,
  fields_monitored INT NOT NULL DEFAULT 0,
  smallholder_percentage NUMERIC(5, 2) NOT NULL DEFAULT 80.0,
  current_stress_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
  current_risk_tier risk_tier_enum NOT NULL DEFAULT 'Normal',
  avg_ndvi NUMERIC(4, 3) NOT NULL DEFAULT 0.50,
  avg_ndmi NUMERIC(4, 3) NOT NULL DEFAULT 0.20,
  rainfall_deficit_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
  last_satellite_sync TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wards_county ON wards(county_code);
CREATE INDEX IF NOT EXISTS idx_wards_risk ON wards(current_risk_tier);

-- -----------------------------------------------------------------------------
-- 3. USERS & RBAC ACCESS CONTROL
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role user_role_enum NOT NULL DEFAULT 'EXTENSION_OFFICER',
  county_code VARCHAR(10) REFERENCES counties(code) ON DELETE SET NULL,
  organization VARCHAR(200) NOT NULL,
  phone_number VARCHAR(50),
  status account_status_enum NOT NULL DEFAULT 'ACTIVE',
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_county ON users(county_code);

-- -----------------------------------------------------------------------------
-- 4. PRIVILEGE SECURITY MATRIX (RBAC)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rbac_permissions (
  role user_role_enum NOT NULL,
  module_name VARCHAR(50) NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT TRUE,
  can_edit BOOLEAN NOT NULL DEFAULT FALSE,
  can_dispatch_sms BOOLEAN NOT NULL DEFAULT FALSE,
  can_verify_field BOOLEAN NOT NULL DEFAULT FALSE,
  can_export_audit BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_users BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (role, module_name)
);

-- -----------------------------------------------------------------------------
-- 5. FARMERS & PARCELS (KDPA 2019 Anonymized)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS farm_parcels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id VARCHAR(50) UNIQUE NOT NULL,
  ward_id INT NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
  farmer_anonymized_hash VARCHAR(64) NOT NULL,
  farmer_type VARCHAR(50) NOT NULL DEFAULT 'Smallholder (<2ha)',
  household_gender VARCHAR(30) NOT NULL DEFAULT 'Female-Headed',
  area_ha NUMERIC(6, 2) NOT NULL,
  phenology VARCHAR(50) NOT NULL DEFAULT 'V6-Vegetative Knee-High',
  current_ndvi NUMERIC(4, 3) NOT NULL DEFAULT 0.50,
  current_ndmi NUMERIC(4, 3) NOT NULL DEFAULT 0.20,
  current_sar_vv_db NUMERIC(5, 2) NOT NULL DEFAULT -9.0,
  soil_moisture NUMERIC(4, 3) NOT NULL DEFAULT 0.22,
  stress_score NUMERIC(5, 2) NOT NULL DEFAULT 35.0,
  risk_tier risk_tier_enum NOT NULL DEFAULT 'Normal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. IMPACT & REACH METRICS TRACKING
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS impact_metrics (
  id SERIAL PRIMARY KEY,
  metric_key VARCHAR(100) UNIQUE NOT NULL,
  metric_title VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  baseline_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  target_value NUMERIC(12, 2) NOT NULL,
  achieved_value NUMERIC(12, 2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  uasin_gishu_achieved NUMERIC(12, 2) NOT NULL DEFAULT 0,
  trans_nzoia_achieved NUMERIC(12, 2) NOT NULL DEFAULT 0,
  historical_trend JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. FIELD VERIFICATIONS (Alert Precision Confirmation)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS field_verifications (
  id SERIAL PRIMARY KEY,
  ward_id INT NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
  parcel_id VARCHAR(50) NOT NULL,
  verified_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  verifier_name VARCHAR(150) NOT NULL,
  verifier_role VARCHAR(100) NOT NULL,
  alert_date TIMESTAMPTZ NOT NULL,
  verification_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  satellite_stress_score NUMERIC(5, 2) NOT NULL,
  ground_stress_score NUMERIC(5, 2) NOT NULL,
  maize_growth_stage VARCHAR(50) NOT NULL,
  confirmation_status verification_status_enum NOT NULL DEFAULT 'CONFIRMED_TRUE_POSITIVE',
  visual_symptoms TEXT NOT NULL,
  soil_moisture_ground_pct NUMERIC(5, 2),
  corrective_action_advised TEXT,
  gps_lat NUMERIC(9, 6) NOT NULL,
  gps_lon NUMERIC(9, 6) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_field_verifications_ward ON field_verifications(ward_id);
CREATE INDEX IF NOT EXISTS idx_field_verifications_status ON field_verifications(confirmation_status);

-- -----------------------------------------------------------------------------
-- 8. BILINGUAL SMS DISPATCH LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sms_broadcast_logs (
  id SERIAL PRIMARY KEY,
  ward_id INT NOT NULL REFERENCES wards(id) ON DELETE RESTRICT,
  dispatched_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_count INT NOT NULL,
  language VARCHAR(10) NOT NULL, -- 'SW' or 'EN'
  message_content TEXT NOT NULL,
  trigger_threshold NUMERIC(5, 2) NOT NULL,
  lead_time_days INT NOT NULL DEFAULT 17,
  delivery_status VARCHAR(50) NOT NULL DEFAULT 'DELIVERED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 9. SEED DATA (INITIALIZATION)
-- -----------------------------------------------------------------------------
INSERT INTO counties (code, name, capital, agricultural_zone, headquarters_lat, headquarters_lon)
VALUES 
  ('026', 'Trans Nzoia', 'Kitale', 'High Potential Maize Belt', 1.016, 35.006),
  ('027', 'Uasin Gishu', 'Eldoret', 'High Potential Cereal & Dairy Belt', 0.514, 35.269)
ON CONFLICT (code) DO NOTHING;

-- Seed Impact & Reach Core Reference Table
INSERT INTO impact_metrics (metric_key, metric_title, category, baseline_value, target_value, achieved_value, unit, uasin_gishu_achieved, trans_nzoia_achieved, historical_trend)
VALUES
  (
    'sms_farmers_reached',
    'Farmers receiving early-warning SMS',
    'Farmer Outreach & Resilience',
    0,
    25000,
    19450,
    'Farmers',
    10820,
    8630,
    '[{"month": "Nov 25", "val": 3200}, {"month": "Dec 25", "val": 7800}, {"month": "Jan 26", "val": 12400}, {"month": "Feb 26", "val": 16200}, {"month": "Mar 26", "val": 19450}]'::jsonb
  ),
  (
    'staff_trained',
    'Extension officers and cooperative staff trained',
    'Capacity Building & Training',
    0,
    150,
    142,
    'Trained Personnel',
    78,
    64,
    '[{"month": "Nov 25", "val": 25}, {"month": "Dec 25", "val": 60}, {"month": "Jan 26", "val": 95}, {"month": "Feb 26", "val": 128}, {"month": "Mar 26", "val": 142}]'::jsonb
  ),
  (
    'institutional_dashboards',
    'Cooperatives, county offices, or insurers using dashboard',
    'Institutional Adoption',
    0,
    25,
    28,
    'Institutions',
    16,
    12,
    '[{"month": "Nov 25", "val": 4}, {"month": "Dec 25", "val": 11}, {"month": "Jan 26", "val": 18}, {"month": "Feb 26", "val": 23}, {"month": "Mar 26", "val": 28}]'::jsonb
  ),
  (
    'alert_precision',
    'Alerts confirmed by field check (precision)',
    'Model Precision & Ground Truth',
    70.0,
    80.0,
    84.6,
    '% Precision',
    85.2,
    83.8,
    '[{"month": "Nov 25", "val": 74.2}, {"month": "Dec 25", "val": 78.5}, {"month": "Jan 26", "val": 81.1}, {"month": "Feb 26", "val": 83.4}, {"month": "Mar 26", "val": 84.6}]'::jsonb
  )
ON CONFLICT (metric_key) DO UPDATE SET
  achieved_value = EXCLUDED.achieved_value,
  uasin_gishu_achieved = EXCLUDED.uasin_gishu_achieved,
  trans_nzoia_achieved = EXCLUDED.trans_nzoia_achieved;
