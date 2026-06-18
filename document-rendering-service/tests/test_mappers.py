import unittest

from app.mappers import build_disciplines_table


class BuildDisciplinesTableTest(unittest.TestCase):
    def test_uses_sum_of_semesters_for_discipline_total(self):
        disciplines, semesters_total = build_disciplines_table(
            [
                {
                    "name": {"ru": "Test discipline", "kz": ""},
                    "totalHours": 999,
                    "semesters": [
                        {"semester": 1, "totalHours": 24},
                        {"semester": 2, "totalHours": 48},
                        {"semester": 7, "totalHours": 12},
                    ],
                    "topics": [
                        {"totalHours": 2},
                        {"totalHours": 2},
                    ],
                }
            ],
            "ru",
        )

        self.assertEqual(len(disciplines), 1)
        self.assertEqual(disciplines[0]["total"], 84)
        self.assertEqual(disciplines[0]["sem1"], 24)
        self.assertEqual(disciplines[0]["sem2"], 48)
        self.assertEqual(disciplines[0]["sem7"], 12)
        self.assertEqual(semesters_total, [24, 48, "", "", "", "", 12, ""])


if __name__ == "__main__":
    unittest.main()
