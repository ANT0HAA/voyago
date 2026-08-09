"""Фикстуры тестов: изолированная in-memory БД, клиент, помощники создания
пользователей и наполнения каталога. Реальный файл БД и сид не используются."""
from __future__ import annotations

from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.auth import create_token, hash_password
from app.db import get_session
from app.main import app
from app.models import Flight, Hotel, Tour, User


@pytest.fixture
def session():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        yield s


@pytest.fixture
def client(session):
    app.dependency_overrides[get_session] = lambda: session
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def make_user(session):
    def _make(email="user@test.com", role="user", password="pass123", name="Тест"):
        user = User(email=email, name=name, hashed_password=hash_password(password), role=role)
        session.add(user)
        session.commit()
        session.refresh(user)
        return {"Authorization": f"Bearer {create_token(user)}"}
    return _make


@pytest.fixture
def seed_catalog(session):
    dep = datetime(2030, 1, 1, 10, tzinfo=timezone.utc)
    arr = datetime(2030, 1, 1, 12, tzinfo=timezone.utc)
    flight = Flight(airline="SU", from_city="Москва", to_city="Сочи", departure=dep, arrival=arr,
                    price=6000, seats_total=10, seats_left=10)
    hotel = Hotel(name="Тест-Отель", city="Сочи", stars=4, price_per_night=4000,
                  rooms_total=5, rooms_left=5)
    tour = Tour(title="Тест-Тур", city="Сочи", duration_days=1, price=2000,
                spots_total=8, spots_left=8)
    for obj in (flight, hotel, tour):
        session.add(obj)
    session.commit()
    for obj in (flight, hotel, tour):
        session.refresh(obj)
    return {"flight": flight, "hotel": hotel, "tour": tour}
