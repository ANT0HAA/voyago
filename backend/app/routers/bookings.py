"""Бронирование (нужна авторизация): создать, мои брони, отменить.

Бронь уменьшает доступность предложения; отмена — возвращает её обратно.
"""
from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..auth import current_user
from ..db import get_session
from ..models import Booking, Flight, Hotel, Tour, User
from ..schemas import BookingIn, BookingOut

router = APIRouter(prefix="/api/bookings", tags=["bookings"])

_MODEL = {"flight": Flight, "hotel": Hotel, "tour": Tour}
_LEFT = {"flight": "seats_left", "hotel": "rooms_left", "tour": "spots_left"}


def _unit_price(item: object, item_type: str) -> float:
    return item.price_per_night if item_type == "hotel" else item.price  # type: ignore[attr-defined]


def _nights(date_from: str | None, date_to: str | None) -> int | None:
    """Число ночей между датами; None если даты не заданы/некорректны."""
    if not date_from or not date_to:
        return None
    try:
        delta = (date.fromisoformat(date_to) - date.fromisoformat(date_from)).days
    except ValueError:
        return None
    return max(1, delta)


def _title(item: object, item_type: str) -> str:
    if item_type == "flight":
        return f"{item.airline}: {item.from_city} → {item.to_city}"      # type: ignore[attr-defined]
    if item_type == "hotel":
        return f"{item.name} ({item.city}, {item.stars}★)"               # type: ignore[attr-defined]
    return f"{item.title} ({item.city})"                                 # type: ignore[attr-defined]


def _out(b: Booking) -> BookingOut:
    nights = _nights(b.date_from, b.date_to) if b.item_type == "hotel" else None
    return BookingOut(id=b.id, item_type=b.item_type, item_id=b.item_id, title=b.title,
                      quantity=b.quantity, total_price=b.total_price, status=b.status,
                      created_at=b.created_at, date_from=b.date_from, date_to=b.date_to, nights=nights)


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(data: BookingIn, user: User = Depends(current_user),
                   session: Session = Depends(get_session)) -> BookingOut:
    item = session.get(_MODEL[data.item_type], data.item_id)
    if item is None:
        raise HTTPException(404, "Предложение не найдено")
    left_attr = _LEFT[data.item_type]
    left = getattr(item, left_attr)
    if left < data.quantity:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Недостаточно мест — осталось {left}")
    setattr(item, left_attr, left - data.quantity)
    # Для отелей цена умножается на число ночей (если заданы даты заезда/выезда).
    nights = _nights(data.date_from, data.date_to) if data.item_type == "hotel" else None
    total = _unit_price(item, data.item_type) * data.quantity * (nights or 1)
    booking = Booking(
        user_id=user.id, item_type=data.item_type, item_id=data.item_id,
        title=_title(item, data.item_type), quantity=data.quantity,
        total_price=round(total, 2), date_from=data.date_from, date_to=data.date_to,
    )
    session.add(item)
    session.add(booking)
    session.commit()
    session.refresh(booking)
    return _out(booking)


@router.get("/mine", response_model=list[BookingOut])
def my_bookings(user: User = Depends(current_user),
                session: Session = Depends(get_session)) -> list[BookingOut]:
    rows = session.exec(
        select(Booking).where(Booking.user_id == user.id).order_by(Booking.id.desc())  # type: ignore[attr-defined]
    ).all()
    return [_out(b) for b in rows]


@router.post("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(booking_id: int, user: User = Depends(current_user),
                   session: Session = Depends(get_session)) -> BookingOut:
    booking = session.get(Booking, booking_id)
    if booking is None or booking.user_id != user.id:
        raise HTTPException(404, "Бронь не найдена")
    if booking.status == "cancelled":
        raise HTTPException(status.HTTP_409_CONFLICT, "Бронь уже отменена")
    booking.status = "cancelled"
    item = session.get(_MODEL[booking.item_type], booking.item_id)
    if item is not None:  # вернуть доступность
        attr = _LEFT[booking.item_type]
        setattr(item, attr, getattr(item, attr) + booking.quantity)
        session.add(item)
    session.add(booking)
    session.commit()
    session.refresh(booking)
    return _out(booking)
