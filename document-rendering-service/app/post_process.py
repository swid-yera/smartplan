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
