from docxtpl import DocxTemplate
from datetime import datetime
from pathlib import Path

from app.logger import logger
from app.config import OUT_DIR, TEMPLATE_PATH

from app.helpers.rup_helpers import decode_study_form, locale_text, normalize_language, zero_to_empty
from app.helpers.slugify import slugify_ru
from app.mappers import (
    build_contacts,
    build_content_table,
    build_developers,
    build_disciplines_table,
    build_resources,
)
from app.post_process import apply_vertical_merge


def generate_rup_docx(data: dict) -> Path:
    OUT_DIR.mkdir(exist_ok=True)

    # mapping data from json
    logger.info("generating rup document, mapping data from json")

    language = normalize_language(data.get("language") or data.get("locale"))
    rup_name = locale_text(data.get("name", ""), language)
    totalHours = int(data.get("totalHours"))
    totalCredits = int(totalHours / 24)

    group = data.get("group") or {}

    contacts = build_contacts(data.get("contacts", []))
    developers = build_developers(data.get("contacts", []))

    explorationNote = data.get("explorationNote") or {}
    internet_resources = build_resources(explorationNote.get("internetResources"), language)
    technical_resources = build_resources(explorationNote.get("technicalResources"), language)

    disciplines, semesters_total = build_disciplines_table(data.get("disciplines", []), language)
    content_table = build_content_table(data.get("disciplines", []), language)

    # context
    context = {
        # base information
        "name": rup_name,
        "specialty": locale_text(group.get("specialty"), language),
        "qualification": locale_text(group.get("qualification"), language),
        "form": decode_study_form(data.get("studyForm", "")),
        "totalHours": totalHours,
        "credits": totalCredits,
        "course": data.get("course", 0),
        "group_name": locale_text(group.get("name"), language),
        # developers
        "developer1": developers[0],
        "developer2": developers[1],
        "developer3": developers[2],
        # exploration note
        "basis": locale_text(explorationNote.get("basis", ""), language),
        "goals": locale_text(explorationNote.get("goals", ""), language),
        "competencies": locale_text(explorationNote.get("competencies", ""), language),
        "prerequisites": locale_text(explorationNote.get("prerequisites", ""), language),
        "postrequisites": locale_text(explorationNote.get("postrequisites", ""), language),
        # resources
        "internet_resources": internet_resources,
        "technical_resources": technical_resources,
        # contacts
        "contacts": contacts,
        # distribution
        "disciplines": disciplines,
        # semesters total
        "sem1total": zero_to_empty(semesters_total[0]),
        "sem2total": zero_to_empty(semesters_total[1]),
        "sem3total": zero_to_empty(semesters_total[2]),
        "sem4total": zero_to_empty(semesters_total[3]),
        "sem5total": zero_to_empty(semesters_total[4]),
        "sem6total": zero_to_empty(semesters_total[5]),
        "sem7total": zero_to_empty(semesters_total[6]),
        "sem8total": zero_to_empty(semesters_total[7]),
        # topics
        "content_table": content_table,
    }

    # render
    logger.info("generating rup document, rendering document: %s", rup_name)
    doc = DocxTemplate(TEMPLATE_PATH)
    doc.render(context)

    # save
    logger.info("generating rup document, saving document: %s", rup_name)

    slug = slugify_ru(rup_name[:13])
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"{slug}_{timestamp}.docx"
    output_path = OUT_DIR / filename

    doc.save(output_path)

    # merge columns
    logger.info("generating rup document, applying vertical merge: %s", rup_name)
    apply_vertical_merge(output_path)

    return output_path
