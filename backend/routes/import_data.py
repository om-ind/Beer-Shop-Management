import io
import math
import pandas as pd
from flask import Blueprint, request, jsonify, g, Response, send_file
from database import get_connection
from utils.auth_middleware import token_required

import_bp = Blueprint("import_data", __name__)


def _shop_id():
    role = g.user.get("role")
    if role == "Admin":
        return request.args.get("shop_id", type=int) or g.user.get("shop_id")
    return g.user.get("shop_id")


def _clean(val):
    """Convert NaN / None to None for MySQL."""
    if val is None:
        return None
    try:
        if math.isnan(float(val)):
            return None
    except (TypeError, ValueError):
        pass
    return val if str(val).strip() != "" else None


# ═══════════════════════════════════════════════════
# TEMPLATE DOWNLOADS
# ═══════════════════════════════════════════════════

PRODUCT_COLS = [
    "name", "brand", "category", "barcode",
    "purchase_price", "selling_price", "stock", "minimum_stock",
    "expiry_date",                          # YYYY-MM-DD or blank
    "excise_code", "pack_size_ml",
    "liquor_type",                           # Beer / IMFL / Wine / Country Liquor / Foreign Liquor
]

CUSTOMER_COLS = ["name", "mobile", "address", "credit_balance"]

SUPPLIER_COLS = ["name", "mobile", "company", "address"]


def _make_template(columns, sheet_name, notes):
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df = pd.DataFrame(columns=columns)
        df.to_excel(writer, index=False, sheet_name=sheet_name)

        # Notes sheet
        notes_df = pd.DataFrame({"Notes": notes})
        notes_df.to_excel(writer, index=False, sheet_name="Notes")

        # Auto-width columns
        ws = writer.sheets[sheet_name]
        for col in ws.columns:
            max_len = max(len(str(cell.value or "")) for cell in col) + 4
            ws.column_dimensions[col[0].column_letter].width = min(max_len, 40)

    buf.seek(0)
    return buf


@import_bp.route("/import/template/products", methods=["GET"])
@token_required
def template_products():
    notes = [
        "Fill one product per row. Only 'name' is required.",
        "category: e.g. Beer, Whisky, Wine, Gin, Rum, Vodka",
        "liquor_type: Beer | IMFL | Wine | Country Liquor | Foreign Liquor",
        "expiry_date format: YYYY-MM-DD  (leave blank if none)",
        "pack_size_ml: bottle size in ml, e.g. 650, 330, 750",
        "excise_code: your state excise brand code (if known)",
        "purchase_price / selling_price: numbers only, no ₹ symbol",
        "stock / minimum_stock: whole numbers",
    ]
    buf = _make_template(PRODUCT_COLS, "Products", notes)
    return send_file(buf, mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                     as_attachment=True, download_name="products_template.xlsx")


@import_bp.route("/import/template/customers", methods=["GET"])
@token_required
def template_customers():
    notes = [
        "Fill one customer per row. Only 'name' is required.",
        "mobile: 10-digit number",
        "credit_balance: leave 0 for new customers",
    ]
    buf = _make_template(CUSTOMER_COLS, "Customers", notes)
    return send_file(buf, mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                     as_attachment=True, download_name="customers_template.xlsx")


@import_bp.route("/import/template/suppliers", methods=["GET"])
@token_required
def template_suppliers():
    notes = [
        "Fill one supplier per row. Only 'name' is required.",
        "company: distributor / company name",
    ]
    buf = _make_template(SUPPLIER_COLS, "Suppliers", notes)
    return send_file(buf, mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                     as_attachment=True, download_name="suppliers_template.xlsx")


# ═══════════════════════════════════════════════════
# PREVIEW (parse + validate, no DB write)
# ═══════════════════════════════════════════════════

def _read_file(file):
    name = file.filename.lower()
    if name.endswith(".xlsx") or name.endswith(".xls"):
        return pd.read_excel(file, dtype=str)
    elif name.endswith(".csv"):
        return pd.read_csv(file, dtype=str)
    return None


def _validate_products(df):
    rows, errors = [], []
    for i, row in df.iterrows():
        r = row.to_dict()
        n = i + 2  # Excel row number (1=header)
        name = str(r.get("name", "") or "").strip()
        if not name:
            errors.append({"row": n, "field": "name", "message": "Name is required"})
            continue

        ltype = str(r.get("liquor_type", "") or "").strip()
        valid_types = ("Beer", "IMFL", "Wine", "Country Liquor", "Foreign Liquor", "")
        if ltype and ltype not in valid_types:
            errors.append({"row": n, "field": "liquor_type",
                           "message": f"Must be one of: {', '.join(t for t in valid_types if t)}"})

        rows.append({
            "name":           name,
            "brand":          str(r.get("brand", "") or "").strip() or None,
            "category":       str(r.get("category", "") or "").strip() or None,
            "barcode":        str(r.get("barcode", "") or "").strip() or None,
            "purchase_price": _clean(r.get("purchase_price")),
            "selling_price":  _clean(r.get("selling_price")),
            "stock":          int(float(r.get("stock") or 0)),
            "minimum_stock":  int(float(r.get("minimum_stock") or 0)),
            "expiry_date":    str(r.get("expiry_date", "") or "").strip() or None,
            "excise_code":    str(r.get("excise_code", "") or "").strip() or None,
            "pack_size_ml":   int(float(r.get("pack_size_ml"))) if _clean(r.get("pack_size_ml")) else None,
            "liquor_type":    ltype or None,
        })
    return rows, errors


