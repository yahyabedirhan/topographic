import { describe, expect, it } from 'vitest';
import { cropRegion, pngFileName, videoFileName } from './png';

describe('cropRegion', () => {
  it('is null for the window shape and for the screen size', () => {
    expect(cropRegion(1.6, 2560, 1600)).toBeNull();
    expect(cropRegion(1.6, 0, 0)).toBeNull();
  });

  it('cuts a phone from a wide view along x, centred by default', () => {
    const r = cropRegion(1.6, 1170, 2532)!;
    expect(r.height).toBe(1);
    expect(r.width).toBeCloseTo((1170 / 2532) / 1.6, 6);
    expect(r.x).toBeCloseTo((1 - r.width) / 2, 6);
    expect(cropRegion(1.6, 1170, 2532, 1)!.x + r.width).toBeCloseTo(1, 6);
    expect(cropRegion(1.6, 1170, 2532, 0)!.x).toBe(0);
  });

  it('cuts 16:9 from a 16:10 view along y', () => {
    const r = cropRegion(1.6, 1920, 1080, 0)!;
    expect(r).toMatchObject({ x: 0, y: 0, width: 1 });
    expect(r.height).toBeCloseTo(0.9, 6);
  });
});

describe('export file names', () => {
  it('names the file after a named place', () => {
    expect(pngFileName({ style: 'seed-pod', seed: 71 }, 'Mount Fuji')).toBe('topographic-mount-fuji.png');
    expect(pngFileName({ style: 'seed-pod', seed: 71 }, 'Matterhorn & Zermatt')).toBe('topographic-matterhorn-and-zermatt.png');
    expect(videoFileName('orbit', 'mp4', 'Everest & the Khumbu')).toBe('topographic-everest-and-the-khumbu-orbit.mp4');
  });

  it('keeps the style and seed, or the motion, without a place', () => {
    expect(pngFileName({ style: 'seed-pod', seed: 71 }, null)).toBe('topographic-seed-pod-71.png');
    expect(pngFileName({ style: 'dunes', seed: 0 }, '')).toBe('topographic-dunes-0.png');
    expect(videoFileName('drone', 'webm')).toBe('topographic-drone.webm');
  });
});
