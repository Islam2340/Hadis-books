import fs from "fs"; import zlib from "zlib"; import crypto from "crypto";
const h = crypto.createHash("sha256");
for (const f of ["part1", "part2"]) {
  const s = fs.readFileSync(`../app/src/main/assets/${f}.html`, "utf8");
  const b = s.match(/atob\("([A-Za-z0-9+\/=]+)"\)/)[1];
  h.update(zlib.gunzipSync(Buffer.from(b, "base64")));
}
console.log(h.digest("hex").slice(0, 20));
