import base64
import sys
import tempfile
import types
import unittest
from pathlib import Path

from docx import Document

PNG_BYTES = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5N8qkAAAAASUVORK5CYII="
)


class _DummyQrImage:
    def save(self, buffer, format="PNG"):
        buffer.write(PNG_BYTES)


class _DummyQRCode:
    def __init__(self, *args, **kwargs):
        self._data = []

    def add_data(self, data):
        self._data.append(data)

    def make(self, fit=True):
        return None

    def make_image(self, fill_color="black", back_color="white"):
        return _DummyQrImage()


if "qrcode" not in sys.modules:
    qrcode_module = types.ModuleType("qrcode")
    qrcode_module.QRCode = _DummyQRCode

    constants_module = types.ModuleType("qrcode.constants")
    constants_module.ERROR_CORRECT_M = object()

    sys.modules["qrcode"] = qrcode_module
    sys.modules["qrcode.constants"] = constants_module

from app.services.rup import append_verification_qr


class RupQrAppendTest(unittest.TestCase):
    def _create_docx(self, title: str, anchor: str) -> Path:
        tmp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(tmp_dir.cleanup)

        file_path = Path(tmp_dir.name) / "sample.docx"
        doc = Document()
        doc.add_paragraph("Кіріспе")

        table = doc.add_table(rows=1, cols=1)
        table.cell(0, 0).text = anchor

        doc.add_paragraph(title)
        doc.add_paragraph("Негізгі бөлім")
        doc.save(file_path)

        return file_path

    def test_appends_qr_for_kazakh_title_without_crashing(self):
        file_path = self._create_docx("Түсіндірме жазба", "Бөлімше меңгерушісі")

        append_verification_qr(
            file_path,
            {"verificationUrl": "https://example.com/verify/123"},
            "kz",
        )

        doc = Document(file_path)
        texts = [paragraph.text.strip() for paragraph in doc.paragraphs]

        self.assertIn("Түсіндірме жазба", texts)
        self.assertTrue(any("kripto.aspc.kz" in paragraph.text for paragraph in doc.paragraphs))

    def test_appends_qr_for_russian_title_without_crashing(self):
        file_path = self._create_docx("Пояснительная записка", "Заведующий отделением")

        append_verification_qr(
            file_path,
            {"verificationUrl": "https://example.com/verify/123"},
            "ru",
        )

        doc = Document(file_path)
        texts = [paragraph.text.strip() for paragraph in doc.paragraphs]

        self.assertIn("Пояснительная записка", texts)
        self.assertTrue(any("kripto.aspc.kz" in paragraph.text for paragraph in doc.paragraphs))


if __name__ == "__main__":
    unittest.main()
