import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let originalUrl = "";
  try {
    const body = await req.json();
    originalUrl = body.url || "";
    if (!originalUrl) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Call TinyURL free public API
    const res = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(originalUrl)}`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (res.ok) {
      const shortUrl = (await res.text()).trim();
      if (shortUrl && shortUrl.startsWith("http")) {
        return NextResponse.json({ shortUrl });
      }
    }

    // Fallback to original URL
    return NextResponse.json({ shortUrl: originalUrl });
  } catch (err: any) {
    console.warn("URL shorten failed, using original:", err);
    return NextResponse.json({ shortUrl: originalUrl });
  }
}
