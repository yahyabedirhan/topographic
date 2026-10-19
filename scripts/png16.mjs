// PNG helpers for scripts/locations.mjs and its tests: a 16-bit greyscale encoder and an 8-bit decoder.
import { deflateSync, inflateSync } from 'node:zlib';

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes) {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, body) {
  const out = Buffer.alloc(12 + body.length);
  out.writeUInt32BE(body.length, 0);
  out.write(type, 4, 'latin1');
  Buffer.from(body).copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
  return out;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/** Filters each row with the filter whose output has the smallest sum, the usual PNG heuristic. */
function filterRows(pixels, width, height, bpp) {
  const stride = width * bpp;
  const out = Buffer.alloc((stride + 1) * height);
  const trial = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const row = y * stride;
    let best = -1;
    let bestSum = Infinity;
    for (let type = 0; type <= 4; type++) {
      let sum = 0;
      for (let x = 0; x < stride; x++) {
        const a = x >= bpp ? pixels[row + x - bpp] : 0;
        const b = y > 0 ? pixels[row - stride + x] : 0;
        const c = x >= bpp && y > 0 ? pixels[row - stride + x - bpp] : 0;
        const pred = type === 0 ? 0 : type === 1 ? a : type === 2 ? b : type === 3 ? (a + b) >> 1 : paeth(a, b, c);
        const v = (pixels[row + x] - pred) & 255;
        trial[x] = v;
        sum += v < 128 ? v : 256 - v;
      }
      if (sum < bestSum) {
        bestSum = sum;
        best = type;
        out[y * (stride + 1)] = type;
        trial.copy(out, y * (stride + 1) + 1);
      }
    }
    if (best < 0) throw new Error('no filter');
  }
  return out;
}

/** Encodes heights from 0 to 1 (row 0 south) as a square 16-bit greyscale PNG with north at the top. */
export function encodeGrid16(samples, size) {
  const pixels = new Uint8Array(size * size * 2);
  for (let y = 0; y < size; y++) {
    const dst = (size - 1 - y) * size * 2;
    for (let x = 0; x < size; x++) {
      const v = Math.round(Math.min(1, Math.max(0, samples[y * size + x])) * 65535);
      pixels[dst + x * 2] = v >> 8;
      pixels[dst + x * 2 + 1] = v & 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 16; // bit depth
  ihdr[9] = 0; // greyscale
  const idat = deflateSync(filterRows(pixels, size, size, 2), { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Decodes an 8-bit, non-interlaced greyscale, RGB or RGBA PNG to RGBA, and lists its chunk types. */
export function decodePng(bytes) {
  const buf = Buffer.from(bytes);
  let at = 8;
  let width = 0, height = 0, colour = 0, depth = 0, interlace = 0;
  const idat = [];
  const chunks = [];
  while (at < buf.length) {
    const length = buf.readUInt32BE(at);
    const type = buf.toString('latin1', at + 4, at + 8);
    const body = buf.subarray(at + 8, at + 8 + length);
    chunks.push(type);
    if (type === 'IHDR') {
      width = body.readUInt32BE(0); height = body.readUInt32BE(4);
      depth = body[8]; colour = body[9]; interlace = body[12];
    } else if (type === 'IDAT') idat.push(body);
    else if (type === 'IEND') break;
    at += 12 + length;
  }
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colour];
  if (depth !== 8 || !channels || interlace) throw new Error(`unsupported PNG: depth ${depth}, colour ${colour}, interlace ${interlace}`);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const px = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const type = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? px[y * stride + x - channels] : 0;
      const b = y > 0 ? px[(y - 1) * stride + x] : 0;
      const c = x >= channels && y > 0 ? px[(y - 1) * stride + x - channels] : 0;
      const v = raw[y * (stride + 1) + 1 + x];
      px[y * stride + x] = (type === 0 ? v : type === 1 ? v + a : type === 2 ? v + b : type === 3 ? v + ((a + b) >> 1) : v + paeth(a, b, c)) & 255;
    }
  }
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const s = i * channels;
    const g = channels <= 2;
    rgba[i * 4] = px[s];
    rgba[i * 4 + 1] = g ? px[s] : px[s + 1];
    rgba[i * 4 + 2] = g ? px[s] : px[s + 2];
    rgba[i * 4 + 3] = channels === 4 ? px[s + 3] : channels === 2 ? px[s + 1] : 255;
  }
  return { width, height, rgba, chunks };
}
