-- Complete Unified Database Schema for Beer Shop ERP
SET SQL_SAFE_UPDATES = 0;

CREATE TABLE IF NOT EXISTS shops (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    address     VARCHAR(300),
    phone       VARCHAR(30),
    owner_name  VARCHAR(150),
    is_active   TINYINT(1) DEFAULT 1,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO shops (id, name, address, phone, owner_name)
VALUES (1, 'Default Shop', '', '', 'Admin')
ON DUPLICATE KEY UPDATE name = name;

CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('Admin','Owner','Manager','Cashier') NOT NULL DEFAULT 'Cashier',
    shop_id     INT DEFAULT NULL,
    full_name   VARCHAR(150) DEFAULT '',
    is_active   TINYINT(1) DEFAULT 1,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE SET NULL
);

INSERT INTO users (username, password, role, full_name)
VALUES ('admin', 'admin123', 'Admin', 'Administrator')
ON DUPLICATE KEY UPDATE role = 'Admin';

CREATE TABLE IF NOT EXISTS products (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    shop_id        INT NOT NULL DEFAULT 1,
    barcode        VARCHAR(100),
    name           VARCHAR(100) NOT NULL,
    brand          VARCHAR(100),
    category       VARCHAR(50),
    purchase_price DECIMAL(10,2) DEFAULT 0.00,
    selling_price  DECIMAL(10,2) DEFAULT 0.00,
    stock          INT DEFAULT 0,
    minimum_stock  INT DEFAULT 0,
    expiry_date    DATE,
    excise_code    VARCHAR(50) DEFAULT NULL,
    pack_size_ml   INT DEFAULT NULL,
    liquor_type    ENUM('Beer','IMFL','Wine','Country Liquor','Foreign Liquor') DEFAULT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customers (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    shop_id        INT NOT NULL DEFAULT 1,
    name           VARCHAR(100) NOT NULL,
    mobile         VARCHAR(20),
    address        VARCHAR(200),
    credit_balance DECIMAL(10,2) DEFAULT 0.00,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS suppliers (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    shop_id     INT NOT NULL DEFAULT 1,
    name        VARCHAR(100) NOT NULL,
    mobile      VARCHAR(20),
    company     VARCHAR(100),
    address     VARCHAR(200),
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sales (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    shop_id      INT NOT NULL DEFAULT 1,
    invoice_no   VARCHAR(50),
    customer_id  INT,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_mode VARCHAR(20) DEFAULT 'cash',
    sale_date    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sale_items (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    sale_id    INT NOT NULL,
    product_id INT NOT NULL,
    quantity   INT NOT NULL,
    price      DECIMAL(10,2) NOT NULL,
    profit     DECIMAL(10,2) DEFAULT 0.00,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS purchases (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    shop_id     INT NOT NULL DEFAULT 1,
    supplier_id INT,
    invoice_no  VARCHAR(50),
    purchase_date DATE,
    total       DECIMAL(10,2) NOT NULL,
    mvat_amount DECIMAL(10,2) DEFAULT 0.00,
    tcs_amount  DECIMAL(10,2) DEFAULT 0.00,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id    INT NOT NULL,
    product_id     INT NOT NULL,
    quantity       INT NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS credit_payments (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    customer_id  INT NOT NULL,
    amount       DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remarks      VARCHAR(200),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cash_register (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    shop_id     INT NOT NULL DEFAULT 1,
    entry_type  ENUM('cash_in','cash_out','bank_in','bank_out') NOT NULL,
    category    VARCHAR(100) DEFAULT 'other',
    amount      DECIMAL(10,2) NOT NULL,
    description VARCHAR(255),
    entry_date  DATE NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS supplier_bills (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    shop_id      INT NOT NULL DEFAULT 1,
    supplier_id  INT NOT NULL,
    bill_number  VARCHAR(100),
    bill_date    DATE NOT NULL,
    due_date     DATE,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount  DECIMAL(10,2) DEFAULT 0,
    status       ENUM('pending','partial','paid') DEFAULT 'pending',
    notes        TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS expenses (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    shop_id      INT NOT NULL DEFAULT 1,
    category     VARCHAR(100) NOT NULL,
    description  VARCHAR(255),
    amount       DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    created_by   VARCHAR(50),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_sales_register (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    shop_id         INT NOT NULL DEFAULT 1,
    product_id      INT NOT NULL,
    sale_date       DATE NOT NULL,
    opening_stock   INT NOT NULL DEFAULT 0,
    qty_received    INT NOT NULL DEFAULT 0,
    qty_sold        INT NOT NULL DEFAULT 0,
    closing_stock   INT NOT NULL DEFAULT 0,
    sale_value      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    is_locked       TINYINT(1) NOT NULL DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_shop_product_date (shop_id, product_id, sale_date),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);