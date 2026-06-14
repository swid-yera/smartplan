#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VENV_DIR="$SCRIPT_DIR/.venv-model"
OUTPUT_DIR="$REPO_ROOT/models/translation/nllb-200-distilled-600M-ct2-int8"
MIN_FREE_KB=$((8 * 1024 * 1024))

FREE_KB="$(df -Pk "$REPO_ROOT" | awk 'NR==2 {print $4}')"
if [ "$FREE_KB" -lt "$MIN_FREE_KB" ]; then
  FREE_GB="$(awk "BEGIN {printf \"%.2f\", $FREE_KB / 1024 / 1024}")"
  echo "Not enough free disk space. Need at least 8 GB, found ${FREE_GB} GB." >&2
  exit 1
fi

if [ ! -d "$VENV_DIR" ]; then
  python3 -m venv "$VENV_DIR"
fi

PYTHON="$VENV_DIR/bin/python"
CONVERTER="$VENV_DIR/bin/ct2-transformers-converter"

"$PYTHON" -m pip install --upgrade pip
"$PYTHON" -m pip install "ctranslate2>=4.5.0,<5.0.0" "transformers>=4.45.0,<5.0.0" "sentencepiece>=0.2.0,<0.3.0" "protobuf>=5.0.0"
"$PYTHON" -m pip install torch --index-url https://download.pytorch.org/whl/cpu

mkdir -p "$OUTPUT_DIR"

"$CONVERTER" \
  --model facebook/nllb-200-distilled-600M \
  --output_dir "$OUTPUT_DIR" \
  --quantization int8 \
  --force \
  --copy_files tokenizer_config.json special_tokens_map.json sentencepiece.bpe.model tokenizer.json

echo "Model prepared at $OUTPUT_DIR"
