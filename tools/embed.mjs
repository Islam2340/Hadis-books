import { pipeline, env } from "@xenova/transformers";
import fs from "fs";
import zlib from "zlib";
env.cacheDir = "./models";
const [html, out] = process.argv.slice(2);
const src = fs.readFileSync(html, "utf8");
const b64 = src.match(/atob\("([A-Za-z0-9+\/=]+)"\)/)[1];
const data = JSON.parse(zlib.gunzipSync(Buffer.from(b64, "base64")).toString("utf8"));
const texts = [];
for (const s of data.s) for (const b of s.b) for (const t of b.r) texts.push(t);
console.log(html, "records:", texts.length);
const ext = await pipeline("feature-extraction", "Xenova/multilingual-e5-small", { quantized: true });
const D = 384, N = texts.length, scales = new Float32Array(N), q = new Int8Array(N * D);
const order = [...texts.keys()].sort((a, b) => texts[a].length - texts[b].length);
for (let i = 0; i < N; i += 32) {
  const idx = order.slice(i, i + 32);
  const o = await ext(idx.map(j => "passage: " + texts[j].slice(0, 600)), { pooling: "mean", normalize: true });
  idx.forEach((j, r) => {
    let m = 0;
    for (let k = 0; k < D; k++) m = Math.max(m, Math.abs(o.data[r * D + k]));
    const s = m / 127 || 1; scales[j] = s;
    for (let k = 0; k < D; k++) q[j * D + k] = Math.round(o.data[r * D + k] / s);
  });
  if (i % 3200 === 0) console.log(i, "/", N);
}
const h = Buffer.alloc(8); h.writeUInt32LE(N, 0); h.writeUInt32LE(D, 4);
fs.writeFileSync(out, Buffer.concat([h, Buffer.from(scales.buffer), Buffer.from(q.buffer)]));
console.log("done", out);
