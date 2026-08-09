"""Модели БД (SQLModel = таблица + Pydantic-схема).

Три категории предложений (рейсы, отели, туры) + пользователи и брони.
Доступность (места/номера) уменьшается при бронировании и возвращается при отмене.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    name: str
    hashed_password: str
    role: str = Field(default="user")          # user | admin
    created_at: datetime = Field(default_factory=_now)


class Flight(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    airline: str
    from_city: str = Field(index=True)
    to_city: str = Field(index=True)
    departure: datetime
    arrival: datetime
    price: float
    seats_total: int
    seats_left: int


class Hotel(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    city: str = Field(index=True)
    stars: int = Field(ge=1, le=5)
    price_per_night: float
    rooms_total: int
    rooms_left: int
    description: str = ""


class Tour(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str
    city: str = Field(index=True)
    duration_days: int
    price: float
    spots_total: int
    spots_left: int
    description: str = ""


class Booking(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    item_type: str                              # flight | hotel | tour
    item_id: int
    title: str                                  # снимок названия для отображения
    quantity: int = Field(ge=1)
    total_price: float
    status: str = Field(default="confirmed")    # confirmed | cancelled
    created_at: datetime = Field(default_factory=_now)
    date_from: str | None = None                # дата заезда/поездки (ISO, для отелей/туров)
    date_to: str | None = None                  # дата выезда (для отелей)
