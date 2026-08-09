"""Авторизация: регистрация, вход, /me, дубли и ошибки."""


def test_register_returns_token_and_user(client):
    r = client.post("/api/auth/register",
                    json={"email": "ann@test.com", "name": "Анна", "password": "secret1"})
    assert r.status_code == 201
    body = r.json()
    assert body["access_token"] and body["user"]["email"] == "ann@test.com"
    assert body["user"]["role"] == "user"


def test_duplicate_email_rejected(client):
    client.post("/api/auth/register", json={"email": "d@test.com", "name": "D", "password": "secret1"})
    r = client.post("/api/auth/register", json={"email": "d@test.com", "name": "D2", "password": "secret1"})
    assert r.status_code == 409


def test_login_wrong_password(client):
    client.post("/api/auth/register", json={"email": "l@test.com", "name": "L", "password": "secret1"})
    assert client.post("/api/auth/login", json={"email": "l@test.com", "password": "nope"}).status_code == 401


def test_me_requires_token(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_returns_current_user(client):
    tok = client.post("/api/auth/register",
                      json={"email": "m@test.com", "name": "Мия", "password": "secret1"}).json()["access_token"]
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 200 and r.json()["name"] == "Мия"


def test_short_password_rejected(client):
    r = client.post("/api/auth/register", json={"email": "x@test.com", "name": "X", "password": "123"})
    assert r.status_code == 422
