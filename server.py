from http import HTTPStatus
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, quote, urlparse
import hashlib
import hmac
import json
import mimetypes
import os
import secrets
import time

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
PRICES_FILE = DATA_DIR / "prices.json"
SESSION_COOKIE = "morla_tpv_session"
SESSION_TTL_SECONDS = 8 * 60 * 60
LOGIN_WINDOW_SECONDS = 5 * 60
MAX_LOGIN_ATTEMPTS = 8
MAX_BODY_BYTES = 64 * 1024
TPV_HOST = "tpv.morladelavalderia.es"

SESSIONS = {}
LOGIN_ATTEMPTS = {}


class ConfigError(RuntimeError):
    pass


def require_env(name):
    value = os.environ.get(name, "").strip()
    if not value:
        raise ConfigError(f"{name} is required")
    return value


APP_SECRET = require_env("APP_SECRET").encode("utf-8")
SESSION_COOKIE_SECURE = os.environ.get("SESSION_COOKIE_SECURE", "true").lower() == "true"


def parse_users():
    raw_users = require_env("TPV_USERS")
    users = {}
    for raw_user in raw_users.split(","):
        parts = raw_user.strip().split(":")
        if len(parts) != 3:
            raise ConfigError("TPV_USERS must use username:password:role entries separated by commas")
        username, password, role = [part.strip() for part in parts]
        if not username or not password or role not in {"cajero", "editor"}:
            raise ConfigError("Each TPV user needs username, password and role cajero/editor")
        users[username] = {
            "password_hash": hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), username.encode("utf-8"), 160000),
            "role": role,
        }
    if not any(user["role"] == "editor" for user in users.values()):
        raise ConfigError("At least one TPV user must have editor role")
    return users


USERS = parse_users()


def sign_session(session_id):
    return hmac.new(APP_SECRET, session_id.encode("utf-8"), hashlib.sha256).hexdigest()


def make_cookie(session_id):
    flags = ["Path=/", "HttpOnly", "SameSite=Strict", f"Max-Age={SESSION_TTL_SECONDS}"]
    if SESSION_COOKIE_SECURE:
        flags.append("Secure")
    return f"{SESSION_COOKIE}={session_id}.{sign_session(session_id)}; " + "; ".join(flags)


def clear_cookie():
    flags = ["Path=/", "HttpOnly", "SameSite=Strict", "Max-Age=0"]
    if SESSION_COOKIE_SECURE:
        flags.append("Secure")
    return f"{SESSION_COOKIE}=; " + "; ".join(flags)


def clean_sessions():
    now = time.time()
    for session_id, session in list(SESSIONS.items()):
        if session["expires_at"] < now:
            SESSIONS.pop(session_id, None)


def verify_password(username, password):
    user = USERS.get(username)
    if not user:
        hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), b"missing", 160000)
        return None
    candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), username.encode("utf-8"), 160000)
    if hmac.compare_digest(candidate, user["password_hash"]):
        return user
    return None


def load_prices():
    with PRICES_FILE.open("r", encoding="utf-8") as price_file:
        return json.load(price_file)


def save_prices(products):
    DATA_DIR.mkdir(exist_ok=True)
    temp_file = PRICES_FILE.with_suffix(".json.tmp")
    with temp_file.open("w", encoding="utf-8") as price_file:
        json.dump(products, price_file, ensure_ascii=True, indent=2)
        price_file.write("\n")
    temp_file.replace(PRICES_FILE)


def validate_products(products):
    if not isinstance(products, list) or not products:
        raise ValueError("El catalogo no puede estar vacio")

    seen_ids = set()
    cleaned = []
    for item in products:
        if not isinstance(item, dict):
            raise ValueError("Producto no valido")
        product_id = str(item.get("id", "")).strip()
        name = str(item.get("name", "")).strip()
        category = str(item.get("category", "")).strip()
        shortcut = str(item.get("shortcut", "")).strip().upper()[:3]
        try:
            price = round(float(item.get("price")), 2)
        except (TypeError, ValueError):
            raise ValueError(f"Precio no valido para {name or product_id}")
        if not product_id or product_id in seen_ids or not name or category not in {"bebidas", "comida", "merch"}:
            raise ValueError("Producto con id, nombre o categoria no validos")
        if price < 0 or price > 999:
            raise ValueError(f"Precio fuera de rango para {name}")
        seen_ids.add(product_id)
        cleaned.append({"id": product_id, "name": name, "category": category, "price": price, "shortcut": shortcut or product_id[:2].upper()})
    return cleaned


