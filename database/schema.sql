-- สร้างฐานข้อมูลสำหรับโปรเจกต์ส่งด่วนมื้อเที่ยง
CREATE DATABASE IF NOT EXISTS `lunch_delivery` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `lunch_delivery`;

-- 1. ตารางลูกค้า (customers)
CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL UNIQUE,
  `address` VARCHAR(255) DEFAULT '',
  `latitude` DECIMAL(10, 7) NOT NULL,
  `longitude` DECIMAL(10, 7) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. ตารางรายการสั่งซื้อ (orders)
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `box_count` INT NOT NULL DEFAULT 1,
  `note` VARCHAR(255) DEFAULT '',
  `status` ENUM('pending', 'delivering', 'completed', 'cancelled') DEFAULT 'pending',
  `is_simulated` TINYINT(1) DEFAULT 0,
  `order_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
