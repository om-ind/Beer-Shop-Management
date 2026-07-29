import urllib.request
import json

BASE_URL = "http://127.0.0.1:5000"

def make_req(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    req_data = None
    if data:
        req_data = json.dumps(data).encode('utf-8')
        headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode('utf-8')
            return resp.status, json.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(body)
        except:
            return e.code, body
    except Exception as e:
        return 0, str(e)

def test_routes():
    print("Testing Backend API Endpoints...\n")

    status, res = make_req(f"{BASE_URL}/")
    print(f"1. GET / : Status {status} -> {res}")

    status, res = make_req(f"{BASE_URL}/login", method="POST", data={"username": "admin", "password": "admin123"})
    print(f"2. POST /login : Status {status} -> {res}")

    token = res.get("token") if isinstance(res, dict) else None
    if not token:
        print("Failed to get token!")
        return

    headers = {"Authorization": f"Bearer {token}"}

    status, res = make_req(f"{BASE_URL}/admin/overview", headers=headers)
    print(f"\n3. GET /admin/overview : Status {status} -> {res}")

    status, res = make_req(f"{BASE_URL}/shops", headers=headers)
    print(f"\n4. GET /shops : Status {status} -> {res}")

    status, res = make_req(f"{BASE_URL}/products", headers=headers)
    print(f"\n5. GET /products : Status {status} -> {res}")

    status, res = make_req(f"{BASE_URL}/dashboard", headers=headers)
    print(f"\n6. GET /dashboard : Status {status} -> {res}")

if __name__ == '__main__':
    test_routes()
