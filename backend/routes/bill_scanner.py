import os
import json
import traceback
from flask import Blueprint, request, jsonify, g
from werkzeug.utils import secure_filename
from database import get_connection
from config import GEMINI_API_KEY
from utils.auth_middleware import token_required

bill_scanner_bp = Blueprint("bill_scanner", __name__)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads", "bills")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "pdf"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


EXTRACTION_PROMPT = """You are a bill/invoice data extraction assistant for an Indian beer and liquor shop.
Analyze this purchase bill image/document and extract all line items (products) into JSON.

CRITICAL INSTRUCTIONS:
1. Read the EXACT volume for each item carefully (e.g. 650ml, 500ml, 330ml, 750ml, 180ml). Do NOT confuse 650ml with 500ml.
2. Put the full product name including volume in "product_name" (e.g. "KINGFISHER CAN 500ml" or "LONDON PILSNER BOTTLE 650ml").
3. For quantity:
   - Extract the number of cases/cartons listed on the bill into "carton_qty".
   - Extract the unit type (Case/Carton or Bottle/Can) into "unit_type".
   - Extract unit_price (price per case or price per unit as listed on bill) and total_price.

Return this exact JSON structure:
{
  "supplier_name": "supplier/vendor name from the bill or null",
  "bill_number": "invoice/bill number or null",
  "bill_date": "YYYY-MM-DD format or null",
  "items": [
    {
      "product_name": "full product name with volume (e.g. KINGFISHER CAN 500ml)",
      "brand": "brand name (e.g. Kingfisher, London Pilsner)",
      "volume": "500ml or 650ml or 330ml or 750ml",
      "category": "Beer/Whisky/Rum/Vodka/Wine/Other",
      "carton_qty": 1,
      "unit_type": "Case",
      "unit_price": 0.00,
      "total_price": 0.00
    }
  ],
  "total_amount": 0.00
}"""


def get_mime_type(filepath):
    ext = filepath.rsplit(".", 1)[1].lower() if "." in filepath else ""
    if ext == "pdf":
        return "application/pdf"
    elif ext in ["jpg", "jpeg"]:
        return "image/jpeg"
    elif ext == "png":
        return "image/png"
    elif ext == "webp":
        return "image/webp"
    return "image/jpeg"


def extract_with_gemini(filepath):
    """Send image/PDF to Gemini API and extract bill data."""
    import time
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=GEMINI_API_KEY)

    mime_type = get_mime_type(filepath)
    with open(filepath, "rb") as f:
        file_bytes = f.read()

    file_part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type)

    # Try models with active free tier quotas
    models = ["gemini-flash-latest", "gemini-flash-lite-latest", "gemini-2.0-flash-001"]
    last_error = None

    for model_name in models:
        for attempt in range(2):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=[file_part, EXTRACTION_PROMPT],
                )

                # Parse the response text as JSON
                text = response.text.strip()

                # Strip markdown code fences if present
                if text.startswith("```"):
                    lines = text.split("\n")
                    lines = [l for l in lines if not l.strip().startswith("```")]
                    text = "\n".join(lines).strip()

                return json.loads(text)

            except Exception as e:
                last_error = e
                error_str = str(e)
                # Rate limit or 503 high demand spike — retry after brief delay
                if any(code in error_str for code in ["429", "RESOURCE_EXHAUSTED", "503", "UNAVAILABLE"]):
                    if attempt < 2:
                        time.sleep(2 * (attempt + 1))
                        continue
                    else:
                        break  # Try next model
                # Model not found — skip immediately
                elif "404" in error_str or "NOT_FOUND" in error_str:
                    break
                else:
                    raise

    raise last_error or Exception("All models failed")


