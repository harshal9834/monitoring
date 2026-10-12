import os
import urllib.parse
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.engine.url import URL, make_url
from dotenv import load_dotenv

# Load environment configuration
load_dotenv(".env", override=False)
load_dotenv("backend/.env", override=False)


def resolve_database_url() -> tuple[str, dict]:
    """
    Constructs and sanitizes the database connection string.
    - Handles special characters (@, #, %, :, /, ?, &) in passwords safely.
    - Normalizes cloud URLs (mysql:// -> mysql+pymysql://, postgres:// -> postgresql+psycopg2://).
    - Automatically configures TLS/SSL for TiDB Cloud Serverless.
    """
    # 1. Check if individual discrete parameters are provided
    db_host = os.getenv("DB_HOST")
    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    db_name = os.getenv("DB_NAME")
    db_port = os.getenv("DB_PORT")

    if db_host and db_user:
        port_num = int(db_port) if db_port and db_port.isdigit() else (4000 if "tidb" in db_host else 3306)
        url_obj = URL.create(
            drivername="mysql+pymysql",
            username=db_user,
            password=db_password or "",
            host=db_host,
            port=port_num,
            database=db_name or "test"
        )
        db_url_str = url_obj.render_as_string(hide_password=False)
    else:
        # 2. Parse from DATABASE_URL
        raw_url = os.getenv(
            "DATABASE_URL",
            "mysql+pymysql://root:Admin%40123@127.0.0.1:3307/sih245"
        ).strip()

        # Normalize driver names for cloud providers (Render, Heroku, TiDB)
        if raw_url.startswith("mysql://"):
            raw_url = "mysql+pymysql://" + raw_url[8:]
        elif raw_url.startswith("postgres://"):
            raw_url = "postgresql+psycopg2://" + raw_url[11:]
        elif raw_url.startswith("postgresql://") and not raw_url.startswith("postgresql+"):
            raw_url = "postgresql+psycopg2://" + raw_url[13:]

        # Handle unencoded special characters in password (@, #, %, :, etc.)
        if "://" in raw_url:
            scheme, remainder = raw_url.split("://", 1)
            if "@" in remainder:
                last_at_idx = remainder.rfind("@")
                userinfo = remainder[:last_at_idx]
                host_and_beyond = remainder[last_at_idx + 1:]

                if ":" in userinfo:
                    u, p = userinfo.split(":", 1)
                    u = urllib.parse.quote_plus(urllib.parse.unquote_plus(u))
                    p = urllib.parse.quote_plus(urllib.parse.unquote_plus(p))
                    userinfo = f"{u}:{p}"
                else:
                    userinfo = urllib.parse.quote_plus(urllib.parse.unquote_plus(userinfo))

                raw_url = f"{scheme}://{userinfo}@{host_and_beyond}"

        db_url_str = raw_url

    # 3. Configure SSL/TLS and connection timeouts (safe for PyMySQL / TiDB)
    connect_args = {
        "connect_timeout": 10,
        "read_timeout": 10,
        "write_timeout": 10
    }
    is_tidb = "tidbcloud.com" in db_url_str
    ssl_required = is_tidb or os.getenv("DB_SSL", "false").lower() in ("true", "1", "yes")

    if ssl_required:
        ssl_config = {}
        ca_cert = os.getenv("DB_SSL_CA", "/etc/ssl/certs/ca-certificates.crt")
        if os.path.exists(ca_cert):
            ssl_config["ca"] = ca_cert
        else:
            ssl_config["check_hostname"] = False
        connect_args["ssl"] = ssl_config

    return db_url_str, connect_args


DATABASE_URL, db_connect_args = resolve_database_url()

# Engine with pool pre-ping and 300s recycle (critical for TiDB Serverless idle connections)
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_recycle=300,
    connect_args=db_connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Module-level tracking for database readiness
db_status_info = {
    "initialized": False,
    "last_check_status": "untested",
    "last_error": None
}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def safe_init_db_schema() -> bool:
    """
    Production-safe database schema initialization.
    - First verifies connectivity with SELECT 1.
    - Inspects existing tables. If tables already exist, does NOT execute redundant CREATE TABLE (DDL).
    - If tables are missing and AUTO_CREATE_TABLES is enabled, creates missing tables.
    - Never drops, alters, or resets existing production data.
    - Captures errors gracefully without raising exceptions.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))

        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()

        if "roles" in existing_tables and "users" in existing_tables:
            print(f"[Database Init] Schema verified: {len(existing_tables)} tables present in database.")
            db_status_info["initialized"] = True
            db_status_info["last_check_status"] = "connected"
            db_status_info["last_error"] = None
            return True

        auto_create = os.getenv("AUTO_CREATE_TABLES", "true").lower() in ("true", "1", "yes")
        if auto_create:
            print("[Database Init] Tables not found. Attempting initial schema creation...")
            from backend.models import models
            Base.metadata.create_all(bind=engine)
            print("[Database Init] Tables created successfully.")
            db_status_info["initialized"] = True
            db_status_info["last_check_status"] = "connected"
            db_status_info["last_error"] = None
            return True
        else:
            print("[Database Init] Schema auto-creation disabled (AUTO_CREATE_TABLES=false).")
            db_status_info["initialized"] = True
            db_status_info["last_check_status"] = "connected"
            db_status_info["last_error"] = None
            return False

    except Exception as e:
        err_msg = str(e)
        db_status_info["initialized"] = False
        db_status_info["last_check_status"] = "unavailable"
        db_status_info["last_error"] = err_msg
        if "1142" in err_msg or "command denied" in err_msg.lower():
            print(
                "[Database Init Notice] TiDB/MySQL user does not have DDL CREATE privileges on this schema.\n"
                "If tables already exist, queries will run normally.\n"
                "To initialize a fresh database, run 'GRANT ALL PRIVILEGES ON <dbname>.* TO ...' in TiDB Cloud Console."
            )
        else:
            print(f"[Database Init Notice] Connectivity check: {err_msg}")
        return False


def print_db_config_summary():
    """Diagnostic logging helper. Never prints DB_PASSWORD."""
    print(
        "[DB CONFIG] "
        f"host={os.getenv('DB_HOST')} "
        f"port={os.getenv('DB_PORT')} "
        f"user={os.getenv('DB_USER')} "
        f"database={os.getenv('DB_NAME')} "
        f"password_set={bool(os.getenv('DB_PASSWORD'))} "
        f"password_length={len(os.getenv('DB_PASSWORD', ''))}"
    )


# Print non-sensitive configuration diagnostics at import time
print_db_config_summary()