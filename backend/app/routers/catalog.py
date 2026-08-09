"""Публичный каталог: список и карточка рейсов, отелей, туров (без авторизации)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..db import get_session
from ..models import Flight, Hotel, Tour

router = APIRouter(prefix="/api", tags=["catalog"])


@router.get("/flights", response_model=list[Flight])
def list_flights(from_city: str | None = None, to_city: str | None = None,
                 session: Session = Depends(get_session)) -> list[Flight]:
    q = select(Flight)
    if from_city:
        q = q.where(Flight.from_city.ilike(f"%{from_city}%"))  # type: ignore[attr-defined]
    if to_city:
        q = q.where(Flight.to_city.ilike(f"%{to_city}%"))      # type: ignore[attr-defined]
    return list(session.exec(q.order_by(Flight.departure)).all())


@router.get("/flights/{item_id}", response_model=Flight)
def get_flight(item_id: int, session: Session = Depends(get_session)) -> Flight:
    return _get_or_404(session, Flight, item_id, "Рейс не найден")


@router.get("/hotels", response_model=list[Hotel])
def list_hotels(city: str | None = None, session: Session = Depends(get_session)) -> list[Hotel]:
    q = select(Hotel)
    if city:
        q = q.where(Hotel.city.ilike(f"%{city}%"))              # type: ignore[attr-defined]
    return list(session.exec(q.order_by(Hotel.price_per_night)).all())


@router.get("/hotels/{item_id}", response_model=Hotel)
def get_hotel(item_id: int, session: Session = Depends(get_session)) -> Hotel:
    return _get_or_404(session, Hotel, item_id, "Отель не найден")


@router.get("/tours", response_model=list[Tour])
def list_tours(city: str | None = None, session: Session = Depends(get_session)) -> list[Tour]:
    q = select(Tour)
    if city:
        q = q.where(Tour.city.ilike(f"%{city}%"))               # type: ignore[attr-defined]
    return list(session.exec(q.order_by(Tour.price)).all())


@router.get("/tours/{item_id}", response_model=Tour)
def get_tour(item_id: int, session: Session = Depends(get_session)) -> Tour:
    return _get_or_404(session, Tour, item_id, "Тур не найден")


def _get_or_404(session: Session, model: type, item_id: int, msg: str):
    obj = session.get(model, item_id)
    if obj is None:
        raise HTTPException(404, msg)
    return obj