def match_or_create_products(extracted_items, shop_id):
    """
    For each extracted item, convert carton quantity to bottle/can count (500ml -> x24, 650ml -> x12),
    then try to match existing product by exact volume. Auto-create if not found.
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    matched_items = []

    try:
        for item in extracted_items:
            product_name = (item.get("product_name") or "").strip()
            if not product_name:
                continue

            brand = (item.get("brand") or "").strip()
            category = (item.get("category") or "Beer").strip()
            vol_str = (item.get("volume") or "").lower()
            p_name_lower = product_name.lower()

            # Determine multiplier (500ml/330ml -> 24 per carton, 650ml/750ml -> 12 per carton)
            if "650" in vol_str or "650" in p_name_lower:
                multiplier = 12
                volume_tag = "650ml"
            elif "500" in vol_str or "500" in p_name_lower:
                multiplier = 24
                volume_tag = "500ml"
            elif "330" in vol_str or "330" in p_name_lower:
                multiplier = 24
                volume_tag = "330ml"
            elif "750" in vol_str or "750" in p_name_lower:
                multiplier = 12
                volume_tag = "750ml"
            elif "180" in vol_str or "180" in p_name_lower:
                multiplier = 48
                volume_tag = "180ml"
            else:
                multiplier = 12
                volume_tag = ""

            carton_qty = float(item.get("carton_qty") or item.get("quantity") or 1)
            unit_type = (item.get("unit_type") or "Case").strip().lower()

            # Calculate total bottle/can quantity
            if "bottle" not in unit_type and "can" not in unit_type and "unit" not in unit_type:
                total_qty = int(round(carton_qty * multiplier))
            else:
                total_qty = int(round(carton_qty))

            total_qty = max(total_qty, 1)

            # Calculate per-unit purchase price
            total_price = float(item.get("total_price") or 0)
            raw_unit_price = float(item.get("unit_price") or 0)

            if total_price > 0:
                per_unit_price = round(total_price / total_qty, 2)
            elif raw_unit_price > 0 and ("bottle" in unit_type or "can" in unit_type):
                per_unit_price = round(raw_unit_price, 2)
            elif raw_unit_price > 0:
                per_unit_price = round((raw_unit_price * carton_qty) / total_qty, 2)
            else:
                per_unit_price = 0.0

            # Step 1: Try exact product name match
            cursor.execute(
                """
                SELECT id, name, brand, category, purchase_price, selling_price, stock
                FROM products
                WHERE shop_id = %s AND LOWER(name) = LOWER(%s)
                LIMIT 1
                """,
                (shop_id, product_name)
            )
            existing = cursor.fetchone()

            # Step 2: Try match by brand + volume tag if available
            if not existing and volume_tag and brand:
                cursor.execute(
                    """
                    SELECT id, name, brand, category, purchase_price, selling_price, stock
                    FROM products
                    WHERE shop_id = %s AND LOWER(name) LIKE %s AND LOWER(name) LIKE %s
                    LIMIT 1
                    """,
                    (shop_id, f"%{brand.lower()}%", f"%{volume_tag.lower()}%")
                )
                existing = cursor.fetchone()

            if existing:
                matched_items.append({
                    "id": existing["id"],
                    "name": existing["name"],
                    "brand": existing["brand"] or brand,
                    "category": existing["category"] or category,
                    "quantity": total_qty,
                    "purchase_price": per_unit_price if per_unit_price > 0 else float(existing["purchase_price"]),
                    "selling_price": float(existing["selling_price"]),
                    "stock": existing["stock"],
                    "is_new": False,
                })
            else:
                # Auto-create new product with exact volume in name
                selling_price = round(per_unit_price * 1.3, 2) if per_unit_price > 0 else 0
                cursor.execute(
                    """
                    INSERT INTO products (name, brand, category, purchase_price, selling_price, stock, minimum_stock, shop_id)
                    VALUES (%s, %s, %s, %s, %s, 0, 10, %s)
                    """,
                    (product_name, brand, category, per_unit_price, selling_price, shop_id)
                )
                conn.commit()
                new_id = cursor.lastrowid

                matched_items.append({
                    "id": new_id,
                    "name": product_name,
                    "brand": brand,
                    "category": category,
                    "quantity": total_qty,
                    "purchase_price": per_unit_price,
                    "selling_price": selling_price,
                    "stock": 0,
                    "is_new": True,
                })

        return matched_items

    finally:
        cursor.close()
        conn.close()


@bill_scanner_bp.route("/purchases/scan-bill", methods=["POST"])
@token_required
def scan_bill():
    """Upload a bill image/PDF and extract purchase data using Gemini AI."""

    if not GEMINI_API_KEY:
        return jsonify({
            "success": False,
            "message": "Gemini API key is not configured. Add your key to backend/config.py"
        }), 500

    if "file" not in request.files:
        return jsonify({"success": False, "message": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"success": False, "message": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({
            "success": False,
            "message": f"File type not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        }), 400

    # Save file
    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_DIR, filename)
    file.save(filepath)

    try:
        # Extract data using Gemini
        extracted = extract_with_gemini(filepath)

        # Get shop_id from authenticated user
        shop_id = g.user.get("shop_id") or 1

        # Match/create products in database
        matched_items = match_or_create_products(
            extracted.get("items", []),
            shop_id
        )

        return jsonify({
            "success": True,
            "extracted": {
                "supplier_name": extracted.get("supplier_name"),
                "bill_number": extracted.get("bill_number"),
                "bill_date": extracted.get("bill_date"),
                "total_amount": extracted.get("total_amount"),
                "items": matched_items,
            }
        })

    except json.JSONDecodeError:
        return jsonify({
            "success": False,
            "message": "Could not parse AI response. Try a clearer image."
        }), 422

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": f"Extraction failed: {str(e)}"
        }), 500
