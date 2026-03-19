import { NextRequest, NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";

export async function GET(req: NextRequest) {
  try {
    await requireMemberAuth();

    const url = req.nextUrl.searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    const parsed = new URL(url);
    const allowedHosts = [
      "app.circle.so",
      "circle.so",
      "circle-production-user-content.s3.amazonaws.com",
    ];
    const isAllowed =
      allowedHosts.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`)) ||
      parsed.hostname.endsWith(".cloudfront.net") ||
      parsed.hostname.endsWith(".amazonaws.com") ||
      parsed.hostname.endsWith(".circle.so");

    if (!isAllowed) {
      return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
    }

    const imageRes = await fetch(url, {
      headers: { Accept: "image/*" },
    });

    if (!imageRes.ok) {
      return new NextResponse(null, { status: imageRes.status });
    }

    const contentType = imageRes.headers.get("content-type") || "image/jpeg";
    const buffer = await imageRes.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
