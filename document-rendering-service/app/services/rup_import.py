import re
import zipfile
from io import BytesIO
from xml.etree import ElementTree as ET


WORD_NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
MAX_DOCX_BYTES = 15 * 1024 * 1024


class RupImportParseError(ValueError):
    pass


def parse_rup_docx(content: bytes, filename: str | None = None) -> dict:
    if not content:
        raise RupImportParseError("empty docx file")
    if len(content) > MAX_DOCX_BYTES:
        raise RupImportParseError("docx file is too large")

    blocks = _read_document_blocks(content)
    paragraphs = [block["text"] for block in blocks if block["type"] == "p" and block["text"]]
    tables = [block["rows"] for block in blocks if block["type"] == "tbl"]
    all_text = "\n".join(paragraphs + [_flatten_table_text(table) for table in tables] + [filename or ""])
    warnings: list[str] = []

    info = _parse_info_table(tables, warnings)
    exploration = _parse_exploration_note(paragraphs, warnings)
    disciplines = _parse_disciplines(tables, warnings)

    study_year_suggestion = _extract_study_year(all_text)
    if not study_year_suggestion:
        warnings.append("studyYearSuggestion was not found in document")

    if not disciplines:
        raise RupImportParseError("discipline table was not found or has no parseable rows")

    name = info.get("name", "")
    if not name:
        raise RupImportParseError("module name was not found")

    course_suggestion = info.get("courseSuggestion", 0)
    if not course_suggestion:
        warnings.append("courseSuggestion was not found in document")

    groups_raw = info.get("groupsRaw", [])
    if not groups_raw:
        warnings.append("groupsRaw was not found in document")

    return {
        "sourceLanguage": "ru",
        "name": _locale_text(name),
        "type": "THEORY",
        "studyForm": info.get("studyForm") or "FULL_TIME",
        "totalHours": info.get("totalHours") or _sum_discipline_hours(disciplines),
        "courseSuggestion": course_suggestion,
        "studyYearSuggestion": study_year_suggestion,
        "groupsRaw": groups_raw,
        "specialtyRaw": info.get("specialtyRaw", ""),
        "qualificationRaw": info.get("qualificationRaw", ""),
        "developersRaw": info.get("developersRaw", []),
        "explorationNote": exploration,
        "disciplines": disciplines,
        "warnings": _dedupe(warnings),
    }


def _read_document_blocks(content: bytes) -> list[dict]:
    try:
        with zipfile.ZipFile(BytesIO(content)) as archive:
            document_xml = archive.read("word/document.xml")
    except KeyError as exc:
        raise RupImportParseError("word/document.xml was not found in docx") from exc
    except zipfile.BadZipFile as exc:
        raise RupImportParseError("invalid docx archive") from exc

    try:
        root = ET.fromstring(document_xml)
    except ET.ParseError as exc:
        raise RupImportParseError("invalid document.xml") from exc

    body = root.find("w:body", WORD_NS)
    if body is None:
        raise RupImportParseError("document body was not found")

    blocks: list[dict] = []
    for child in list(body):
        tag = _local_name(child.tag)
        if tag == "p":
            text = _element_text(child)
            blocks.append({"type": "p", "text": text})
        elif tag == "tbl":
            rows: list[list[str]] = []
            for row in child.findall("w:tr", WORD_NS):
                cells = [_element_text(cell) for cell in row.findall("w:tc", WORD_NS)]
                rows.append(cells)
            blocks.append({"type": "tbl", "rows": rows})

    return blocks


def _parse_info_table(tables: list[list[list[str]]], warnings: list[str]) -> dict:
    info_table = next(
        (
            table
            for table in tables
            if "специальность" in _normalize(_flatten_table_text(table))
            and "квалификация" in _normalize(_flatten_table_text(table))
            and "форма обучения" in _normalize(_flatten_table_text(table))
        ),
        None,
    )
    if not info_table:
        raise RupImportParseError("main information table was not found")

    result = {
        "name": "",
        "specialtyRaw": "",
        "qualificationRaw": "",
        "studyForm": "FULL_TIME",
        "totalHours": 0,
        "courseSuggestion": 0,
        "groupsRaw": [],
        "developersRaw": [],
    }

    for row in info_table:
        row_text = _normalize(" ".join(row))
        nonempty = [cell for cell in row if cell]

        if not result["name"] and nonempty and "наименование модуля" not in row_text:
            candidate = nonempty[0]
            if not _looks_like_label(candidate) and len(candidate) > 8:
                result["name"] = candidate

        if "специальность" in row_text:
            result["specialtyRaw"] = _value_after_label(row, "специальность")
        elif "квалификация" in row_text:
            result["qualificationRaw"] = _value_after_label(row, "квалификация")
        elif "форма обучения" in row_text:
            form_raw = _value_after_label(row, "форма обучения")
            result["studyForm"] = _map_study_form(form_raw)
        elif "общее количество часов" in row_text:
            result["totalHours"] = _int_after_label(row, "общее количество часов")
            result["courseSuggestion"] = _int_after_label(row, "курс")
            groups_raw = _value_after_label(row, "группа")
            result["groupsRaw"] = _split_raw_values(groups_raw)
        elif "разработчик" in row_text:
            result["developersRaw"] = [
                cell
                for cell in nonempty
                if "разработчик" not in _normalize(cell) and "подпись" not in _normalize(cell)
            ]

    if not result["studyForm"]:
        warnings.append("studyForm was not recognized, FULL_TIME was used")
        result["studyForm"] = "FULL_TIME"

    return result


