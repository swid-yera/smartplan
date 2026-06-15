from __future__ import annotations

from typing import Protocol

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.cache import NullTranslationCache, TranslationCache
from app.config import get_settings
from app.translator import NLLBTranslator, SUPPORTED_LANGUAGES, TranslationRequest


class CacheLike(Protocol):
    def health(self) -> bool: ...
    def get_many(self, model: str, source: str, target: str, texts: list[str]): ...
    def set_many(self, model: str, source: str, target: str, pairs: dict[str, str]) -> None: ...


class TranslatorLike(Protocol):
    model_name: str
    def health(self) -> bool: ...
    def translate_batch(self, req: TranslationRequest) -> list[str]: ...


class TranslateTextRequest(BaseModel):
    source: str
    target: str
    text: str
    domain: str = "rup"

    @field_validator("source", "target")
    @classmethod
    def validate_language(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in SUPPORTED_LANGUAGES:
            raise ValueError("supported languages are ru and kz")
        return normalized


class TranslateBatchRequest(BaseModel):
    source: str
    target: str
    texts: list[str] = Field(default_factory=list)
    domain: str = "rup"

    @field_validator("source", "target")
    @classmethod
    def validate_language(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in SUPPORTED_LANGUAGES:
            raise ValueError("supported languages are ru and kz")
        return normalized


class TranslateTextResponse(BaseModel):
    text: str
    model: str
    cacheHits: int


class TranslateBatchResponse(BaseModel):
    texts: list[str]
    model: str
    cacheHits: int


def create_app(translator: TranslatorLike | None = None, cache: CacheLike | None = None) -> FastAPI:
    settings = get_settings()
    if translator is None:
        translator = NLLBTranslator(
            model_path=settings.model_path,
            tokenizer_name=settings.tokenizer_name,
            model_name=settings.model_name,
            compute_type=settings.compute_type,
        )
    if cache is None:
        try:
            cache = TranslationCache(settings.redis_url, settings.cache_ttl_seconds)
        except Exception:
            cache = NullTranslationCache()

    app = FastAPI(title="Eduplan Translation Service")

    @app.get("/health")
    def health():
        model_ready = translator.health()
        redis_ready = cache.health()
        model_error = None
        readiness_error = getattr(translator, "readiness_error", None)
        if callable(readiness_error):
            model_error = readiness_error()

        return {
            "status": "ok" if model_ready and redis_ready else "degraded",
            "model": translator.model_name,
            "modelReady": model_ready,
            "redisReady": redis_ready,
            "modelError": model_error,
        }

    @app.post("/translate", response_model=TranslateTextResponse)
    def translate(req: TranslateTextRequest):
        batch_response = translate_batch(
            TranslateBatchRequest(
                source=req.source,
                target=req.target,
                texts=[req.text],
                domain=req.domain,
            ),
        )
        return TranslateTextResponse(
            text=batch_response.texts[0] if batch_response.texts else "",
            model=batch_response.model,
            cacheHits=batch_response.cacheHits,
        )

    @app.post("/translate/batch", response_model=TranslateBatchResponse)
    def translate_batch(req: TranslateBatchRequest):
        if req.source == req.target:
            return TranslateBatchResponse(texts=req.texts, model=translator.model_name, cacheHits=0)

        normalized_texts = [text.strip() for text in req.texts]
        output: list[str | None] = ["" if text == "" else None for text in normalized_texts]
        indexed_unique: dict[str, list[int]] = {}
        for index, text in enumerate(normalized_texts):
            if text == "":
                continue
            indexed_unique.setdefault(text, []).append(index)

        unique_texts = list(indexed_unique.keys())
        cache_result = cache.get_many(translator.model_name, req.source, req.target, unique_texts)
        misses: list[str] = []
        for text, cached in zip(unique_texts, cache_result.values):
            if cached is None:
                misses.append(text)
                continue
            for index in indexed_unique[text]:
                output[index] = cached

        if misses:
            readiness_error = getattr(translator, "readiness_error", None)
            if callable(readiness_error):
                model_error = readiness_error()
                if model_error is not None:
                    raise HTTPException(
                        status_code=503,
                        detail={"code": "model_not_ready", "message": model_error},
                    )

            try:
                translated = translator.translate_batch(
                    TranslationRequest(source=req.source, target=req.target, texts=misses),
                )
            except Exception as exc:
                raise HTTPException(status_code=503, detail={"code": "translation_failed", "message": str(exc)}) from exc

            if len(translated) != len(misses):
                raise HTTPException(
                    status_code=502,
                    detail={"code": "invalid_translation_response", "message": "translation count mismatch"},
                )

            cache_pairs = dict(zip(misses, translated))
            cache.set_many(translator.model_name, req.source, req.target, cache_pairs)
            for text, translated_text in cache_pairs.items():
                for index in indexed_unique[text]:
                    output[index] = translated_text

        return TranslateBatchResponse(
            texts=[text or "" for text in output],
            model=translator.model_name,
            cacheHits=cache_result.hits,
        )

    return app


app = create_app()
