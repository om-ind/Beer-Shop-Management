-- ============================================================
-- Beer Shop ERP — Migration: Excise Compliance Features
-- Brand Register, Daily Sales Register, Monthly Statement
-- ============================================================

USE beer_shop_v2;

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Add excise metadata columns to products
-- ─────────────────────────────────────────────────────────────
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS excise_code   VARCHAR(50)  DEFAULT NULL COMMENT 'State excise brand code',
    ADD COLUMN IF NOT EXISTS pack_size_ml  INT          DEFAULT NULL COMMENT 'Bottle/pack size in ml',
    ADD COLUMN IF NOT EXISTS liquor_type   ENUM('Beer','IMFL','Wine','Country Liquor','Foreign Liquor') DEFAULT NULL;

-- ─────────────────────────────────────────────────────────────
-- STEP 2: Create daily_sales_register table
-- Auto-populated from sales; editable before locking for excise submission
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_sales_register (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    shop_id         INT NOT NULL,
    product_id      INT NOT NULL,
    sale_date       DATE NOT NULL,
    opening_stock   INT NOT NULL DEFAULT 0,
    qty_received    INT NOT NULL DEFAULT 0,   -- purchases received that day
    qty_sold        INT NOT NULL DEFAULT 0,
    closing_stock   INT NOT NULL DEFAULT 0,   -- opening + received - sold
    sale_value      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    is_locked       TINYINT(1) NOT NULL DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_shop_product_date (shop_id, product_id, sale_date),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (shop_id)    REFERENCES shops(id)    ON DELETE CASCADE
);
