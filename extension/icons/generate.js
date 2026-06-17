// Generates simple placeholder PNG icons (teal rounded square + white dot).
// Run: node extension/icons/generate.js
// Replace these with a real logo before publishing if you like.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const TEAL = [37, 135, 109];
const WHITE = [255, 255, 255];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function makePng(size) {
  const radius = size * 0.22;
  const cx = size / 2;
  const cy = size / 2;
  const dotR = size * 0.16;

  const raw = Buffer.alloc(size * (size * 4 + 1));
  let pos = 0;
  for (let y = 0; y < size; y++) {
    raw[pos++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      // Rounded-corner mask
      let inside = true;
      const corners = [
        [radius, radius],
        [size - radius, radius],
        [radius, size - radius],
        [size - radius, size - radius],
      ];
      if (x < radius && y < radius)
        inside = Math.hypot(x - corners[0][0], y - corners[0][1]) <= radius;
      else if (x > size - radius && y < radius)
        inside = Math.hypot(x - corners[1][0], y - corners[1][1]) <= radius;
      else if (x < radius && y > size - radius)
        inside = Math.hypot(x - corners[2][0], y - corners[2][1]) <= radius;
      else if (x > size - radius && y > size - radius)
        inside = Math.hypot(x - corners[3][0], y - corners[3][1]) <= radius;

      let r = TEAL[0];
      let g = TEAL[1];
      let b = TEAL[2];
      let a = inside ? 255 : 0;

      // White center dot
      if (inside && Math.hypot(x - cx, y - cy) <= dotR) {
        r = WHITE[0];
        g = WHITE[1];
        b = WHITE[2];
      }

      raw[pos++] = r;
      raw[pos++] = g;
      raw[pos++] = b;
      raw[pos++] = a;
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of [16, 48, 128]) {
  const out = path.join(__dirname, `icon${size}.png`);
  fs.writeFileSync(out, makePng(size));
  console.log("wrote", out);
}
