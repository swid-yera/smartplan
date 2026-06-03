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
        "PRACTICAL": "практический",
        "SNZ": "СНЗ",
    },
    "kz": {
        "COMBINED": "аралас",
        "PRACTICAL": "практикалық",
        "SNZ": "ОӨЖ",
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


def locale_text(value, language: str = "ru") -> str:
    if isinstance(value, str):
        return value.strip()

    if not isinstance(value, dict):
        return ""

    lang = normalize_language(language)
    ru = str(value.get("ru", "") or "").strip()
    kz = str(value.get("kz", "") or "").strip()

    if lang == "kz":
        return kz or ru
    return ru or kz