class MorlaHandler(BaseHTTPRequestHandler):
    server_version = "MorlaTPV/1.0"

    def log_message(self, format, *args):
        return

    def send_security_headers(self, private=False):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer" if private else "strict-origin-when-cross-origin")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()")
        if private:
            self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'")
        else:
            self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self' https://www.googletagmanager.com; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'")
        if private:
            self.send_header("Cache-Control", "no-store, private")
        if SESSION_COOKIE_SECURE:
            self.send_header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

    def send_json(self, payload, status=HTTPStatus.OK):
        body = json.dumps(payload, ensure_ascii=True).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_security_headers(private=True)
        self.end_headers()
        self.wfile.write(body)

    def redirect(self, location):
        self.send_response(HTTPStatus.SEE_OTHER)
        self.send_header("Location", location)
        self.send_security_headers(private=True)
        self.end_headers()

    def read_body(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length > MAX_BODY_BYTES:
            raise ValueError("Solicitud demasiado grande")
        return self.rfile.read(length)

    def client_key(self):
        forwarded = self.headers.get("X-Forwarded-For", "")
        return (forwarded.split(",")[0].strip() or self.client_address[0])

    def current_session(self):
        clean_sessions()
        cookies = self.headers.get("Cookie", "")
        values = {}
        for cookie in cookies.split(";"):
            if "=" in cookie:
                key, value = cookie.strip().split("=", 1)
                values[key] = value
        raw_cookie = values.get(SESSION_COOKIE, "")
        if "." not in raw_cookie:
            return None
        session_id, signature = raw_cookie.rsplit(".", 1)
        if not hmac.compare_digest(signature, sign_session(session_id)):
            return None
        session = SESSIONS.get(session_id)
        if not session or session["expires_at"] < time.time():
            return None
        session["expires_at"] = time.time() + SESSION_TTL_SECONDS
        return session

    def require_session(self):
        session = self.current_session()
        if session:
            return session
        if self.path.startswith("/api/"):
            self.send_json({"error": "No autenticado"}, HTTPStatus.UNAUTHORIZED)
        else:
            self.redirect(f"/login?next={quote(self.path, safe='/')}")
        return None

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/healthz":
            self.send_json({"ok": True})
            return
        if path == "/login":
            self.serve_file(ROOT / "tpv" / "login.html", private=True)
            return
        if path in {"/tpv/styles.css", "/tpv/login.js"}:
            self.serve_file(ROOT / path.lstrip("/"), private=True)
            return
        if path in {"/tpv/manifest.json", "/tpv/sw.js", "/tpv/icon.svg", "/tpv/icon-192.png", "/tpv/icon-512.png"}:
            self.serve_file(ROOT / path.lstrip("/"), private=False)
            return
        if path == "/logout":
            self.handle_logout()
            return
        if path == "/api/session":
            self.handle_session()
            return
        if path == "/api/products":
            if self.require_session():
                self.send_json({"products": load_prices()})
            return

        host = self.headers.get("Host", "").split(":")[0]
        if host == TPV_HOST and path == "/":
            path = "/tpv/index.html"
        if path.startswith("/tpv"):
            if not self.require_session():
                return
            if path == "/tpv/precios.html" and self.current_session()["role"] != "editor":
                self.send_error_page(HTTPStatus.FORBIDDEN)
                return
            self.serve_file(ROOT / path.lstrip("/"), private=True)
            return

        self.serve_file(ROOT / (path.lstrip("/") or "index.html"), private=False)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/login":
            self.handle_login()
            return
        if parsed.path == "/api/products":
            self.handle_update_products()
            return
        self.send_error_page(HTTPStatus.NOT_FOUND)

    def serve_file(self, file_path, private):
        resolved = file_path.resolve()
        if not str(resolved).startswith(str(ROOT)) or not resolved.is_file():
            self.send_error_page(HTTPStatus.NOT_FOUND)
            return
        content = resolved.read_bytes()
        content_type = mimetypes.guess_type(str(resolved))[0] or "application/octet-stream"
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.send_security_headers(private=private)
        self.end_headers()
        self.wfile.write(content)

    def send_error_page(self, status):
        body = f"{status.value} {status.phrase}".encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_security_headers(private=True)
        self.end_headers()
        self.wfile.write(body)

    def login_limited(self):
        key = self.client_key()
        now = time.time()
        attempts = [item for item in LOGIN_ATTEMPTS.get(key, []) if now - item < LOGIN_WINDOW_SECONDS]
        LOGIN_ATTEMPTS[key] = attempts
        return len(attempts) >= MAX_LOGIN_ATTEMPTS

    def record_login_failure(self):
        key = self.client_key()
        LOGIN_ATTEMPTS.setdefault(key, []).append(time.time())

    def handle_login(self):
        if self.login_limited():
            self.send_error_page(HTTPStatus.TOO_MANY_REQUESTS)
            return
        parsed = urlparse(self.path)
        try:
            form = parse_qs(self.read_body().decode("utf-8"), keep_blank_values=True)
        except ValueError:
            self.send_error_page(HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
            return
        username = form.get("username", [""])[0].strip()
        password = form.get("password", [""])[0]
        user = verify_password(username, password)
        if not user:
            self.record_login_failure()
            self.redirect("/login?error=1")
            return
        session_id = secrets.token_urlsafe(32)
        SESSIONS[session_id] = {
            "username": username,
            "role": user["role"],
            "csrf": secrets.token_urlsafe(32),
            "expires_at": time.time() + SESSION_TTL_SECONDS,
        }
        next_url = parse_qs(parsed.query).get("next", ["/"])[0]
        if not next_url.startswith("/") or next_url.startswith("//"):
            next_url = "/"
        self.send_response(HTTPStatus.SEE_OTHER)
        self.send_header("Location", next_url)
        self.send_header("Set-Cookie", make_cookie(session_id))
        self.send_security_headers(private=True)
        self.end_headers()

    def handle_logout(self):
        session = self.current_session()
        if session:
            for session_id, stored in list(SESSIONS.items()):
                if stored is session:
                    SESSIONS.pop(session_id, None)
                    break
        self.send_response(HTTPStatus.SEE_OTHER)
        self.send_header("Location", "/login")
        self.send_header("Set-Cookie", clear_cookie())
        self.send_security_headers(private=True)
        self.end_headers()

    def handle_session(self):
        session = self.require_session()
        if not session:
            return
        self.send_json({
            "username": session["username"],
            "role": session["role"],
            "canEditPrices": session["role"] == "editor",
            "csrf": session["csrf"],
        })

    def handle_update_products(self):
        session = self.require_session()
        if not session:
            return
        if session["role"] != "editor":
            self.send_json({"error": "No autorizado"}, HTTPStatus.FORBIDDEN)
            return
        if self.headers.get("X-CSRF-Token") != session["csrf"]:
            self.send_json({"error": "CSRF no valido"}, HTTPStatus.FORBIDDEN)
            return
        try:
            payload = json.loads(self.read_body().decode("utf-8"))
            products = validate_products(payload.get("products"))
            save_prices(products)
        except (ValueError, json.JSONDecodeError) as exc:
            self.send_json({"error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        self.send_json({"products": products})


if __name__ == "__main__":
    DATA_DIR.mkdir(exist_ok=True)
    if not PRICES_FILE.exists():
        raise ConfigError("data/prices.json is required")
    port = int(os.environ.get("PORT", "80"))
    ThreadingHTTPServer(("0.0.0.0", port), MorlaHandler).serve_forever()
