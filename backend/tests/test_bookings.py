"""Бронирование: создание уменьшает доступность, отмена возвращает, лимиты."""


def test_full_booking_flow(client, make_user, seed_catalog):
    headers = make_user()
    fid = seed_catalog["flight"].id

    r = client.post("/api/bookings", json={"item_type": "flight", "item_id": fid, "quantity": 2},
                    headers=headers)
    assert r.status_code == 201
    assert r.json()["total_price"] == 12000                       # 6000 × 2
    assert client.get(f"/api/flights/{fid}").json()["seats_left"] == 8

    mine = client.get("/api/bookings/mine", headers=headers).json()
    assert len(mine) == 1
    booking_id = mine[0]["id"]

    cancel = client.post(f"/api/bookings/{booking_id}/cancel", headers=headers)
    assert cancel.status_code == 200 and cancel.json()["status"] == "cancelled"
    assert client.get(f"/api/flights/{fid}").json()["seats_left"] == 10   # доступность вернулась


def test_booking_requires_auth(client, seed_catalog):
    r = client.post("/api/bookings", json={"item_type": "flight", "item_id": seed_catalog["flight"].id})
    assert r.status_code == 401


def test_insufficient_availability(client, make_user, seed_catalog):
    headers = make_user()
    tid = seed_catalog["tour"].id                                 # spots_total = 8
    r = client.post("/api/bookings", json={"item_type": "tour", "item_id": tid, "quantity": 9},
                    headers=headers)
    assert r.status_code == 409


def test_booking_nonexistent_item(client, make_user):
    headers = make_user()
    r = client.post("/api/bookings", json={"item_type": "hotel", "item_id": 4242}, headers=headers)
    assert r.status_code == 404


def test_cannot_cancel_others_booking(client, make_user, seed_catalog):
    owner = make_user(email="owner@test.com")
    other = make_user(email="other@test.com")
    fid = seed_catalog["flight"].id
    bid = client.post("/api/bookings", json={"item_type": "flight", "item_id": fid},
                      headers=owner).json()["id"]
    assert client.post(f"/api/bookings/{bid}/cancel", headers=other).status_code == 404
