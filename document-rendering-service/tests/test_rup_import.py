import unittest
from pathlib import Path

from app.services.rup_import import parse_rup_docx


RUPS_DIR = Path(__file__).resolve().parents[2] / "docs" / "RUPs"
ROOT_DOCS_DIR = Path(__file__).resolve().parents[2] / "docs"


def _fixture(name: str) -> Path:
    return RUPS_DIR / name


def _root_fixture(name: str) -> Path:
    return ROOT_DOCS_DIR / name


def _display_name(payload: dict) -> str:
    return payload["name"]["ru"] or payload["name"]["kz"]


@unittest.skipUnless(RUPS_DIR.exists(), "RUP DOCX fixtures are not available")
class RupImportParserTest(unittest.TestCase):
    def test_parses_all_rup_examples(self):
        docx_files = sorted(RUPS_DIR.glob("*.docx"), key=lambda path: path.name.lower())

        self.assertGreaterEqual(len(docx_files), 18)

        for docx in docx_files:
            with self.subTest(docx=docx.name):
                payload = parse_rup_docx(docx.read_bytes(), docx.name)
                topics_count = sum(len(discipline["topics"]) for discipline in payload["disciplines"])

                self.assertIn(payload["sourceLanguage"], {"ru", "kz"})
                self.assertTrue(_display_name(payload))
                self.assertGreater(payload["totalHours"], 0)
                self.assertGreater(len(payload["disciplines"]), 0)
                self.assertGreater(topics_count, 0)

    def test_parses_provided_russian_template(self):
        docx = _fixture("ПМ6 РУП Т22-4Б 288ч 2025-2025 уч год (1).docx")
        payload = parse_rup_docx(docx.read_bytes(), docx.name)

        self.assertEqual(payload["sourceLanguage"], "ru")
        self.assertEqual(
            payload["name"]["ru"],
            "ПМ6 Обеспечение информационной безопасности локальных вычислительных сетей и Internet",
        )
        self.assertEqual(payload["studyForm"], "FULL_TIME")
        self.assertEqual(payload["courseSuggestion"], 4)
        self.assertEqual(payload["studyYearSuggestion"], "2025-2025")
        self.assertEqual(payload["groupsRaw"], ["Т22-4Б"])
        self.assertEqual(payload["totalHours"], 288)
        self.assertEqual(len(payload["disciplines"]), 3)
        self.assertEqual(sum(len(discipline["topics"]) for discipline in payload["disciplines"]), 144)
        self.assertEqual(payload["warnings"], [])

    def test_parses_short_module_name_without_approval_text(self):
        docx = _fixture("питон_ru_20260615_115202.docx")
        payload = parse_rup_docx(docx.read_bytes(), docx.name)

        self.assertEqual(payload["sourceLanguage"], "ru")
        self.assertEqual(payload["name"]["ru"], "питон")
        self.assertEqual(payload["groupsRaw"], ["ИС22-Б"])
        self.assertEqual(payload["totalHours"], 144)

    def test_parses_kazakh_practice_template(self):
        docx = _fixture("РУП КМ4 ПО практика қазақша.docx")
        payload = parse_rup_docx(docx.read_bytes(), docx.name)

        self.assertEqual(payload["sourceLanguage"], "kz")
        self.assertEqual(payload["type"], "PRACTICE")
        self.assertEqual(payload["groupsRaw"], ["П24-3А", "П24-3Б", "П24-3В"])
        self.assertEqual(payload["totalHours"], 216)
        self.assertEqual(len(payload["disciplines"]), 3)
        self.assertEqual(sum(len(discipline["topics"]) for discipline in payload["disciplines"]), 36)

    def test_merges_duplicate_learning_result_rows_in_distribution(self):
        docx = _fixture("РУП КМ1 ЕТ теория, практика каз.docx")
        payload = parse_rup_docx(docx.read_bytes(), docx.name)

        discipline_totals = [
            sum(semester["totalHours"] for semester in discipline["semesters"])
            for discipline in payload["disciplines"]
        ]

        self.assertEqual(payload["totalHours"], 432)
        self.assertEqual(discipline_totals, [120, 168, 144])
        self.assertEqual(sum(discipline_totals), 432)
        self.assertNotIn(
            "semester hours total 408 differs from declared total 432",
            payload["warnings"],
        )

    def test_parses_flattened_kazakh_header(self):
        docx = _fixture("РУП КМ6 ИС теория.docx")
        payload = parse_rup_docx(docx.read_bytes(), docx.name)

        self.assertEqual(payload["sourceLanguage"], "kz")
        self.assertEqual(
            payload["name"]["kz"],
            "КМ6 Автоматтандырылған ақпараттық жүйені техникалық қолдау және сүйемелдеу",
        )
        self.assertEqual(payload["totalHours"], 120)
        self.assertEqual(len(payload["disciplines"]), 2)
        self.assertEqual(sum(len(discipline["topics"]) for discipline in payload["disciplines"]), 60)

    def test_parses_russian_pm4_distribution_table(self):
        docx = _fixture("РУП ПМ4 ПО теория орысша.docx")
        payload = parse_rup_docx(docx.read_bytes(), docx.name)

        discipline_totals = [
            sum(semester["totalHours"] for semester in discipline["semesters"])
            for discipline in payload["disciplines"]
        ]
        discipline_names = [discipline["name"]["ru"] for discipline in payload["disciplines"]]

        self.assertEqual(payload["totalHours"], 216)
        self.assertEqual(discipline_totals, [48, 24, 48, 96])
        self.assertEqual(sum(discipline_totals), 216)
        self.assertNotIn(
            "semester distribution table was not found",
            payload["warnings"],
        )
        self.assertFalse(any(name.startswith("ПМ4 ") for name in discipline_names))

    def test_parses_distribution_row_without_learning_result_code(self):
        docx = _fixture("РМ7 Postgresql_ru_20260616_142100.docx")
        payload = parse_rup_docx(docx.read_bytes(), docx.name)

        self.assertEqual(payload["totalHours"], 24)
        self.assertEqual(len(payload["disciplines"]), 1)
        self.assertEqual(payload["disciplines"][0]["name"]["ru"], "Postgresql")
        self.assertEqual(
            [semester["totalHours"] for semester in payload["disciplines"][0]["semesters"]],
            [0, 0, 0, 0, 0, 0, 24, 0],
        )
        self.assertEqual(len(payload["disciplines"][0]["topics"]), 12)


class RupImportRealExampleTest(unittest.TestCase):
    def test_parses_real_example_first_discipline_hours_from_distribution(self):
        docx = _root_fixture("rup-real-example.docx")
        payload = parse_rup_docx(docx.read_bytes(), docx.name)

        first_discipline = payload["disciplines"][0]
        first_discipline_name = first_discipline["name"]["ru"] or first_discipline["name"]["kz"]

        self.assertEqual(
            first_discipline_name,
            "ОН 2.1. Компьютерлік және перифериялық жабдықтарға қызмет көрсету",
        )
        self.assertEqual(first_discipline["totalHours"], 120)
        self.assertEqual(
            [semester["totalHours"] for semester in first_discipline["semesters"]],
            [0, 0, 0, 96, 24, 0, 0, 0],
        )
        self.assertEqual(sum(topic["totalHours"] for topic in first_discipline["topics"]), 120)


if __name__ == "__main__":
    unittest.main()
