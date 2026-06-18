import re
import zipfile
from io import BytesIO
from xml.etree import ElementTree as ET


WORD_NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
MAX_DOCX_BYTES = 15 * 1024 * 1024
KZ_SPECIFIC_RE = re.compile(r"[ӘәҒғҚқҢңӨөҰұҮүІі]")


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

    source_language = _detect_source_language(all_text)
    info = _parse_info_table(tables, warnings)
    exploration = _parse_exploration_note(paragraphs, warnings, source_language)
    disciplines = _parse_disciplines(blocks, tables, warnings, source_language)

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

    declared_total_hours = info.get("totalHours") or 0
    semester_total_hours = _sum_discipline_hours(disciplines)
    if declared_total_hours and declared_total_hours != semester_total_hours:
        warnings.append(
            f"semester hours total {semester_total_hours} differs from declared total {declared_total_hours}"
        )

    return {
        "sourceLanguage": source_language,
        "name": _locale_text(name, source_language),
        "type": _infer_rup_type(filename or all_text),
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
    info_table = _find_table(
        tables,
        lambda table: (
            _has_any(_normalize(_flatten_table_text(table)), ("специальность", "мамандық"))
            and _has_any(_normalize(_flatten_table_text(table)), ("квалификация", "біліктілік"))
            and _has_any(_normalize(_flatten_table_text(table)), ("форма обучения", "оқыту нысаны"))
        ),
    )
    if not info_table:
        raise RupImportParseError("main information table was not found")

    result = {
        "name": _extract_module_name(info_table),
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

        if (
            not result["name"]
            and nonempty
            and not _has_any(row_text, ("наименование модуля", "модуль немесе пән атауы"))
        ):
            candidate = nonempty[0]
            if not _looks_like_label(candidate) and not _looks_like_approval_text(candidate):
                result["name"] = candidate

        if _has_any(row_text, ("специальность", "мамандық")):
            result["specialtyRaw"] = _value_after_any_label(row, ("специальность", "мамандық"))
        elif _has_any(row_text, ("квалификация", "біліктілік")):
            result["qualificationRaw"] = _value_after_any_label(row, ("квалификация", "біліктілік"))
        elif _has_any(row_text, ("форма обучения", "оқыту нысаны")):
            form_raw = _value_after_any_label(row, ("форма обучения", "оқыту нысаны"))
            result["studyForm"] = _map_study_form(form_raw)
        elif _has_any(row_text, ("общее количество часов", "жалпы сағат саны")):
            result["totalHours"] = _int_after_any_label(row, ("общее количество часов", "жалпы сағат саны"))
            result["courseSuggestion"] = _int_after_any_label(row, ("курс",))
            groups_raw = _value_after_any_label(row, ("группа", "топ"))
            result["groupsRaw"] = _split_raw_values(groups_raw)
        elif _has_any(row_text, ("разработчик", "әзірлеуш", "құрастырушы")):
            result["developersRaw"] = [
                cell
                for cell in nonempty
                if not _has_any(_normalize(cell), ("разработчик", "әзірлеуш", "құрастырушы", "подпись", "қолы"))
            ]

    _fill_info_from_flat_text(result, _flatten_table_text(info_table))

    if not result["studyForm"]:
        warnings.append("studyForm was not recognized, FULL_TIME was used")
        result["studyForm"] = "FULL_TIME"

    return result


def _parse_exploration_note(paragraphs: list[str], warnings: list[str], source_language: str) -> dict:
    empty = _locale_text("", source_language)
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
        start = next(
            i
            for i, item in enumerate(paragraphs)
            if _has_any(_normalize(item), ("пояснительная записка", "түсіндірме жазба"))
        )
    except StopIteration:
        warnings.append("exploration note section was not found")
        return note

    lines = paragraphs[start + 1 :]
    stop_markers = (
        "контактные данные",
        "байланыс құралдары",
        "байланыс деректері",
        "распределение часов",
        "семестр бойынша сағаттарды бөлу",
        "оқу жұмыс бағдарламасының мазмұны",
    )
    scoped: list[str] = []
    for line in lines:
        normalized = _normalize(line)
        if any(marker in normalized for marker in stop_markers):
            break
        scoped.append(line)

    for line in scoped:
        normalized = _normalize(line)
        if not _locale_has_text(note["basis"]) and _has_any(
            normalized,
            ("рабочая учебная программа", "оқу жұмыс бағдарламасы", "кәсіптік модулінің оқу жұмыс бағдарламасы"),
        ):
            note["basis"] = _locale_text(line, source_language)
        elif normalized.startswith("цель") or "мақсаты" in normalized:
            note["goals"] = _locale_text(line, source_language)
        elif _has_any(normalized, ("формируемые компетенции", "қалыптастырылатын құз")):
            note["competencies"] = _locale_text(
                _strip_any_prefix(
                    line,
                    (
                        "Формируемые компетенции:",
                        "Қалыптастырылатын құзіреттіліктер:",
                        "Қалыптастырылатын құзыреттер:",
                    ),
                ),
                source_language,
            )
        elif "пререквизит" in normalized:
            note["prerequisites"] = _locale_text(
                _strip_any_prefix(line, ("Пререквизиты:", "Пәннің пререквизиттері:", "Пререквизиттер:")),
                source_language,
            )
        elif "пострекв" in normalized:
            note["postrequisites"] = _locale_text(
                _strip_any_prefix(
                    line,
                    ("Постреквизиты:", "Пәннің постреквизиттері:", "Постреквизиттер:", "Постреквзиттер:"),
                ),
                source_language,
            )

    fallback_texts = [
        line
        for line in scoped
        if _normalize(line)
        and not _is_note_field_line(_normalize(line))
        and not _is_resource_heading(_normalize(line))
        and not _is_empty_placeholder(_normalize(line))
    ]
    if not _locale_has_text(note["basis"]) and fallback_texts:
        note["basis"] = _locale_text(fallback_texts[0], source_language)
    if not _locale_has_text(note["goals"]) and len(fallback_texts) > 1:
        note["goals"] = _locale_text(fallback_texts[1], source_language)

    internet_resources: list[str] = []
    technical_resources: list[str] = []
    current_section = ""
    skip_lines = {
        "необходимые средства обучения, оборудование:",
        "учебно-методическое оснащение, справочная литература/интернет-ресурсы:",
        "дополнительные ресурсы и руководства",
        "технические средства и материалы:",
        "оқытуға қажетті құралдар, жабдықтар",
        "оқытуға қажетті құралдар, жабдықтар:",
        "оқу-әдістемелік жабдықтау, анықтамалық әдебиеттер/интернет-ресурстар:",
        "пайдаланылған әдебиеттер мен интернет-ресурстар тізімі:",
        "оқыту құралдары:",
    }

    for line in scoped:
        normalized = _normalize(line)
        if _is_empty_placeholder(normalized):
            continue
        if _is_internet_resources_heading(normalized):
            current_section = "internet"
            continue
        if _is_technical_resources_heading(normalized):
            current_section = "technical"
            continue
        if normalized in skip_lines or _is_note_field_line(normalized) or _is_resource_heading(normalized):
            continue
        if current_section == "internet":
            internet_resources.append(line)
        elif current_section == "technical":
            technical_resources.append(line)

    note["internetResources"] = [{"name": _locale_text(item, source_language), "link": ""} for item in internet_resources]
    note["technicalResources"] = [
        {"name": _locale_text(item, source_language), "link": ""} for item in technical_resources
    ]

    return note


def _parse_disciplines(
    blocks: list[dict],
    tables: list[list[list[str]]],
    warnings: list[str],
    source_language: str,
) -> list[dict]:
    distribution_table = _find_distribution_table(blocks, tables)
    content_table = _find_content_table(blocks, tables)

    disciplines_by_name: dict[str, dict] = {}
    if distribution_table:
        layout = _infer_distribution_layout(distribution_table)
        for row in distribution_table:
            cells = _pad(row, max(10, len(row)))
            learning_result_name_index = _find_learning_result_name_index(cells)
            name_index = learning_result_name_index
            if name_index is None:
                name_index = _find_distribution_name_index(cells, layout)
            if name_index is None:
                continue

            raw_name = cells[name_index]
            name = (
                _extract_learning_result_name(raw_name)
                if learning_result_name_index is not None
                else _clean_text(raw_name)
            )
            normalized_name = _normalize(name)
            if not name or "всего" in normalized_name or "итого" in normalized_name or "барлығы" in normalized_name:
                continue
            if learning_result_name_index is None and not _looks_like_distribution_data_name(normalized_name):
                continue

            semester_indexes = layout["semester_indexes"]
            if not semester_indexes:
                semester_indexes = list(range(name_index + 2, min(len(cells), name_index + 10)))

            semesters = [
                {"semester": semester_index + 1, "totalHours": _to_int(cells[cell_index])}
                for semester_index, cell_index in enumerate(semester_indexes[:8])
            ]
            total_hours = sum(semester["totalHours"] for semester in semesters)
            if not total_hours and not any(semester["totalHours"] for semester in semesters):
                continue

            discipline_key = _discipline_key(name)
            existing_discipline = disciplines_by_name.get(discipline_key)
            if existing_discipline:
                existing_semesters = existing_discipline.get("semesters") or _empty_semesters()
                for index, semester in enumerate(semesters[:8]):
                    existing_semesters[index]["totalHours"] += semester["totalHours"]
                existing_discipline["semesters"] = existing_semesters
                existing_discipline["totalHours"] = sum(
                    int(semester.get("totalHours", 0) or 0) for semester in existing_semesters
                )
                continue

            disciplines_by_name[discipline_key] = {
                "name": _locale_text(name, source_language),
                "semesters": semesters,
                "topics": [],
                "totalHours": total_hours,
            }
    else:
        warnings.append("semester distribution table was not found")

    if content_table:
        current_key = ""
        for row in content_table[2:]:
            cells = _pad(row, max(10, len(row)))
            row_text = _normalize(" ".join(cells))
            if (
                not row_text
                or "всего часов" in row_text
                or "барлық сағат" in row_text
                or row_text.startswith("всего")
                or row_text.startswith("итого")
                or row_text.startswith("барлығы")
                or row_text.startswith("сағат саны")
                or "общее количество часов" in row_text
                or "жалпы сағат" in row_text
            ):
                continue

            discipline_name = cells[1]
            if discipline_name and not _is_total_row_label(discipline_name):
                normalized_discipline_name = _normalize(discipline_name)
                is_learning_result = _looks_like_learning_result_name(normalized_discipline_name)
                candidate_name = (
                    _extract_learning_result_name(discipline_name)
                    if is_learning_result
                    else _clean_text(discipline_name)
                )
                candidate_key = _discipline_key(candidate_name)
                if (
                    is_learning_result
                    or candidate_key in disciplines_by_name
                    or (not current_key and not disciplines_by_name)
                ):
                    current_key = candidate_key
                    disciplines_by_name.setdefault(
                        current_key,
                        {
                            "name": _locale_text(candidate_name, source_language),
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
            total_hours = _to_int(cells[3]) or theory_hours + practice_hours + individual_hours + srsp_hours
            if not total_hours:
                total_hours = theory_hours + practice_hours + individual_hours + srsp_hours

            disciplines_by_name[current_key]["topics"].append(
                {
                    "name": _locale_text(topic_name, source_language),
                    "type": _map_topic_type(cells[9], theory_hours, practice_hours, individual_hours, srsp_hours),
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
        discipline_name = _locale_display_text(discipline["name"])
        semester_total = sum(int(semester.get("totalHours", 0) or 0) for semester in discipline.get("semesters", []))
        discipline["totalHours"] = semester_total
        if not discipline["topics"]:
            warnings.append(f"discipline has no parsed topics: {discipline_name}")
        if not any(semester.get("totalHours", 0) for semester in discipline.get("semesters", [])):
            warnings.append(f"semester distribution was empty for discipline: {discipline_name}")

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


def _find_table(
    tables: list[list[list[str]]],
    predicate,
) -> list[list[str]] | None:
    for table in tables:
        if predicate(table):
            return table
    return None


def _find_table_after_marker(
    blocks: list[dict],
    markers: tuple[str, ...],
    predicate,
) -> list[list[str]] | None:
    for index, block in enumerate(blocks):
        if block["type"] != "p":
            continue
        normalized = _normalize(block["text"])
        if not any(marker in normalized for marker in markers):
            continue
        for next_block in blocks[index + 1 :]:
            if next_block["type"] == "tbl":
                rows = next_block["rows"]
                if predicate(rows):
                    return rows
                break
    return None


def _find_distribution_table(blocks: list[dict], tables: list[list[list[str]]]) -> list[list[str]] | None:
    table = _find_table_after_marker(
        blocks,
        ("распределение часов", "часов по семестрам", "семестр бойынша сағаттарды бөлу"),
        _looks_like_distribution_table,
    )
    if table:
        return table
    return _find_table(tables, _looks_like_distribution_table)


def _find_content_table(blocks: list[dict], tables: list[list[list[str]]]) -> list[list[str]] | None:
    table = _find_table_after_marker(
        blocks,
        ("содержание учебной программы", "содержание", "учебная программа", "оқу жұмыс бағдарламасының мазмұны"),
        _looks_like_content_table,
    )
    if table:
        return table
    return _find_table(tables, _looks_like_content_table)


def _looks_like_distribution_table(table: list[list[str]]) -> bool:
    flat = _normalize(_flatten_table_text(table))
    return (
        "семестр" in flat
        and (
            "общее количество часов" in flat
            or "всего часов" in flat
            or "код и название" in flat
            or "код и наименование" in flat
            or "дисциплина/ код" in flat
            or "распределение часов" in flat
            or "в том числе" in flat
            or "в частности" in flat
            or "из них" in flat
            or "соның ішінде" in flat
            or "модульдегі" in flat
            or "сағат саны" in flat
        )
    )


def _looks_like_content_table(table: list[list[str]]) -> bool:
    flat = _normalize(_flatten_table_text(table))
    return (
        ("тип занятия" in flat or "сабақ түрі" in flat)
        and (
            "критерии оценки" in flat
            or "разделы" in flat
            or "результаты обучения" in flat
            or "темы занятий" in flat
            or "бағалау өлшемшарттары" in flat
            or "оқыту нәтижелері" in flat
            or "сабақ тақырыптары" in flat
            or "тараулар" in flat
        )
    )


def _infer_distribution_layout(table: list[list[str]]) -> dict:
    total_index = None
    semester_indexes: list[int] = []

    for row in table[:4]:
        for index, cell in enumerate(row):
            normalized = _normalize(cell)
            if total_index is None and (
                "общее количество часов" in normalized
                or "всего часов" in normalized
                or "жалпы сағат" in normalized
                or "барлық сағат" in normalized
                or "сағат саны" in normalized
                or normalized == "всего"
                or normalized.startswith("всего")
                or normalized.startswith("барлығы")
                or "итого" in normalized
            ):
                total_index = index
            if "семестр" in normalized:
                semester_indexes.append(index)

    semester_indexes = _dedupe_ints(semester_indexes)
    if len(semester_indexes) > 8:
        semester_indexes = semester_indexes[:8]

    if total_index is None:
        total_index = 1 if table and table[0] else None

    return {"total_index": total_index, "semester_indexes": semester_indexes}


def _looks_like_learning_result_name(normalized: str) -> bool:
    return bool(re.search(r"(ро|рo|он|oн)\s*\d", normalized))


def _find_learning_result_name_index(cells: list[str]) -> int | None:
    for index, cell in enumerate(cells[:3]):
        if _looks_like_learning_result_name(_normalize(cell)):
            return index
    return None


def _find_distribution_name_index(cells: list[str], layout: dict) -> int | None:
    total_index = layout.get("total_index")
    for index, cell in enumerate(cells[:3]):
        if index == total_index:
            continue
        normalized = _normalize(cell)
        if _looks_like_distribution_data_name(normalized):
            return index
    return None


def _looks_like_distribution_data_name(normalized: str) -> bool:
    if _is_empty_placeholder(normalized) or _is_total_row_label(normalized):
        return False
    if re.fullmatch(r"\d+[\.\)]?", normalized):
        return False
    return not _has_any(
        normalized,
        (
            "семестр",
            "курс",
            "в том числе",
            "из них",
            "соның ішінде",
            "код и название",
            "код и наименование",
            "дисциплина/ код",
            "общее количество",
            "общее количество часов",
            "всего часов",
            "жалпы сағат",
            "сағат саны",
        ),
    )


def _extract_learning_result_name(value: str) -> str:
    match = re.search(r"((?:РО|РO|ОН|OН)\s*\d+(?:\.\d+)?\.?.*)", value or "", flags=re.IGNORECASE)
    return _clean_text(match.group(1)) if match else value


def _locale_text(value: str, source_language: str = "ru") -> dict:
    cleaned = _clean_text(value)
    if source_language == "kz":
        return {"ru": "", "kz": cleaned}
    return {"ru": cleaned, "kz": ""}


def _locale_has_text(value: dict) -> bool:
    return bool(_clean_text(value.get("ru", "")) or _clean_text(value.get("kz", "")))


def _locale_display_text(value: dict) -> str:
    return _clean_text(value.get("ru", "")) or _clean_text(value.get("kz", ""))


def _has_any(value: str, needles: tuple[str, ...]) -> bool:
    return any(needle in value for needle in needles)


def _detect_source_language(value: str) -> str:
    normalized = _normalize(value)
    if _has_any(normalized, ("оқу жұмыс бағдарламасы", "мамандық", "біліктілік", "оқыту нысаны", "сабақ түрі")):
        return "kz"
    if len(KZ_SPECIFIC_RE.findall(value or "")) >= 20:
        return "kz"
    return "ru"


def _infer_rup_type(value: str) -> str:
    normalized = _normalize(value)
    has_theory = _has_any(normalized, ("теория", "теоретичес"))
    has_practice = _has_any(normalized, ("практика", "кәсіптік практика", "өндірістік оқыту"))
    if has_practice and not has_theory:
        return "PRACTICE"
    if has_theory:
        return "THEORY"
    if has_practice:
        return "PRACTICE"
    return "THEORY"


def _looks_like_label(value: str) -> bool:
    normalized = _normalize(value)
    return normalized.startswith("(") or _has_any(
        normalized,
        (
            "специальность",
            "мамандық",
            "квалификация",
            "біліктілік",
            "форма обучения",
            "оқыту нысаны",
            "общее количество часов",
            "жалпы сағат саны",
            "разработчик",
            "әзірлеуш",
            "құрастырушы",
            "коды және атауы",
            "код и наименование",
            "наименование модуля",
            "модуль немесе пән атауы",
        ),
    )


def _looks_like_approval_text(value: str) -> bool:
    normalized = _normalize(value)
    return _has_any(
        normalized,
        (
            "согласовано",
            "утверждаю",
            "бекітілді",
            "бекітемін",
            "келісілді",
            "директор",
            "методист",
            "әдіскер",
            "бөлім меңгерушісі",
            "хаттама",
        ),
    )


def _extract_module_name(table: list[list[str]]) -> str:
    flat_candidate = _extract_module_name_from_flat_text(_flatten_table_text(table))
    if flat_candidate:
        return flat_candidate

    for index, row in enumerate(table):
        row_text = _normalize(" ".join(row))
        if _has_any(row_text, ("наименование модуля", "наименование дисциплины", "модуль немесе пән атауы")):
            for previous_row in reversed(table[:index]):
                candidate = _first_meaningful_cell(previous_row)
                if candidate:
                    return candidate

    for row in table:
        candidate = _first_meaningful_cell(row)
        if candidate:
            return candidate

    return ""


def _extract_module_name_from_flat_text(text: str) -> str:
    match = re.search(
        r"(.+?)\s*\((?:наименование\s+модуля(?:\s+или\s+дисциплины)?|модуль\s+немесе\s+пән\s+атауы)\)",
        text,
        flags=re.IGNORECASE,
    )
    if not match:
        return ""

    candidate = _clean_text(match.group(1))
    candidate = re.sub(
        r"^.*(?:оқу\s+жұмыс\s+бағдарламасы|учебная\s+рабочая\s+программа|рабочая\s+учебная\s+программа)",
        "",
        candidate,
        flags=re.IGNORECASE,
    )
    candidate = candidate.strip(" .:-")
    code_match = re.search(r"((?:КМ|ПМ|РМ|KM|PM|RM)\s*\d+\.?.*)", candidate, flags=re.IGNORECASE)
    if code_match:
        candidate = code_match.group(1).strip()

    if _looks_like_label(candidate) or _looks_like_approval_text(candidate):
        return ""
    return candidate


def _first_meaningful_cell(row: list[str]) -> str:
    for cell in row:
        if _is_empty_placeholder(_normalize(cell)):
            continue
        if _looks_like_label(cell) or _looks_like_approval_text(cell):
            continue
        return cell
    return ""


def _fill_info_from_flat_text(result: dict, text: str) -> None:
    if not result["name"]:
        result["name"] = _extract_module_name_from_flat_text(text)
    if not result["specialtyRaw"]:
        result["specialtyRaw"] = _flat_value_after_any_label(
            text,
            ("специальность", "мамандық"),
            ("(код", "(коды", "квалификация", "біліктілік", "форма обучения", "оқыту нысаны"),
        )
    if not result["qualificationRaw"]:
        result["qualificationRaw"] = _flat_value_after_any_label(
            text,
            ("квалификация", "біліктілік"),
            ("(код", "(коды", "форма обучения", "оқыту нысаны", "общее количество часов", "жалпы сағат саны"),
        )
    if not result["studyForm"]:
        form_raw = _flat_value_after_any_label(
            text,
            ("форма обучения", "оқыту нысаны"),
            ("общее количество часов", "жалпы сағат саны"),
        )
        result["studyForm"] = _map_study_form(form_raw)
    if not result["totalHours"]:
        result["totalHours"] = _to_int(
            _flat_value_after_any_label(
                text,
                ("общее количество часов", "жалпы сағат саны"),
                ("кредит", "курс", "группа", "топ", "разработчик", "әзірлеуш", "құрастырушы"),
            )
        )
    if not result["courseSuggestion"]:
        result["courseSuggestion"] = _to_int(
            _flat_value_after_any_label(
                text,
                ("курс",),
                ("группа", "топ", "разработчик", "әзірлеуш", "құрастырушы"),
            )
        )
    if not result["groupsRaw"]:
        result["groupsRaw"] = _split_raw_values(
            _flat_value_after_any_label(
                text,
                ("группа", "топ"),
                ("разработчик", "әзірлеуш", "құрастырушы", "согласовано", "келісілді"),
            )
        )


def _flat_value_after_any_label(text: str, labels: tuple[str, ...], stop_labels: tuple[str, ...]) -> str:
    cleaned = _clean_text(text)
    lower = cleaned.lower()
    for label in labels:
        label_index = lower.find(label.lower())
        if label_index == -1:
            continue

        start = label_index + len(label)
        end = len(cleaned)
        for stop_label in stop_labels:
            stop_index = lower.find(stop_label.lower(), start)
            if stop_index != -1:
                end = min(end, stop_index)

        return _clean_flat_value(cleaned[start:end])
    return ""


def _clean_flat_value(value: str) -> str:
    value = _clean_text(value).strip(" :-—")
    value = re.sub(r"\((?:код|коды|наименование|атауы|түрлері).*?$", "", value, flags=re.IGNORECASE).strip()
    return value.strip(" :-—")


def _value_after_label(row: list[str], label: str) -> str:
    label = label.lower()
    for index, cell in enumerate(row):
        if label in _normalize(cell):
            for candidate in row[index + 1 :]:
                if candidate and label not in _normalize(candidate):
                    return candidate
    return ""


def _value_after_any_label(row: list[str], labels: tuple[str, ...]) -> str:
    for label in labels:
        value = _value_after_label(row, label)
        if value:
            return value
    return ""


def _int_after_label(row: list[str], label: str) -> int:
    value = _value_after_label(row, label)
    return _to_int(value)


def _int_after_any_label(row: list[str], labels: tuple[str, ...]) -> int:
    return _to_int(_value_after_any_label(row, labels))


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


def _map_topic_type(value: str, theory: int, practice: int, individual: int, srsp: int) -> str:
    normalized = _normalize(value)
    if _has_any(normalized, ("срсп", "соөж")):
        return "SRSP"
    if _has_any(normalized, ("практи", "тәжіриб", "зертхан", "лаборатор")):
        return "PRACTICAL"
    if _has_any(normalized, ("снз", "сөж", "соөж")):
        return "SNZ"
    if _has_any(normalized, ("комбин", "аралас")):
        return "COMBINED"
    if srsp > 0 and theory == 0 and practice == 0 and individual == 0:
        return "SRSP"
    if practice > 0 and theory == 0 and individual == 0:
        return "PRACTICAL"
    return "COMBINED"


def _split_raw_values(value: str) -> list[str]:
    result: list[str] = []
    for item in re.split(r"[,;/]+", value or ""):
        cleaned = item.strip()
        cleaned = re.sub(r"^\(?\s*(?:ы|тар)\s*\)?", "", cleaned, flags=re.IGNORECASE).strip()
        cleaned = cleaned.replace("_", "").strip(" :-—")
        if _is_empty_placeholder(_normalize(cleaned)):
            continue
        if not re.search(r"\d", cleaned):
            continue
        if _has_any(_normalize(cleaned), ("қолы", "подпись", "т.а.ә", "ф.и.о")):
            continue
        result.append(cleaned)
    return result


def _extract_study_year(value: str) -> str:
    match = re.search(r"(20\d{2})\s*[-–]\s*(20\d{2})", value or "")
    return f"{match.group(1)}-{match.group(2)}" if match else ""


def _strip_prefix(value: str, prefix: str) -> str:
    if value.lower().startswith(prefix.lower()):
        return value[len(prefix) :].strip()
    return value


def _strip_any_prefix(value: str, prefixes: tuple[str, ...]) -> str:
    for prefix in prefixes:
        value = _strip_prefix(value, prefix)
    return value.strip()


def _is_note_field_line(normalized: str) -> bool:
    return normalized.startswith(
        (
            "рабочая учебная программа",
            "цель",
            "формируемые компетенции",
            "пререквизиты",
            "постреквизиты",
            "оқу жұмыс бағдарламасы",
            "пән/модуль сипаттамасы",
            "қалыптастырылатын құз",
            "пәннің пререквизиттері",
            "пререквизиттер",
            "пәннің постреквизиттері",
            "постреквизиттер",
            "постреквзиттер",
        )
    )


def _is_resource_heading(normalized: str) -> bool:
    return _is_internet_resources_heading(normalized) or _is_technical_resources_heading(normalized) or (
        normalized.startswith("необходимые средства обучения")
        or normalized.startswith("оқытуға қажетті құралдар")
        or normalized.startswith("оқыту құралдары")
    )


def _is_internet_resources_heading(normalized: str) -> bool:
    return (
        "учебно-методическое оснащение" in normalized
        or "интернет-ресурсы" in normalized
        or "оқу-әдістемелік" in normalized
        or "интернет-ресурстар" in normalized
        or "пайдаланылған әдебиеттер" in normalized
    )


def _is_technical_resources_heading(normalized: str) -> bool:
    return (
        "технические средства и материалы" in normalized
        or "технические средства, материалы" in normalized
        or "оқыту құралдары" in normalized
        or "оқытуға қажетті құралдар" in normalized
        or "аппараттық қамтамасыздандыру" in normalized
        or "бағдарламалық қамтамасыздандыру" in normalized
    )


def _is_empty_placeholder(normalized: str) -> bool:
    if normalized in {"", "—", "-", "отсутвуют", "отсутствуют", "нет", "не требуется", "не предусмотрено"}:
        return True
    return bool(re.fullmatch(r"[_\s.-]+", normalized))


def _pad(row: list[str], length: int) -> list[str]:
    return row + [""] * max(0, length - len(row))


def _dedupe_ints(items: list[int]) -> list[int]:
    result: list[int] = []
    seen: set[int] = set()
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result


def _empty_semesters() -> list[dict]:
    return [{"semester": index + 1, "totalHours": 0} for index in range(8)]


def _discipline_key(value: str) -> str:
    normalized = re.sub(r"\s+", " ", _normalize(value))
    match = re.search(r"((?:ро|рo|он|oн)\s*\d+(?:\.\d+)?)", normalized)
    if match:
        return match.group(1).replace(" ", "")
    return normalized


def _is_total_row_label(value: str) -> bool:
    normalized = _normalize(value)
    return (
        normalized.startswith("всего")
        or normalized.startswith("итого")
        or normalized.startswith("барлығы")
        or normalized.startswith("сағат саны")
        or normalized.startswith("общее количество")
        or normalized.startswith("жалпы сағат")
    )


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
