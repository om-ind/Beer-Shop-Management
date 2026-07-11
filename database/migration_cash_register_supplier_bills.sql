-- ============================================================
-- Beer Shop ERP — Migration: Cash Register + Supplier Bills
-- Run this in your MySQL client / Workbench
-- ============================================================

USE beer_shop_v2;

-- ─────────────────────────────────────
-- Table 1: cash_register
-- Tracks cash & bank in/out transactions
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS cash_register (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    entry_type  ENUM('cash_in','cash_out','bank_in','bank_out') NOT NULL,
    category    VARCHAR(100) DEFAULT 'other',
    amount      DECIMAL(10,2) NOT NULL,
    description VARCHAR(255),
    entry_date  DATE NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────
-- Table 2: supplier_bills
-- Tracks bills received from suppliers
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS supplier_bills (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id  INT NOT NULL,
    bill_number  VARCHAR(100),
    bill_date    DATE NOT NULL,
    due_date     DATE,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount  DECIMAL(10,2) DEFAULT 0,
    status       ENUM('pending','partial','paid') DEFAULT 'pending',
    notes        TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);
