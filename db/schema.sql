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

