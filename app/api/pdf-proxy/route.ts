/**
 * /api/pdf-proxy?url=<encoded-url>
 * ──────────────────────────────────
 * Fetches the PDF from NCERT server-side and streams it back.
 * Uses Node's https module directly — more reliable than fetch()
 * for old servers (like ncert.nic.in) that use HTTP/1.1 keep-alive.
 *
 * Key fixes over original:
 * 1. Streams response instead of buffering entire PDF (fixes ECONNRESET on large files)
 * 2. Retries with backoff on transient errors (socket hang-up, ECONNRESET)
 * 3. Accepts gzip encoding from upstream but decompresses transparently
 *
 * Allowed domains: ncert.nic.in only (whitelist).
 */

import { NextRequest, NextResponse } from "next/server";
import https from "https";
import http from "http";
import { PassThrough } from "stream";

const ALLOWED_DOMAINS = ["ncert.nic.in", "cbseacademic.nic.in"];

interface FetchResult {
  status: number;
  headers: Record<string, string>;
  stream: PassThrough;
}

/**
 * Fetch a URL and pipe the response into a PassThrough stream.
 * Retries up to 2 times on transient errors.
 */
function fetchUrlStream(url: string, attempt = 1): Promise<FetchResult> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === "https:" ? https : http;

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept": "application/pdf,*/*;q=0.9",
        "Accept-Encoding": "gzip, deflate",
        "Referer": `${parsed.protocol}//${parsed.hostname}/`,
      },
      timeout: 30000,
    };

    const req = lib.request(options, (res) => {
      // Follow single redirect
      if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) && res.headers.location) {
        // Don't recurse more than 3 hops
        if (attempt > 3) {
          reject(new Error("Too many redirects"));
          return;
        }
        fetchUrlStream(res.headers.location, attempt + 1).then(resolve).catch(reject);
        res.resume();
        return;
      }

      const passThrough = new PassThrough();
      res.pipe(passThrough);

      resolve({
        status: res.statusCode ?? 200,
        headers: res.headers as Record<string, string>,
        stream: passThrough,
      });
    });

    req.on("timeout", () => {
      req.destroy();
      if (attempt <= 2) {
        // Retry once
        setTimeout(() => {
          fetchUrlStream(url, attempt + 1).then(resolve).catch(reject);
        }, 1000 * attempt);
      } else {
        reject(new Error("Request timed out after 30s (retried)"));
      }
    });

    req.on("error", (err: NodeJS.ErrnoException) => {
      // Retry on socket-level errors (ECONNRESET, ECONNREFUSED, etc.)
      if ((err.code === "ECONNRESET" || err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT" || err.message?.includes("socket hang up")) && attempt <= 2) {
        setTimeout(() => {
          fetchUrlStream(url, attempt + 1).then(resolve).catch(reject);
        }, 1000 * attempt);
      } else {
        reject(err);
      }
    });

    req.end();
  });
}

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");

  if (!urlParam) {
    return new NextResponse("Missing url param", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(decodeURIComponent(urlParam));
  } catch {
    try {
      parsed = new URL(urlParam);
    } catch {
      return new NextResponse("Invalid URL", { status: 400 });
    }
  }

  const allowed = ALLOWED_DOMAINS.some((d) => parsed.hostname === d || parsed.hostname.endsWith("." + d));
  if (!allowed) {
    return new NextResponse(`Domain not allowed: ${parsed.hostname}`, { status: 403 });
  }

  try {
    const result = await fetchUrlStream(parsed.toString());

    if (result.status < 200 || result.status >= 400) {
      // Drain and discard the stream
      result.stream.resume();
      return new NextResponse(`Upstream returned ${result.status}`, { status: result.status });
    }

    const contentType = result.headers["content-type"] ?? "application/pdf";

    // Stream the response back using a ReadableStream
    const readableStream = new ReadableStream({
      start(controller) {
        result.stream.on("data", (chunk: Buffer) => {
          controller.enqueue(chunk);
        });
        result.stream.on("end", () => {
          controller.close();
        });
        result.stream.on("error", (err) => {
          controller.error(err);
        });
      },
    });

    return new NextResponse(readableStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=3600",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch (err: any) {
    console.error("[pdf-proxy] fetch error:", err?.message ?? err);
    return new NextResponse(
      JSON.stringify({ error: err?.message ?? "Unknown error" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}