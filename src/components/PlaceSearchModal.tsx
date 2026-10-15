"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Plus,
  X,
  Compass,
  Sparkles,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Place } from "@/types/trip";
import { samplePlacesCatalog } from "@/lib/dummy-data";

interface PlaceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlace: (place: Omit<Place, "id">) => void;
  hasApiKey: boolean;
}

export const PlaceSearchModal: React.FC<PlaceSearchModalProps> = ({
  isOpen,
  onClose,
  onAddPlace,
  hasApiKey,
}) => {
  const [keyword, setKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setKeyword("");
      setSearchResults([]);
      setHasSearched(false);
      setShowManualForm(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = keyword.trim();
    if (!query) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      // 1. Try Next.js Kakao Local Search API route
      const res = await fetch(`/api/places/search?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.documents && Array.isArray(data.documents)) {
          setIsLoading(false);
          const mapped = data.documents.map((item: any) => ({
            id: item.id,
            name: item.place_name,
            category: item.category_name || item.category_group_name || "장소",
            address: item.address_name,
            roadAddress: item.road_address_name || item.address_name,
            lat: parseFloat(item.y),
            lng: parseFloat(item.x),
            phone: item.phone,
            url: item.place_url,
          }));
          setSearchResults(mapped);
          return;
        }
      }
    } catch (err) {
      console.warn("Server search failed, trying client SDK...", err);
    }

    // 2. Check if Kakao Maps Places client service is available
    if (
      typeof window !== "undefined" &&
      (window as any).kakao?.maps?.services?.Places
    ) {
      try {
        const ps = new (window as any).kakao.maps.services.Places();
        ps.keywordSearch(query, (data: any[], status: any) => {
          setIsLoading(false);
          if (status === (window as any).kakao.maps.services.Status.OK) {
            const mapped = data.map((item) => ({
              id: item.id,
              name: item.place_name,
              category: item.category_name || item.category_group_name || "장소",
              address: item.address_name,
              roadAddress: item.road_address_name || item.address_name,
              lat: parseFloat(item.y),
              lng: parseFloat(item.x),
              phone: item.phone,
              url: item.place_url,
            }));
            setSearchResults(mapped);
          } else if (
            status === (window as any).kakao.maps.services.Status.ZERO_RESULT
          ) {
            setSearchResults([]);
          } else {
            fallbackSearch(query);
          }
        });
        return;
      } catch (err) {
        console.warn("Kakao Places search failed, falling back", err);
      }
    }

    // 3. Fallback search using local catalog
    fallbackSearch(query);
  };

  const fallbackSearch = (query: string) => {
    setIsLoading(false);
    const qLower = query.toLowerCase();
    const filtered = samplePlacesCatalog
      .filter(
        (item) =>
          item.name.toLowerCase().includes(qLower) ||
          item.category.toLowerCase().includes(qLower) ||
          item.roadAddress.toLowerCase().includes(qLower)
      )
      .map((item, idx) => ({
        id: `mock-${idx}-${Date.now()}`,
        name: item.name,
        category: item.category,
        address: item.address,
        roadAddress: item.roadAddress,
        lat: item.lat,
        lng: item.lng,
      }));

    setSearchResults(filtered);
  };

  const handleSelect = (item: any) => {
    onAddPlace({
      name: item.name,
      category: item.category || "일반 장소",
      address: item.address || item.roadAddress,
      roadAddress: item.roadAddress,
      lat: item.lat,
      lng: item.lng,
      phone: item.phone,
      url: item.url,
      memo: "",
    });
    onClose();
  };

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    // Approximate Jeju center coordinate with slight offset
    const lat = 33.3617 + (Math.random() - 0.5) * 0.15;
    const lng = 126.5292 + (Math.random() - 0.5) * 0.2;

    onAddPlace({
      name: manualName.trim(),
      category: "직접 등록 장소",
      address: manualAddress.trim() || "제주특별자치도",
      roadAddress: manualAddress.trim(),
      lat,
      lng,
      memo: "",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">장소 검색 및 추가</h2>
              <p className="text-xs text-slate-500">
                방문할 명소, 맛집, 숙소 등을 검색하여 일정에 추가하세요.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 bg-white shrink-0">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="장소명, 관광지, 식당 이름 검색 (예: 성산일출봉, 런던베이글)"
                autoFocus
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {keyword && (
                <button
                  type="button"
                  onClick={() => setKeyword("")}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!keyword.trim() || isLoading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm rounded-xl shadow-xs transition-all shrink-0 flex items-center gap-1.5"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>검색</span>
              )}
            </button>
          </form>

          {/* Quick suggestions when not searched */}
          {!hasSearched && (
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-medium text-slate-400 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> 추천 키워드:
              </span>
              {["우도 잠수함", "비자림", "쇠소깍", "새별오름", "오는정김밥", "아르떼뮤지엄"].map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setKeyword(item);
                      // Trigger search immediately with this keyword
                      setTimeout(() => {
                        const qLower = item.toLowerCase();
                        fallbackSearch(qLower);
                        setHasSearched(true);
                      }, 50);
                    }}
                    className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-xs transition-colors"
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2.5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
              <p className="text-sm font-medium">카카오 장소 정보를 검색 중입니다...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-500 px-1 mb-2">
                검색 결과 <span className="text-blue-600 font-bold">{searchResults.length}</span>건
              </div>
              {searchResults.map((item) => {
                const categoryClean = item.category
                  ? item.category.split(" > ").pop() || item.category
                  : "명소";

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                          {item.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">
                          {categoryClean}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{item.roadAddress || item.address}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleSelect(item)}
                      className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>일정 추가</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : hasSearched ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Compass className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-700 text-sm mb-1">
                검색 결과가 없습니다
              </p>
              <p className="text-xs text-slate-500 max-w-xs mb-4">
                검색어를 확인하거나, 원하시는 장소명을 직접 입력하여 추가할 수 있습니다.
              </p>
              <button
                type="button"
                onClick={() => setShowManualForm(!showManualForm)}
                className="text-xs text-blue-600 font-semibold underline underline-offset-4 hover:text-blue-700"
              >
                {showManualForm ? "직접 입력 닫기" : "장소명 직접 입력해서 추가하기"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-center text-slate-400">
              <Search className="w-10 h-10 stroke-[1.5] mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-600 mb-1">
                원하는 여행지를 검색해보세요
              </p>
              <p className="text-xs text-slate-400">
                카카오맵 로컬 키워드 검색을 통해 실제 위치 좌표가 등록됩니다.
              </p>
            </div>
          )}

          {/* Manual Input Form */}
          {showManualForm && (
            <form
              onSubmit={handleAddManual}
              className="mt-4 p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3"
            >
              <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>장소 직접 등록</span>
              </h4>
              <input
                type="text"
                placeholder="장소명 (예: 우리들의 비밀 카페)"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
              <input
                type="text"
                placeholder="주소 (예: 제주 서귀포시 중문관광로)"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  직접 추가하기
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => setShowManualForm(!showManualForm)}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            {showManualForm ? "직접 입력 닫기" : "+ 장소 직접 수동 입력"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200/70 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
