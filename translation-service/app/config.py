from functools import lru_cache
import os


class Settings:
    def __init__(self) -> None:
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0").strip()
        self.model_path = os.getenv(
            "NLLB_MODEL_PATH",
            "/models/nllb-200-distilled-600M-ct2-int8",
        ).strip()
        self.tokenizer_name = os.getenv("NLLB_TOKENIZER_NAME", self.model_path).strip()
        self.model_name = os.getenv(
            "TRANSLATION_MODEL_NAME",
            "nllb-200-distilled-600M-ct2-int8",
        ).strip()
        self.compute_type = os.getenv("TRANSLATION_COMPUTE_TYPE", "int8").strip()
        self.cache_ttl_seconds = int(os.getenv("TRANSLATION_CACHE_TTL_SECONDS", "2592000"))


@lru_cache
def get_settings() -> Settings:
    return Settings()
