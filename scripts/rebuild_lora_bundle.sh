#!/usr/bin/env bash
# rebuild_lora_bundle.sh — one-shot pipeline that takes a freshly trained
# LoRA adapter and produces a browser-ready MLC bundle staged in public/.
#
#   Usage:  bash scripts/rebuild_lora_bundle.sh [layout|portfolio]
#
# What it does (idempotent — skips steps whose output already exists):
#   1. Pull the adapter from ../fluid-portfolio-trainer/output/
#   2. Merge LoRA into Qwen 0.5B base (Python on Windows)
#   3. Patch HF config.json so MLC's converter accepts it
#   4. Compile to MLC bundle in WSL (convert_weight + gen_config)
#   5. Copy MLC's prebuilt Qwen wasm as the model_lib
#   6. Add ndarray-cache.json alias + vocab.json + merges.txt
#   7. Stage in public/models/<name>-q4f16_1/{,/resolve/main}/
#   8. Print the cache-bust JS snippet to paste in DevTools
#
# Assumes:
#   - WSL Ubuntu-24.04 is set up with ~/.venvs/mlc + nvidia-cu12 libs
#     (see calibration.md entry 16 for the one-time setup)
#   - The trainer has already produced the adapter you want to ship
#
# To rebuild from scratch:
#   rm -rf models/merged/<name> models/compiled/<name>-q4f16_1 \
#          public/models/<name>-q4f16_1
#   bash scripts/rebuild_lora_bundle.sh <name>

set -euo pipefail

NAME="${1:-layout}"
case "$NAME" in
  layout|portfolio) ;;
  *) echo "Usage: $0 [layout|portfolio]" >&2; exit 1 ;;
esac

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
TRAINER="../fluid-portfolio-trainer"
ADAPTER="$TRAINER/output/lakshay-${NAME}-qwen-0.5b/adapter"
LORA_DIR="$ROOT/models/loras/$NAME"
MERGED="$ROOT/models/merged/$NAME"
COMPILED="$ROOT/models/compiled/${NAME}-q4f16_1"
PUBLIC="$ROOT/public/models/${NAME}-q4f16_1"
QWEN_WASM_URL="https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Qwen2-0.5B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm"
VOCAB_URL="https://huggingface.co/mlc-ai/Qwen2.5-0.5B-Instruct-q4f16_1-MLC/resolve/main/vocab.json"
MERGES_URL="https://huggingface.co/mlc-ai/Qwen2.5-0.5B-Instruct-q4f16_1-MLC/resolve/main/merges.txt"

# ───────── 1. Sync adapter from trainer ─────────
if [ ! -d "$ADAPTER" ]; then
  echo "ERROR: adapter not found at $ADAPTER" >&2
  echo "       run trainer first: cd $TRAINER && python -m fluid_trainer train -c configs/examples/lakshay-${NAME}-qwen-0.5b.yaml --no-tui" >&2
  exit 1
