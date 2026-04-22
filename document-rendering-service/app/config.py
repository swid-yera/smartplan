from pathlib import Path
from os import getenv

BASE_DIR = Path(__file__).resolve().parent
OUT_DIR = BASE_DIR.parent / "out"
TEMPLATE_PATH = BASE_DIR / "templates" / "template.docx"
LESSON_TEMPLATE_PATH = BASE_DIR / "templates" / "lesson-template.docx"
LOG_FOLDER = BASE_DIR.parent / "logs"

# from env
API_KEYS = {
    "rup_backend": getenv("API_KEY_RUP_BACKEND"),
}
