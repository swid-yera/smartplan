from docx import Document
from docx.enum.table import WD_ALIGN_VERTICAL


def apply_vertical_merge(file_path: str):
    doc = Document(file_path)
    if not doc.tables:
        return

    table = doc.tables[-1]
    COL_INDEX = 1  # disciplines column
    primary_cell = None

    for row in table.rows:
        if len(row.cells) <= COL_INDEX:
            continue

        # index 0 it is num column
        row_number_text = row.cells[0].text.strip()
        current_cell = row.cells[COL_INDEX]
        current_text = current_cell.text.strip()

        # if text is empty it is disciplines summary hours line
        if not row_number_text:
            # skipping if it's header
            if "№" not in row.cells[0].text:
                primary_cell = None  # reset merge
                continue

        # if text exist it is discipline name
        if current_text:
            primary_cell = current_cell
            primary_cell.vertical_alignment = WD_ALIGN_VERTICAL.TOP

        # if text doesn't exist, but there is exists numeric cell value
        elif primary_cell is not None:
            primary_cell.merge(current_cell)

    doc.save(file_path)


KAZAKH_EXACT_TEXT_REPLACEMENTS = {
    "Согласовано": "Келісілді",
    "Утверждаю": "Бекітемін",
    "Директор ТОО «»": "«» ЖШС директоры",
    "Заместитель директора по": "Директордың орынбасары",
    "Рабочая учебная программа по модулю ": "Модуль бойынша жұмыс оқу бағдарламасы ",
    "(наименование модуля или дисциплины)": "(модульдің немесе пәннің атауы)",
    "Специальность": "Мамандық",
    "Квалификация": "Біліктілік",
    "(код и наименование)": "(коды және атауы)",
    "Форма обучения": "Оқу нысаны",
    "на базе": "негізінде",
    "основной": "негізгі",
    "среднего образования": "орта білім",
    "Общее количество часов": "Жалпы сағат саны",
    "кредитов": "кредит",
    "курс": "курс",
    "группа(ы)": "топ(тар)",
    "Разработчик (-и)": "Әзірлеуші(лер)",
    "(подпись)": "(қолы)",
    "Ф.И.О.": "Т.А.Ә.",
    "Методист УМО": "ОӘБ әдіскері",
    "Заведующий отделением": "Бөлімше меңгерушісі",
    "Пояснительная записка": "Түсіндірме жазба",
    "Формируемые компетенции:": "Қалыптастырылатын құзыреттіліктер:",
    "Пререквизиты:": "Пререквизиттер:",
    "Постреквизиты:": "Постреквизиттер:",
    "Необходимые средства обучения, оборудование:": "Қажетті оқу құралдары, жабдықтар:",
    "Учебно-методическое оснащение, справочная литература/интернет-ресурсы:": "Оқу-әдістемелік қамтамасыз ету, анықтамалық әдебиет/интернет-ресурстар:",
    "Технические средства и материалы:": "Техникалық құралдар мен материалдар:",
    "Общее количество часов на обучение по модулю": "Модуль бойынша оқытуға арналған жалпы сағат саны",
    "Содержание учебной рабочей программы": "Жұмыс оқу бағдарламасының мазмұны",
    "Разделы/Результаты обучения": "Бөлімдер/Оқу нәтижелері",
    "Критерии оценки и/или темы занятий": "Бағалау критерийлері және/немесе сабақ тақырыптары",
    "В том числе": "Оның ішінде",
    "Самостоятельная работа студента с преподавателем": "Білім алушының оқытушымен өзіндік жұмысы",
    "Самостоятельная работа студента": "Білім алушының өзіндік жұмысы",
    "Тип занятия": "Сабақ түрі",
    "Теоретические": "Теориялық",
    "Лабораторно- практические": "Зертханалық-практикалық",
    "Индиви-дуальные": "Жеке",
    "Всего:": "Барлығы:",
    "Управление образования города Алматы": "Алматы қаласы Білім басқармасы",
    "     (наименование организации образования)": "     (білім беру ұйымының атауы)",
}

