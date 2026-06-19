import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { installSsrfGuard, preflightCheckUrl, isUrlHopSafe } from "@/lib/ssrf-guard";
import { Site } from "@mdn/mdn-http-observatory/src/site.js";
import { retrieve } from "@mdn/mdn-http-observatory/src/retriever/retriever.js";
import { analyzeScan } from "@mdn/mdn-http-observatory/src/scanner/index.js";

export const runtime = "nodejs";
export const maxDuration = 30;

installSsrfGuard();

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  const { url } = await req.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required." }, { status: 400 });
  }

  let hostname: string;
  try {
    const checked = await preflightCheckUrl(url);
    hostname = checked.hostname;
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  const scanRecord = await prisma.scan.create({
    data: {
      url,
      userId: session?.user ? (session.user as any).id : null,
      status: "RUNNING",
    },
  });

  try {
    const site = Site.fromSiteString(hostname);
    const requests = await retrieve(site);

    const hops = [
      ...(requests.responses.httpRedirects || []),
      ...(requests.responses.httpsRedirects || []),
    ];
    for (const hop of hops) {
      const safe = await isUrlHopSafe(hop.url.href);
      if (!safe) {
        await prisma.scan.update({
          where: { id: scanRecord.id },
          data: { status: "FAILED" },
        });
        return NextResponse.json(
          { error: "Scan blocked: a redirect in this site's chain points to a private/internal address." },
          { status: 400 }
        );
      }
    }

    const result = analyzeScan(requests);

    await prisma.scan.update({
      where: { id: scanRecord.id },
      data: { status: "COMPLETE", rawResult: result as any },
    });

    return NextResponse.json({ id: scanRecord.id, result });
  } catch (e: any) {
    await prisma.scan.update({
      where: { id: scanRecord.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json({ error: e.message || "Scan failed." }, { status: 500 });
  }
}
