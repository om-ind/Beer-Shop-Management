-- ============================================================
-- Migration: Expense Tracking
-- Run this SQL against your beer_shop_v2 database
-- ============================================================

USE beer_shop_v2;

CREATE TABLE IF NOT EXISTS expenses (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    category     VARCHAR(100) NOT NULL,
    description  VARCHAR(255),
    amount       DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    created_by   VARCHAR(50),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
