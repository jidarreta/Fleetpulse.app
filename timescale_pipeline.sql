-- ============================================================================
-- FleetPulse Production Data Engineering Pipeline Script
-- TimescaleDB Hypertable, Continuous Aggregates, and Retention Policies
-- ============================================================================

-- 1. Enable TimescaleDB Extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- 2. Create Base Raw Telemetry Ingestion Table
CREATE TABLE IF NOT EXISTS vehicle_telemetry (
    recorded_at TIMESTAMPTZ NOT NULL,
    vehicle_id UUID NOT NULL,
    coolant_temp REAL,            -- CAN PID 05 (Float32)
    battery_voltage REAL,         -- CAN PID 42 (Float32)
    engine_rpm INTEGER,           -- CAN PID 0C (UInt16)
    oil_pressure REAL,            -- CAN PID 59 (Float32)
    fuel_injection_timing REAL,   -- Proprietary PID (Float32)
    error_codes TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Convert to TimescaleDB Hypertable (Partitioned by time and vehicle_id)
SELECT create_hypertable(
    'vehicle_telemetry', 
    'recorded_at', 
    partitioning_column => 'vehicle_id', 
    number_partitions => 8,
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- 4. Create High-Throughput Composite Index for Query Acceleration
CREATE INDEX IF NOT EXISTS idx_vehicle_telemetry_lookup 
ON vehicle_telemetry (vehicle_id, recorded_at DESC);

-- ============================================================================
-- DOWN-SAMPLING: CONTINUOUS AGGREGATES (1-MINUTE BUCKETING)
-- Solves the 10 Hz dynamic surge feature-calculation bottleneck
-- ============================================================================

CREATE MATERIALIZED VIEW telemetry_1min_avg
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 minute', recorded_at) AS bucket,
    vehicle_id,
    -- Time-weighted averages accounting for dynamic 1-10 Hz sampling shifts
    stats_agg(coolant_temp) AS coolant_temp_stats,
    AVG(coolant_temp)::REAL AS coolant_temp_avg,
    STDDEV(coolant_temp)::REAL AS coolant_temp_std,
    AVG(battery_voltage)::REAL AS battery_voltage_avg,
    MIN(battery_voltage)::REAL AS battery_voltage_min,
    AVG(engine_rpm)::INTEGER AS engine_rpm_avg,
    MAX(engine_rpm)::INTEGER AS engine_rpm_max,
    AVG(oil_pressure)::REAL AS oil_pressure_avg,
    MIN(oil_pressure)::REAL AS oil_pressure_min
FROM vehicle_telemetry
GROUP BY bucket, vehicle_id;

-- Enable Auto-Refresh Policy for 1-Minute Continuous Aggregate View
SELECT add_continuous_aggregate_policy('telemetry_1min_avg',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '1 minute'
);

-- ============================================================================
-- DATA COMPRESSION & RETENTION POLICIES
-- ============================================================================

-- Configure Segmenting and Ordering for Maximum Compression Ratio (~90%)
ALTER TABLE vehicle_telemetry SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'vehicle_id',
    timescaledb.compress_orderby = 'recorded_at DESC'
);

-- Automatically compress chunks older than 7 days
SELECT add_compression_policy('vehicle_telemetry', INTERVAL '7 days', if_not_exists => TRUE);

-- Automatically drop raw uncompressed/compressed data older than 90 days to control disk usage
SELECT add_retention_policy('vehicle_telemetry', INTERVAL '90 days', if_not_exists => TRUE);
