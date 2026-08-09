"""Админка: доступ только админам, CRUD предложений, статистика."""

_FLIGHT = {"airline": "SU", "from_city": "A", "to_city": "B",
           "departure": "2030-01-01T10:00:00", "arrival": "2030-01-01T12:00:00",
           "price": 5000, "seats_total": 100}


def test_admin_endpoints_guarded(client, make_user):
    assert client.get("/api/admin/stats").status_code == 401           # без токена
    user = make_user(role="user")
    assert client.get("/api/admin/stats", headers=user).status_code == 403   # обычный пользователь


def test_create_update_delete_flight(client, make_user):
    admin = make_user(email="admin@test.com", role="admin")

    created = client.post("/api/admin/flights", json=_FLIGHT, headers=admin)
    assert created.status_code == 201 and created.json()["seats_left"] == 100
    fid = created.json()["id"]

    # апдейт увеличивает total → left растёт на дельту (брони сохраняются)
    upd = client.put(f"/api/admin/flights/{fid}", json={**_FLIGHT, "seats_total": 120}, headers=admin)
    assert upd.status_code == 200 and upd.json()["seats_left"] == 120

    assert client.delete(f"/api/admin/flights/{fid}", headers=admin).status_code == 204
    assert client.get(f"/api/flights/{fid}").status_code == 404


def test_update_preserves_booked_count(client, make_user, seed_catalog):
    admin = make_user(email="admin@test.com", role="admin")
    user = make_user(email="u@test.com")
    fid = seed_catalog["flight"].id                                    # total 10, left 10
    client.post("/api/bookings", json={"item_type": "flight", "item_id": fid, "quantity": 3}, headers=user)
    # было забронировано 3 (left=7); меняем total 10→20 → left = 20-3 = 17
    body = {"airline": "SU", "from_city": "Москва", "to_city": "Сочи",
            "departure": "2030-01-01T10:00:00", "arrival": "2030-01-01T12:00:00",
            "price": 6000, "seats_total": 20}
    upd = client.put(f"/api/admin/flights/{fid}", json=body, headers=admin)
    assert upd.json()["seats_left"] == 17


def test_stats(client, make_user, seed_catalog):
    admin = make_user(email="admin@test.com", role="admin")
    user = make_user(email="u@test.com")
    client.post("/api/bookings", json={"item_type": "hotel", "item_id": seed_catalog["hotel"].id,
                                       "quantity": 2}, headers=user)
    st = client.get("/api/admin/stats", headers=admin).json()
    assert st["flights"] == 1 and st["hotels"] == 1 and st["tours"] == 1
    assert st["users"] == 2 and st["bookings_active"] == 1
    assert st["revenue"] == 8000                                       # 4000 × 2
