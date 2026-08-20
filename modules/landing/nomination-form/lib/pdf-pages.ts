/**
 * Best-effort PDF page counter. Scans the file bytes as latin1 text for
 * `/Count N` (page-tree counts) and falls back to counting `/Type /Page`
 * objects. Returns the page count, or `null` when it cannot be determined.
 *
 * Works in the browser and on the server — both receive `File`/`Blob` objects
 * that expose `arrayBuffer()`.
 */
export async function countPdfPages(file: Blob): Promise<number | null> {
  try {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);

    let str = "";
    const chunk = 65536;
    for (let i = 0; i < bytes.length; i += chunk) {
      str += String.fromCharCode(...Array.from(bytes.subarray(i, i + chunk)));
    }

    let max = 0;
    const counts = str.match(/\/Count\s+(\d+)/g);
    if (counts) {
      for (const c of counts) {
        const n = Number.parseInt(c.replace(/\/Count\s+/, ""), 10);
        if (n > max) max = n;
      }
    }
    if (max > 0) return max;

    const pages = str.match(/\/Type\s*\/Page[^s]/g);
    return pages ? pages.length : null;
  } catch {
    return null;
  }
}
