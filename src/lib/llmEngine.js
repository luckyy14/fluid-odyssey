// Web-llm runtime config. The personalized LoRA bundle (baked + compiled in
// the fluid-trainer repo) is hosted at VITE_PERSONAL_MODEL_URL with model_lib
// at VITE_PERSONAL_MODEL_LIB. When either is unset, fall back to the canonical
// Qwen instruct bundle from MLC's CDN — the site still runs, but pass-1 intent
// routing won't reflect the personality fine-tune.

import { devLog } from './devLog';

const PERSONAL_MODEL_URL = import.meta.env?.VITE_PERSONAL_MODEL_URL || '';
const PERSONAL_MODEL_LIB = import.meta.env?.VITE_PERSONAL_MODEL_LIB || '';
const PERSONAL_MODEL_ID  = 'fluid-personal-q4f16_1-MLC';
const FALLBACK_MODEL_ID  = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';

const useCustomBundle = !!(PERSONAL_MODEL_URL && PERSONAL_MODEL_LIB);
const ACTIVE_MODEL_ID = useCustomBundle ? PERSONAL_MODEL_ID : FALLBACK_MODEL_ID;

let engine = null;
let loadingPromise = null;
let onProgressCallback = null;
let initFailures = 0;

export const LLM_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
};

export function setProgressCallback(cb) {
  onProgressCallback = cb;
}

/**
 * Parse download progress from WebLLM's text-based progress.
 * Returns 0-1 float.
 */
export function parseProgress(progressObj) {
  if (!progressObj) return 0;
  if (typeof progressObj.progress === 'number') return progressObj.progress;
  const text = progressObj.text || '';
  const match = text.match(/([\d.]+)\s*(?:MB|GB)\s*\/\s*([\d.]+)\s*(?:MB|GB)/i);
  if (match) return parseFloat(match[1]) / parseFloat(match[2]);
  if (text.toLowerCase().includes('finish')) return 1;
  return 0;
}

export async function initEngine() {
  if (engine) return engine;
  if (loadingPromise) return loadingPromise;

  devLog.info('llm', 'initEngine() start', {
    model: ACTIVE_MODEL_ID,
    bundle: useCustomBundle ? 'personal-lora' : 'fallback-qwen',
    webgpu: isWebGPUAvailable(),
  });
  const stopInit = devLog.heartbeat('llm', 'engine init (download + shader compile)', 5000);

  loadingPromise = (async () => {
    try {
      const { CreateWebWorkerMLCEngine } = await import('@mlc-ai/web-llm');
      const worker = new Worker(new URL('./llm.worker.js', import.meta.url), { type: 'module' });
      worker.addEventListener('error', (e) => devLog.warn('llm', 'worker error', e.message || e));
      let lastLoggedPct = -1;
      const opts = {
        initProgressCallback: (progress) => {
          const pct = Math.floor(parseProgress(progress) * 100);
          if (pct !== lastLoggedPct && pct % 10 === 0) {
            devLog.debug('llm', `download ${pct}%`, progress?.text);
            lastLoggedPct = pct;
          }
          if (onProgressCallback) onProgressCallback(progress);
        },
      };
      if (useCustomBundle) {
        opts.appConfig = {
          model_list: [{
            model: PERSONAL_MODEL_URL,
            model_id: PERSONAL_MODEL_ID,
            model_lib: PERSONAL_MODEL_LIB,
            overrides: { context_window_size: 2048 },
          }],
        };
        devLog.debug('llm', 'using custom LoRA bundle', { url: PERSONAL_MODEL_URL });
      }
      engine = await CreateWebWorkerMLCEngine(worker, ACTIVE_MODEL_ID, opts);
      initFailures = 0;
      stopInit();
      devLog.info('llm', 'engine ready', { model: ACTIVE_MODEL_ID });
      return engine;
    } catch (err) {
      engine = null;
      loadingPromise = null;
      initFailures++;
      stopInit();
      devLog.warn('llm', `engine init failed (#${initFailures})`, err);
      throw err;
    }
  })();

  return loadingPromise;
}

export function isWebGPUAvailable() {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

export function isLocallyUnavailable() {
  return !isWebGPUAvailable() || initFailures >= 2;
}

export function getEngine() {
  return engine;
}

export const ACTIVE_MODEL = ACTIVE_MODEL_ID;
