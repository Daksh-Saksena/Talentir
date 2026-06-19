/**
 * /api/pdf-proxy?url=<encoded-url>
 * ──────────────────────────────────
 * Fetches the PDF from NCERT server-side and streams it back.
 * Uses Node's https module directly — more reliable than fetch()
 * for old servers (like ncert.nic.in) that use HTTP/1.1 keep-alive
 * and sometimes drop connections on fetch().
 *
 * Allowed domains: ncert.nic.in only (whitelist).
 */

import { NextRequest, NextResponse } from "next/server";
import https from "https";
import http from "http";

const ALLOWED_DOMAINS = ["ncert.nic.in", "cbseacademic.nic.in"];

function fetchUrl(url: string): Promise<{ status: number; headers: Record<string, string>; body: Buffer }> {
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
        "Accept-Encoding": "identity", // avoid gzip — we want raw bytes
        "Referer": `${parsed.protocol}//${parsed.hostname}/`,
        "Connection": "close",
      },
      timeout: 30000,
    };

    const req = lib.request(options, (res) => {
      // Follow single redirect
      if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) && res.headers.location) {
        fetchUrl(res.headers.location).then(resolve).catch(reject);
        res.resume();
        return;
      }

      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      res.on("end", () => {
        resolve({
          status: res.statusCode ?? 200,
          headers: res.headers as Record<string, string>,
          body: Buffer.concat(chunks),
        });
      });
      res.on("error", reject);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out after 30s"));
    });

    req.on("error", reject);
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
    const result = await fetchUrl(parsed.toString());

    if (result.status < 200 || result.status >= 400) {
      return new NextResponse(`Upstream returned ${result.status}`, { status: result.status });
    }

    const contentType = result.headers["content-type"] ?? "application/pdf";

    return new NextResponse(result.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=3600",
        // Remove any upstream X-Frame-Options so our iframe can render it
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch (err: any) {
    console.error("[pdf-proxy] fetch error:", err);
    return new NextResponse(
      JSON.stringify({ error: err.message ?? "Unknown error" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
