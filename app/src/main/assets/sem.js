import { pipeline, env } from "./lib/transformers.min.js";
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = "/assets/models/";
env.useBrowserCache = false;
env.backends.onnx.wasm.wasmPaths = "/assets/lib/";
env.backends.onnx.wasm.numThreads = 1;
let p;
export async function embed(q) {
  p = p || await pipeline("feature-extraction", "Xenova/multilingual-e5-small", { quantized: true });
  const o = await p("query: " + q, { pooling: "mean", normalize: true });
  return o.data;
}
