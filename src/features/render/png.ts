import { zlibSync } from 'fflate';
import { parseHex, type PixelCanvas } from './canvas';

/**
 * A minimal indexed-colour PNG encoder for pixel canvases. The README picture embeds its static
 * layers as PNG (a year-old island as vector paths would weigh megabytes); `fflate` is pure
 * JavaScript, so the same canvas gives the same bytes on every machine.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = (CRC_TABLE[(c ^ b) & 0xff] as number) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/** Encode a canvas (at most 255 colours, alpha allowed) as an 8-bit indexed PNG. */
export function encodePng(canvas: PixelCanvas): Uint8Array {
  const { width, height } = canvas;
  if (canvas.colors.length > 255) throw new Error(`a PNG layer can hold 255 colours, this one has ${canvas.colors.length}`);
  // index 0 is "transparent", the canvas colours follow
  const palette = new Uint8Array(3 * (canvas.colors.length + 1));
  const alpha = new Uint8Array(canvas.colors.length + 1);
  canvas.colors.forEach((color, i) => {
    const [r, g, b, a] = parseHex(color);
    palette.set([r, g, b], 3 * (i + 1));
    alpha[i + 1] = a;
  });
  const raw = new Uint8Array((width + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width + 1)] = 0;
    for (let x = 0; x < width; x++) raw[y * (width + 1) + 1 + x] = (canvas.data[y * width + x] ?? -1) + 1;
  }
  const header = new Uint8Array(13);
  const hv = new DataView(header.buffer);
  hv.setUint32(0, width);
  hv.setUint32(4, height);
  header.set([8, 3, 0, 0, 0], 8);
  const parts = [
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('PLTE', palette),
    chunk('tRNS', alpha),
    chunk('IDAT', zlibSync(raw, { level: 9 })),
    chunk('IEND', new Uint8Array()),
  ];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

function base64(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] as number;
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    out += chars[a >> 2];
    out += chars[((a & 3) << 4) | ((b ?? 0) >> 4)];
    out += b === undefined ? '=' : chars[((b & 15) << 2) | ((c ?? 0) >> 6)];
    out += c === undefined ? '=' : chars[c & 63];
  }
  return out;
}

export function pngDataUri(canvas: PixelCanvas): string {
  return `data:image/png;base64,${base64(encodePng(canvas))}`;
}
