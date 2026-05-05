# models/

Landing area for trained LoRA adapters and any locally-built MLC bundles.
Everything in this directory is **gitignored** except this README — the
binaries are large and machine-generated.

## Layout

```
models/
├── loras/
│   ├── portfolio/        # voice/style LoRA, Qwen 2.5 0.5B base
│   │   ├── adapter_config.json
│   │   ├── adapter_model.safetensors
│   │   ├── tokenizer.json
│   │   ├── tokenizer_config.json
│   │   └── chat_template.jinja
│   ├── layout/           # JSON-output LoRA, Qwen 2.5 0.5B base
│   │   └── (same files)
│   └── SYNC_INFO.txt     # provenance stamp from the trainer
├── base/                 # optional: cached base model for offline merging
│   └── Qwen2.5-0.5B-Instruct/
└── compiled/             # optional: MLC bundles ready to host
    ├── portfolio-q4f16/
    └── layout-q4f16/
```

## How these arrive here

1. `cd ../fluid-portfolio-trainer`
2. `bash scripts/train_two_loras.sh` — trains both adapters in sequence
3. `bash scripts/move_loras_to_odyssey.sh` — copies them into `loras/`

See `../fluid-portfolio-trainer/configs/examples/lakshay-{portfolio,layout}-qwen-0.5b.yaml`
for the exact training configs.

## Why these CAN'T be loaded directly by web-llm

web-llm consumes MLC-LLM bundles (`.wasm` + `mlc-chat-config.json` +
sharded params). It does not load raw HuggingFace safetensors at runtime.

To actually serve a LoRA from this directory in fluid-odyssey:

1. **Merge** the adapter into the base model:
   ```bash
   pip install peft transformers
   python -c "
   from peft import PeftModel
   from transformers import AutoModelForCausalLM, AutoTokenizer
   base = AutoModelForCausalLM.from_pretrained('Qwen/Qwen2.5-0.5B-Instruct')
   merged = PeftModel.from_pretrained(base, 'models/loras/layout').merge_and_unload()
   merged.save_pretrained('models/merged/layout')
   AutoTokenizer.from_pretrained('Qwen/Qwen2.5-0.5B-Instruct').save_pretrained('models/merged/layout')
   "
   ```

2. **Compile** with MLC-LLM (Linux/CUDA recommended):
   ```bash
   mlc_llm convert_weight models/merged/layout \
       --quantization q4f16_1 \
       --output models/compiled/layout-q4f16
   mlc_llm gen_config models/merged/layout \
       --quantization q4f16_1 \
       --conv-template qwen2 \
       --output models/compiled/layout-q4f16
   mlc_llm compile models/compiled/layout-q4f16 \
       --device webgpu \
       --output models/compiled/layout-q4f16/lib.wasm
   ```

3. **Host** the bundle (Cloudflare R2, HuggingFace Hub, S3, …) and point
   fluid-odyssey at it:
   ```
   # .env.local in fluid-odyssey/
   VITE_PERSONAL_MODEL_URL=https://your-cdn/portfolio-q4f16/
   VITE_PERSONAL_MODEL_LIB=https://your-cdn/portfolio-q4f16/lib.wasm
   ```
   (The runtime in `src/lib/llmEngine.js` reads these env vars and feeds
   them into web-llm's `appConfig`.)

The full plan including data scale, evaluation metrics, and risk analysis
lives in [`../layout_adapter_plan.md`](../layout_adapter_plan.md).

## SYNC_INFO.txt

Written by `move_loras_to_odyssey.{sh,ps1}` after each sync. Contains:

- Source repo path
- Sync timestamp (UTC)
- Base model id
- Config file paths used for training

Use it to know which checkpoint produced the adapters currently in this
directory. Don't edit by hand — the move script overwrites it.
