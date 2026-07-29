USE beer_shop_v2;

INSERT INTO products
(barcode, name, brand, category, purchase_price, selling_price, stock, minimum_stock, shop_id)
VALUES
('890100001', 'Kingfisher Strong 650ml', 'Kingfisher', 'Beer', 140.00, 180.00, 120, 20, 1),
('890100002', 'Budweiser Magnum', 'Budweiser', 'Beer', 170.00, 220.00, 80, 20, 1),
('890100003', 'Tuborg Green', 'Tuborg', 'Beer', 145.00, 190.00, 100, 25, 1),
('890100004', 'Carlsberg Elephant', 'Carlsberg', 'Beer', 160.00, 210.00, 70, 15, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO customers (id, name, mobile, address, credit_balance, shop_id)
VALUES (1, 'Cash Customer', '0000000000', 'Store Counter', 0.00, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);