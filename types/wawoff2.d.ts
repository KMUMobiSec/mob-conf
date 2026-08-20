declare module "wawoff2" {
  /** Decompress a WOFF2 buffer back to its underlying TTF/OTF sfnt bytes. */
  export function decompress(input: Uint8Array | Buffer): Promise<Uint8Array>;
  /** Compress a TTF/OTF buffer to WOFF2. */
  export function compress(input: Uint8Array | Buffer): Promise<Uint8Array>;
}
