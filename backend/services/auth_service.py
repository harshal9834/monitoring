import os
from datetime import datetime, timedelta
from typing import Optional, List
import jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.models import User, Role

JWT_SECRET = os.getenv("JWT_SECRET", "skillguard_jwt_super_secure_enterprise_key_2026_gov_compliance")
JWT_REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET", "skillguard_refresh_key_2026_gov_compliance")
JWT_ALGORITHM = "HS256"

security = HTTPBearer(auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=8))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, JWT_REFRESH_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        print("[AUTH DEBUG] token_present=false authenticated=false", flush=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required"
        )
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            print("[AUTH DEBUG] token_present=true token_payload_invalid=true authenticated=false", flush=True)
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except jwt.ExpiredSignatureError:
        print("[AUTH DEBUG] token_present=true token_expired=true authenticated=false", flush=True)
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError:
        print("[AUTH DEBUG] token_present=true token_invalid=true authenticated=false", flush=True)
        raise HTTPException(status_code=401, detail="Token invalid or expired")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        print(f"[AUTH DEBUG] token_present=true user_found=false user_id={user_id} authenticated=false", flush=True)
        raise HTTPException(status_code=401, detail="User account not found")
    if user.status == "SUSPENDED":
        print(f"[AUTH DEBUG] token_present=true user_suspended=true user_id={user.id} role={user.role}", flush=True)
        raise HTTPException(status_code=403, detail="Account is suspended")
    return user

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            print(f"[AUTH DEBUG] role_mismatch=true user_id={current_user.id} actual_role={current_user.role} allowed_roles={allowed_roles}", flush=True)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: Requires one of roles {allowed_roles}"
            )
        print(f"[AUTH DEBUG] user_id={current_user.id} role={current_user.role} authenticated=true authorized=true", flush=True)
        return current_user
    return role_checker
