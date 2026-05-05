#!/usr/bin/env bash
# Compile each merged Qwen 0.5B + LoRA into an MLC bundle (webgpu target).
# Run from WSL Ubuntu, NOT from Windows shell.
#
#   wsl -d Ubuntu-24.04 -- bash /mnt/e/GITHUB/fluid-odyssey/scripts/compile_mlc.sh
#
# Outputs:
#   models/compiled/portfolio-q4f16/
#   models/compiled/layout-q4f16/
#
# Each bundle contains:
#   - mlc-chat-config.json
#   - tokenizer.json
#   - ndarray-cache.json + sharded params (*.bin)
#   - <model_id>-webgpu.wasm  ← model_lib for web-llm

set -euo pipefail

VENV="$HOME/.venvs/mlc"
ROOT="/mnt/e/GITHUB/fluid-odyssey"
MERGED="$ROOT/models/merged"
COMPILED="$ROOT/models/compiled"
QUANT="q4f16_1"
TARGET="webgpu"
CONV_TEMPLATE="qwen2"

# CUDA 12 libs from the venv (TVM was built against cu124).
CUDA12="$VENV/lib/python3.12/site-packages/nvidia"
export LD_LIBRARY_PATH="$CUDA12/cuda_runtime/lib:$CUDA12/cublas/lib:$CUDA12/cudnn/lib:$CUDA12/curand/lib:$CUDA12/cusolver/lib:$CUDA12/cusparse/lib:$CUDA12/cufft/lib:$CUDA12/nvjitlink/lib:$CUDA12/nvtx/lib:$CUDA12/cuda_cupti/lib:$CUDA12/cuda_nvrtc/lib:${LD_LIBRARY_PATH:-}"

source "$VENV/bin/activate"
mkdir -p "$COMPILED"

compile_one() {
  local name="$1"
  local src="$MERGED/$name"
  local out="$COMPILED/${name}-${QUANT}"

  if [ -f "$out/${name}-${QUANT}-${TARGET}.wasm" ] || [ -f "$out/lib.wasm" ]; then
    echo "==> [$name] already compiled at $out, skipping"
    return
  fi

  echo "==> [$name] convert_weight ($QUANT)"
  mkdir -p "$out"
  python -m mlc_llm convert_weight "$src" \
    --quantization "$QUANT" \
    --device cpu \
    --output "$out"

  echo "==> [$name] gen_config"
  python -m mlc_llm gen_config "$src" \
    --quantization "$QUANT" \
    --conv-template "$CONV_TEMPLATE" \
    --output "$out"

  echo "==> [$name] compile → $TARGET wasm"
  python -m mlc_llm compile "$out/mlc-chat-config.json" \
    --device "$TARGET" \
    --output "$out/lib.wasm"

  echo "==> [$name] DONE → $out"
  ls -lh "$out"
}

compile_one portfolio
compile_one layout

echo
echo "All compiled. Bundles in: $COMPILED"
echo "Next: copy bundles into fluid-odyssey/public/models/ (or host on a CDN),"
echo "      then set VITE_PERSONAL_MODEL_URL + VITE_PERSONAL_MODEL_LIB."
