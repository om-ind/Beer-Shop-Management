import io
import csv
from flask import Blueprint, request, jsonify, g, Response
from database import get_connection
from utils.auth_middleware import token_required

excise_bp = Blueprint("excise", __name__)

LIQUOR_TYPES = ("Beer", "IMFL", "Wine", "Country Liquor", "Foreign Liquor")


def _shop_id():
    role = g.user.get("role")
    sid = g.user.get("shop_id")
    if role == "Admin":
        return request.args.get("shop_id", type=int) or sid or 1
    return sid or 1


# ═══════════════════════════════════════════════════
# BRAND REGISTER
# ═══════════════════════════════════════════════════

@excise_bp.route("/excise/brand-register", methods=["GET"])
@token_required
def get_brand_register():
    """All products with excise fields, grouped/filtered by liquor_type."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    shop_id = _shop_id()
    liquor_type = request.args.get("liquor_type", "")

    params = []
    filters = []

    if shop_id:
        filters.append("shop_id = %s")
        params.append(shop_id)

    if liquor_type and liquor_type in LIQUOR_TYPES:
        filters.append("liquor_type = %s")
        params.append(liquor_type)

    where = ("WHERE " + " AND ".join(filters)) if filters else ""

    try:
        cursor.execute(f"""
            SELECT id, barcode, name, brand, category,
                   excise_code, pack_size_ml, liquor_type,
                   stock, selling_price
            FROM products
            {where}
            ORDER BY liquor_type, brand, name
        """, params)
        rows = cursor.fetchall()
        for r in rows:
            r["selling_price"] = float(r["selling_price"] or 0)
        return jsonify(rows)
    finally:
        cursor.close()
        conn.close()


@excise_bp.route("/excise/brand-register/<int:product_id>", methods=["PUT"])
@token_required
def update_brand_register(product_id):
    """Update excise metadata on a product."""
    data = request.get_json()
    excise_code  = data.get("excise_code", "").strip() or None
    pack_size_ml = data.get("pack_size_ml")
    liquor_type  = data.get("liquor_type", "").strip() or None

    if liquor_type and liquor_type not in LIQUOR_TYPES:
        return jsonify({"error": f"Invalid liquor_type. Must be one of: {LIQUOR_TYPES}"}), 400

    if pack_size_ml is not None:
        try:
            pack_size_ml = int(pack_size_ml)
        except (ValueError, TypeError):
            return jsonify({"error": "pack_size_ml must be an integer"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE products
            SET excise_code=%s, pack_size_ml=%s, liquor_type=%s
            WHERE id=%s
        """, (excise_code, pack_size_ml, liquor_type, product_id))
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ═══════════════════════════════════════════════════
# DAILY STATUTORY SALES REGISTER (DSR)
# ═══════════════════════════════════════════════════

