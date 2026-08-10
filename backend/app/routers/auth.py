"""Регистрация, вход, текущий пользователь."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..auth import create_token, current_user, hash_password, verify_password
from ..db import get_session
from ..models import User
from ..schemas import ChangePasswordIn, LoginIn, RegisterIn, TokenOut, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _user_out(user: User) -> UserOut:
    return UserOut(id=user.id, email=user.email, name=user.name, role=user.role)


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(data: RegisterIn, session: Session = Depends(get_session)) -> TokenOut:
    if session.exec(select(User).where(User.email == data.email)).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Пользователь с таким email уже существует")
    user = User(email=data.email, name=data.name, hashed_password=hash_password(data.password))
    session.add(user)
    session.commit()
    session.refresh(user)
    return TokenOut(access_token=create_token(user), user=_user_out(user))


@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, session: Session = Depends(get_session)) -> TokenOut:
    user = session.exec(select(User).where(User.email == data.email)).first()
    if user is None or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверный email или пароль")
    return TokenOut(access_token=create_token(user), user=_user_out(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)) -> UserOut:
    return _user_out(user)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(data: ChangePasswordIn, user: User = Depends(current_user),
                    session: Session = Depends(get_session)) -> None:
    if not verify_password(data.old_password, user.hashed_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Неверный текущий пароль")
    user.hashed_password = hash_password(data.new_password)
    session.add(user)
    session.commit()
