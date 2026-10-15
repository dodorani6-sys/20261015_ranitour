"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Place } from "@/types/trip";
import {
  MapPin,
  KeyRound,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Navigation,
  Sparkles,
  Info,
} from "lucide-react";

interface KakaoMapProps {
  apiKey: string;
  places: Place[];
  activePlaceId: string | null;
  onSelectPlace: (place: Place) => void;
  onOpenKeyModal: () => void;
}

export const KakaoMap: React.FC<KakaoMapProps> = ({
  apiKey,
  places,
  activePlaceId,
  onSelectPlace,
  onOpenKeyModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load Kakao Map Script
  useEffect(() => {
    if (!apiKey) {
      setIsScriptLoaded(false);
      return;
    }

    const scriptId = "kakao-map-sdk-script";
    const existingScript = document.getElementById(scriptId);

    const onScriptReady = () => {
      if ((window as any).kakao && (window as any).kakao.maps) {
        (window as any).kakao.maps.load(() => {
          setIsScriptLoaded(true);
          setLoadError(null);
        });
      }
    };

    if (existingScript) {
      if (existingScript.getAttribute("src")?.includes(`appkey=${apiKey}`)) {
        if ((window as any).kakao?.maps) {
          onScriptReady();
        } else {
          existingScript.addEventListener("load", onScriptReady);
        }
        return;
      } else {
        existingScript.remove();
        delete (window as any).kakao;
      }
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services,clusterer&autoload=false`;
    script.async = true;

    script.onload = onScriptReady;
    script.onerror = () => {
      setLoadError("카카오 지도 SDK를 로드하지 못했습니다. API 키 또는 도메인 허용 설정을 확인하세요.");
    };

    document.head.appendChild(script);
  }, [apiKey]);

  // Initialize Map
  useEffect(() => {
    if (!isScriptLoaded || !containerRef.current) return;
    if (!(window as any).kakao?.maps) return;

    const kakao = (window as any).kakao;

    // Default center (Jeju City / Airport or first place)
    const initialLat = places.length > 0 ? places[0].lat : 33.4996;
    const initialLng = places.length > 0 ? places[0].lng : 126.5312;

    const options = {
      center: new kakao.maps.LatLng(initialLat, initialLng),
      level: 9,
    };

    try {
      const map = new kakao.maps.Map(containerRef.current, options);
      mapInstanceRef.current = map;

      // Handle window resize and container resize
      const handleResize = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.relayout();
        }
      };
      window.addEventListener("resize", handleResize);

      // ResizeObserver to automatically relayout when flex container changes
      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== "undefined" && containerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.relayout();
          }
        });
        resizeObserver.observe(containerRef.current);
      }

      // Delayed relayout to handle CSS transitions and hydration
      const timer1 = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.relayout();
        }
      }, 100);

      const timer2 = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.relayout();
        }
      }, 300);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (resizeObserver) resizeObserver.disconnect();
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } catch (err: any) {
      console.error("Kakao Map init failed:", err);
      setLoadError("카카오 지도를 초기화하지 못했습니다. 도메인 설정을 확인해주세요.");
    }
  }, [isScriptLoaded]);

  // Update Markers and Polyline when places change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !(window as any).kakao?.maps) return;

    const kakao = (window as any).kakao;

    // 1. Clear previous overlays
    markersRef.current.forEach((overlay) => overlay.setMap(null));
    markersRef.current = [];

    // 2. Clear previous polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (places.length === 0) return;

    const bounds = new kakao.maps.LatLngBounds();
    const linePath: any[] = [];

    // 3. Create numbered custom overlays
    places.forEach((place, index) => {
      const position = new kakao.maps.LatLng(place.lat, place.lng);
      bounds.extend(position);
      linePath.push(position);

      const isActive = place.id === activePlaceId;

      // Overlay DOM container
      const overlayDiv = document.createElement("div");
      overlayDiv.className = `kakao-custom-overlay ${isActive ? "active" : ""}`;
      overlayDiv.style.cursor = "pointer";

      overlayDiv.innerHTML = `
        <div class="marker-title-tooltip">${place.name}</div>
        <div class="marker-bubble ${isActive ? "marker-pin" : ""}">
          ${index + 1}
        </div>
        <div class="marker-tail"></div>
      `;

      overlayDiv.onclick = (e) => {
        e.stopPropagation();
        onSelectPlace(place);
      };

      const customOverlay = new kakao.maps.CustomOverlay({
        position: position,
        content: overlayDiv,
        yAnchor: 1.15,
        zIndex: isActive ? 100 : 10 + index,
      });

      customOverlay.setMap(map);
      markersRef.current.push(customOverlay);
    });

    // 4. Render Polyline connecting places
    if (linePath.length > 1) {
      const polyline = new kakao.maps.Polyline({
        path: linePath,
        strokeWeight: 4,
        strokeColor: "#2563EB",
        strokeOpacity: 0.85,
        strokeStyle: "solid",
      });
      polyline.setMap(map);
      polylineRef.current = polyline;
    }

    // 5. Fit bounds with padding so all markers are visible
    if (places.length === 1) {
      map.setCenter(new kakao.maps.LatLng(places[0].lat, places[0].lng));
      map.setLevel(5);
    } else {
      map.setBounds(bounds, 80, 80, 80, 80);
    }
  }, [places, isScriptLoaded, onSelectPlace]);

  // Handle Pan to active place
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activePlaceId || !(window as any).kakao?.maps) return;

    const targetPlace = places.find((p) => p.id === activePlaceId);
    if (!targetPlace) return;

    const kakao = (window as any).kakao;
    const targetLatLng = new kakao.maps.LatLng(targetPlace.lat, targetPlace.lng);

    map.panTo(targetLatLng);
  }, [activePlaceId, places]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      const level = mapInstanceRef.current.getLevel();
      mapInstanceRef.current.setLevel(level - 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      const level = mapInstanceRef.current.getLevel();
      mapInstanceRef.current.setLevel(level + 1);
    }
  };

  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    if (!map || !(window as any).kakao?.maps || places.length === 0) return;
    const kakao = (window as any).kakao;
    const bounds = new kakao.maps.LatLngBounds();
    places.forEach((p) => bounds.extend(new kakao.maps.LatLng(p.lat, p.lng)));
    map.setBounds(bounds, 80, 80, 80, 80);
  };

  // If No API Key or Failed to load, render fallback preview canvas
  if (!apiKey || loadError) {
    return (
      <div className="relative w-full h-full bg-slate-100 flex flex-col overflow-hidden">
        {/* Top Info Banner */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-3 p-3.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-floating border border-amber-200/90 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 text-slate-800">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">
                {loadError
                  ? "카카오맵 도메인 허용 등록이 필요합니다 (401 오류)"
                  : "카카오맵 API 키를 등록하면 실제 지도가 활성화됩니다"}
              </p>
              <p className="text-slate-500 text-[11px]">
                {loadError
                  ? "카카오 개발자 콘솔의 [Web 사이트 도메인]에 현재 Vercel 도메인을 등록하시면 지도가 활성화됩니다."
                  : "발급받으신 JavaScript 키를 입력하시면 실시간 도로 지도와 정확한 위치가 표시됩니다."}
              </p>
            </div>
          </div>
          <button
            onClick={
              loadError
                ? () =>
                    window.open(
                      "https://developers.kakao.com/console",
                      "_blank"
                    )
                : onOpenKeyModal
            }
            className="shrink-0 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all"
          >
            {loadError ? "카카오 콘솔 바로가기" : "API 키 등록하기"}
          </button>
        </div>

        {/* Fallback Interactive SVG Map Preview */}
        <div className="flex-1 w-full h-full relative bg-gradient-to-b from-sky-50/70 via-blue-50/40 to-slate-100 flex items-center justify-center p-8 select-none">
          {/* Subtle Map Grid / Contour Pattern */}
          <div
            className="absolute inset-0 opacity-[0.25]"
            style={{
              backgroundImage:
                "radial-gradient(#94a3b8 1px, transparent 1px), radial-gradient(#94a3b8 1px, #f8fafc 1px)",
              backgroundSize: "28px 28px",
              backgroundPosition: "0 0, 14px 14px",
            }}
          />

          {/* SVG Map of Jeju Route */}
          <div className="relative z-10 w-full max-w-2xl aspect-[4/3] bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-slate-200/80 shadow-soft flex flex-col">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Navigation className="w-4 h-4 text-blue-600" />
                <span>스마트 여행 동선 프리뷰 (인터랙티브 뷰)</span>
              </div>
              <span className="text-[11px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                등록 장소 {places.length}곳
              </span>
            </div>

            {/* Simulated Map Canvas */}
            <div className="relative flex-1 w-full rounded-2xl bg-slate-50/90 border border-slate-200 overflow-hidden flex items-center justify-center p-6">
              {places.length === 0 ? (
                <div className="text-center text-slate-400">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">이 일차에 등록된 장소가 없습니다.</p>
                </div>
              ) : (
                <svg className="w-full h-full" viewBox="0 0 600 400">
                  {/* Calculate bounding box of places */}
                  {(() => {
                    const lats = places.map((p) => p.lat);
                    const lngs = places.map((p) => p.lng);
                    const minLat = Math.min(...lats);
                    const maxLat = Math.max(...lats);
                    const minLng = Math.min(...lngs);
                    const maxLng = Math.max(...lngs);

                    const latSpan = Math.max(0.02, maxLat - minLat);
                    const lngSpan = Math.max(0.02, maxLng - minLng);

                    // Transform lat/lng to svg coordinates (padding 60px)
                    const points = places.map((p) => {
                      const x = 70 + ((p.lng - minLng) / lngSpan) * 460;
                      // Latitude inverted in screen coords
                      const y = 330 - ((p.lat - minLat) / latSpan) * 260;
                      return { ...p, x, y };
                    });

                    const pathString = points
                      .map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
                      .join(" ");

                    return (
                      <g>
                        {/* Connecting Polyline Route */}
                        {points.length > 1 && (
                          <>
                            <path
                              d={pathString}
                              fill="none"
                              stroke="#93c5fd"
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              opacity="0.4"
                            />
                            <path
                              d={pathString}
                              fill="none"
                              stroke="#2563eb"
                              strokeWidth="3.5"
                              strokeDasharray="6 4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </>
                        )}

                        {/* Place Marker Pins */}
                        {points.map((pt, idx) => {
                          const isActive = pt.id === activePlaceId;
                          return (
                            <g
                              key={pt.id}
                              onClick={() => onSelectPlace(pt)}
                              className="cursor-pointer transition-transform hover:scale-110"
                            >
                              {/* Pulse ring if active */}
                              {isActive && (
                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r="22"
                                  fill="#3b82f6"
                                  opacity="0.25"
                                  className="animate-ping"
                                />
                              )}
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={isActive ? "17" : "14"}
                                fill={isActive ? "#1d4ed8" : "#2563eb"}
                                stroke="#ffffff"
                                strokeWidth="2.5"
                                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                              />
                              <text
                                x={pt.x}
                                y={pt.y + 4}
                                textAnchor="middle"
                                fill="#ffffff"
                                fontSize="12"
                                fontWeight="bold"
                              >
                                {idx + 1}
                              </text>
                              {/* Place Name Tooltip Label */}
                              <rect
                                x={pt.x - 45}
                                y={pt.y - 32}
                                width="90"
                                height="20"
                                rx="4"
                                fill="rgba(15, 23, 42, 0.85)"
                              />
                              <text
                                x={pt.x}
                                y={pt.y - 18}
                                textAnchor="middle"
                                fill="#ffffff"
                                fontSize="10"
                                fontWeight="600"
                              >
                                {pt.name.length > 7
                                  ? pt.name.slice(0, 7) + "..."
                                  : pt.name}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                    );
                  })()}
                </svg>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                마커를 클릭하면 좌측 목록의 장소 카드가 강조됩니다.
              </span>
              <button
                onClick={onOpenKeyModal}
                className="text-blue-600 font-semibold hover:underline"
              >
                카카오 공식 지도 활성화하기 &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Kakao Map DOM Target Container */}
      <div
        ref={containerRef}
        id="kakao-map-container"
        className="w-full h-full bg-slate-100 kakao-map-container"
      />

      {/* Floating Map Controls */}
      <div className="absolute right-3 top-3 sm:right-4 sm:top-4 z-20 flex flex-col gap-1.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-floating p-1.5 border border-slate-200">
        <button
          onClick={handleZoomIn}
          title="확대"
          className="p-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="축소"
          className="p-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="h-[1px] bg-slate-200 my-0.5" />
        <button
          onClick={handleFitBounds}
          title="동선 전체보기"
          className="p-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Route Summary Pill */}
      {places.length > 0 && (
        <div className="absolute top-3 left-3 sm:top-auto sm:bottom-6 sm:left-6 z-20 bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-floating text-[11px] sm:text-xs flex items-center gap-1.5 sm:gap-2 border border-slate-700/50 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="hidden sm:inline">현재 일차 방문지</span>
          <span className="sm:hidden">방문지</span>
          <span className="font-bold text-blue-400">{places.length}곳</span>
          <span className="text-slate-500">|</span>
          <button
            onClick={handleFitBounds}
            className="text-slate-300 hover:text-white underline underline-offset-2"
          >
            동선 한눈에 보기
          </button>
        </div>
      )}
    </div>
  );
};
