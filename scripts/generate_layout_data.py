#!/usr/bin/env python3
"""Convenience wrapper: shells out to the real generator in
../fluid-portfolio-trainer/ so it works no matter which repo you cd'd into.

The actual script lives there because it reads/writes data/layout/*.jsonl
which is owned by the trainer repo.

Usage (identical to the real script):
    GEMINI_API_KEY=AIza... python scripts/generate_layout_data.py --target-rows 2000
    python scripts/generate_layout_data.py --no-api --paraphrase-per-seed 4
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

THIS = Path(__file__).resolve()
ODYSSEY_ROOT = THIS.parent.parent
TRAINER_ROOT = ODYSSEY_ROOT.parent / "fluid-portfolio-trainer"
TARGET_SCRIPT = TRAINER_ROOT / "scripts" / "generate_layout_data.py"


def main() -> int:
    if not TARGET_SCRIPT.exists():
        print(f"[error] real script not found at: {TARGET_SCRIPT}", file=sys.stderr)
        print("        is fluid-portfolio-trainer cloned next to fluid-odyssey?", file=sys.stderr)
        return 1
    # Inherit env (so GEMINI_API_KEY etc. pass through), forward all argv,
    # and run from the trainer repo so its relative paths resolve.
    return subprocess.call(
        [sys.executable, str(TARGET_SCRIPT), *sys.argv[1:]],
        cwd=str(TRAINER_ROOT),
        env=os.environ,
    )


if __name__ == "__main__":
    sys.exit(main())
