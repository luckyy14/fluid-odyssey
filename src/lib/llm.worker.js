// Web-llm worker. Runs the model off the main thread so WGSL→HLSL shader
// compile and inference don't block the UI (or our heartbeat timers).
import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm';

const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => {
  handler.onmessage(msg);
};