def _parse_exploration_note(paragraphs: list[str], warnings: list[str]) -> dict:
    empty = _locale_text("")
    note = {
        "basis": empty,
        "goals": empty,
        "competencies": empty,
        "prerequisites": empty,
        "postrequisites": empty,
        "internetResources": [],
        "technicalResources": [],
    }

    try:
        start = next(i for i, item in enumerate(paragraphs) if _normalize(item) == "пояснительная записка")
    except StopIteration:
        warnings.append("exploration note section was not found")
        return note

    lines = paragraphs[start + 1 :]
    stop_markers = ("контактные данные", "распределение часов")
    scoped: list[str] = []
    for line in lines:
        normalized = _normalize(line)
        if any(marker in normalized for marker in stop_markers):
            break
        scoped.append(line)

    for line in scoped:
        normalized = _normalize(line)
        if not note["basis"]["ru"] and normalized.startswith("рабочая учебная программа"):
            note["basis"] = _locale_text(line)
        elif normalized.startswith("цель"):
            note["goals"] = _locale_text(line)
        elif normalized.startswith("формируемые компетенции"):
            note["competencies"] = _locale_text(_strip_prefix(line, "Формируемые компетенции:"))
        elif normalized.startswith("пререквизиты"):
            note["prerequisites"] = _locale_text(_strip_prefix(line, "Пререквизиты:"))
        elif normalized.startswith("постреквизиты"):
            note["postrequisites"] = _locale_text(_strip_prefix(line, "Постреквизиты:"))

    internet_resources: list[str] = []
    technical_resources: list[str] = []
    current_section = ""
    skip_lines = {
        "необходимые средства обучения, оборудование:",
        "учебно-методическое оснащение, справочная литература/интернет-ресурсы:",
        "дополнительные ресурсы и руководства",
        "технические средства и материалы:",
    }

    for line in scoped:
        normalized = _normalize(line)
        if "учебно-методическое оснащение" in normalized or "интернет-ресурсы" in normalized:
            current_section = "internet"
            continue
        if "технические средства и материалы" in normalized:
            current_section = "technical"
            continue
        if normalized in skip_lines or _is_note_field_line(normalized):
            continue
        if current_section == "internet":
            internet_resources.append(line)
        elif current_section == "technical":
            technical_resources.append(line)

    note["internetResources"] = [{"name": _locale_text(item), "link": ""} for item in internet_resources]
    note["technicalResources"] = [{"name": _locale_text(item), "link": ""} for item in technical_resources]

    return note


def _parse_disciplines(tables: list[list[list[str]]], warnings: list[str]) -> list[dict]:
    distribution_table = next(
        (table for table in tables if "код и название дисциплины" in _normalize(_flatten_table_text(table))),
        None,
    )
    content_table = next(
        (table for table in tables if "критерии оценки" in _normalize(_flatten_table_text(table))),
        None,
    )

    disciplines_by_name: dict[str, dict] = {}
    if distribution_table:
        for row in distribution_table[4:]:
            cells = _pad(row, 10)
            name = cells[0]
            normalized_name = _normalize(name)
            if not name or "всего" in normalized_name or "общее количество" in normalized_name:
                continue
            if not normalized_name.startswith("ро"):
                continue

            semesters = [
                {"semester": semester_index + 1, "totalHours": _to_int(cells[semester_index + 2])}
                for semester_index in range(8)
            ]
            disciplines_by_name[_discipline_key(name)] = {
                "name": _locale_text(name),
                "semesters": semesters,
                "topics": [],
            }
    else:
        warnings.append("semester distribution table was not found")

    if content_table:
        current_key = ""
        for row in content_table[2:]:
            cells = _pad(row, 10)
            row_text = _normalize(" ".join(cells))
            if not row_text or "всего часов" in row_text or "итого часов" in row_text:
                continue

            discipline_name = cells[1]
            if discipline_name and _normalize(discipline_name).startswith("ро"):
                current_key = _discipline_key(discipline_name)
                disciplines_by_name.setdefault(
                    current_key,
                    {
                        "name": _locale_text(discipline_name),
                        "semesters": _empty_semesters(),
                        "topics": [],
                    },
                )

            if not current_key:
                continue

            topic_name = _clean_topic_name(cells[2])
            if not topic_name:
                continue

            theory_hours = _to_int(cells[4])
            practice_hours = _to_int(cells[5])
            individual_hours = _to_int(cells[6])
            srsp_hours = _to_int(cells[7])
            srs_hours = _to_int(cells[8])
            total_hours = _to_int(cells[3]) or theory_hours + practice_hours + individual_hours

            disciplines_by_name[current_key]["topics"].append(
                {
                    "name": _locale_text(topic_name),
                    "type": _map_topic_type(cells[9], theory_hours, practice_hours, individual_hours),
                    "theoryHours": theory_hours,
                    "practiceHours": practice_hours,
                    "individualHours": individual_hours,
                    "srspHours": srsp_hours,
                    "srsHours": srs_hours,
                    "totalHours": total_hours,
                }
            )
    else:
        warnings.append("content table was not found")

    disciplines = list(disciplines_by_name.values())
    for discipline in disciplines:
        if not discipline["topics"]:
            warnings.append(f"discipline has no parsed topics: {discipline['name']['ru']}")

    return disciplines


