from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
OUT_DIR = BASE_DIR.parent / "out"
TEMPLATE_PATH = BASE_DIR / "templates" / "template.docx"
LOG_FOLDER = BASE_DIR.parent / "logs"
