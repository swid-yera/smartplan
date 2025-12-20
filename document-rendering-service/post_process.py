from docx import Document
from docx.enum.table import WD_ALIGN_VERTICAL


def apply_vertical_merge(file_path: str):
    doc = Document(file_path)
    if not doc.tables:
        return

    table = doc.tables[-1]
    COL_INDEX = 1  # Столбец с РО (Разделами)
    primary_cell = None

    for row in table.rows:
        if len(row.cells) <= COL_INDEX:
            continue

        # Индекс 0 — это колонка "№"
        row_number_text = row.cells[0].text.strip()
        current_cell = row.cells[COL_INDEX]
        current_text = current_cell.text.strip()

        # ЛОГИКА:
        # 1. Если в колонке № пусто — значит это строка "Всего часов"
        if not row_number_text:
            # Пропускаем шапку (проверяем, не заголовок ли это)
            if "№" not in row.cells[0].text:
                primary_cell = None  # Сбрасываем мерж перед итоговой строкой
                continue

        # 2. Если есть текст в РО (например, "РО6.1...")
        if current_text:
            primary_cell = current_cell
            primary_cell.vertical_alignment = WD_ALIGN_VERTICAL.TOP

        # 3. Если текста в РО нет, но это строка с темой (есть номер №)
        elif primary_cell is not None:
            primary_cell.merge(current_cell)

    doc.save(file_path)
