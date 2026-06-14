from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from threading import Lock


SUPPORTED_LANGUAGES = {
    "ru": "rus_Cyrl",
    "kz": "kaz_Cyrl",
}

REQUIRED_MODEL_FILES = ("model.bin", "config.json")
REQUIRED_TOKENIZER_FILES = ("tokenizer_config.json", "special_tokens_map.json")
TOKENIZER_MODEL_FILES = ("sentencepiece.bpe.model", "tokenizer.json")


@dataclass(frozen=True)
class TranslationRequest:
    source: str
    target: str
    texts: list[str]


class NLLBTranslator:
    def __init__(
        self,
        model_path: str,
        tokenizer_name: str,
        model_name: str,
        compute_type: str,
    ) -> None:
        self.model_path = model_path
        self.tokenizer_name = tokenizer_name
        self.model_name = model_name
        self.compute_type = compute_type
        self._translator = None
        self._tokenizer = None
        self._lock = Lock()
        self._translate_lock = Lock()

    def health(self) -> bool:
        return self.readiness_error() is None

    def readiness_error(self) -> str | None:
        model_dir = Path(self.model_path)
        if not model_dir.exists():
            return f"model directory does not exist: {model_dir}"
        if not model_dir.is_dir():
            return f"model path is not a directory: {model_dir}"

        missing_model_files = [name for name in REQUIRED_MODEL_FILES if not (model_dir / name).is_file()]
        if missing_model_files:
            return (
                f"CTranslate2 model is incomplete at {model_dir}: missing "
                f"{', '.join(missing_model_files)}. Run translation-service/prepare-model.ps1 "
                "or translation-service/prepare-model.sh, then rebuild/restart the container."
            )

        tokenizer_dir = Path(self.tokenizer_name)
        if tokenizer_dir.exists() and tokenizer_dir.is_dir():
            missing_tokenizer_files = [name for name in REQUIRED_TOKENIZER_FILES if not (tokenizer_dir / name).is_file()]
            has_tokenizer_model = any((tokenizer_dir / name).is_file() for name in TOKENIZER_MODEL_FILES)
            if missing_tokenizer_files or not has_tokenizer_model:
                missing = missing_tokenizer_files
                if not has_tokenizer_model:
                    missing.append("sentencepiece.bpe.model or tokenizer.json")
                return f"tokenizer files are incomplete at {tokenizer_dir}: missing {', '.join(missing)}"

        return None

    def translate_batch(self, req: TranslationRequest) -> list[str]:
        readiness_error = self.readiness_error()
        if readiness_error is not None:
            raise RuntimeError(readiness_error)

        source_code = SUPPORTED_LANGUAGES[req.source]
        target_code = SUPPORTED_LANGUAGES[req.target]
        translator, tokenizer = self._load()

        with self._translate_lock:
            tokenizer.src_lang = source_code
            encoded = tokenizer(req.texts, return_attention_mask=False)
            source_tokens = [tokenizer.convert_ids_to_tokens(ids) for ids in encoded["input_ids"]]
            target_prefix = [[target_code] for _ in req.texts]

            results = translator.translate_batch(source_tokens, target_prefix=target_prefix)
            translations: list[str] = []
            for result in results:
                tokens = result.hypotheses[0]
                if tokens and tokens[0] == target_code:
                    tokens = tokens[1:]
                text = tokenizer.decode(tokenizer.convert_tokens_to_ids(tokens), skip_special_tokens=True)
                translations.append(text.strip())
            return translations

    def _load(self):
        if self._translator is not None and self._tokenizer is not None:
            return self._translator, self._tokenizer

        with self._lock:
            if self._translator is not None and self._tokenizer is not None:
                return self._translator, self._tokenizer

            import ctranslate2
            from transformers import AutoTokenizer

            self._translator = ctranslate2.Translator(self.model_path, device="cpu", compute_type=self.compute_type)
            self._tokenizer = AutoTokenizer.from_pretrained(self.tokenizer_name)
            return self._translator, self._tokenizer
