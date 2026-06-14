# Eduplan Translation Service

Internal FastAPI service for `ru <-> kz` translation through NLLB-200 and CTranslate2.

## Model Preparation

The container does not download model files on startup. Prepare the quantized CTranslate2 model once and keep it outside git.

Using Docker Compose:

```powershell
docker compose -f ..\shared\docker\docker-compose.yml --profile tools run --rm translation-model-prepare
docker compose -f ..\shared\docker\docker-compose.yml up --build -d translation-service api
```

Or locally on Windows:

```powershell
.\prepare-model.ps1
```

On Linux/macOS:

```bash
./prepare-model.sh
```

Docker Compose mounts `../../models/translation` as `/models`, so the service expects:

```text
models/translation/nllb-200-distilled-600M-ct2-int8
```

The directory must contain `model.bin`, `config.json`, tokenizer config files, and either
`sentencepiece.bpe.model` or `tokenizer.json`.

## Local Run

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\start.sh
```

The service listens on `http://localhost:8082`.

## Local Test

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install pytest fastapi httpx redis
.\.venv\Scripts\python -m pytest -q
```
