# ✈ Voyago — бронирование путешествий

### 🔴 [Открыть живое демо →](https://ant0haa.github.io/voyago/)

Кликабельная демо-версия в браузере — можно искать, бронировать, зайти как пользователь
или администратор. Данные хранятся локально в браузере (кнопка «Сбросить демо» вернёт всё
в исходное состояние). Полная версия с настоящим FastAPI-бэкендом — в каталоге `backend/`.

Учебно-демонстрационная платформа бронирования отдыха: **авиабилеты, отели и туры**.
Есть и **пользовательская** часть (поиск, бронирование, «Мои брони», авторизация),
и **административная** (дашборд, управление предложениями, все брони, статистика).

Проект с открытым кодом — можно клонировать, запустить локально и посмотреть,
как устроено небольшое, но полноценное full-stack-приложение с JWT-авторизацией,
ролями и честной бизнес-логикой мест/номеров.

![Главная](docs/screenshots/home.png)

## Возможности

**Для пользователя**
- Главная с каруселью «горящих предложений» и плиткой популярных направлений
- Каталог с карточками-обложками и **фильтрами**: город, дата вылета, цена, звёзды,
  длительность, сортировка
- **Страница предложения** с галереей, описанием, характеристиками и панелью бронирования
- **Корзина** и **оформление заказа**: выбор дат (для отелей — расчёт по ночам),
  количество, контактные данные и демо-оплата картой → подтверждение заказа
- Личный кабинет «Мои брони» с датами поездки и отменой (места возвращаются в продажу)
- Регистрация и вход по email + паролю (JWT)

**Для администратора**
- Дашборд со сводкой: пользователи, предложения, активные брони, выручка
- CRUD рейсов, отелей и туров (создание, редактирование, удаление)
- Таблица всех бронирований платформы
- Доступ к админке защищён ролью `admin`

| Каталог с фильтрами | Страница предложения |
|---|---|
| ![Каталог](docs/screenshots/catalog.png) | ![Детали](docs/screenshots/detail.png) |

Оформление заказа (корзина → контактные данные → демо-оплата):

![Оформление](docs/screenshots/checkout.png)

Обложки предложений рисуются локально (тематический градиент + эмодзи по городу) —
демо не зависит от внешних картинок; чтобы подключить реальные фото, достаточно заменить
фон в компоненте `Cover` ([frontend/src/media.tsx](frontend/src/media.tsx)).

Админку смотрите на [живом демо](https://ant0haa.github.io/voyago/) — войдите как
`admin@voyago.app / admin123`.

## Технологии

**Backend** — Python
- [FastAPI](https://fastapi.tiangolo.com/) — REST API
- [SQLModel](https://sqlmodel.tiangolo.com/) (SQLAlchemy + Pydantic) поверх SQLite
- JWT-авторизация (`python-jose`), хеширование паролей `bcrypt` (`passlib`)
- Тесты: `pytest` (18 тестов, изолированная in-memory БД)

**Frontend** — TypeScript
- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [React Router 6](https://reactrouter.com/), Context API для авторизации
- [Tailwind CSS](https://tailwindcss.com/)
- Тесты: [Vitest](https://vitest.dev/) + Testing Library (17 тестов)

**CI** — GitHub Actions: прогон backend- и frontend-тестов + сборка на каждый push/PR.

## Архитектура

```
voyago/
├── backend/                 # FastAPI + SQLModel
│   ├── app/
│   │   ├── main.py          # приложение, CORS, старт БД и сидов
│   │   ├── db.py            # движок SQLite, сессии
│   │   ├── models.py        # таблицы: User, Flight, Hotel, Tour, Booking
│   │   ├── schemas.py       # DTO запросов/ответов
│   │   ├── auth.py          # JWT, хеширование, зависимости current_user / require_admin
│   │   ├── seed.py          # демо-данные при пустой БД
│   │   └── routers/         # auth, catalog, bookings, admin
│   └── tests/               # pytest
└── frontend/                # React + Vite + Tailwind
    ├── src/
    │   ├── api.ts           # типизированный клиент REST
    │   ├── auth.tsx         # AuthProvider / useAuth
    │   ├── App.tsx          # роутинг, навбар, защита маршрутов
    │   └── pages/           # Home, Catalog, MyBookings, AuthPage, Admin
    └── ...
```

Бизнес-логика мест: бронирование уменьшает остаток (`seats_left` / `rooms_left` /
`spots_left`), отмена — возвращает; при редактировании предложения администратором
уже проданные места сохраняются.

## Запуск

Нужны **Python 3.11+** и **Node.js 18+**.

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate   |   Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API поднимется на `http://127.0.0.1:8000` (документация — `/docs`).
При первом старте создаётся `voyago.db` с демо-данными.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Откройте `http://127.0.0.1:5173`. Vite проксирует `/api` на бэкенд, CORS настраивать не нужно.

### Демо-доступы

| Роль | Email | Пароль |
|------|-------|--------|
| Администратор | `admin@voyago.app` | `admin123` |
| Пользователь | `user@voyago.app` | `user123` |

> ⚠️ Демо-учётки и `SECRET_KEY` по умолчанию — только для локального запуска.
> Для продакшена задайте переменные окружения `SECRET_KEY` и смените пароли.

## Живое демо (GitHub Pages)

Демо на `https://ant0haa.github.io/voyago/` — это фронтенд, собранный в **демо-режиме**:
вместо сетевых запросов к бэкенду весь API работает прямо в браузере (данные в
`localStorage`, начальный каталог и пара броней предзаполнены). Так статический сайт
на GitHub Pages выглядит и ведёт себя как готовый продукт, без сервера.

Собрать демо-бандл локально:

```bash
cd frontend
VITE_DEMO=1 VITE_BASE=/voyago/ npm run build   # результат в frontend/dist
```

Публикацию выполняет GitHub Actions ([.github/workflows/pages.yml](.github/workflows/pages.yml))
на каждый push в `main`.

## Тесты

```bash
# backend
cd backend && pytest -q

# frontend
cd frontend && npm run test:run
```

## Лицензия

[MIT](LICENSE) © 2026 Anton K.
