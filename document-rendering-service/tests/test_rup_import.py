import unittest
from pathlib import Path

from app.services.rup_import import parse_rup_docx


EXAMPLE_DOCX = (
    Path(__file__).resolve().parents[2]
    / "docs"
    / "ПМ6 РУП Т22-4Б 288ч 2025-2025 уч год (1).docx"
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


if __name__ == "__main__":
    unittest.main()
