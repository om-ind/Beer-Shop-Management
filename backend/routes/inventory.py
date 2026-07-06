from flask import Blueprint, request, jsonify
from database import get_connection

inventory_bp = Blueprint("inventory", __name__)

# GET all products
@inventory_bp.route("/products", methods=["GET"])
def get_products():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM products")
    products = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(products)

# ADD product
@inventory_bp.route("/products", methods=["POST"])
def add_product():
    data = request.json

    conn = get_connection()
    cursor = conn.cursor()

    sql = """
    INSERT INTO products
    (barcode,name,brand,category,purchase_price,selling_price,stock,minimum_stock)
    VALUES(%s,%s,%s,%s,%s,%s,%s,%s)
    """

    values = (
        data["barcode"],
        data["name"],
        data["brand"],
        data["category"],
        data["purchase_price"],
        data["selling_price"],
        data["stock"],
        data["minimum_stock"]
    )

    cursor.execute(sql, values)

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message": "Product Added Successfully"})
# UPDATE product
@inventory_bp.route("/products/<int:id>", methods=["PUT"])
def update_product(id):

    data = request.json

    conn = get_connection()
    cursor = conn.cursor()

    sql = """
    UPDATE products
    SET
        purchase_price=%s,
        selling_price=%s,
        stock=%s
    WHERE id=%s
    """

    values = (
        data["purchase_price"],
        data["selling_price"],
        data["stock"],
        id
    )

    cursor.execute(sql, values)

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message":"Product Updated"})
# DELETE product
@inventory_bp.route("/products/<int:id>", methods=["DELETE"])
def delete_product(id):

    conn = get_connection()

    cursor = conn.cursor()

    cursor.execute("DELETE FROM products WHERE id=%s",(id,))

    conn.commit()

    cursor.close()

    conn.close()

    return jsonify({"message":"Deleted Successfully"})