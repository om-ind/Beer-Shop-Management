import mysql.connector
from mysql.connector import pooling, errors as _errors
from config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT

_pool = None

def _get_pool():
    global _pool
    if _pool is not None:
        return _pool
    try:
        _pool = pooling.MySQLConnectionPool(
            pool_name="beer_shop_pool",
            pool_size=32,
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            buffered=True,
            connection_timeout=5,
        )
    except Exception:
        # Pool with this name already exists or failed to create
        pass
    return _pool


def get_connection():
    pool = _get_pool()
    if pool is not None:
        try:
            return pool.get_connection()
        except _errors.PoolError:
            # Pool exhausted fallback to direct connection
            pass
        except Exception:
            pass

    # Direct connection fallback
    return mysql.connector.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        buffered=True,
        connection_timeout=5,
    )