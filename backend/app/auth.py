"""Авторизация: хеш паролей (bcrypt), JWT-токены, зависимости доступа."""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlmodel import Session

from .db import get_session
from .models import User

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-prod")
ALGORITHM = "HS256"
TOKEN_TTL_MIN = 60 * 24  # сутки

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
# tokenUrl нужен только для Swagger; сам токен читается из заголовка Authorization.
_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=True)


def hash_password(plain: str) -> str:
    return _pwd.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd.verify(plain, hashed)


def create_token(user: User) -> str:
    payload = {
        "sub": str(user.id),
        "role": user.role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=TOKEN_TTL_MIN),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def current_user(token: str = Depends(_oauth2), session: Session = Depends(get_session)) -> User:
    exc = HTTPException(status.HTTP_401_UNAUTHORIZED, "Не авторизованы",
                        headers={"WWW-Authenticate": "Bearer"})
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(data["sub"])
    except (JWTError, KeyError, ValueError):
        raise exc
    user = session.get(User, user_id)
    if user is None:
        raise exc
    return user


def require_admin(user: User = Depends(current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Требуются права администратора")
    return user


def require_staff(user: User = Depends(current_user)) -> User:
    """Сотрудник: администратор или менеджер (менеджер не может удалять и не видит выручку)."""
    if user.role not in ("admin", "manager"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Требуются права сотрудника")
    return user
