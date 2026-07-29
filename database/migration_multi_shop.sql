-- ============================================================
-- Beer Shop ERP — Migration: Multi-Shop / Multi-Tenant Support
-- ============================================================

USE beer_shop_v2;

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Create the shops table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shops (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    address     VARCHAR(300),
    phone       VARCHAR(30),
    owner_name  VARCHAR(150),
    is_active   TINYINT(1) DEFAULT 1,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────
-- STEP 2: Insert a default shop for existing data
-- ─────────────────────────────────────────────────────────────
INSERT INTO shops (id, name, address, phone, owner_name)
VALUES (1, 'Default Shop', '', '', 'Admin')
ON DUPLICATE KEY UPDATE name = name;

-- ─────────────────────────────────────────────────────────────
-- STEP 3: Add shop_id to users
-- ─────────────────────────────────────────────────────────────
ALTER TABLE users
    MODIFY COLUMN role ENUM('Admin','Owner','Manager','Cashier') NOT NULL DEFAULT 'Cashier';

ALTER TABLE users
    ADD COLUMN shop_id INT DEFAULT NULL,
    ADD COLUMN full_name VARCHAR(150) DEFAULT '',
    ADD COLUMN is_active TINYINT(1) DEFAULT 1,
    ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

UPDATE users SET role = 'Admin', shop_id = NULL WHERE username = 'admin';

-- ─────────────────────────────────────────────────────────────
-- STEP 4: Add shop_id to products
-- ─────────────────────────────────────────────────────────────
ALTER TABLE products
    ADD COLUMN shop_id INT NOT NULL DEFAULT 1;

UPDATE products SET shop_id = 1 WHERE shop_id = 0 OR shop_id IS NULL;

-- ─────────────────────────────────────────────────────────────
-- STEP 5: Add shop_id to customers
-- ─────────────────────────────────────────────────────────────
ALTER TABLE customers
    ADD COLUMN shop_id INT NOT NULL DEFAULT 1;

UPDATE customers SET shop_id = 1 WHERE shop_id = 0 OR shop_id IS NULL;

-- ─────────────────────────────────────────────────────────────
-- STEP 6: Add shop_id to suppliers
-- ─────────────────────────────────────────────────────────────
ALTER TABLE suppliers
    ADD COLUMN shop_id INT NOT NULL DEFAULT 1;

UPDATE suppliers SET shop_id = 1 WHERE shop_id = 0 OR shop_id IS NULL;

-- ─────────────────────────────────────────────────────────────
-- STEP 7: Add shop_id to sales
-- ─────────────────────────────────────────────────────────────
ALTER TABLE sales
    ADD COLUMN shop_id INT NOT NULL DEFAULT 1;

UPDATE sales SET shop_id = 1 WHERE shop_id = 0 OR shop_id IS NULL;

-- ─────────────────────────────────────────────────────────────
-- STEP 8: Add shop_id to purchases
-- ─────────────────────────────────────────────────────────────
ALTER TABLE purchases
    ADD COLUMN shop_id INT NOT NULL DEFAULT 1;

UPDATE purchases SET shop_id = 1 WHERE shop_id = 0 OR shop_id IS NULL;

-- ─────────────────────────────────────────────────────────────
-- STEP 9: Add shop_id to cash_register
-- ─────────────────────────────────────────────────────────────
ALTER TABLE cash_register
    ADD COLUMN shop_id INT NOT NULL DEFAULT 1;

UPDATE cash_register SET shop_id = 1 WHERE shop_id = 0 OR shop_id IS NULL;

-- ─────────────────────────────────────────────────────────────
-- STEP 10: Add shop_id to supplier_bills
-- ─────────────────────────────────────────────────────────────
ALTER TABLE supplier_bills
    ADD COLUMN shop_id INT NOT NULL DEFAULT 1;

UPDATE supplier_bills SET shop_id = 1 WHERE shop_id = 0 OR shop_id IS NULL;

-- ─────────────────────────────────────────────────────────────
-- STEP 11: Add shop_id to expenses
-- ─────────────────────────────────────────────────────────────
ALTER TABLE expenses
    ADD COLUMN shop_id INT NOT NULL DEFAULT 1;

UPDATE expenses SET shop_id = 1 WHERE shop_id = 0 OR shop_id IS NULL;

-- ─────────────────────────────────────────────────────────────
-- STEP 12: Assign existing non-admin users to Default Shop (shop_id = 1)
-- ─────────────────────────────────────────────────────────────
UPDATE users SET shop_id = 1 WHERE role != 'Admin' AND (shop_id IS NULL OR shop_id = 0);
