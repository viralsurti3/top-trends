CREATE TABLE IF NOT EXISTS trends (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(2048) NOT NULL,
  source VARCHAR(32) NOT NULL,
  volume VARCHAR(32) DEFAULT NULL,
  timestamp DATETIME NOT NULL,
  country_code VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_trends_country (country_code),
  INDEX idx_trends_source (source),
  INDEX idx_trends_timestamp (timestamp)
);

CREATE TABLE IF NOT EXISTS youtube_trends_snapshots (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  region_code VARCHAR(10) NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_youtube_trends_region (region_code),
  INDEX idx_youtube_trends_created (created_at)
);


