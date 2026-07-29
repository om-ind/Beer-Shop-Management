import sys, os
sys.stdout.reconfigure(encoding='utf-8')
from dotenv import load_dotenv
load_dotenv('backend/.env')
import mysql.connector

conn = mysql.connector.connect(
    host=os.getenv('DB_HOST', 'localhost'),
    user=os.getenv('DB_USER', 'root'),
    password=os.getenv('DB_PASSWORD', ''),
    database=os.getenv('DB_NAME', 'beer_shop_v2')
)
cursor = conn.cursor()

stmts = [
    "ALTER TABLE products ADD COLUMN excise_code VARCHAR(50) DEFAULT NULL",
    "ALTER TABLE products ADD COLUMN pack_size_ml INT DEFAULT NULL",
    "ALTER TABLE products ADD COLUMN liquor_type ENUM('Beer','IMFL','Wine','Country Liquor','Foreign Liquor') DEFAULT NULL",
    """CREATE TABLE IF NOT EXISTS daily_sales_register (
        id INT AUTO_INCREMENT PRIMARY KEY,
        shop_id INT NOT NULL,
        product_id INT NOT NULL,
        sale_date DATE NOT NULL,
        opening_stock INT NOT NULL DEFAULT 0,
        qty_received INT NOT NULL DEFAULT 0,
        qty_sold INT NOT NULL DEFAULT 0,
        closing_stock INT NOT NULL DEFAULT 0,
        sale_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        is_locked TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_shop_product_date (shop_id, product_id, sale_date),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
    )""",
]

for s in stmts:
    try:
        cursor.execute(s)
        print("OK:", s[:70].replace("\n", " "))
    except mysql.connector.Error as e:
        if e.errno == 1060:
            print("SKIP (column exists):", s[:60].replace("\n", " "))
        else:
            print("ERR:", str(e)[:100])

conn.commit()
cursor.close()
conn.close()
print("Migration complete.")
