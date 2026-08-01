import os
from pathlib import Path
from dotenv import load_dotenv

base_dir = Path(__file__).resolve().parent
backend_env = base_dir / ".env"
root_env = base_dir.parent / ".env"

if backend_env.exists():
    load_dotenv(dotenv_path=backend_env)
elif root_env.exists():
    load_dotenv(dotenv_path=root_env)
else:
    load_dotenv()

def _safe_int(val, default):
    if val is None:
        return default
    val_str = str(val).strip()
    if not val_str:
        return default
    try:
        return int(val_str)
    except (ValueError, TypeError):
        return default

# Database Credentials
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "")
DB_PORT = _safe_int(os.getenv("DB_PORT"), 3306)

# Security & JWT Settings
SECRET_KEY = os.getenv("SECRET_KEY", "default_secret_key_change_in_prod")
JWT_EXPIRATION_HOURS = _safe_int(os.getenv("JWT_EXPIRATION_HOURS"), 12)

# Gemini AI Credentials
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Server Configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = _safe_int(os.getenv("PORT"), 5000)