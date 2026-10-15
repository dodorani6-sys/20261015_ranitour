import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ documents: [] }, { status: 400 });
  }

  const restApiKey =
    process.env.KAKAO_REST_API_KEY || "8427c6cc899d112db0b23a9cf1397633";

  try {
    const kakaoRes = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(
        query
      )}&size=15`,
      {
        headers: {
          Authorization: `KakaoAK ${restApiKey}`,
        },
        next: { revalidate: 60 },
      }
    );

    if (!kakaoRes.ok) {
      const errText = await kakaoRes.text();
      return NextResponse.json(
        { error: "Kakao API error", details: errText },
        { status: kakaoRes.status }
      );
    }

    const data = await kakaoRes.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}
