export interface EncodedSample {
  data: Uint8Array;
  key: boolean;
  timestamp: number;
}

export interface EncodeRequest {
  format: 'mp4' | 'webm';
  width: number;
  height: number;
  fps: number;
  frames: number;
  canvas: HTMLCanvasElement;
  renderFrame: (index: number) => void;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const size = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(size);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
function u8(n: number): Uint8Array { return new Uint8Array([n & 255]); }
function u16(n: number): Uint8Array { const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, n); return b; }
function u32(n: number): Uint8Array { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, n); return b; }
function i16(n: number): Uint8Array { const b = new Uint8Array(2); new DataView(b.buffer).setInt16(0, n); return b; }
function i32(n: number): Uint8Array { const b = new Uint8Array(4); new DataView(b.buffer).setInt32(0, n); return b; }
function f64(n: number): Uint8Array { const b = new Uint8Array(8); new DataView(b.buffer).setFloat64(0, n); return b; }
function str(s: string): Uint8Array { return new TextEncoder().encode(s); }
function box(type: string, ...payload: Uint8Array[]): Uint8Array {
  const body = concat(payload);
  return concat([u32(body.length + 8), str(type), body]);
}
function zeros(n: number): Uint8Array { return new Uint8Array(n); }

function fullBox(type: string, version: number, flags: number, ...payload: Uint8Array[]): Uint8Array {
  return box(type, u32((version << 24) | flags), ...payload);
}

export function muxMp4(opts: { width: number; height: number; fps: number; chunks: EncodedSample[]; description: Uint8Array }): Uint8Array {
  const { width, height, fps, chunks, description } = opts;
  const timescale = fps * 1000;
  const delta = 1000;
  const duration = chunks.length * delta;
  const samples = concat(chunks.map((c) => c.data));
  const ftyp = box('ftyp', str('isom'), u32(0x200), str('isom'), str('iso2'), str('avc1'), str('mp41'));
  const mdat = concat([u32(samples.length + 8), str('mdat'), samples]);
  const name = zeros(32);
  const avc1 = box(
    'avc1',
    zeros(6), u16(1),
    zeros(16),
    u16(width), u16(height),
    u32(0x00480000), u32(0x00480000),
    zeros(4), u16(1), name, u16(0x0018), i16(-1),
    box('avcC', description),
  );
  const stsd = fullBox('stsd', 0, 0, u32(1), avc1);
  const stts = fullBox('stts', 0, 0, u32(1), u32(chunks.length), u32(delta));
  const keys = chunks.map((c, i) => (c.key ? i + 1 : 0)).filter((n) => n > 0);
  const stss = fullBox('stss', 0, 0, u32(keys.length), ...keys.map(u32));
  const stsc = fullBox('stsc', 0, 0, u32(1), u32(1), u32(chunks.length), u32(1));
  const stsz = fullBox('stsz', 0, 0, u32(0), u32(chunks.length), ...chunks.map((c) => u32(c.data.length)));
  const chunkOffset = ftyp.length + 8;
  const stco = fullBox('stco', 0, 0, u32(1), u32(chunkOffset));
  const stbl = box('stbl', stsd, stts, stss, stsc, stsz, stco);
  const url = fullBox('url ', 0, 1);
  const dref = fullBox('dref', 0, 0, u32(1), url);
  const dinf = box('dinf', dref);
  const vmhd = fullBox('vmhd', 0, 1, u16(0), u16(0), u16(0), u16(0));
  const minf = box('minf', vmhd, dinf, stbl);
  const hdlr = fullBox('hdlr', 0, 0, u32(0), str('vide'), zeros(12), str('VideoHandler\0'));
  const mdhd = fullBox('mdhd', 0, 0, u32(0), u32(0), u32(timescale), u32(duration), u16(0x55c4), u16(0));
  const mdia = box('mdia', mdhd, hdlr, minf);
  const matrix = concat([
    u32(0x00010000), u32(0), u32(0),
    u32(0), u32(0x00010000), u32(0),
    u32(0), u32(0), u32(0x40000000),
  ]);
  const tkhd = fullBox(
    'tkhd', 0, 7,
    u32(0), u32(0), u32(1), u32(0), u32(duration),
    zeros(8), u16(0), u16(0), u16(0), u16(0),
    matrix, u32(width << 16), u32(height << 16),
  );
  const trak = box('trak', tkhd, mdia);
  const mvhd = fullBox(
    'mvhd', 0, 0,
    u32(0), u32(0), u32(timescale), u32(duration),
    u32(0x00010000), u16(0x0100), u16(0), zeros(8),
    matrix, zeros(24), u32(2),
  );
  const moov = box('moov', mvhd, trak);
  return concat([ftyp, mdat, moov]);
}

function vint(value: number): Uint8Array {
  let length = 1;
  for (let i = 1; i <= 8; i++) {
    if (value < 2 ** (7 * i) - 1) { length = i; break; }
  }
  const out = new Uint8Array(length);
  let remaining = value;
  for (let i = length - 1; i >= 0; i--) {
    out[i] = remaining & 255;
    remaining = Math.floor(remaining / 256);
  }
  out[0] |= 1 << (8 - length);
  return out;
}
function id(hex: number[]): Uint8Array { return new Uint8Array(hex); }
function el(elementId: Uint8Array, data: Uint8Array): Uint8Array {
  return concat([elementId, vint(data.length), data]);
}
function uintEl(elementId: Uint8Array, value: number, bytes = 1): Uint8Array {
  const data = new Uint8Array(bytes);
  let n = value;
  for (let i = bytes - 1; i >= 0; i--) { data[i] = n & 255; n = Math.floor(n / 256); }
  return el(elementId, data);
}

