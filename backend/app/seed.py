"""Стартовые данные: админ, демо-пользователь и наполнение каталога.

Запускается один раз при пустой БД — чтобы приложение сразу было живым для демо.
Демо-доступы (сменить в проде): admin@voyago.app / admin123 · user@voyago.app / user123
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlmodel import Session, select

from .auth import hash_password
from .db import engine
from .models import Flight, Hotel, Tour, User


def _dep(day_offset: int, hour: int) -> datetime:
    base = datetime.now(timezone.utc).replace(hour=hour, minute=0, second=0, microsecond=0)
    return base + timedelta(days=day_offset)


def seed_if_empty() -> None:
    with Session(engine) as s:
        if s.exec(select(User)).first() is not None:
            return

        s.add(User(email="admin@voyago.app", name="Администратор",
                   hashed_password=hash_password("admin123"), role="admin"))
        s.add(User(email="user@voyago.app", name="Гость",
                   hashed_password=hash_password("user123")))

        # (авиакомпания, откуда, куда, день_вылета, час_вылета, день_прилёта, час_прилёта, цена, мест)
        flights = [
            ("Аэрофлот", "Москва", "Сочи", 2, 9, 2, 12, 6500, 180),
            ("S7", "Москва", "Казань", 3, 7, 3, 9, 4800, 150),
            ("Победа", "Санкт-Петербург", "Сочи", 4, 6, 4, 10, 5900, 189),
            ("Уральские авиалинии", "Екатеринбург", "Сочи", 5, 10, 5, 14, 7200, 160),
            ("Аэрофлот", "Москва", "Калининград", 2, 14, 2, 16, 5400, 170),
            ("S7", "Новосибирск", "Москва", 6, 8, 6, 12, 9800, 200),
        ]
        for airline, a, b, d1, h1, d2, h2, price, seats in flights:
            s.add(Flight(airline=airline, from_city=a, to_city=b, departure=_dep(d1, h1),
                         arrival=_dep(d2, h2), price=price, seats_total=seats, seats_left=seats))

        hotels = [
            ("Гранд Отель Сочи", "Сочи", 5, 9500, 40, "5★ у моря, бассейн, спа."),
            ("Приморская", "Сочи", 3, 4200, 60, "Уютный отель в центре, 5 минут до пляжа."),
            ("Казань Палас", "Казань", 4, 5600, 35, "Исторический центр, вид на Кремль."),
            ("Балтика", "Калининград", 4, 4800, 50, "Рядом с Куршской косой."),
            ("Сибирь", "Новосибирск", 3, 3500, 45, "Бизнес-отель у вокзала."),
        ]
        for name, city, stars, price, rooms, desc in hotels:
            s.add(Hotel(name=name, city=city, stars=stars, price_per_night=price,
                        rooms_total=rooms, rooms_left=rooms, description=desc))

        tours = [
            ("Красная Поляна: канатки и горы", "Сочи", 1, 3500, 30, "Подъём на 2320 м, панорамы Кавказа."),
            ("Кремль и старый город", "Казань", 1, 2200, 25, "Пешеходная экскурсия с гидом."),
            ("Куршская коса", "Калининград", 1, 2800, 20, "Дюны, танцующий лес, орнитостанция."),
            ("Олимпийский парк вечером", "Сочи", 1, 1800, 40, "Поющие фонтаны и набережная."),
        ]
        for title, city, days, price, spots, desc in tours:
            s.add(Tour(title=title, city=city, duration_days=days, price=price,
                       spots_total=spots, spots_left=spots, description=desc))

        s.commit()
