"""Стартовые данные: админ, демо-пользователь и наполнение каталога.

Запускается один раз при пустой БД — чтобы приложение сразу было живым для демо.
Демо-доступы (сменить в проде): admin@voyago.app / admin123 · user@voyago.app / user123
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlmodel import Session, select

from .auth import hash_password
from .db import engine
from .models import Booking, Flight, Hotel, Tour, User


def _dep(day_offset: int, hour: int) -> datetime:
    base = datetime.now(timezone.utc).replace(hour=hour, minute=0, second=0, microsecond=0)
    return base + timedelta(days=day_offset)


# (авиакомпания, откуда, куда, день_вылета, час_вылета, день_прилёта, час_прилёта, цена, мест)
FLIGHTS = [
    ("Аэрофлот", "Москва", "Сочи", 2, 9, 2, 12, 6500, 180),
    ("S7", "Москва", "Казань", 3, 7, 3, 9, 4800, 150),
    ("Победа", "Санкт-Петербург", "Сочи", 4, 6, 4, 10, 5900, 189),
    ("Уральские авиалинии", "Екатеринбург", "Сочи", 5, 10, 5, 14, 7200, 160),
    ("Аэрофлот", "Москва", "Калининград", 2, 14, 2, 16, 5400, 170),
    ("S7", "Новосибирск", "Москва", 6, 8, 6, 12, 9800, 200),
    ("Аэрофлот", "Москва", "Санкт-Петербург", 1, 19, 1, 20, 3900, 190),
    ("Победа", "Москва", "Краснодар", 3, 11, 3, 13, 4300, 189),
    ("Россия", "Санкт-Петербург", "Казань", 4, 15, 4, 17, 5100, 140),
    ("Аэрофлот", "Москва", "Минеральные Воды", 5, 12, 5, 15, 6100, 175),
    ("S7", "Москва", "Владивосток", 7, 21, 8, 9, 18900, 250),
    ("Уральские авиалинии", "Екатеринбург", "Москва", 2, 7, 2, 8, 5200, 160),
    ("Аэрофлот", "Москва", "Мурманск", 6, 13, 6, 15, 6700, 165),
    ("S7", "Москва", "Уфа", 3, 16, 3, 18, 4600, 150),
]

# (название, город, звёзды, цена_за_ночь, номеров, описание)
HOTELS = [
    ("Гранд Отель Сочи", "Сочи", 5, 9500, 40, "5★ у моря, бассейн, спа."),
    ("Приморская", "Сочи", 3, 4200, 60, "Уютный отель в центре, 5 минут до пляжа."),
    ("Казань Палас", "Казань", 4, 5600, 35, "Исторический центр, вид на Кремль."),
    ("Балтика", "Калининград", 4, 4800, 50, "Рядом с Куршской косой."),
    ("Сибирь", "Новосибирск", 3, 3500, 45, "Бизнес-отель у вокзала."),
    ("Астория", "Санкт-Петербург", 5, 12000, 30, "Легендарный отель на Исаакиевской площади."),
    ("Невский Бриз", "Санкт-Петербург", 3, 5200, 55, "В шаге от Невского проспекта."),
    ("Екатеринбург Центральный", "Екатеринбург", 4, 4600, 40, "В центре, рядом с Плотинкой."),
    ("Роза Хутор Резорт", "Сочи", 4, 8700, 48, "Горнолыжный курорт Красной Поляны."),
    ("Азимут Мурманск", "Мурманск", 3, 3900, 42, "Северное сияние и виды на залив."),
]

# (название, город, дней, цена, мест, описание)
TOURS = [
    ("Красная Поляна: канатки и горы", "Сочи", 1, 3500, 30, "Подъём на 2320 м, панорамы Кавказа."),
    ("Кремль и старый город", "Казань", 1, 2200, 25, "Пешеходная экскурсия с гидом."),
    ("Куршская коса", "Калининград", 1, 2800, 20, "Дюны, танцующий лес, орнитостанция."),
    ("Олимпийский парк вечером", "Сочи", 1, 1800, 40, "Поющие фонтаны и набережная."),
    ("Эрмитаж и Дворцовая", "Санкт-Петербург", 1, 2600, 22, "Главный музей и центр Петербурга."),
    ("Разводные мосты ночью", "Санкт-Петербург", 1, 2400, 30, "Ночная прогулка на теплоходе."),
    ("Гранд-каньон Урала", "Екатеринбург", 2, 5400, 18, "Двухдневный тур по природному парку."),
    ("Териберка и Баренцево море", "Мурманск", 2, 7900, 16, "Скалы, водопад и кит-сафари."),
]


def seed_if_empty() -> None:
    with Session(engine) as s:
        if s.exec(select(User)).first() is not None:
            return

        s.add(User(email="admin@voyago.app", name="Администратор",
                   hashed_password=hash_password("admin123"), role="admin"))
        s.add(User(email="manager@voyago.app", name="Менеджер",
                   hashed_password=hash_password("manager123"), role="manager"))
        demo_user = User(email="user@voyago.app", name="Гость",
                         hashed_password=hash_password("user123"))
        s.add(demo_user)

        for airline, a, b, d1, h1, d2, h2, price, seats in FLIGHTS:
            s.add(Flight(airline=airline, from_city=a, to_city=b, departure=_dep(d1, h1),
                         arrival=_dep(d2, h2), price=price, seats_total=seats, seats_left=seats))

        for name, city, stars, price, rooms, desc in HOTELS:
            s.add(Hotel(name=name, city=city, stars=stars, price_per_night=price,
                        rooms_total=rooms, rooms_left=rooms, description=desc))

        for title, city, days, price, spots, desc in TOURS:
            s.add(Tour(title=title, city=city, duration_days=days, price=price,
                       spots_total=spots, spots_left=spots, description=desc))

        s.commit()
        s.refresh(demo_user)
        _seed_demo_bookings(s, demo_user.id)


def _seed_demo_bookings(s: Session, user_id: int) -> None:
    """Пара готовых броней демо-пользователя — чтобы «Мои брони» и статистика были живыми."""
    flight = s.exec(select(Flight).order_by(Flight.id)).first()      # type: ignore[arg-type]
    hotel = s.exec(select(Hotel).order_by(Hotel.id)).first()         # type: ignore[arg-type]
    tour = s.exec(select(Tour).order_by(Tour.id)).first()            # type: ignore[arg-type]

    specs = [
        (flight, "flight", "seats_left", flight.price, 2,
         f"{flight.airline}: {flight.from_city} → {flight.to_city}"),
        (hotel, "hotel", "rooms_left", hotel.price_per_night, 1,
         f"{hotel.name} ({hotel.city}, {hotel.stars}★)"),
        (tour, "tour", "spots_left", tour.price, 2,
         f"{tour.title} ({tour.city})"),
    ]
    for item, item_type, left_attr, unit_price, qty, title in specs:
        setattr(item, left_attr, getattr(item, left_attr) - qty)
        s.add(item)
        s.add(Booking(user_id=user_id, item_type=item_type, item_id=item.id, title=title,
                      quantity=qty, total_price=round(unit_price * qty, 2)))
    s.commit()
