from fastapi import FastAPI, Body
from fastapi.responses import FileResponse

from app.services.rup import generate_rup_docx


app = FastAPI(title="Document Generator")


@app.post("/generate-rup", response_class=FileResponse)
def generate_document(payload: dict = Body(...)):
    file_path = generate_rup_docx(payload)

    return FileResponse(
        path=file_path,
        filename=file_path.name,
        media_type=(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ),
    )
