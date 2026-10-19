/**
 * Reads the built-in locations' height grids: square 16-bit greyscale PNGs, north at the top.
 * A canvas would round 16 bits down to 8, so the file is decoded here with DecompressionStream.
 */

export interface Grid16 {
  /** Heights from 0 to 1. Row 0 is south, column 0 is west. */
  samples: Float32Array;
  size: number;
}

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

function u32(b: Uint8Array, at: number): number {
  return ((b[at] << 24) | (b[at + 1] << 16) | (b[at + 2] << 8) | b[at + 3]) >>> 0;
}

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  // 'deflate' is the zlib format that PNG uses, with its two-byte header and checksum.
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/** Undoes the PNG row filters in place. `bpp` is bytes per pixel. Returns the rows without filter bytes. */
export function unfilter(raw: Uint8Array, width: number, height: number, bpp: number): Uint8Array {
  const stride = width * bpp;
  const out = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const type = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const row = y * stride;
    const up = row - stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[row + x - bpp] : 0;
      const b = y > 0 ? out[up + x] : 0;
      const c = x >= bpp && y > 0 ? out[up + x - bpp] : 0;
      const v = raw[src + x];
      out[row + x] = (type === 0 ? v : type === 1 ? v + a : type === 2 ? v + b : type === 3 ? v + ((a + b) >> 1) : v + paeth(a, b, c)) & 255;
    }
  }
  return out;
}

/** Decodes a square 16-bit greyscale PNG into heights from 0 to 1, south row first. */
export async function decodeGrid16(bytes: Uint8Array): Promise<Grid16> {
  for (let i = 0; i < SIGNATURE.length; i++) if (bytes[i] !== SIGNATURE[i]) throw new Error('[topographic] location grid is not a PNG');
  let at = 8;
  let width = 0;
  let height = 0;
  const parts: Uint8Array[] = [];
  while (at + 8 <= bytes.length) {
    const length = u32(bytes, at);
    const type = String.fromCharCode(bytes[at + 4], bytes[at + 5], bytes[at + 6], bytes[at + 7]);
    const body = bytes.subarray(at + 8, at + 8 + length);
    if (type === 'IHDR') {
      width = u32(body, 0);
      height = u32(body, 4);
      const depth = body[8];
      const colour = body[9];
      const interlace = body[12];
      if (depth !== 16 || colour !== 0 || interlace !== 0) throw new Error('[topographic] location grid must be a 16-bit greyscale PNG');
    } else if (type === 'IDAT') parts.push(body);
    else if (type === 'IEND') break;
    at += 12 + length;
  }
  if (!width || width !== height) throw new Error('[topographic] location grid must be square');
  const joined = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) { joined.set(p, offset); offset += p.length; }
  const pixels = unfilter(await inflate(joined), width, height, 2);
  const size = width;
  const samples = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    // PNG row 0 is the north edge; heightfield row 0 is the south edge.
    const src = (size - 1 - y) * size * 2;
    for (let x = 0; x < size; x++) samples[y * size + x] = ((pixels[src + x * 2] << 8) | pixels[src + x * 2 + 1]) / 65535;
  }
  return { samples, size };
}

/** Decodes standard base64 into bytes. */
export function fromBase64(text: string): Uint8Array {
  const bin = atob(text);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
