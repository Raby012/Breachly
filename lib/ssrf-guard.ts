import dns from "node:dns";
import net from "node:net";

const originalLookup = dns.lookup;
const originalLookupPromise = dns.promises.lookup;

/**
 * Checks if a single IPv4/IPv6 address is private, loopback, link-local,
 * or otherwise non-public (including cloud metadata addresses like
 * 169.254.169.254). This is the core blocklist.
 */
export function isBlockedAddress(address: string): boolean {
  if (net.isIPv4(address)) {
    const parts = address.split(".").map(Number);
    const a = parts[0];
    const b = parts[1];
    if (a === undefined || b === undefined) return true;
    if (a === 127) return true; // loopback
    if (a === 10) return true; // private
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 169 && b === 254) return true; // link-local incl. cloud metadata
    if (a === 0) return true; // "this network"
    if (a === 100 && b >= 64 && b <= 127) return true; // shared/CGNAT space
    if (a >= 224) return true; // multicast + reserved
    return false;
  }
  if (net.isIPv6(address)) {
    const lower = address.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fe80")) return true; // link-local
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
    if (lower.startsWith("::ffff:")) {
      const embedded = lower.split(":").pop() || "";
      if (net.isIPv4(embedded)) return isBlockedAddress(embedded);
    }
    return false;
  }
  return true; // unknown format, block to be safe
}

/**
 * Patches dns.lookup / dns.promises.lookup process-wide so that EVERY
 * connection this server makes — the original request, a redirect hop,
 * or a re-resolved hostname mid-scan (DNS rebinding) — gets re-checked
 * against the blocklist at the moment of resolution.
 *
 * Limitation: this does not catch a redirect straight to a literal IP
 * address, because Node skips dns.lookup entirely for literal IPs.
 * That narrower case is checked separately in the scan route by
 * inspecting the redirect chain after the request completes.
 */
export function installSsrfGuard() {
  // @ts-ignore overriding overloaded signature intentionally
  dns.lookup = function (hostname: string, options: any, callback?: any) {
    const cb = typeof options === "function" ? options : callback;
    const opts = typeof options === "function" ? {} : options;
    // @ts-ignore
    return originalLookup.call(dns, hostname, opts, (err: any, address: any, family: any) => {
      if (err) return cb(err, address, family);
      const list = Array.isArray(address) ? address : [{ address, family }];
      for (const entry of list) {
        const addr = typeof entry === "string" ? entry : entry.address;
        if (isBlockedAddress(addr)) {
          return cb(
            new Error(`SSRF guard: "${hostname}" resolves to a restricted address (${addr})`)
          );
        }
      }
      return cb(err, address, family);
    });
  } as typeof dns.lookup;

  // @ts-ignore
// @ts-ignore
  dns.promises.lookup = async function (hostname: string, options?: any) {
    const lookupFn: any = originalLookupPromise;
    const result: any = await lookupFn.call(dns.promises, hostname, options);
    const list = Array.isArray(result) ? result : [result];
    for (const entry of list) {
      if (isBlockedAddress(entry.address)) {
        throw new Error(`SSRF guard: "${hostname}" resolves to a restricted address (${entry.address})`);
      }
    }
    return result;
  };
}

/**
 * Validates a user-submitted URL before any scan starts:
 * protocol check, literal-IP check, and a DNS pre-check of every
 * resolved address.
 */
export async function preflightCheckUrl(rawUrl: string): Promise<{ hostname: string }> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL format.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https URLs are allowed.");
  }

  const hostname = parsed.hostname.toLowerCase();

  if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new Error("Scanning local/internal hostnames is not allowed.");
  }

  if (net.isIP(hostname)) {
    if (isBlockedAddress(hostname)) {
      throw new Error("Scanning private or reserved IP addresses is not allowed.");
    }
    return { hostname };
  }

  let records;
  try {
    records = await dns.promises.lookup(hostname, { all: true });
  } catch {
    throw new Error("Could not resolve this hostname.");
  }

  for (const record of records) {
    if (isBlockedAddress(record.address)) {
      throw new Error("This hostname resolves to a private or reserved address and cannot be scanned.");
    }
  }

  return { hostname };
}

/**
 * Used to re-check each hop in a redirect chain after the scan completes,
 * to catch redirects straight to a literal private IP (see limitation
 * above).
 */
export async function isUrlHopSafe(urlStr: string): Promise<boolean> {
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    return false;
  }
  const hostname = parsed.hostname.toLowerCase();
  if (net.isIP(hostname)) {
    return !isBlockedAddress(hostname);
  }
  try {
    const records = await dns.promises.lookup(hostname, { all: true });
    return records.every((r) => !isBlockedAddress(r.address));
  } catch {
    return false;
  }
}
