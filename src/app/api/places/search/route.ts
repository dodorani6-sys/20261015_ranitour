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
    // 1. Primary: Kakao Local Keyword Search API
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

    let data: any = { documents: [], meta: { total_count: 0 } };
    if (kakaoRes.ok) {
      data = await kakaoRes.json();
    }

    // 2. If no results from keyword API, try Smart Web Place Fallback (Daum/KakaoMap Web)
    // Often new places (like newly opened photo booths, cafes) exist on map.kakao.com
    // but have not yet synced to the external developer Open API index.
    if (!data.documents || data.documents.length === 0) {
      try {
        const daumRes = await fetch(
          `https://search.daum.net/search?w=tot&q=${encodeURIComponent(query)}`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          }
        );
        if (daumRes.ok) {
          const daumHtml = await daumRes.text();
          const placeIdMatch = daumHtml.match(
            /https:\/\/place\.map\.kakao\.com\/([0-9]{6,12})/
          );
          if (placeIdMatch && placeIdMatch[1]) {
            const placeId = placeIdMatch[1];
            const placePageRes = await fetch(
              `https://place.map.kakao.com/${placeId}`,
              {
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                },
              }
            );
            if (placePageRes.ok) {
              const placeHtml = await placePageRes.text();
              const titleMatch = placeHtml.match(/<title>(.*?)<\/title>/);
              const descMatch = placeHtml.match(
                /<meta property="og:description" content="([^"]+)"/
              );

              const placeTitle = titleMatch
                ? titleMatch[1].replace(/\s*\|\s*카카오맵.*$/, "").trim()
                : query;
              const placeAddr = descMatch ? descMatch[1].trim() : "";

              if (placeAddr) {
                // Geocode address via Kakao Address API
                const geoRes = await fetch(
                  `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(
                    placeAddr
                  )}`,
                  {
                    headers: {
                      Authorization: `KakaoAK ${restApiKey}`,
                    },
                  }
                );
                if (geoRes.ok) {
                  const geoData = await geoRes.json();
                  if (geoData.documents && geoData.documents.length > 0) {
                    const firstGeo = geoData.documents[0];
                    data.documents = [
                      {
                        id: placeId,
                        place_name: placeTitle,
                        category_name: "명소/놀거리 > 신규등록장소",
                        address_name: firstGeo.address_name || placeAddr,
                        road_address_name:
                          firstGeo.road_address?.address_name || placeAddr,
                        x: firstGeo.x,
                        y: firstGeo.y,
                        place_url: `https://place.map.kakao.com/${placeId}`,
                      },
                    ];
                  }
                }
              }
            }
          }
        }
      } catch (fallbackErr) {
        console.warn("Smart web place fallback failed:", fallbackErr);
      }
    }

    // 3. If still no results, try Kakao Address Search (in case user searched by street/jibeon address)
    if (!data.documents || data.documents.length === 0) {
      try {
        const addrRes = await fetch(
          `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(
            query
          )}`,
          {
            headers: {
              Authorization: `KakaoAK ${restApiKey}`,
            },
          }
        );
        if (addrRes.ok) {
          const addrData = await addrRes.json();
          if (addrData.documents && addrData.documents.length > 0) {
            data.documents = addrData.documents.map((item: any, idx: number) => ({
              id: `addr-${Date.now()}-${idx}`,
              place_name:
                item.road_address?.building_name ||
                item.road_address?.address_name ||
                item.address_name,
              category_name: "주소/위치",
              address_name: item.address_name,
              road_address_name:
                item.road_address?.address_name || item.address_name,
              x: item.x,
              y: item.y,
              place_url: `https://map.kakao.com/link/map/${encodeURIComponent(
                item.address_name
              )},${item.y},${item.x}`,
            }));
          }
        }
      } catch (addrErr) {
        console.warn("Address search fallback failed:", addrErr);
      }
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}
