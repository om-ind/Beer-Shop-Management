
USE beer_shop_v2;
CREATE TABLE products(

id INT AUTO_INCREMENT PRIMARY KEY,

barcode VARCHAR(100) UNIQUE,

name VARCHAR(100),

brand VARCHAR(100),

category VARCHAR(50),

purchase_price DECIMAL(10,2),

selling_price DECIMAL(10,2),

stock INT,

minimum_stock INT,

expiry_date DATE,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);
CREATE TABLE customers(

id INT AUTO_INCREMENT PRIMARY KEY,

name VARCHAR(100),

mobile VARCHAR(20),

address VARCHAR(200),

credit_balance DECIMAL(10,2) DEFAULT 0,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);
CREATE TABLE suppliers(

id INT AUTO_INCREMENT PRIMARY KEY,

name VARCHAR(100),

mobile VARCHAR(20),

company VARCHAR(100),

address VARCHAR(200)

);
CREATE TABLE sales(

id INT AUTO_INCREMENT PRIMARY KEY,

invoice_no VARCHAR(50),

customer_id INT,

total_amount DECIMAL(10,2),

payment_mode VARCHAR(20),

sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY(customer_id)
REFERENCES customers(id)

);
CREATE TABLE sale_items(

id INT AUTO_INCREMENT PRIMARY KEY,

sale_id INT,

product_id INT,

quantity INT,

price DECIMAL(10,2),

profit DECIMAL(10,2),

FOREIGN KEY(sale_id)
REFERENCES sales(id),

FOREIGN KEY(product_id)
REFERENCES products(id)

);
CREATE TABLE purchases(

id INT AUTO_INCREMENT PRIMARY KEY,

supplier_id INT,

invoice_no VARCHAR(50),

purchase_date DATE,

total DECIMAL(10,2),

FOREIGN KEY(supplier_id)
REFERENCES suppliers(id)

);
CREATE TABLE purchase_items(

id INT AUTO_INCREMENT PRIMARY KEY,

purchase_id INT,

product_id INT,

quantity INT,

purchase_price DECIMAL(10,2),

FOREIGN KEY(product_id)
REFERENCES products(id),

FOREIGN KEY(purchase_id)
REFERENCES purchases(id)

);
CREATE TABLE credit_payments(

id INT AUTO_INCREMENT PRIMARY KEY,

customer_id INT,

amount DECIMAL(10,2),

payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

remarks VARCHAR(200),

FOREIGN KEY(customer_id)
REFERENCES customers(id)

);
CREATE TABLE users(

id INT AUTO_INCREMENT PRIMARY KEY,

username VARCHAR(50),

password VARCHAR(255),

role VARCHAR(20)

);
INSERT INTO users

(username,password,role)

VALUES

('admin','admin123','Admin');