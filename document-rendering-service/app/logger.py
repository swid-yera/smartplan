import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

from app.config import LOG_FOLDER

LOG_FOLDER.mkdir(exist_ok=True)

logger = logging.getLogger("document_service")
logger.setLevel(logging.INFO)

# logging to the file with rotation
file_handler = RotatingFileHandler(
    LOG_FOLDER / "app.log", maxBytes=5_000_000, backupCount=5, encoding="utf-8"
)
formatter = logging.Formatter("%(asctime)s | %(levelname)s | %(name)s | %(message)s")
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

# logging to console
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)
