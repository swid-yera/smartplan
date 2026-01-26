from docxtpl import DocxTemplate
from datetime import datetime
from pathlib import Path

from app.logger import logger
from app.config import OUT_DIR, LESSON_TEMPLATE_PATH

from app.helpers.slugify import slugify_ru
from app.mappers import (
    build_resources,
)
from app.post_process import apply_vertical_merge


def generate_rup_docx(data: dict) -> Path:
    OUT_DIR.mkdir(exist_ok=True)

    print(data)

    # mapping data from json
    logger.info("generating lesson document, mapping data from json")

    topic_name = data.get("topicName", "")

    # TODO: localize date
    eventDate = data.get("eventDate", "")
    lessonType = data.get("type", "")

    group = data.get("group")

    teacher = data.get("teacher")
    teacher_name = (
        teacher.get("firstName", "")
        + " "
        + teacher.get(
            "lastName",
        )
    )

    internet_resources = build_resources(data.get("internetResources"))
    technical_resources = build_resources(data.get("technicalResources"))

    lesson_progress = data.get("lessonProgress", "")

    # context
    context = {
        "rup_name": data.get("rupName", ""),
        "topic_name": topic_name,
        "teacher_name": teacher_name,
        "event_date": eventDate,
        "course": data.get("course", 0),
        "group_name": group.get("name"),
        "type": lessonType,
        "goals": data.get("goals", ""),
        "tasks": data.get("tasks", ""),
        "expected": data.get("expected", ""),
        "internet_resources": internet_resources,
        "technical_resources": technical_resources,
        "lesson_progress": lesson_progress,
    }

    # render
    logger.info("generating lesson document, rendering document: %s", topic_name)
    doc = DocxTemplate(LESSON_TEMPLATE_PATH)
    doc.render(context)

    # save
    logger.info("generating lesson document, saving document: %s", topic_name)

    slug = slugify_ru(topic_name[:13])
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"lesson_{slug}_{timestamp}.docx"
    output_path = OUT_DIR / filename

    doc.save(output_path)

    # merge columns
    logger.info("generating lesson document, applying vertical merge: %s", topic_name)
    apply_vertical_merge(output_path)

    return output_path