def _build_dsr(conn, shop_id, sale_date):
    """
    Compute the DSR for a shop+date.
    1. Get all products with sales OR purchases on that date.
    2. Check daily_sales_register for any persisted/manual entry.
    3. If persisted → return it. If not → compute on-the-fly.
    """
    cursor = conn.cursor(dictionary=True)

    # Products with movement on this date
    cursor.execute("""
        SELECT DISTINCT p.id, p.name, p.brand, p.excise_code,
                        p.pack_size_ml, p.liquor_type
        FROM products p
        WHERE p.shop_id = %s
          AND (
              EXISTS (
                  SELECT 1 FROM sale_items si
                  JOIN sales s ON s.id = si.sale_id
                  WHERE si.product_id = p.id
                    AND DATE(s.sale_date) = %s
                    AND s.shop_id = %s
              )
              OR
              EXISTS (
                  SELECT 1 FROM purchase_items pi
                  JOIN purchases pu ON pu.id = pi.purchase_id
                  WHERE pi.product_id = p.id
                    AND DATE(pu.purchase_date) = %s
                    AND pu.shop_id = %s
              )
          )
        ORDER BY p.liquor_type, p.brand, p.name
    """, (shop_id, sale_date, shop_id, sale_date, shop_id))
    products = cursor.fetchall()

    result = []

    for p in products:
        pid = p["id"]

        # Check persisted entry
        cursor.execute("""
            SELECT * FROM daily_sales_register
            WHERE shop_id=%s AND product_id=%s AND sale_date=%s
        """, (shop_id, pid, sale_date))
        persisted = cursor.fetchone()

        if persisted:
            row = dict(persisted)
            row["sale_date"] = str(row["sale_date"])
        else:
            # Compute qty sold
            cursor.execute("""
                SELECT IFNULL(SUM(si.quantity),0) AS qty_sold,
                       IFNULL(SUM(si.quantity * si.price),0) AS sale_value
                FROM sale_items si
                JOIN sales s ON s.id = si.sale_id
                WHERE si.product_id=%s AND DATE(s.sale_date)=%s AND s.shop_id=%s
            """, (pid, sale_date, shop_id))
            sold_row = cursor.fetchone()
            qty_sold   = int(sold_row["qty_sold"])
            sale_value = float(sold_row["sale_value"])

            # Compute qty received (purchases)
            cursor.execute("""
                SELECT IFNULL(SUM(pi.quantity),0) AS qty_received
                FROM purchase_items pi
                JOIN purchases pu ON pu.id = pi.purchase_id
                WHERE pi.product_id=%s AND DATE(pu.purchase_date)=%s AND pu.shop_id=%s
            """, (pid, sale_date, shop_id))
            qty_received = int(cursor.fetchone()["qty_received"])

            # Opening = prior day closing (use current stock as fallback)
            cursor.execute("""
                SELECT closing_stock FROM daily_sales_register
                WHERE shop_id=%s AND product_id=%s AND sale_date < %s
                ORDER BY sale_date DESC LIMIT 1
            """, (shop_id, pid, sale_date))
            prior = cursor.fetchone()
            if prior:
                opening_stock = int(prior["closing_stock"])
            else:
                # Estimate: current stock + sold today - received today
                cursor.execute("SELECT stock FROM products WHERE id=%s", (pid,))
                current_stock = cursor.fetchone()["stock"]
                opening_stock = current_stock + qty_sold - qty_received

            closing_stock = opening_stock + qty_received - qty_sold

            row = {
                "product_id":    pid,
                "sale_date":     str(sale_date),
                "opening_stock": opening_stock,
                "qty_received":  qty_received,
                "qty_sold":      qty_sold,
                "closing_stock": closing_stock,
                "sale_value":    sale_value,
                "is_locked":     0,
            }

        row["name"]        = p["name"]
        row["brand"]       = p["brand"]
        row["excise_code"] = p["excise_code"]
        row["pack_size_ml"] = p["pack_size_ml"]
        row["liquor_type"] = p["liquor_type"]
        row["sale_value"]  = float(row["sale_value"])
        result.append(row)

    cursor.close()
    return result


@excise_bp.route("/excise/daily-register", methods=["GET"])
@token_required
def get_daily_register():
    """DSR for a given date. Auto-computed from sales+purchases if not persisted."""
    from datetime import date as date_cls
    sale_date = request.args.get("date", str(date_cls.today()))
    shop_id   = _shop_id()

    if not shop_id:
        return jsonify({"error": "shop_id required"}), 400

    conn = get_connection()
    try:
        rows = _build_dsr(conn, shop_id, sale_date)
        return jsonify({"date": sale_date, "rows": rows})
    finally:
        conn.close()


