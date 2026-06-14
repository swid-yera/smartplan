from app.cache import CacheResult
from app.main import create_app
from app.translator import TranslationRequest
from fastapi.testclient import TestClient


class FakeTranslator:
    model_name = "fake-model"

    def __init__(self):
        self.calls: list[list[str]] = []

    def health(self) -> bool:
        return True

    def translate_batch(self, req: TranslationRequest) -> list[str]:
        self.calls.append(req.texts)
        return [f"{req.target}:{text}" for text in req.texts]


class NotReadyTranslator(FakeTranslator):
    def health(self) -> bool:
        return False

    def readiness_error(self) -> str:
        return "missing model.bin"


class FakeCache:
    def __init__(self, initial: dict[str, str] | None = None):
        self.values = initial or {}
        self.writes: dict[str, str] = {}

    def health(self) -> bool:
        return True

    def get_many(self, model: str, source: str, target: str, texts: list[str]) -> CacheResult:
        values = [self.values.get(text) for text in texts]
        return CacheResult(values=values, hits=sum(1 for value in values if value is not None))

    def set_many(self, model: str, source: str, target: str, pairs: dict[str, str]) -> None:
        self.writes.update(pairs)
        self.values.update(pairs)


def test_health_reports_model_and_redis():
    client = TestClient(create_app(FakeTranslator(), FakeCache()))

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["model"] == "fake-model"
    assert response.json()["modelError"] is None


def test_batch_preserves_order_duplicates_and_empty_strings():
    translator = FakeTranslator()
    client = TestClient(create_app(translator, FakeCache()))

    response = client.post(
        "/translate/batch",
        json={"source": "ru", "target": "kz", "texts": ["Первый", " ", "Первый", "Второй"], "domain": "rup"},
    )

    assert response.status_code == 200
    assert response.json()["texts"] == ["kz:Первый", "", "kz:Первый", "kz:Второй"]
    assert translator.calls == [["Первый", "Второй"]]


def test_batch_uses_cache_for_hits_and_writes_misses():
    translator = FakeTranslator()
    cache = FakeCache({"Первый": "cached:first"})
    client = TestClient(create_app(translator, cache))

    response = client.post(
        "/translate/batch",
        json={"source": "ru", "target": "kz", "texts": ["Первый", "Второй"], "domain": "lesson"},
    )

    assert response.status_code == 200
    assert response.json()["texts"] == ["cached:first", "kz:Второй"]
    assert response.json()["cacheHits"] == 1
    assert translator.calls == [["Второй"]]
    assert cache.writes == {"Второй": "kz:Второй"}


def test_rejects_unsupported_language():
    client = TestClient(create_app(FakeTranslator(), FakeCache()))

    response = client.post(
        "/translate",
        json={"source": "en", "target": "kz", "text": "Hello", "domain": "rup"},
    )

    assert response.status_code == 422


def test_batch_reports_model_not_ready_before_loading_translator():
    client = TestClient(create_app(NotReadyTranslator(), FakeCache()))

    response = client.post(
        "/translate/batch",
        json={"source": "ru", "target": "kz", "texts": ["Первый"], "domain": "rup"},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == {"code": "model_not_ready", "message": "missing model.bin"}
