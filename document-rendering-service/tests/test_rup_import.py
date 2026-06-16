import unittest
from pathlib import Path

from app.services.rup_import import parse_rup_docx


EXAMPLE_DOCX = (
    Path(__file__).resolve().parents[2]
    / "docs"
    / "ПМ6 РУП Т22-4Б 288ч 2025-2025 уч год (1).docx"
)

ADDITIONAL_EXAMPLE_DOCX = (
    Path(__file__).resolve().parents[2]
    / "docs"
    / "РУП ПМ3 Т4Г полный.docx"
)


@unittest.skipUnless(EXAMPLE_DOCX.exists(), "example RUP DOCX fixture is not available")
class RupImportParserTest(unittest.TestCase):
    def test_parses_provided_russian_template(self):
        payload = parse_rup_docx(EXAMPLE_DOCX.read_bytes(), EXAMPLE_DOCX.name)

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
        self.assertEqual(
            sum(len(discipline["topics"]) for discipline in payload["disciplines"]),
            144,
        )
        self.assertEqual(payload["warnings"], [])

    def test_parses_alternative_russian_template(self):
        if not ADDITIONAL_EXAMPLE_DOCX.exists():
            self.skipTest("additional RUP DOCX fixture is not available")
        payload = parse_rup_docx(ADDITIONAL_EXAMPLE_DOCX.read_bytes(), ADDITIONAL_EXAMPLE_DOCX.name)

        self.assertEqual(payload["name"]["ru"], "ПМ3 Управление системами и сетями организации")
        self.assertEqual(payload["courseSuggestion"], 4)
        self.assertEqual(payload["totalHours"], 192)
        self.assertEqual(len(payload["disciplines"]), 2)
        self.assertEqual(
            [sum(semester["totalHours"] for semester in discipline["semesters"]) for discipline in payload["disciplines"]],
            [72, 120],
        )
        self.assertEqual(
            sum(len(discipline["topics"]) for discipline in payload["disciplines"]),
            95,
        )
        self.assertEqual(
            payload["warnings"],
            [
                "topic hours total 118 differs from distribution total 120 for discipline: РО3.2 Оценивать эффективность конфигурации сетевых устройств с точки зрения производительности сети и защиты от несанкционированного доступа",
                "studyYearSuggestion was not found in document",
            ],
        )

    def test_parses_postgresql_template(self):
        docx = Path(__file__).resolve().parents[2] / "docs" / "РМ7 Postgresql_ru_20260616_142100.docx"
        if not docx.exists():
            self.skipTest("example RUP DOCX fixture is not available")
        payload = parse_rup_docx(docx.read_bytes(), docx.name)

        self.assertEqual(payload["name"]["ru"], "РМ7 Postgresql")
        self.assertEqual(payload["studyForm"], "FULL_TIME")
        self.assertEqual(payload["courseSuggestion"], 4)
        self.assertEqual(payload["groupsRaw"], ["ИС22-Б"])
        self.assertEqual(payload["totalHours"], 24)
        self.assertEqual(len(payload["disciplines"]), 1)
        self.assertEqual(payload["disciplines"][0]["name"]["ru"], "Postgresql")
        self.assertEqual(len(payload["disciplines"][0]["topics"]), 12)
        self.assertEqual(
            sum(len(discipline["topics"]) for discipline in payload["disciplines"]),
            12,
        )
        self.assertEqual(payload["warnings"], ["studyYearSuggestion was not found in document"])


if __name__ == "__main__":
    unittest.main()
