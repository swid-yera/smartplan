from pathlib import Path

from app.logger import logger
from app.config import OUT_DIR


def cleanup_by_count(
    folder: Path, max_files: int = 100, extension: str = ".docx"
) -> dict:
    """
    deletes old files, leaving only max_files of the most recent ones.
    returns the number of deleted files and error count.
    """

    # get list files with extension
    files = list(folder.glob(f"*{extension}"))

    # sort by date from new to oldest
    files.sort(key=lambda f: f.stat().st_mtime, reverse=True)

    # taking files that remain and delete the rest
    deleted_count = 0
    error_count = 0

    for file in files[max_files:]:
        try:
            file.unlink()
            deleted_count += 1
            logger.info(f"deleted file: {file}")

        except Exception as e:
            error_count += 1
            logger.error(f"error while deleting {file}: {e}")

    result = {"deleted": deleted_count, "error": error_count}

    if (deleted_count + error_count) > 0:
        logger.info(
            f"deleted success: {result["deleted"]}, with error {result["error"]}"
        )

    return result


def clear_out_folder(folder: Path = OUT_DIR) -> dict:
    """
    deletes all files in a folder.
    returns the number of deleted files and error count.
    """

    deleted_count = 0
    error_count = 0

    for file in folder.iterdir():
        if file.is_file():
            try:
                file.unlink()
                deleted_count += 1
                logger.info(f"deleted file: {file}")

            except Exception as e:
                error_count += 1
                logger.error(f"error while deleting {file}: {e}")

    result = {"deleted": deleted_count, "error": error_count}

    if (deleted_count + error_count) > 0:
        logger.info(
            f"deleted success: {result["deleted"]}, with error {result["error"]}"
        )

    return result