@excise_bp.route("/excise/daily-register/save", methods=["POST"])
@token_required
def save_daily_register():
    """Persist manual corrections to a DSR row."""
    data       = request.get_json()
    shop_id    = _shop_id()
    sale_date  = data.get("sale_date")
    product_id = data.get("product_id")

    if not all([shop_id, sale_date, product_id]):
        return jsonify({"error": "shop_id, sale_date, product_id required"}), 400

    # Check not locked
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT is_locked FROM daily_sales_register
            WHERE shop_id=%s AND product_id=%s AND sale_date=%s
        """, (shop_id, product_id, sale_date))
        existing = cursor.fetchone()
        if existing and existing["is_locked"]:
            return jsonify({"error": "This day's register is locked"}), 403

        opening = data.get("opening_stock", 0)
        received = data.get("qty_received", 0)
        sold     = data.get("qty_sold", 0)
        closing  = opening + received - sold
        value    = data.get("sale_value", 0)

        cursor.execute("""
            INSERT INTO daily_sales_register
                (shop_id, product_id, sale_date, opening_stock, qty_received, qty_sold, closing_stock, sale_value)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            ON DUPLICATE KEY UPDATE
                opening_stock=VALUES(opening_stock),
                qty_received=VALUES(qty_received),
                qty_sold=VALUES(qty_sold),
                closing_stock=VALUES(closing_stock),
                sale_value=VALUES(sale_value)
        """, (shop_id, product_id, sale_date, opening, received, sold, closing, value))
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@excise_bp.route("/excise/daily-register/lock", methods=["POST"])
@token_required
def lock_daily_register():
    """Lock all rows for a given date — prevents further editing."""
    from datetime import date as date_cls
    data      = request.get_json()
    shop_id   = _shop_id()
    sale_date = data.get("date", str(date_cls.today()))

    if not shop_id:
        return jsonify({"error": "shop_id required"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # First persist any unpersisted rows
        rows = _build_dsr(conn, shop_id, sale_date)
        cursor2 = conn.cursor()
        for row in rows:
            cursor2.execute("""
                INSERT INTO daily_sales_register
                    (shop_id, product_id, sale_date, opening_stock, qty_received, qty_sold, closing_stock, sale_value, is_locked)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,1)
                ON DUPLICATE KEY UPDATE
                    opening_stock=VALUES(opening_stock),
                    qty_received=VALUES(qty_received),
                    qty_sold=VALUES(qty_sold),
                    closing_stock=VALUES(closing_stock),
                    sale_value=VALUES(sale_value),
                    is_locked=1
            """, (shop_id, row["product_id"], sale_date,
                  row["opening_stock"], row["qty_received"],
                  row["qty_sold"], row["closing_stock"], row["sale_value"]))
        conn.commit()
        cursor2.close()
        return jsonify({"success": True, "message": f"Register locked for {sale_date}"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ═══════════════════════════════════════════════════
# MONTHLY EXCISE STATEMENT
# ═══════════════════════════════════════════════════

def _monthly_statement_rows(conn, shop_id, month, year):
    """
    For each product with movement in month/year:
    opening = closing stock of last day of prior month
    total_purchased = sum purchases that month
    total_sold = sum sales that month
    closing = opening + purchased - sold
    excise_value = total sold × selling_price
    """
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT DISTINCT p.id, p.name, p.brand, p.category,
                        p.excise_code, p.pack_size_ml, p.liquor_type,
                        p.selling_price
        FROM products p
        WHERE p.shop_id = %s
          AND (
              EXISTS (
                  SELECT 1 FROM sale_items si
                  JOIN sales s ON s.id = si.sale_id
                  WHERE si.product_id = p.id
                    AND MONTH(s.sale_date)=%s AND YEAR(s.sale_date)=%s
                    AND s.shop_id=%s
              )
              OR EXISTS (
                  SELECT 1 FROM purchase_items pi
                  JOIN purchases pu ON pu.id = pi.purchase_id
                  WHERE pi.product_id = p.id
                    AND MONTH(pu.purchase_date)=%s AND YEAR(pu.purchase_date)=%s
                    AND pu.shop_id=%s
              )
          )
        ORDER BY p.liquor_type, p.brand, p.name
    """, (shop_id, month, year, shop_id, month, year, shop_id))
    products = cursor.fetchall()

    rows = []
    for p in products:
        pid = p["id"]
        selling_price = float(p["selling_price"] or 0)

        # Opening: closing stock of last day of prior month (from DSR if available)
        cursor.execute("""
            SELECT closing_stock FROM daily_sales_register
            WHERE shop_id=%s AND product_id=%s
              AND sale_date < DATE(CONCAT(%s,'-',%s,'-01'))
            ORDER BY sale_date DESC LIMIT 1
        """, (shop_id, pid, year, str(month).zfill(2)))
        prior = cursor.fetchone()
        opening_stock = int(prior["closing_stock"]) if prior else 0

        # Total purchased this month
        cursor.execute("""
            SELECT IFNULL(SUM(pi.quantity),0) AS total_purchased
            FROM purchase_items pi
            JOIN purchases pu ON pu.id = pi.purchase_id
            WHERE pi.product_id=%s
              AND MONTH(pu.purchase_date)=%s AND YEAR(pu.purchase_date)=%s
              AND pu.shop_id=%s
        """, (pid, month, year, shop_id))
        total_purchased = int(cursor.fetchone()["total_purchased"])

        # Total sold this month
        cursor.execute("""
            SELECT IFNULL(SUM(si.quantity),0) AS total_sold,
                   IFNULL(SUM(si.quantity * si.price),0) AS sale_value
            FROM sale_items si
            JOIN sales s ON s.id = si.sale_id
            WHERE si.product_id=%s
              AND MONTH(s.sale_date)=%s AND YEAR(s.sale_date)=%s
              AND s.shop_id=%s
        """, (pid, month, year, shop_id))
        sold_row    = cursor.fetchone()
        total_sold  = int(sold_row["total_sold"])
        sale_value  = float(sold_row["sale_value"])
        closing_stock = opening_stock + total_purchased - total_sold

        rows.append({
            "product_id":      pid,
            "name":            p["name"],
            "brand":           p["brand"],
            "category":        p["category"],
            "excise_code":     p["excise_code"] or "",
            "pack_size_ml":    p["pack_size_ml"],
            "liquor_type":     p["liquor_type"] or "",
            "selling_price":   selling_price,
            "opening_stock":   opening_stock,
            "total_purchased": total_purchased,
            "total_sold":      total_sold,
            "closing_stock":   closing_stock,
            "sale_value":      round(sale_value, 2),
        })

    cursor.close()
    return rows