def _validate_customers(df):
    rows, errors = [], []
    for i, row in df.iterrows():
        r = row.to_dict()
        n = i + 2
        name = str(r.get("name", "") or "").strip()
        if not name:
            errors.append({"row": n, "field": "name", "message": "Name is required"})
            continue
        rows.append({
            "name":           name,
            "mobile":         str(r.get("mobile", "") or "").strip() or None,
            "address":        str(r.get("address", "") or "").strip() or None,
            "credit_balance": float(r.get("credit_balance") or 0),
        })
    return rows, errors


def _validate_suppliers(df):
    rows, errors = [], []
    for i, row in df.iterrows():
        r = row.to_dict()
        n = i + 2
        name = str(r.get("name", "") or "").strip()
        if not name:
            errors.append({"row": n, "field": "name", "message": "Name is required"})
            continue
        rows.append({
            "name":    name,
            "mobile":  str(r.get("mobile", "") or "").strip() or None,
            "company": str(r.get("company", "") or "").strip() or None,
            "address": str(r.get("address", "") or "").strip() or None,
        })
    return rows, errors


@import_bp.route("/import/preview/<entity>", methods=["POST"])
@token_required
def preview(entity):
    """Parse file and return rows + validation errors without writing to DB."""
    if entity not in ("products", "customers", "suppliers"):
        return jsonify({"error": "Invalid entity"}), 400

    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    df = _read_file(file)
    if df is None:
        return jsonify({"error": "Unsupported file type. Upload .xlsx or .csv"}), 400

    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
    df = df.dropna(how="all")

    validators = {
        "products":  _validate_products,
        "customers": _validate_customers,
        "suppliers": _validate_suppliers,
    }
    rows, errors = validators[entity](df)

    return jsonify({
        "entity":     entity,
        "total_rows": len(rows),
        "rows":       rows[:200],  # cap preview at 200
        "errors":     errors,
    })


# ═══════════════════════════════════════════════════
# IMPORT (write to DB)
# ═══════════════════════════════════════════════════

@import_bp.route("/import/commit/<entity>", methods=["POST"])
@token_required
def commit_import(entity):
    """Accepts the validated rows JSON and inserts into DB."""
    if entity not in ("products", "customers", "suppliers"):
        return jsonify({"error": "Invalid entity"}), 400

    shop_id = _shop_id()
    if not shop_id and entity != "suppliers":
        return jsonify({"error": "shop_id required"}), 400

    data = request.get_json()
    rows = data.get("rows", [])
    if not rows:
        return jsonify({"error": "No rows to import"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    inserted = 0
    skipped  = 0
    skip_log = []

    try:
        if entity == "products":
            for r in rows:
                try:
                    cursor.execute("""
                        INSERT INTO products
                            (name, brand, category, barcode, purchase_price, selling_price,
                             stock, minimum_stock, expiry_date, excise_code, pack_size_ml,
                             liquor_type, shop_id)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    """, (
                        r["name"], r["brand"], r["category"], r["barcode"],
                        r["purchase_price"], r["selling_price"],
                        r["stock"], r["minimum_stock"], r["expiry_date"],
                        r["excise_code"], r["pack_size_ml"], r["liquor_type"],
                        shop_id,
                    ))
                    inserted += 1
                except Exception as e:
                    skipped += 1
                    skip_log.append({"name": r.get("name"), "reason": str(e)[:80]})

        elif entity == "customers":
            for r in rows:
                try:
                    cursor.execute("""
                        INSERT INTO customers (name, mobile, address, credit_balance, shop_id)
                        VALUES (%s,%s,%s,%s,%s)
                    """, (r["name"], r["mobile"], r["address"], r["credit_balance"], shop_id))
                    inserted += 1
                except Exception as e:
                    skipped += 1
                    skip_log.append({"name": r.get("name"), "reason": str(e)[:80]})

        elif entity == "suppliers":
            sid = shop_id or g.user.get("shop_id") or 1
            for r in rows:
                try:
                    cursor.execute("""
                        INSERT INTO suppliers (name, mobile, company, address, shop_id)
                        VALUES (%s,%s,%s,%s,%s)
                    """, (r["name"], r["mobile"], r["company"], r["address"], sid))
                    inserted += 1
                except Exception as e:
                    skipped += 1
                    skip_log.append({"name": r.get("name"), "reason": str(e)[:80]})

        conn.commit()
        return jsonify({
            "success":  True,
            "inserted": inserted,
            "skipped":  skipped,
            "skip_log": skip_log,
        })

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()
