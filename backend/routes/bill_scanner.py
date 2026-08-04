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
Analyze this purchase bill image/document and extract all invoice details and line items (products) into JSON.

CRITICAL INSTRUCTIONS:
1. Read the EXACT volume/size for each item carefully (e.g. 650ml, 500ml, 330ml, 750ml, 180ml). Do NOT confuse 650ml with 500ml.
2. Put the full product name including volume in "product_name" (e.g. "KINGFISHER CAN 500ml" or "LONDON PILSNER BOTTLE 650ml").
3. Special brand & variant rules:
   - For all beer brands (e.g., London Pilsner, Kingfisher, Haywards, Tuborg, Carlsberg): "Mild", "Prem", "Premum", and "Premium" are synonymous.
   - If a bill lists "London Pilsner" without specifying a variant, treat it as "London Pilsner Premium" (the Mild/Prem/Premium variant).
   - Only label as "Strong" if the bill explicitly states "Strong" or "Super Strong".
4. For quantity:
   - Extract the number of cases/cartons listed on the bill into "carton_qty".
   - Extract the unit type (Case/Carton or Bottle/Can) into "unit_type".
   - Extract unit_price (price per case or price per unit as listed on bill) and total_price.
5. Extract tax & header breakdown:
   - Extract supplier / vendor business name into "supplier_name".
   - Extract bill / invoice number into "bill_number".
   - Extract bill / invoice date into "bill_date" (in YYYY-MM-DD or readable date string).
   - Extract MVAT (Maharashtra Value Added Tax or VAT amount) into "mvat_amount" (numeric or 0.00).
   - Extract TCS (Tax Collected at Source) into "tcs_amount" (numeric or 0.00).
   - Extract the ENTIRE total bill amount (including all taxes & charges) into "total_amount".

Return this exact JSON structure:
{
  "supplier_name": "supplier/vendor name from the bill or null",
  "bill_number": "invoice/bill number or null",
  "bill_date": "YYYY-MM-DD format or null",
  "mvat_amount": 0.00,
  "tcs_amount": 0.00,
  "total_amount": 0.00,
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
  ]
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


def normalize_beer_variant_name(name):
    """Normalize variant names across all brands (mild / prem / premum / premium -> premium)."""
    if not name:
        return ""
    n = name.lower()
    if "super strong" in n:
        n = n.replace("super strong", "strong")
    
    # Treat mild, prem, premum as premium for all brands
    words = n.split()
    norm_words = []
    for w in words:
        if w in ["mild", "prem", "premum"]:
            norm_words.append("premium")
        else:
            norm_words.append(w)
    n = " ".join(norm_words)

    # If London Pilsner has no variant specified (neither strong nor premium), default to premium
    if "london pilsner" in n and "strong" not in n and "premium" not in n:
        n = n.replace("london pilsner", "london pilsner premium")

    return n