KAZAKH_PARTIAL_TEXT_REPLACEMENTS = (
    (
        "Рассмотрено на заседании отделения «Программное обеспечение и системы информационной безопасности»",
        "«Бағдарламалық қамтамасыз ету және ақпараттық қауіпсіздік жүйелері» бөлімшесінің отырысында қаралды",
    ),
    ("Протокол №__", "№__ хаттама"),
    ("«____» ____________20___г.", "«____» ____________20___ж."),
    ("«____»__________ 20__год", "«____»__________ 20__жыл"),
    ("20      год", "20      жыл"),
)


KAZAKH_LESSON_EXACT_TEXT_REPLACEMENTS = {
    "План учебного занятия № ": "Сабақ жоспары № ",
    "Наименование модуля": "Модульдің атауы",
    "/дисциплины": "/пән",
    "Подготовил педагог": "Дайындаған педагог",
    "Дата проведения": "Өткізу күні",
    "Общие сведения": "Жалпы мәліметтер",
    "Тип занятия": "Сабақ түрі",
    "Цель": "Мақсаты",
    "Задачи": "Міндеттері",
    "Ожидаемые": "Күтілетін",
    "результаты": "нәтижелер",
    "Необходимые ресурсы": "Қажетті ресурстар",
    "Учебно-методическое оснащение,": "Оқу-әдістемелік қамтамасыз ету,",
    "Учебно-методическое оснащение, справочная литература:": "Оқу-әдістемелік қамтамасыз ету, анықтамалық әдебиеттер:",
    "справочная литература:": "анықтамалық әдебиеттер:",
    "Техническое оснащение:": "Техникалық жабдықталуы:",
    "Ход занятия": "Сабақ барысы",
}

KAZAKH_LESSON_PARTIAL_TEXT_REPLACEMENTS = (
    ("Курс ", "Курс "),
    ("Группа ", "Топ "),
)


def _replace_rup_static_text(text: str) -> str:
    updated = KAZAKH_EXACT_TEXT_REPLACEMENTS.get(text, text)

    for source, target in KAZAKH_PARTIAL_TEXT_REPLACEMENTS:
        if source in updated:
            updated = updated.replace(source, target)

    return updated


def _replace_lesson_static_text(text: str) -> str:
    updated = KAZAKH_LESSON_EXACT_TEXT_REPLACEMENTS.get(text, text)

    for source, target in KAZAKH_LESSON_PARTIAL_TEXT_REPLACEMENTS:
        if source in updated:
            updated = updated.replace(source, target)

    return updated


def _localize_paragraphs(paragraphs, replace_text) -> bool:
    changed = False

    for paragraph in paragraphs:
        for run in paragraph.runs:
            updated = replace_text(run.text)
            if updated != run.text:
                run.text = updated
                changed = True

    return changed


def _localize_tables(tables, replace_text) -> bool:
    changed = False

    for table in tables:
        for row in table.rows:
            for cell in row.cells:
                changed = _localize_paragraphs(cell.paragraphs, replace_text) or changed
                changed = _localize_tables(cell.tables, replace_text) or changed

    return changed


def _apply_document_localization(file_path: str, replace_text) -> None:
    doc = Document(file_path)
    changed = _localize_paragraphs(doc.paragraphs, replace_text)
    changed = _localize_tables(doc.tables, replace_text) or changed

    for section in doc.sections:
        changed = _localize_paragraphs(section.header.paragraphs, replace_text) or changed
        changed = _localize_tables(section.header.tables, replace_text) or changed
        changed = _localize_paragraphs(section.footer.paragraphs, replace_text) or changed
        changed = _localize_tables(section.footer.tables, replace_text) or changed

    if changed:
        doc.save(file_path)


def apply_kazakh_template_localization(file_path: str, language: str):
    if language != "kz":
        return

    _apply_document_localization(file_path, _replace_rup_static_text)


def apply_kazakh_lesson_template_localization(file_path: str, language: str):
    if language != "kz":
        return

    _apply_document_localization(file_path, _replace_lesson_static_text)
