from datetime import datetime
from pathlib import Path

from docxtpl import DocxTemplate

from app.config import LESSON_TEMPLATE_PATH, OUT_DIR
from app.helpers.rup_helpers import locale_text, normalize_language
from app.helpers.slugify import slugify_ru
from app.logger import logger
from app.post_process import apply_kazakh_lesson_template_localization


def to_text_list(value, language: str = "ru") -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        result = []
        for item in value:
            text = locale_text(item, language)
            if text:
                result.append(text)
        return result
    text = locale_text(value, language)
    return [text] if text else []


def to_multiline_text(value, language: str = "ru") -> str:
    items = to_text_list(value, language)
    if not items:
        return ""
    return "\n".join(items)


def to_int(value, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def first_list_number(value, default: int = 0) -> int:
    if isinstance(value, list):
        if not value:
            return default
        return to_int(value[0], default)
    return to_int(value, default)


def extract_step_times(row: dict, fallback: tuple[int, int, int]) -> tuple[int, int, int]:
    first_time = first_list_number(row.get("first_time"), fallback[0])
    second_time = first_list_number(row.get("second_time"), fallback[1])
    third_time = first_list_number(row.get("third_time"), fallback[2])

    return first_time, second_time, third_time


def map_progress_rows(rows: list[dict]) -> list[dict]:
    language = str(rows[0].get("_language", "ru")).strip().lower() if rows else "ru"
    fixed_names_map = {
        "ru": [
            "Организационно-\nмотивационный момент",
            "Актуализация знаний",
            "Формирование новых\nзнаний и навыков",
            "Закрепление новой темы",
            "Рефлексия",
            "Оценивание",
            "Домашнее задание",
        ],
        "kz": [
            "Ұйымдастыру-\nынталандыру кезеңі",
            "Білімді өзектендіру",
            "Жаңа білім мен\nдағдыларды қалыптастыру",
            "Жаңа тақырыпты бекіту",
            "Рефлексия",
            "Бағалау",
            "Үй тапсырмасы",
        ],
    }
    fixed_names = fixed_names_map.get(language, fixed_names_map["ru"])
    fixed_times = [
        [5, 10, 15],
        [15, 10, 10],
        [40, 35, 30],
        [15, 15, 15],
        [7, 8, 8],
        [5, 7, 7],
        [3, 5, 5],
    ]
    mapped: list[dict] = []
    for i, name in enumerate(fixed_names):
        fallback_times = fixed_times[i]
        row = rows[i] if i < len(rows) else {}
        first_time, second_time, third_time = extract_step_times(row, tuple(fallback_times))
        time_str = f"{first_time}/{second_time}/{third_time}мин."
        resolved_name = locale_text(row.get("name", ""), language) or name
        content = to_multiline_text(row.get("content", []), language)
        mapped.append({
            "num": str(i + 1),
            "name": f"{resolved_name}\n{time_str}",
            "content": content,
        })
    return mapped


def generate_lesson_docx(data: dict) -> Path:
    OUT_DIR.mkdir(exist_ok=True)

    logger.info("generating lesson document, mapping data from json")
    language = normalize_language(data.get("language") or data.get("locale"))
    rup_name = locale_text(data.get("rup_name", ""), language)
    discipline_name = locale_text(data.get("discipline_name", ""), language)
    topic_name = locale_text(data.get("topic_name", ""), language)
    module_name = discipline_name or rup_name or topic_name
    ro_code = rup_name if rup_name and rup_name != module_name else ""

    context = {
        "college": "КГКП «ALMATY POLYTECHNIC COLLEGE»",
        "plan_num": str(data.get("plan_num", "47")),
        "topic_name": topic_name,
        "module_name": module_name,
        "ro_code": ro_code,
        "teacher_name": locale_text(data.get("teacher_name", ""), language),
        "event_date": str(data.get("event_date", "")).strip(),
        "course": data.get("course", ""),
        "group_name": str(data.get("group_name", "")).strip(),
        "type": locale_text(data.get("type", ""), language),
        "goals": locale_text(data.get("goals", ""), language),
        "tasks": locale_text(data.get("tasks", ""), language),
        "expected": locale_text(data.get("expected", ""), language),
        "internet_resources": to_multiline_text(data.get("internet_resources"), language),
        "technical_resources": to_multiline_text(data.get("technical_resources"), language),
        "lesson_progress": map_progress_rows(
            [{**row, "_language": language} for row in data.get("lesson_progress", [])]
        ),
    }

    logger.info("generating lesson document, rendering template")
    doc = DocxTemplate(LESSON_TEMPLATE_PATH)
    doc.render(context)

    lesson_name = context["topic_name"] or "lesson"
    slug = slugify_ru(lesson_name[:24])
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    file_name = f"lesson_{slug}_{timestamp}.docx"
    output_path = OUT_DIR / file_name

    logger.info("generating lesson document, saving to %s", output_path)
    doc.save(output_path)
    apply_kazakh_lesson_template_localization(output_path, language)

    return output_path
