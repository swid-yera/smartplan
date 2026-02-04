import os
from fastapi import FastAPI, Body, File, UploadFile
from fastapi.responses import FileResponse

from app.logger import logger
from app.config import OUT_DIR
from app.helpers.cleanup import cleanup_by_count, clear_out_folder
from app.services.hik import generate_hik_report
from app.services.rup import generate_rup_docx
from app.helpers.security import verify_api_key


app = FastAPI(title="Document Generator")


@app.post("/generate-rup", response_class=FileResponse)
def generate_document(payload: dict = Body(...)):
    try:
        logger.info(
            "/generate-rup, request to generate document: %s", payload.get("name")
        )

        # cleanup
        deleted = cleanup_by_count(OUT_DIR, max_files=2)
        print(
            f"old files removed: {deleted["deleted"]}, with error: {deleted["error"]}"
        )

        # generate rup docx
        file_path = generate_rup_docx(payload)

        logger.info("/generate-rup, document generated successfully: %s", file_path)
        return FileResponse(
            path=file_path,
            filename=file_path.name,
            media_type=(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ),
        )

    except Exception as e:
        logger.exception("/generate-rup, error while generating document")
        return {"status": "error", "message": str(e)}


@app.delete("/cleanup")
async def delete_out_files():
    """
    delete all files in /out folder
    """

    try:
        logger.info("/cleanup, request to cleanup all files")

        deleted = clear_out_folder(OUT_DIR)

        logger.info("/cleanup, all files deleted successfully")
        return {
            "deleted_files": deleted["deleted"],
            "error": deleted["error"],
            "status": "success",
        }
    except Exception as e:
        logger.exception("/cleanup, error during cleanup")
        return {"status": "error", "message": str(e)}


@app.post("/hik-to-report", response_class=FileResponse)
async def hik_to_report(file: UploadFile = File(...)):
    try:
        logger.info(f"/hik-to-report, request received for file: {file.filename}")

        # Удаляем старые файлы (используем твою логику)
        cleanup_by_count(OUT_DIR, max_files=2)

        content = await file.read()
        file_path = generate_hik_report(content, file.filename)

        logger.info(f"/hik-to-report, report generated: {file_path}")

        return FileResponse(
            path=file_path,
            filename=os.path.basename(file_path),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    except Exception as e:
        logger.exception("/hik-to-report, error")
        return {"status": "error", "message": str(e)}
