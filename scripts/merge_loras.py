#!/usr/bin/env python3
"""Merge each LoRA adapter into the Qwen2.5-0.5B-Instruct base model.

Outputs full standalone models to models/merged/{portfolio,layout}/. These
are the inputs to the MLC compile step (see scripts/compile_mlc.sh, run
under WSL).

Run from fluid-odyssey root:
    python scripts/merge_loras.py
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

import torch
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

ROOT = Path(__file__).resolve().parent.parent
BASE_MODEL = "Qwen/Qwen2.5-0.5B-Instruct"
ADAPTERS = {
    "portfolio": ROOT / "models" / "loras" / "portfolio",
    "layout":    ROOT / "models" / "loras" / "layout",
}
OUT_DIR = ROOT / "models" / "merged"


def merge_one(name: str, adapter_path: Path) -> None:
    out = OUT_DIR / name
    if (out / "model.safetensors").exists():
        print(f"[{name}] already merged at {out}, skipping (delete to rebuild)")
        return

    print(f"[{name}] loading base {BASE_MODEL}...")
    base = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        torch_dtype=torch.float16,
        low_cpu_mem_usage=True,
    )

    print(f"[{name}] loading adapter from {adapter_path}...")
    peft_model = PeftModel.from_pretrained(base, str(adapter_path))

    print(f"[{name}] merging...")
    merged = peft_model.merge_and_unload()

    print(f"[{name}] saving to {out}...")
    out.mkdir(parents=True, exist_ok=True)
    merged.save_pretrained(out, safe_serialization=True)

    # Copy tokenizer from the adapter dir (it was saved alongside).
    tok = AutoTokenizer.from_pretrained(str(adapter_path))
    tok.save_pretrained(out)

    # Also copy chat_template.jinja explicitly (some loaders look for it).
    src_tmpl = adapter_path / "chat_template.jinja"
    if src_tmpl.exists():
        shutil.copy(src_tmpl, out / "chat_template.jinja")

    print(f"[{name}] done. Files: {sorted(p.name for p in out.iterdir())}")


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, path in ADAPTERS.items():
        if not path.exists():
            print(f"[error] adapter not found: {path}", file=sys.stderr)
            return 1
        merge_one(name, path)
    print(f"\nAll merged. Next: bash scripts/compile_mlc.sh (run under WSL)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
