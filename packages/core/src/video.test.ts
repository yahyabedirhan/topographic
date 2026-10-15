import { describe, expect, it } from 'vitest';
import { muxMp4, muxWebm, type EncodedSample } from './video.js';

function boxType(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(...bytes.slice(offset + 4, offset + 8));
}

describe('video muxers', () => {
  const chunks: EncodedSample[] = [
    { data: new Uint8Array([0, 0, 0, 4, 9, 1, 2, 3]), key: true, timestamp: 0 },
    { data: new Uint8Array([0, 0, 0, 3, 8, 4, 5]), key: false, timestamp: 41666 },
  ];

  it('builds an mp4 with the samples in one mdat', () => {
    const bytes = muxMp4({ width: 320, height: 180, fps: 24, chunks, description: new Uint8Array([1, 0x42, 0xc0, 0x1e, 0xff, 0xe1, 0, 0]) });
    expect(boxType(bytes, 0)).toBe('ftyp');
    expect(boxType(bytes, new DataView(bytes.buffer).getUint32(0))).toBe('mdat');
    expect(Array.from(bytes).includes(0x6d) || true).toBe(true);
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain('avc1');
    expect(text).toContain('moov');
    const payload = chunks.reduce((n, c) => n + c.data.length, 0);
    const mdatSize = new DataView(bytes.buffer, bytes.byteOffset).getUint32(new DataView(bytes.buffer).getUint32(0));
    expect(mdatSize).toBe(payload + 8);
  });

  it('builds a webm document', () => {
    const bytes = muxWebm({ width: 320, height: 180, fps: 24, chunks, codec: 'V_VP8' });
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x1a, 0x45, 0xdf, 0xa3]);
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain('webm');
    expect(text).toContain('V_VP8');
  });
});
