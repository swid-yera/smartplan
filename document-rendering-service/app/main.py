import os
from fastapi import FastAPI, Body, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from app.logger import logger
from app.config import OUT_DIR
from app.helpers.cleanup import cleanup_by_count, clear_out_folder
from app.services.hik import generate_hik_report
from app.services.lesson import generate_lesson_docx
from app.services.rup import generate_rup_docx
from app.services.rup_import import MAX_DOCX_BYTES, RupImportParseError, parse_rup_docx


app = FastAPI(title="Document Generator")

# Настройка CORS
origins = [
    "http://localhost:3000",  # Адрес твоего фронтенда (Next.js/React)
    "http://127.0.0.1:3000",
    # Добавь сюда другие домены, если нужно
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Разрешенные домены
    allow_credentials=True,
    allow_methods=["*"],  # Разрешить все методы (POST, GET, и т.д.)
    allow_headers=["*"],  # Разрешить все заголовки
    expose_headers=["Content-Disposition"],
)


@app.post("/generate-rup", response_class=FileResponse)
def generate_document(payload: dict = Body(...)):
    try:
        logger.info(
            "/generate-rup, request to generate document: %s", payload.get("name")
        )

        # cleanup
        deleted = cleanup_by_count(OUT_DIR, max_files=2)
        print(
            f"old files removed: {deleted['deleted']}, with error: {deleted['error']}"
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
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/parse-rup-docx")
async def parse_rup_docx_endpoint(file: UploadFile = File(...)):
    try:
        logger.info("/parse-rup-docx, request received for file: %s", file.filename)

        filename = file.filename or ""
        if not filename.lower().endswith(".docx"):
            raise HTTPException(status_code=400, detail="only .docx files are supported")

        content = await file.read()
        if len(content) > MAX_DOCX_BYTES:
            raise HTTPException(status_code=413, detail="docx file is too large")

        payload = parse_rup_docx(content, filename)
        logger.info("/parse-rup-docx, document parsed successfully: %s", filename)

        return payload
    except HTTPException:
        raise
    except RupImportParseError as e:
        logger.warning("/parse-rup-docx, unsupported document: %s", e)
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception("/parse-rup-docx, error while parsing document")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-lesson", response_class=FileResponse)
def generate_lesson(payload: dict = Body(...)):
    try:
        logger.info(
            "/generate-lesson, request to generate document: %s",
            payload.get("topic_name"),
        )

        cleanup_by_count(OUT_DIR, max_files=2)

        file_path = generate_lesson_docx(payload)

        logger.info(
            "/generate-lesson, document generated successfully: %s",
            file_path,
        )
        return FileResponse(
            path=file_path,
            filename=file_path.name,
            media_type=(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ),
        )

    except Exception as e:
        logger.exception("/generate-lesson, error while generating document")
        raise HTTPException(status_code=500, detail=str(e))


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
        raise HTTPException(status_code=500, detail=str(e))


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
        raise HTTPException(status_code=500, detail=str(e))
