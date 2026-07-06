import mysql.connector
from config import *

def get_connection():
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )

    cursor = conn.cursor()

    cursor.execute("SELECT DATABASE()")
    print("Connected Database:", cursor.fetchone())

    cursor.execute("SELECT * FROM customers")
    print("Customers:", cursor.fetchall())

    cursor.close()

    return conn