USE qrqueue;

CREATE TABLE merchants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  google_id VARCHAR(64) NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE shops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  merchant_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  address VARCHAR(255),
  type ENUM('shop','clinic') NOT NULL DEFAULT 'shop',
  is_public TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE queues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(64) NOT NULL UNIQUE,
  status ENUM('open','paused','closed') NOT NULL DEFAULT 'open',
  avg_service_min DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  last_token INT NOT NULL DEFAULT 0,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  telegram_chat_id VARCHAR(32),
  push_sub JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE queue_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  queue_id INT NOT NULL,
  customer_id INT NOT NULL,
  entry_key CHAR(36) NOT NULL UNIQUE,
  token_no INT NOT NULL,
  status ENUM('waiting','notified','serving','served','skipped','cancelled','no_show')
         NOT NULL DEFAULT 'waiting',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  called_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  notified_at TIMESTAMP NULL,
  UNIQUE KEY uq_queue_token (queue_id, token_no),
  KEY idx_queue_status (queue_id, status, notified_at, token_no),
  FOREIGN KEY (queue_id) REFERENCES queues(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB;

CREATE TABLE otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts TINYINT NOT NULL DEFAULT 0,
  KEY idx_otp_email (email)
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entry_id INT NOT NULL,
  channel ENUM('email','push','telegram','sms') NOT NULL,
  status ENUM('pending','sent','failed') NOT NULL DEFAULT 'pending',
  error VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP NULL,
  KEY idx_notif_status (status, created_at),
  FOREIGN KEY (entry_id) REFERENCES queue_entries(id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE notifications
  ADD COLUMN type ENUM('upcoming','your_turn') NOT NULL DEFAULT 'upcoming' AFTER channel;