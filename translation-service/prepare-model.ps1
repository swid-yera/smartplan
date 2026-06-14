$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..")
$VenvDir = Join-Path $ScriptDir ".venv-model"
$OutputDir = Join-Path $RepoRoot "models\translation\nllb-200-distilled-600M-ct2-int8"
$MinFreeBytes = 8GB

$RepoDrive = (Get-Item $RepoRoot).PSDrive
if ($RepoDrive.Free -lt $MinFreeBytes) {
    $freeGb = [math]::Round($RepoDrive.Free / 1GB, 2)
    throw "Not enough free disk space on $($RepoDrive.Name): drive. Need at least 8 GB, found $freeGb GB."
}

if (-not (Test-Path $VenvDir)) {
    python -m venv $VenvDir
}

$Python = Join-Path $VenvDir "Scripts\python.exe"
$Converter = Join-Path $VenvDir "Scripts\ct2-transformers-converter.exe"

& $Python -m pip install --upgrade pip
& $Python -m pip install "ctranslate2>=4.5.0,<5.0.0" "transformers>=4.45.0,<5.0.0" "sentencepiece>=0.2.0,<0.3.0" "protobuf>=5.0.0"
& $Python -m pip install torch --index-url https://download.pytorch.org/whl/cpu

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

& $Converter `
    --model facebook/nllb-200-distilled-600M `
    --output_dir $OutputDir `
    --quantization int8 `
    --force `
    --copy_files tokenizer_config.json special_tokens_map.json sentencepiece.bpe.model tokenizer.json

Write-Host "Model prepared at $OutputDir"
