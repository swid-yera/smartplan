#!/usr/bin/env bash
set -euo pipefail

MODEL_NAME="${TRANSLATION_MODEL_NAME:-nllb-200-distilled-600M-ct2-int8}"
OUTPUT_DIR="${NLLB_MODEL_OUTPUT_DIR:-/models/${MODEL_NAME}}"
MIN_FREE_KB=$((8 * 1024 * 1024))

mkdir -p /models

FREE_KB="$(df -Pk /models | awk 'NR==2 {print $4}')"
if [ "$FREE_KB" -lt "$MIN_FREE_KB" ]; then
  FREE_GB="$(awk "BEGIN {printf \"%.2f\", $FREE_KB / 1024 / 1024}")"
  echo "Not enough free disk space in /models. Need at least 8 GB, found ${FREE_GB} GB." >&2
  exit 1
fi

if [ -f "$OUTPUT_DIR/model.bin" ] && [ -f "$OUTPUT_DIR/config.json" ]; then
  echo "Model already exists at $OUTPUT_DIR"
  exit 0
fi

mkdir -p "$OUTPUT_DIR"

ct2-transformers-converter \
  --model facebook/nllb-200-distilled-600M \
  --output_dir "$OUTPUT_DIR" \
  --quantization int8 \
  --force \
  --copy_files tokenizer_config.json special_tokens_map.json sentencepiece.bpe.model tokenizer.json

echo "Model prepared at $OUTPUT_DIR"
