from pathlib import Path
from os import getenv

BASE_DIR = Path(__file__).resolve().parent
OUT_DIR = BASE_DIR.parent / "out"
TEMPLATE_DIR = BASE_DIR / "templates"
RUP_TEMPLATE_PATH = TEMPLATE_DIR / "rup-template.docx"
LESSON_TEMPLATE_PATH = TEMPLATE_DIR / "lesson-template.docx"
LOG_FOLDER = BASE_DIR.parent / "logs"

# from env
API_KEYS = {
    "rup_backend": getenv("API_KEY_RUP_BACKEND"),
}
