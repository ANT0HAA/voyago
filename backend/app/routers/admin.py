"""Админка (только role=admin): CRUD предложений, все брони, статистика."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, func, select

from ..auth import require_admin
from ..db import get_session
from ..models import Booking, Flight, Hotel, Tour, User
from ..schemas import BookingOut, FlightIn, HotelIn, Stats, TourIn

# require_admin на весь роутер — каждый эндпоинт требует администратора.
router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])


def _get_or_404(session: Session, model: type, item_id: int):
    obj = session.get(model, item_id)
    if obj is None:
        raise HTTPException(404, "Не найдено")
    return obj


# ── Рейсы ────────────────────────────────────────────────────────────
@router.post("/flights", response_model=Flight, status_code=status.HTTP_201_CREATED)
def create_flight(data: FlightIn, session: Session = Depends(get_session)) -> Flight:
    obj = Flight(**data.model_dump(), seats_left=data.seats_total)
    return _save(session, obj)


@router.put("/flights/{item_id}", response_model=Flight)
def update_flight(item_id: int, data: FlightIn, session: Session = Depends(get_session)) -> Flight:
    obj: Flight = _get_or_404(session, Flight, item_id)
    booked = obj.seats_total - obj.seats_left
    for key, value in data.model_dump().items():
        setattr(obj, key, value)
    obj.seats_left = max(0, data.seats_total - booked)
    return _save(session, obj)


@router.delete("/flights/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_flight(item_id: int, session: Session = Depends(get_session)) -> None:
    session.delete(_get_or_404(session, Flight, item_id))
    session.commit()


# ── Отели ────────────────────────────────────────────────────────────
@router.post("/hotels", response_model=Hotel, status_code=status.HTTP_201_CREATED)
def create_hotel(data: HotelIn, session: Session = Depends(get_session)) -> Hotel:
    return _save(session, Hotel(**data.model_dump(), rooms_left=data.rooms_total))


@router.put("/hotels/{item_id}", response_model=Hotel)
def update_hotel(item_id: int, data: HotelIn, session: Session = Depends(get_session)) -> Hotel:
    obj: Hotel = _get_or_404(session, Hotel, item_id)
    booked = obj.rooms_total - obj.rooms_left
    for key, value in data.model_dump().items():
        setattr(obj, key, value)
    obj.rooms_left = max(0, data.rooms_total - booked)
    return _save(session, obj)


@router.delete("/hotels/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hotel(item_id: int, session: Session = Depends(get_session)) -> None:
    session.delete(_get_or_404(session, Hotel, item_id))
    session.commit()


# ── Туры ─────────────────────────────────────────────────────────────
@router.post("/tours", response_model=Tour, status_code=status.HTTP_201_CREATED)
def create_tour(data: TourIn, session: Session = Depends(get_session)) -> Tour:
    return _save(session, Tour(**data.model_dump(), spots_left=data.spots_total))


@router.put("/tours/{item_id}", response_model=Tour)
def update_tour(item_id: int, data: TourIn, session: Session = Depends(get_session)) -> Tour:
    obj: Tour = _get_or_404(session, Tour, item_id)
    booked = obj.spots_total - obj.spots_left
    for key, value in data.model_dump().items():
        setattr(obj, key, value)
    obj.spots_left = max(0, data.spots_total - booked)
    return _save(session, obj)


@router.delete("/tours/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tour(item_id: int, session: Session = Depends(get_session)) -> None:
    session.delete(_get_or_404(session, Tour, item_id))
    session.commit()


# ── Брони и статистика ───────────────────────────────────────────────
@router.get("/bookings", response_model=list[BookingOut])
def all_bookings(session: Session = Depends(get_session)) -> list[BookingOut]:
    rows = session.exec(select(Booking).order_by(Booking.id.desc())).all()  # type: ignore[attr-defined]
    return [BookingOut(id=b.id, item_type=b.item_type, item_id=b.item_id, title=b.title,
                       quantity=b.quantity, total_price=b.total_price, status=b.status,
                       created_at=b.created_at) for b in rows]


@router.get("/stats", response_model=Stats)
def stats(session: Session = Depends(get_session)) -> Stats:
    def count(model: type) -> int:
        return session.exec(select(func.count()).select_from(model)).one()
    revenue = session.exec(
        select(func.coalesce(func.sum(Booking.total_price), 0.0)).where(Booking.status == "confirmed")
    ).one()
    active = session.exec(
        select(func.count()).select_from(Booking).where(Booking.status == "confirmed")
    ).one()
    return Stats(users=count(User), flights=count(Flight), hotels=count(Hotel),
                 tours=count(Tour), bookings_active=active, revenue=round(float(revenue), 2))


def _save(session: Session, obj):
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj
