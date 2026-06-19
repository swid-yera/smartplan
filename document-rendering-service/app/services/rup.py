import io
from docxtpl import DocxTemplate
from datetime import datetime
from pathlib import Path

import qrcode
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.shared import Inches, Pt
from docx.text.paragraph import Paragraph
from qrcode.constants import ERROR_CORRECT_M

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
from app.post_process import apply_kazakh_template_localization, apply_vertical_merge


TABLE_ANCHOR = "Заведующий отделением"
QR_BLOCK_OFFSET = Inches(1.85)
QR_NOTE_TEXT = {
    "ru": "Проверить подлинность электронного документа Вы можете на kripto.aspc.kz",
    "kz": "Электрондық құжаттың түпнұсқалығын kripto.aspc.kz сайтында тексере аласыз",
}
RUP_TITLE_TEXT = {
    "ru": "Пояснительная записка",
    "kz": "Түсіндірме жазба",
}


def insert_paragraph_after(paragraph: Paragraph) -> Paragraph:
    new_paragraph = OxmlElement("w:p")
    paragraph._p.addnext(new_paragraph)
    return Paragraph(new_paragraph, paragraph._parent)


def insert_paragraph_after_table(table, document: Document) -> Paragraph:
    new_paragraph = OxmlElement("w:p")
    table._tbl.addnext(new_paragraph)
    return Paragraph(new_paragraph, document._body)


def remove_paragraph(paragraph: Paragraph) -> None:
    parent = paragraph._p.getparent()
    if parent is not None:
        parent.remove(paragraph._p)


def find_paragraph_index(doc: Document, candidates: tuple[str, ...]) -> int | None:
    normalized_candidates = {candidate.strip() for candidate in candidates if candidate.strip()}
    for index, paragraph in enumerate(doc.paragraphs):
        if paragraph.text.strip() in normalized_candidates:
            return index
    return None


def find_anchor_table(doc: Document, candidates: tuple[str, ...]):
    normalized_candidates = {candidate.strip() for candidate in candidates if candidate.strip()}
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                if cell.text.strip() in normalized_candidates:
                    return table
    return None


def collect_verification_urls(data: dict) -> list[str]:
    urls: list[str] = []

    plural_urls = data.get("verificationUrls")
    if isinstance(plural_urls, list):
        for item in plural_urls:
            url = str(item or "").strip()
            if url:
                urls.append(url)

    single_url = str(data.get("verificationUrl") or "").strip()
    if single_url:
        urls.append(single_url)

    # Keep order stable and remove duplicates while preserving the first occurrence.
    seen: set[str] = set()
    unique_urls: list[str] = []
    for url in urls:
        if url in seen:
            continue
        seen.add(url)
        unique_urls.append(url)

    return unique_urls


def append_verification_qr(file_path: Path, data: dict, language: str) -> None:
    urls = collect_verification_urls(data)
    if not urls:
        return

    selected_language = normalize_language(language)
    doc = Document(file_path)
    anchor_table = find_anchor_table(doc, (TABLE_ANCHOR, "Бөлімше меңгерушісі"))
    cursor = insert_paragraph_after_table(anchor_table, doc) if anchor_table else doc.add_paragraph()

    for index, url in enumerate(urls):
        indent = QR_BLOCK_OFFSET * index

        if index > 0:
            cursor = insert_paragraph_after(cursor)

        text_paragraph = cursor
        text_paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
        text_paragraph.paragraph_format.left_indent = indent
        text_paragraph.paragraph_format.first_line_indent = Pt(0)
        text_paragraph.paragraph_format.space_before = Pt(10)
        text_paragraph.paragraph_format.space_after = Pt(10)
        text_run = text_paragraph.add_run("Проверить подлинность электронного документа Вы можете на kripto.aspc.kz")
        text_run.font.name = "Times New Roman"
        text_run.font.size = Pt(10)

        qr_paragraph = insert_paragraph_after(text_paragraph)
        qr_paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
        qr_paragraph.paragraph_format.left_indent = indent
        qr_paragraph.paragraph_format.first_line_indent = Pt(0)
        qr_paragraph.paragraph_format.space_before = Pt(0)
        qr_paragraph.paragraph_format.space_after = Pt(0)

        qr = qrcode.QRCode(error_correction=ERROR_CORRECT_M, box_size=8, border=2)
        qr.add_data(url)
        qr.make(fit=True)

        image = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        buffer.seek(0)

        qr_run = qr_paragraph.add_run()
        qr_run.add_picture(buffer, width=Inches(1.85))

        cursor = qr_paragraph

    title_index = find_paragraph_index(doc, (RUP_TITLE_TEXT["ru"], RUP_TITLE_TEXT["kz"]))
    if title_index is not None:
        paragraph = doc.paragraphs[title_index]
        paragraph.paragraph_format.page_break_before = True
        paragraph.paragraph_format.space_before = Pt(0)
        paragraph.paragraph_format.space_after = Pt(0)

    try:
        qr_note_prefix = QR_NOTE_TEXT[selected_language].split(" на ")[0]
        qr_index = next(
            i
            for i, paragraph in enumerate(doc.paragraphs)
            if paragraph.text.strip()
            and paragraph.text.strip().startswith(qr_note_prefix)
        )
        if title_index is None:
            raise ValueError("title paragraph was not found")
        for paragraph in list(doc.paragraphs[qr_index + 1:title_index]):
            if paragraph.text.strip() == "" and not paragraph._p.xpath('.//w:drawing'):
                remove_paragraph(paragraph)
    except (StopIteration, ValueError):
        pass

    doc.save(file_path)


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
        "form": decode_study_form(data.get("studyForm", ""), language),
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
    apply_kazakh_template_localization(output_path, language)
    append_verification_qr(output_path, data, language)

    return output_path
