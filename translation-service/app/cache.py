from __future__ import annotations

from dataclasses import dataclass
import hashlib
from typing import Iterable

import redis


@dataclass(frozen=True)
class CacheResult:
    values: list[str | None]
    hits: int


class TranslationCache:
    def __init__(
        self,
        redis_url: str,
        ttl_seconds: int,
        key_prefix: str = "translation:v1",
    ) -> None:
        self.ttl_seconds = ttl_seconds
        self.key_prefix = key_prefix
        self.client = redis.Redis.from_url(redis_url, decode_responses=True)

    def health(self) -> bool:
        try:
            return bool(self.client.ping())
        except redis.RedisError:
            return False

    def key(self, model: str, source: str, target: str, text: str) -> str:
        digest = hashlib.sha256(text.strip().encode("utf-8")).hexdigest()
        return f"{self.key_prefix}:{model}:{source}:{target}:{digest}"

    def get_many(self, model: str, source: str, target: str, texts: Iterable[str]) -> CacheResult:
        keys = [self.key(model, source, target, text) for text in texts]
        if not keys:
            return CacheResult(values=[], hits=0)

        try:
            values = self.client.mget(keys)
        except redis.RedisError:
            return CacheResult(values=[None] * len(keys), hits=0)

        hits = sum(1 for value in values if value is not None)
        return CacheResult(values=values, hits=hits)

    def set_many(self, model: str, source: str, target: str, pairs: dict[str, str]) -> None:
        if not pairs:
            return

        try:
            pipe = self.client.pipeline()
            for text, translated in pairs.items():
                pipe.setex(self.key(model, source, target, text), self.ttl_seconds, translated)
            pipe.execute()
        except redis.RedisError:
            return


class NullTranslationCache:
    def health(self) -> bool:
        return False

    def get_many(self, model: str, source: str, target: str, texts: Iterable[str]) -> CacheResult:
        return CacheResult(values=[None for _ in texts], hits=0)

    def set_many(self, model: str, source: str, target: str, pairs: dict[str, str]) -> None:
        return None