fi
echo "==> [1/7] Sync adapter $NAME → $LORA_DIR"
mkdir -p "$LORA_DIR"
for f in "$ADAPTER"/*; do
  base=$(basename "$f")
  [ -d "$f" ] && continue
  cp "$f" "$LORA_DIR/$base"
done

# ───────── 2. Merge LoRA into base ─────────
if [ -f "$MERGED/model.safetensors" ]; then
  echo "==> [2/7] Merge: skipping (already at $MERGED)"
else
  echo "==> [2/7] Merge LoRA into Qwen 0.5B base"
  python scripts/merge_loras.py
fi

# ───────── 3. Patch HF config rope_theta ─────────
echo "==> [3/7] Patch rope_theta into config.json"
python -c "
import json
p = 'models/merged/$NAME/config.json'
c = json.load(open(p))
if 'rope_theta' not in c:
    c['rope_theta'] = c.get('rope_parameters', {}).get('rope_theta', 1000000.0)
    json.dump(c, open(p, 'w'), indent=2)
    print('  patched')
else:
    print('  already had rope_theta')
"

# ───────── 4. Compile to MLC bundle (WSL) ─────────
if [ -f "$COMPILED/mlc-chat-config.json" ] && [ -f "$COMPILED/params_shard_0.bin" ]; then
  echo "==> [4/7] Compile: skipping (already at $COMPILED)"
else
  echo "==> [4/7] Compile to MLC bundle (under WSL2)"
  rm -rf "$COMPILED"
  mkdir -p "$COMPILED"
  MSYS_NO_PATHCONV=1 wsl -d Ubuntu-24.04 -- bash -c "
    set -e
    source ~/.venvs/mlc/bin/activate
    CUDA12=/root/.venvs/mlc/lib/python3.12/site-packages/nvidia
    export LD_LIBRARY_PATH=\$CUDA12/cuda_runtime/lib:\$CUDA12/cublas/lib:\$CUDA12/cudnn/lib:\$CUDA12/curand/lib:\$CUDA12/cusolver/lib:\$CUDA12/cusparse/lib:\$CUDA12/cufft/lib:\$CUDA12/nvjitlink/lib:\$CUDA12/nvtx/lib:\$CUDA12/cuda_cupti/lib:\$CUDA12/cuda_nvrtc/lib:\${LD_LIBRARY_PATH:-}
    cd /mnt/e/GITHUB/fluid-odyssey
    python -m mlc_llm convert_weight models/merged/$NAME --quantization q4f16_1 --device cpu --output models/compiled/${NAME}-q4f16_1 2>&1 | tail -3
    python -m mlc_llm gen_config models/merged/$NAME --quantization q4f16_1 --conv-template qwen2 --output models/compiled/${NAME}-q4f16_1 2>&1 | tail -3
  "
fi

# ───────── 5. Reuse MLC's prebuilt Qwen 0.5B wasm ─────────
if [ -f "$COMPILED/lib.wasm" ]; then
  echo "==> [5/7] lib.wasm: already present"
else
  echo "==> [5/7] Download prebuilt Qwen 0.5B wasm (model_lib)"
  curl -sL -o "$COMPILED/lib.wasm" "$QWEN_WASM_URL"
fi

# ───────── 6. Add ndarray-cache.json + vocab + merges ─────────
echo "==> [6/7] Add ndarray-cache.json + vocab + merges"
[ -f "$COMPILED/tensor-cache.json" ] && cp "$COMPILED/tensor-cache.json" "$COMPILED/ndarray-cache.json"
[ -f "$MERGED/config.json" ] && cp "$MERGED/config.json" "$COMPILED/config.json"
[ -f "$COMPILED/vocab.json" ]  || curl -sL -o "$COMPILED/vocab.json"  "$VOCAB_URL"
[ -f "$COMPILED/merges.txt" ]  || curl -sL -o "$COMPILED/merges.txt"  "$MERGES_URL"

# ───────── 7. Stage in public/ for Vite ─────────
echo "==> [7/7] Stage in $PUBLIC"
rm -rf "$PUBLIC"
mkdir -p "$PUBLIC/resolve/main"
cp -r "$COMPILED"/* "$PUBLIC/"
cp -r "$COMPILED"/* "$PUBLIC/resolve/main/"

# ───────── done ─────────
SIZE=$(du -sh "$PUBLIC" | cut -f1)
echo
echo "✓ Bundle ready: $PUBLIC ($SIZE)"
echo
echo "Next:"
echo "  1. .env.local should already point at this bundle:"
echo "       VITE_PERSONAL_MODEL_URL=http://localhost:5173/models/${NAME}-q4f16_1/"
echo "       VITE_PERSONAL_MODEL_LIB=http://localhost:5173/models/${NAME}-q4f16_1/lib.wasm"
echo "  2. Restart Vite (workers don't HMR env vars):"
echo "       npm run dev"
echo "  3. In DevTools console, clear the old cached weights:"
echo "       (await indexedDB.databases()).forEach(d => d.name && indexedDB.deleteDatabase(d.name)); (await caches.keys()).forEach(k => caches.delete(k)); location.reload();"
