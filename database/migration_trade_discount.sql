-- Migration: Add trade_discount and bill_total_amount to purchases table
USE beer_shop_v2;

ALTER TABLE purchases
    ADD COLUMN trade_discount DECIMAL(10,2) DEFAULT 0.00,
    ADD COLUMN bill_total_amount DECIMAL(10,2) DEFAULT 0.00;