export function muxWebm(opts: { width: number; height: number; fps: number; chunks: EncodedSample[]; codec: string }): Uint8Array {
  const { width, height, fps, chunks, codec } = opts;
  const ebml = el(id([0x1a, 0x45, 0xdf, 0xa3]), concat([
    uintEl(id([0x42, 0x86]), 1),
    uintEl(id([0x42, 0xf7]), 1),
    uintEl(id([0x42, 0xf2]), 4),
    uintEl(id([0x42, 0xf3]), 8),
    el(id([0x42, 0x82]), str('webm')),
    uintEl(id([0x42, 0x87]), 4),
    uintEl(id([0x42, 0x85]), 2),
  ]));
  const scale = Math.round(1_000_000_000 / fps);
  const info = el(id([0x15, 0x49, 0xa9, 0x66]), concat([
    uintEl(id([0x2a, 0xd7, 0xb1]), scale, 3),
    el(id([0x4d, 0x80]), str('topographic')),
    el(id([0x57, 0x41]), str('topographic')),
    el(id([0x44, 0x89]), f64(chunks.length * scale)),
  ]));
  const track = el(id([0xae]), concat([
    uintEl(id([0xd7]), 1),
    uintEl(id([0x73, 0xc5]), 1, 4),
    uintEl(id([0x83]), 1),
    el(id([0x86]), str(codec)),
    el(id([0xe0]), concat([
      uintEl(id([0xb0]), width, 2),
      uintEl(id([0xba]), height, 2),
    ])),
  ]));
  const tracks = el(id([0x16, 0x54, 0xae, 0x6b]), track);
  const blocks = chunks.map((chunk, index) => {
    const timecode = index;
    const header = concat([u8(0x81), i16(Math.max(-32768, Math.min(32767, timecode))), u8(chunk.key ? 0x80 : 0)]);
    return el(id([0xa3]), concat([header, chunk.data]));
  });
  const cluster = el(id([0x1f, 0x43, 0xb6, 0x75]), concat([
    uintEl(id([0xe7]), 0, 1),
    ...blocks,
  ]));
  const segment = el(id([0x18, 0x53, 0x80, 0x67]), concat([info, tracks, cluster]));
  return concat([ebml, segment]);
}

function bytesOf(src: AllowSharedBufferSource): Uint8Array {
  if (src instanceof ArrayBuffer) return new Uint8Array(src);
  if (ArrayBuffer.isView(src)) return new Uint8Array(src.buffer, src.byteOffset, src.byteLength);
  return new Uint8Array(src);
}

function blobOf(bytes: Uint8Array, type: string): Blob {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return new Blob([copy], { type });
}

export async function encodeVideo(req: EncodeRequest): Promise<Blob> {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') {
    throw new Error(`[topographic] this browser cannot encode ${req.format}`);
  }
  const codec = req.format === 'mp4' ? 'avc1.42001f' : 'vp8';
  const config: VideoEncoderConfig = {
    codec, width: req.width, height: req.height, bitrate: 2_400_000, framerate: req.fps, latencyMode: 'quality',
    ...(req.format === 'mp4' ? { avc: { format: 'avc' } } : {}),
  };
  const supported = await VideoEncoder.isConfigSupported(config);
  if (!supported.supported) throw new Error(`[topographic] this browser cannot encode ${req.format}`);
  const chunks: EncodedSample[] = [];
  const pending: Promise<void>[] = [];
  let description: Uint8Array | undefined;
  let failed: Error | null = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      const data = new Uint8Array(chunk.byteLength);
      const raw = meta?.decoderConfig?.description;
      if (raw) description = bytesOf(raw);
      chunks.push({ data, key: chunk.type === 'key', timestamp: chunk.timestamp });
      pending.push(Promise.resolve(chunk.copyTo(data)).then(() => undefined));
    },
    error: (error) => { failed = error instanceof Error ? error : new Error(String(error)); },
  });
  encoder.configure(config);
  const duration = Math.round(1_000_000 / req.fps);
  for (let i = 0; i < req.frames; i++) {
    if (failed) break;
    req.renderFrame(i);
    const frame = new VideoFrame(req.canvas, { timestamp: i * duration, duration });
    encoder.encode(frame, { keyFrame: i % Math.max(1, req.fps) === 0 });
    frame.close();
  }
  if (!failed) await encoder.flush();
  await Promise.all(pending);
  encoder.close();
  if (failed) throw failed;
  if (!chunks.length) throw new Error('[topographic] video encoder produced no frames');
  if (req.format === 'mp4') {
    if (!description) throw new Error('[topographic] mp4 encoder did not return a decoder description');
    return blobOf(muxMp4({ width: req.width, height: req.height, fps: req.fps, chunks, description }), 'video/mp4');
  }
  return blobOf(muxWebm({ width: req.width, height: req.height, fps: req.fps, chunks, codec: 'V_VP8' }), 'video/webm');
}
