from flask import Flask

from routes.inventory import inventory_bp
from routes.sales import sales_bp
from routes.auth import auth_bp
from routes.purchase import purchase_bp
from routes.dashboard import dashboard_bp
from routes.analytics import analytics_bp
from routes.products import products_bp
from routes.customer import customers_bp
from routes.supplier import supplier_bp
from routes.report import report_bp
from routes.users import users_bp
from routes.invoice import invoice_bp
from routes.cash_register import cash_register_bp
from routes.supplier_bills import supplier_bills_bp
from routes.expenses import expenses_bp
from routes.shops import shops_bp
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

app.register_blueprint(inventory_bp)
app.register_blueprint(sales_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(purchase_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(analytics_bp)
app.register_blueprint(products_bp)
app.register_blueprint(customers_bp)
app.register_blueprint(supplier_bp)
app.register_blueprint(report_bp)
app.register_blueprint(users_bp)
app.register_blueprint(invoice_bp)
app.register_blueprint(cash_register_bp)
app.register_blueprint(supplier_bills_bp)
app.register_blueprint(expenses_bp)
app.register_blueprint(shops_bp)


@app.route("/")
def home():
    return {
        "Project": "Beer Shop Management"
    }

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)