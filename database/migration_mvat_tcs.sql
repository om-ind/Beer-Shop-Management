-- Migration: Add mvat_amount and tcs_amount to purchases table
USE beer_shop_v2;

ALTER TABLE purchases
    ADD COLUMN mvat_amount DECIMAL(10,2) DEFAULT 0.00,
    ADD COLUMN tcs_amount DECIMAL(10,2) DEFAULT 0.00;