def _local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def _element_text(element: ET.Element) -> str:
    text = "".join(node.text or "" for node in element.findall(".//w:t", WORD_NS))
    return _clean_text(text)


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").replace("\xa0", " ")).strip()


def _normalize(value: str) -> str:
    return _clean_text(value).lower()


def _flatten_table_text(table: list[list[str]]) -> str:
    return " ".join(cell for row in table for cell in row if cell)


def _locale_text(value: str) -> dict:
    return {"ru": _clean_text(value), "kz": ""}


def _looks_like_label(value: str) -> bool:
    normalized = _normalize(value)
    return normalized.startswith("(") or normalized in {
        "специальность",
        "квалификация",
        "форма обучения",
        "общее количество часов",
        "разработчик (-и)",
    }


def _value_after_label(row: list[str], label: str) -> str:
    label = label.lower()
    for index, cell in enumerate(row):
        if label in _normalize(cell):
            for candidate in row[index + 1 :]:
                if candidate and label not in _normalize(candidate):
                    return candidate
    return ""


def _int_after_label(row: list[str], label: str) -> int:
    value = _value_after_label(row, label)
    return _to_int(value)


def _to_int(value: str | int | None) -> int:
    if isinstance(value, int):
        return value
    match = re.search(r"\d+", str(value or ""))
    return int(match.group(0)) if match else 0


def _map_study_form(value: str) -> str:
    normalized = _normalize(value)
    if "заоч" in normalized or "сырт" in normalized:
        return "CORRESPONDENCE"
    return "FULL_TIME"


def _map_topic_type(value: str, theory: int, practice: int, individual: int) -> str:
    normalized = _normalize(value)
    if "практи" in normalized:
        return "PRACTICAL"
    if "снз" in normalized:
        return "SNZ"
    if "комбин" in normalized:
        return "COMBINED"
    if practice > 0 and theory == 0 and individual == 0:
        return "PRACTICAL"
    return "COMBINED"


def _split_raw_values(value: str) -> list[str]:
    return [item.strip() for item in re.split(r"[,;/]+", value or "") if item.strip()]


def _extract_study_year(value: str) -> str:
    match = re.search(r"(20\d{2})\s*[-–]\s*(20\d{2})", value or "")
    return f"{match.group(1)}-{match.group(2)}" if match else ""


def _strip_prefix(value: str, prefix: str) -> str:
    if value.lower().startswith(prefix.lower()):
        return value[len(prefix) :].strip()
    return value


def _is_note_field_line(normalized: str) -> bool:
    return normalized.startswith(
        (
            "рабочая учебная программа",
            "цель",
            "формируемые компетенции",
            "пререквизиты",
            "постреквизиты",
        )
    )


def _pad(row: list[str], length: int) -> list[str]:
    return row + [""] * max(0, length - len(row))


def _empty_semesters() -> list[dict]:
    return [{"semester": index + 1, "totalHours": 0} for index in range(8)]


def _discipline_key(value: str) -> str:
    return re.sub(r"\s+", " ", _normalize(value))


def _clean_topic_name(value: str) -> str:
    cleaned = _clean_text(value)
    cleaned = re.sub(r"(\d{1,2}[,.]\d{2}\s*)+$", "", cleaned).strip()
    return cleaned


def _sum_discipline_hours(disciplines: list[dict]) -> int:
    total = 0
    for discipline in disciplines:
        for semester in discipline.get("semesters", []):
            total += int(semester.get("totalHours", 0) or 0)
    return total


def _dedupe(items: list[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for item in items:
        if not item or item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result
