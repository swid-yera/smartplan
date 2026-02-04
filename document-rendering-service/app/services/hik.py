import pandas as pd
import os
import io
from datetime import datetime
from app.config import OUT_DIR
from app.logger import logger


def generate_hik_report(file_content: bytes, original_filename: str) -> str:
    try:
        file_stream = io.BytesIO(file_content)

        # 1. Находим строку заголовка
        df_raw = pd.read_excel(file_stream, header=None)
        header_row_idx = df_raw[df_raw.eq("Фамилия").any(axis=1)].index[0]

        file_stream.seek(0)
        # dtype={'Дата': str} гарантирует, что Excel не превратит дату в объект datetime при чтении
        df = pd.read_excel(file_stream, header=header_row_idx, dtype={"Дата": str})

        # 2. Формируем данные
        report_df = pd.DataFrame()
        report_df["Фамилия"] = df["Фамилия"]
        report_df["Имя"] = df["Имя"]
        report_df["Группа"] = df["Группа учета времени"]

        # Берем дату как она есть в payload
        report_df["Дата"] = df["Дата"]

        def parse_times(time_str):
            if pd.isna(time_str) or not str(time_str).strip():
                return None, None
            times = [t.strip() for t in str(time_str).split(";") if t.strip()]
            if not times:
                return None, None

            # Оставляем только HH:MM (первые 5 символов), убирая секунды
            t_start = times[0][:5]
            t_end = times[-1][:5]
            return t_start, t_end

        times_parsed = df["Запись о регистрации прихода"].apply(
            lambda x: pd.Series(parse_times(x))
        )
        report_df["Фактическое время прихода"] = times_parsed[0]
        report_df["Фактическое время ухода"] = times_parsed[1]

        # 3. Сохранение с форматированием (xlsxwriter)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        out_file_name = f"report_{timestamp}_{original_filename}"
        if not out_file_name.endswith(".xlsx"):
            out_file_name += ".xlsx"
        file_path = os.path.join(OUT_DIR, out_file_name)

        with pd.ExcelWriter(file_path, engine="xlsxwriter") as writer:
            report_df.to_excel(writer, index=False, sheet_name="Sheet1")

            workbook = writer.book
            worksheet = writer.sheets["Sheet1"]

            # Формат: выравнивание по правому краю
            right_format = workbook.add_format({"align": "right"})

            # Установка ширины столбцов:
            # A, B, C, D (Фамилия, Имя, Группа) — ширина 24
            worksheet.set_column("A:D", 15)

            # E, F (Дата, Приход, Уход) — ширина 26 + выравнивание вправо
            worksheet.set_column("E:F", 26, right_format)

        return file_path

    except Exception as e:
        logger.error(f"Error in generate_hik_report: {e}")
        raise e
