"""DTO запросов/ответов (то, что принимает и отдаёт API)."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ── Авторизация ──────────────────────────────────────────────────────
class RegisterIn(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=6, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    role: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ── Предложения (админ создаёт/правит) ───────────────────────────────
class FlightIn(BaseModel):
    airline: str
    from_city: str
    to_city: str
    departure: datetime
    arrival: datetime
    price: float = Field(gt=0)
    seats_total: int = Field(gt=0)


class HotelIn(BaseModel):
    name: str
    city: str
    stars: int = Field(ge=1, le=5)
    price_per_night: float = Field(gt=0)
    rooms_total: int = Field(gt=0)
    description: str = ""


class TourIn(BaseModel):
    title: str
    city: str
    duration_days: int = Field(gt=0)
    price: float = Field(gt=0)
    spots_total: int = Field(gt=0)
    description: str = ""


# ── Бронирование ─────────────────────────────────────────────────────
class BookingIn(BaseModel):
    item_type: str = Field(pattern="^(flight|hotel|tour)$")
    item_id: int
    quantity: int = Field(default=1, ge=1, le=20)
    date_from: str | None = None                # заезд/дата поездки (ISO YYYY-MM-DD)
    date_to: str | None = None                  # выезд (для отелей — считает ночи)


class BookingOut(BaseModel):
    id: int
    item_type: str
    item_id: int
    title: str
    quantity: int
    total_price: float
    status: str
    created_at: datetime
    date_from: str | None = None
    date_to: str | None = None
    nights: int | None = None                   # число ночей (для отелей)


# ── Админ-статистика ─────────────────────────────────────────────────
class Stats(BaseModel):
    users: int
    flights: int
    hotels: int
    tours: int
    bookings_active: int
    revenue: float
