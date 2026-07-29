import mysql.connector
import os
import sys

# Import config from backend
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))
try:
    from config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
except ImportError:
    DB_HOST = "localhost"
    DB_USER = "root"
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_NAME = "beer_shop_v2"

config = {
    'host': DB_HOST,
    'user': DB_USER,
    'password': DB_PASSWORD
}

def create_database():
    try:
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor(buffered=True)
        print(f"Creating database '{DB_NAME}' if not exists...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        print(f"Database '{DB_NAME}' created/verified successfully.")
        cursor.close()
        conn.close()
    except mysql.connector.Error as err:
        print(f"Error connecting/creating database: {err}")
        return False
    return True

def run_sql_file(cursor, filepath):
    print(f"\n--- Executing {os.path.basename(filepath)} ---")
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    # Split commands by semicolon
    statements = sql_content.split(';')
    for statement in statements:
        lines = [line for line in statement.split('\n') if not line.strip().startswith('--')]
        clean_stmt = '\n'.join(lines).strip()
        if clean_stmt:
            try:
                cursor.execute(clean_stmt)
                # Consume result if query returns any (e.g. SELECT)
                if cursor.with_rows:
                    cursor.fetchall()
            except mysql.connector.Error as err:
                # 1050: Table exists, 1060: Duplicate column, 1061: Duplicate key, 1091: Can't DROP key/column
                if err.errno in (1050, 1060, 1061, 1091):
                    print(f"Notice (Ignored): {err.msg}")
                else:
                    print(f"SQL Error in {os.path.basename(filepath)} (Err {err.errno}): {err.msg}")

def setup_all():
    if not create_database():
        return

    db_config = config.copy()
    db_config['database'] = DB_NAME

    try:
        conn = mysql.connector.connect(**db_config)
        conn.autocommit = True
        cursor = conn.cursor(buffered=True)

        base_dir = os.path.dirname(os.path.abspath(__file__))
        sql_files = [
            os.path.join(base_dir, 'schema.sql'),
            os.path.join(base_dir, 'migration_expenses.sql'),
            os.path.join(base_dir, 'migration_cash_register_supplier_bills.sql'),
            os.path.join(base_dir, 'migration_multi_shop.sql'),
            os.path.join(base_dir, 'sample_data.sql')
        ]

        for sql_file in sql_files:
            run_sql_file(cursor, sql_file)

        print("\n[SUCCESS] Database setup complete! All tables and migrations executed successfully.")
        
        # List created tables
        cursor.execute("SHOW TABLES;")
        tables = [t[0] for t in cursor.fetchall()]
        print(f"\nCreated Tables in '{DB_NAME}':")
        for table in tables:
            print(f"  - {table}")

        cursor.close()
        conn.close()

    except mysql.connector.Error as err:
        print(f"Database connection error: {err}")

if __name__ == '__main__':
    setup_all()
