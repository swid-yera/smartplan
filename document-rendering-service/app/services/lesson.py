from datetime import datetime
from pathlib import Path

from docxtpl import DocxTemplate

from app.config import LESSON_TEMPLATE_PATH, OUT_DIR
from app.helpers.slugify import slugify_ru
from app.logger import logger


def to_text_list(value) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        result = []
        for item in value:
            text = str(item).strip()
            if text:
                result.append(text)
        return result
    text = str(value).strip()
    return [text] if text else []


def to_multiline_text(value) -> str:
    items = to_text_list(value)
    if not items:
        return ""
    return "\n".join(items)


def map_progress_rows(rows: list[dict]) -> list[dict]:
    mapped: list[dict] = []
    for index, row in enumerate(rows):
        num = str(row.get("num", "")).strip() or str(index + 1)
        name = str(row.get("name", "")).strip()
        content = to_multiline_text(row.get("content", ""))
        mapped.append({"num": num, "name": name, "content": content})
    return mapped


def generate_lesson_docx(data: dict) -> Path:
    OUT_DIR.mkdir(exist_ok=True)

    logger.info("generating lesson document, mapping data from json")

    discipline_name = str(data.get("discipline_name", "")).strip()
    if discipline_name:
        discipline_name = f" / {discipline_name}"

    context = {
        "rup_name": str(data.get("rup_name", "")).strip(),
        "discipline_name": discipline_name,
        "topic_name": str(data.get("topic_name", "")).strip(),
        "teacher_name": str(data.get("teacher_name", "")).strip(),
        "event_date": str(data.get("event_date", "")).strip(),
        "course": data.get("course", ""),
        "group_name": str(data.get("group_name", "")).strip(),
        "type": str(data.get("type", "")).strip(),
        "goals": str(data.get("goals", "")).strip(),
        "tasks": str(data.get("tasks", "")).strip(),
        "expected": str(data.get("expected", "")).strip(),
        "internet_resources": to_multiline_text(data.get("internet_resources")),
        "technical_resources": to_multiline_text(data.get("technical_resources")),
        "lesson_progress": map_progress_rows(data.get("lesson_progress", [])),
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

    return output_path
