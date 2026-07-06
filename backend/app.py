from flask import Flask

from routes.inventory import inventory_bp
from routes.sales import sales_bp
from routes.auth import auth_bp

app = Flask(__name__)

app.register_blueprint(inventory_bp)
app.register_blueprint(sales_bp)
app.register_blueprint(auth_bp)

@app.route("/")
def home():
    return {
        "Project": "Beer Shop Management"
    }

if __name__ == "__main__":
    app.run(debug=True)