def match_similar_products(extracted_items, shop_id):
    """
    Find existing candidate products from stock for each extracted line item.
    Do NOT directly auto-create products in the database during scanning.
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    matched_items = []

    try:
        # Fetch all existing products in remaining stock for this shop
        cursor.execute(
            """
            SELECT id, name, brand, category, purchase_price, selling_price, stock
            FROM products
            WHERE shop_id = %s
            """,
            (shop_id,)
        )
        existing_products = cursor.fetchall()

        for item in extracted_items:
            product_name = (item.get("product_name") or "").strip()
            if not product_name:
                continue

            brand = (item.get("brand") or "").strip()
            category = (item.get("category") or "Beer").strip()
            vol_str = (item.get("volume") or "").lower()

            p_name_lower = product_name.lower()
            norm_extracted_name = normalize_beer_variant_name(product_name)

            # Determine volume multiplier & size label
            if "650" in vol_str or "650" in p_name_lower:
                multiplier = 12
                volume_tag = "650"
                size_label = "650ml"
            elif "500" in vol_str or "500" in p_name_lower:
                multiplier = 24
                volume_tag = "500"
                size_label = "500ml"
            elif "330" in vol_str or "330" in p_name_lower:
                multiplier = 24
                volume_tag = "330"
                size_label = "330ml"
            elif "750" in vol_str or "750" in p_name_lower:
                multiplier = 12
                volume_tag = "750"
                size_label = "750ml"
            elif "180" in vol_str or "180" in p_name_lower:
                multiplier = 48
                volume_tag = "180"
                size_label = "180ml"
            else:
                multiplier = 12
                volume_tag = ""
                size_label = item.get("volume") or ""

            carton_qty = float(item.get("carton_qty") or item.get("quantity") or 1)
            unit_type = (item.get("unit_type") or "Case").strip().lower()

            # Calculate total unit quantity
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

            selling_price = round(per_unit_price * 1.3, 2) if per_unit_price > 0 else 0.0

            # Rank candidate products from existing inventory
            scored_candidates = []
            words = [w for w in norm_extracted_name.replace("-", " ").split() if len(w) > 2]

            for ep in existing_products:
                ep_name = (ep["name"] or "").lower()
                norm_ep_name = normalize_beer_variant_name(ep["name"])
                ep_brand = (ep["brand"] or "").lower()
                score = 0

                # Strict penalty if one is "strong" and the other is "premium/mild"
                is_extracted_strong = "strong" in norm_extracted_name
                is_ep_strong = "strong" in norm_ep_name
                if is_extracted_strong != is_ep_strong:
                    continue  # Skip mismatching Strong vs Mild/Premium variant

                if norm_ep_name == norm_extracted_name or ep_name == p_name_lower:
                    score += 100
                elif brand and ep_brand and brand.lower() in ep_brand:
                    score += 40
                    if volume_tag and volume_tag in ep_name:
                        score += 40

                # Keyword overlap match
                matching_words = [w for w in words if w in norm_ep_name or w in ep_name]
                score += len(matching_words) * 15

                if volume_tag and volume_tag in ep_name:
                    score += 15

                if score > 0:
                    scored_candidates.append({
                        "score": score,
                        "id": ep["id"],
                        "name": ep["name"],
                        "brand": ep["brand"] or "",
                        "category": ep["category"] or "Beer",
                        "purchase_price": float(ep["purchase_price"] or 0),
                        "selling_price": float(ep["selling_price"] or 0),
                        "stock": ep["stock"]
                    })

            # Sort by score descending
            scored_candidates.sort(key=lambda x: x["score"], reverse=True)
            top_similar = [{
                "id": c["id"],
                "name": c["name"],
                "brand": c["brand"],
                "category": c["category"],
                "purchase_price": c["purchase_price"],
                "selling_price": c["selling_price"],
                "stock": c["stock"]
            } for c in scored_candidates[:5]]

            best_match = top_similar[0] if top_similar and scored_candidates[0]["score"] >= 40 else None

            matched_items.append({
                "id": best_match["id"] if best_match else None,
                "name": best_match["name"] if best_match else product_name,
                "extracted_name": product_name,
                "brand": brand,
                "category": category,
                "volume": size_label,
                "carton_qty": carton_qty,
                "unit_type": unit_type,
                "quantity": total_qty,
                "purchase_price": per_unit_price if per_unit_price > 0 else (best_match["purchase_price"] if best_match else 0.0),
                "selling_price": best_match["selling_price"] if best_match else selling_price,
                "stock": best_match["stock"] if best_match else 0,
                "is_new": True if not best_match else False,
                "similar_products": top_similar
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

        # Match similar products from existing stock (does NOT create DB rows)
        matched_items = match_similar_products(
            extracted.get("items", []),
            shop_id
        )

        return jsonify({
            "success": True,
            "extracted": {
                "supplier_name": extracted.get("supplier_name"),
                "bill_number": extracted.get("bill_number") or extracted.get("invoice_no"),
                "bill_date": extracted.get("bill_date") or extracted.get("invoice_date"),
                "mvat_amount": float(extracted.get("mvat_amount") or 0.0),
                "tcs_amount": float(extracted.get("tcs_amount") or 0.0),
                "total_amount": float(extracted.get("total_amount") or 0.0),
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
