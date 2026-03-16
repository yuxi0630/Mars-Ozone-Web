CREATE DATABASE IF NOT EXISTS mars_ozone_platform DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE mars_ozone_platform;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    language VARCHAR(10) DEFAULT 'zh',
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prediction_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NULL,
    predict_type VARCHAR(20) NOT NULL,
    martian_year INT NOT NULL,
    sol INT NOT NULL,
    lat DOUBLE NULL,
    lon DOUBLE NULL,
    input_payload JSON NULL,
    prediction_value DOUBLE NULL,
    confidence_lower DOUBLE NULL,
    confidence_upper DOUBLE NULL,
    risk_level VARCHAR(20) NULL,
    model_version VARCHAR(50) DEFAULT 'baseline-v1',
    result_json JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS datasets (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    dataset_name VARCHAR(100) NOT NULL,
    dataset_type VARCHAR(50) NOT NULL,
    description TEXT NULL,
    source VARCHAR(255) NULL,
    status VARCHAR(20) DEFAULT 'draft',
    created_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dataset_versions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    dataset_id BIGINT NOT NULL,
    version_code VARCHAR(50) NOT NULL,
    file_path VARCHAR(255) NULL,
    schema_json JSON NULL,
    validation_report JSON NULL,
    change_log TEXT NULL,
    publish_status VARCHAR(20) DEFAULT 'draft',
    created_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_type VARCHAR(30) NOT NULL,
    biz_id BIGINT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    progress INT DEFAULT 0,
    payload JSON NULL,
    result_summary JSON NULL,
    error_message TEXT NULL,
    created_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);