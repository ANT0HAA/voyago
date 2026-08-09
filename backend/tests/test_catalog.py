"""Публичный каталог: списки, фильтр по городу, карточка, 404."""


def test_lists_are_public(client, seed_catalog):
    assert len(client.get("/api/flights").json()) >= 1
    assert len(client.get("/api/hotels").json()) >= 1
    assert len(client.get("/api/tours").json()) >= 1


def test_filter_by_city(client, seed_catalog):
    assert len(client.get("/api/flights", params={"to_city": "Сочи"}).json()) == 1
    assert len(client.get("/api/flights", params={"to_city": "Казань"}).json()) == 0
    assert len(client.get("/api/hotels", params={"city": "Сочи"}).json()) == 1


def test_detail_and_404(client, seed_catalog):
    fid = seed_catalog["flight"].id
    assert client.get(f"/api/flights/{fid}").json()["from_city"] == "Москва"
    assert client.get("/api/flights/99999").status_code == 404
    assert client.get("/api/hotels/99999").status_code == 404
