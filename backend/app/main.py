"""Voyago API — бронирование путешествий (рейсы · отели · туры).

Пользовательская часть (каталог, брони) + админка (CRUD, статистика).
На старте создаёт таблицы и наполняет БД демо-данными, если она пуста.
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import init_db
from .routers import admin, auth, bookings, catalog
from .seed import seed_if_empty


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    seed_if_empty()
    yield


app = FastAPI(title="Voyago API", version="0.1.0",
              description="Бронирование путешествий: рейсы, отели, туры.", lifespan=lifespan)

_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins or ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(catalog.router)
app.include_router(bookings.router)
app.include_router(admin.router)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}
