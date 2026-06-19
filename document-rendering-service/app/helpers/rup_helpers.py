import json
import re


# zero to empty from 0 to ""
def zero_to_empty(value):
    return "" if value == 0 else value


# study form enum
STUDY_FORM_MAP = {
    "ru": {
        "FULL_TIME": "очная",
        "CORRESPONDENCE": "заочная",
    },
    "kz": {
        "FULL_TIME": "күндізгі",
        "CORRESPONDENCE": "сырттай",
    },
}


# decode study form from enum key to text value
def decode_study_form(value: str, language: str = "ru") -> str:
    lang = normalize_language(language)
    return STUDY_FORM_MAP.get(lang, STUDY_FORM_MAP["ru"]).get(value, value)


# short name
def short_name(first_name: str | None, last_name: str | None) -> str:
    if not first_name or not last_name:
        return ""

    return f"{first_name[0].upper()}. {last_name}"


# lesson type
LESSON_TYPE_MAP = {
    "ru": {
        "COMBINED": "комбинированный",
        "PRACTICAL": "лабораторно-практический",
        "SNZ": "СНЗ",
        "SRSP": "СРСП",
    },
    "kz": {
        "COMBINED": "аралас",
        "PRACTICAL": "зертханалық-практикалық",
        "SNZ": "ОӨЖ",
        "SRSP": "СРСП",
    },
}


# decode lesson type from enum to text
def decode_lesson_type(value: str, language: str = "ru") -> str:
    lang = normalize_language(language)
    return LESSON_TYPE_MAP.get(lang, LESSON_TYPE_MAP["ru"]).get(value, value)


SUMMARY_LABELS = {
    "ru": {
        "discipline_total": "Всего часов:",
        "overall_total": "Итого часов:",
    },
    "kz": {
        "discipline_total": "Барлық сағат:",
        "overall_total": "Жалпы сағат:",
    },
}


def get_summary_label(key: str, language: str = "ru") -> str:
    lang = normalize_language(language)
    return SUMMARY_LABELS.get(lang, SUMMARY_LABELS["ru"]).get(key, SUMMARY_LABELS["ru"][key])


def normalize_language(value: str | None) -> str:
    normalized = (value or "").strip().lower()
    if normalized == "ru":
        return "ru"
    if normalized in {"kz", "kk"}:
        return "kz"
    return "ru"


LETTER_RE = re.compile(r"[A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүІі]")
SHORT_CODE_RE = re.compile(r"^[A-Za-zА-Яа-яЁё0-9._-]{1,8}$")


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+([,.;:])", r"\1", re.sub(r"\s+", " ", value or "")).strip()


def strip_wrapping_quotes(value: str) -> str:
    result = (value or "").strip()

    while len(result) >= 2 and (
        (result.startswith('"') and result.endswith('"'))
        or (result.startswith("'") and result.endswith("'"))
    ):
        result = result[1:-1].strip()

    return result


def looks_like_text_chunk(value: str) -> bool:
    normalized = strip_wrapping_quotes(value)
    if not LETTER_RE.search(normalized):
        return False

    letters_only = re.sub(r"[^A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүІі]", "", normalized)
    return len(letters_only) >= 3


def is_short_code_chunk(value: str) -> bool:
    normalized = strip_wrapping_quotes(value)
    return bool(normalized) and bool(SHORT_CODE_RE.match(normalized))


def extract_title_after_code_slash(value: str) -> str:
    parts = [part.strip() for part in value.split("/") if part.strip()]
    if len(parts) != 2:
        return value

    left, right = parts

    if is_short_code_chunk(left) and looks_like_text_chunk(right):
        return normalize_whitespace(strip_wrapping_quotes(right))

    if is_short_code_chunk(right) and looks_like_text_chunk(left):
        return normalize_whitespace(strip_wrapping_quotes(left))

    return value


def extract_text_from_structured_value(value: str) -> str:
    current = (value or "").strip()

    for _ in range(3):
        normalized = strip_wrapping_quotes(current)
        looks_like_json = (
            (normalized.startswith("{") and normalized.endswith("}"))
            or (normalized.startswith("[") and normalized.endswith("]"))
            or (normalized.startswith('"') and normalized.endswith('"'))
        )

        if not looks_like_json:
            return normalized

        try:
            parsed = json.loads(normalized)
        except Exception:
            return normalized

        if isinstance(parsed, str):
            current = parsed
            continue

        if isinstance(parsed, dict):
            for key in ("translatedText", "text", "name", "value", "ru", "kz"):
                candidate = parsed.get(key)
                if isinstance(candidate, str) and candidate.strip():
                    current = candidate
                    break
            else:
                return normalized
            continue

        return normalized

    return strip_wrapping_quotes(current)


def normalize_localized_string(value: str) -> str:
    normalized = normalize_whitespace(extract_text_from_structured_value(value))

    if "/" in normalized:
        normalized = extract_title_after_code_slash(normalized)

    return normalize_whitespace(strip_wrapping_quotes(normalized))


def locale_text(value, language: str = "ru") -> str:
    if isinstance(value, str):
        return normalize_localized_string(value)

    if not isinstance(value, dict):
        return ""

    lang = normalize_language(language)
    ru = normalize_localized_string(str(value.get("ru", "") or ""))
    kz = normalize_localized_string(str(value.get("kz", "") or ""))

    if not ru and not kz:
        for key in ("translatedText", "text", "name", "value"):
            candidate = value.get(key)
            if isinstance(candidate, str) and candidate.strip():
                return normalize_localized_string(candidate)

    if lang == "kz":
        return kz or ru
    return ru or kz