@excise_bp.route("/excise/monthly-statement", methods=["GET"])
@token_required
def monthly_statement():
    """Monthly excise summary: opening + purchases - sales = closing."""
    from datetime import date as date_cls
    today = date_cls.today()
    month   = int(request.args.get("month", today.month))
    year    = int(request.args.get("year",  today.year))
    shop_id = _shop_id()

    if not shop_id:
        return jsonify({"error": "shop_id required"}), 400

    conn = get_connection()
    try:
        rows = _monthly_statement_rows(conn, shop_id, month, year)
        totals = {
            "total_purchased": sum(r["total_purchased"] for r in rows),
            "total_sold":      sum(r["total_sold"] for r in rows),
            "sale_value":      round(sum(r["sale_value"] for r in rows), 2),
        }
        return jsonify({"month": month, "year": year, "rows": rows, "totals": totals})
    finally:
        conn.close()


@excise_bp.route("/excise/monthly-statement/export", methods=["GET"])
@token_required
def export_monthly_statement():
    """Download monthly excise statement as CSV."""
    from datetime import date as date_cls
    import calendar
    today   = date_cls.today()
    month   = int(request.args.get("month", today.month))
    year    = int(request.args.get("year",  today.year))
    shop_id = _shop_id()

    if not shop_id:
        return jsonify({"error": "shop_id required"}), 400

    conn = get_connection()
    try:
        rows = _monthly_statement_rows(conn, shop_id, month, year)
    finally:
        conn.close()

    month_name = calendar.month_name[month]
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([f"Monthly Excise Statement — {month_name} {year}"])
    writer.writerow([])
    writer.writerow([
        "Sr No", "Brand", "Product Name", "Excise Code",
        "Pack Size (ml)", "Liquor Type", "Category",
        "Opening Stock", "Purchased", "Sold", "Closing Stock",
        "Sale Value (₹)"
    ])

    for i, r in enumerate(rows, 1):
        writer.writerow([
            i,
            r["brand"],
            r["name"],
            r["excise_code"],
            r["pack_size_ml"] or "",
            r["liquor_type"],
            r["category"],
            r["opening_stock"],
            r["total_purchased"],
            r["total_sold"],
            r["closing_stock"],
            f"{r['sale_value']:.2f}",
        ])

    writer.writerow([])
    writer.writerow([
        "", "", "", "", "", "", "TOTAL", "",
        sum(r["total_purchased"] for r in rows),
        sum(r["total_sold"] for r in rows),
        "",
        f"{sum(r['sale_value'] for r in rows):.2f}",
    ])

    csv_bytes = output.getvalue().encode("utf-8-sig")  # BOM for Excel
    filename  = f"excise_statement_{year}_{str(month).zfill(2)}.csv"

    return Response(
        csv_bytes,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
