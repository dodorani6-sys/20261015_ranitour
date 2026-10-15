"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Share2,
  Copy,
  Check,
  Eye,
  X,
  Globe,
  Link2,
  Sparkles,
  Info,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { TripPlan } from "@/types/trip";
import { encodeTripToUrl } from "@/lib/share-utils";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripPlan;
  onShowToast: (msg: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  trip,
  onShowToast,
}) => {
  const [copiedShort, setCopiedShort] = useState(false);
  const [copiedReadOnly, setCopiedReadOnly] = useState(false);
  const [copiedEdit, setCopiedEdit] = useState(false);

  const [shortUrl, setShortUrl] = useState<string>("");
  const [isShortening, setIsShortening] = useState<boolean>(false);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);

  const currentOrigin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const isLocalhost =
    currentOrigin.includes("localhost") || currentOrigin.includes("127.0.0.1");

  // Encode current trip into URL query so friend gets the exact itinerary without backend
  const encodedData = useMemo(() => {
    return encodeTripToUrl(trip);
  }, [trip]);

  const shareModeUrl = encodedData
    ? `${currentOrigin}/?mode=share&plan=${encodedData}`
    : `${currentOrigin}/?mode=share`;

  const editModeUrl = encodedData
    ? `${currentOrigin}/?plan=${encodedData}`
    : `${currentOrigin}/`;

  // Fetch short URL when modal opens
  useEffect(() => {
    if (!isOpen || !shareModeUrl) return;

    setShortUrl("");
    setIsShortening(true);

    fetch("/api/share/shorten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: shareModeUrl }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.shortUrl) {
          setShortUrl(data.shortUrl);
        }
      })
      .catch((err) => {
        console.warn("Failed to shorten url", err);
      })
      .finally(() => {
        setIsShortening(false);
      });
  }, [isOpen, shareModeUrl]);

  if (!isOpen) return null;

  const copyToClipboard = (url: string, type: "short" | "readOnly" | "edit") => {
    navigator.clipboard.writeText(url);
    if (type === "short") {
      setCopiedShort(true);
      setTimeout(() => setCopiedShort(false), 2000);
      onShowToast("깔끔한 단축 링크가 복사되었습니다! (카톡/문자용)");
    } else if (type === "readOnly") {
      setCopiedReadOnly(true);
      setTimeout(() => setCopiedReadOnly(false), 2000);
      onShowToast("가족/친구 공유용 원본 링크가 복사되었습니다.");
    } else {
      setCopiedEdit(true);
      setTimeout(() => setCopiedEdit(false), 2000);
      onShowToast("편집용 링크가 복사되었습니다.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <span>일정 공유하기</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Vercel Tip Banner if running on localhost */}
          {isLocalhost && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">
                  Vercel 배포 주소에서 공유하면 친구 폰에서도 바로 열립니다!
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  현재는 로컬(`localhost`) 주소이며, 배포된 Vercel 도메인에서 공유 버튼을 누르면 카카오톡 전송용 단축 링크가 바로 만들어집니다.
                </p>
              </div>
            </div>
          )}

          {/* Recommended: Compact Short URL (25 chars) */}
          <div className="p-4 rounded-2xl border-2 border-blue-500/40 bg-gradient-to-b from-blue-50/60 to-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-bold shadow-xs">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>추천 · 단축 링크 (카톡 / 문자 전송용)</span>
              </div>
              <span className="text-[11px] text-blue-700 font-semibold truncate max-w-[150px]">
                '{trip.title}'
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              카카오톡이나 문자로 전송하기 좋게 <strong>약 25자 길이로 깔끔하게 단축된 링크</strong>입니다. 친구가 열면 내 속초 일정이 그대로 열립니다!
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3.5 py-2.5 bg-white rounded-xl border border-blue-200 text-xs font-mono text-slate-800 select-all flex items-center overflow-hidden min-h-[42px]">
                {isShortening ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                    <span>단축 링크 생성 중...</span>
                  </div>
                ) : (
                  <span className="truncate font-bold text-blue-600">
                    {shortUrl || shareModeUrl}
                  </span>
                )}
              </div>
              <button
                disabled={isShortening}
                onClick={() => copyToClipboard(shortUrl || shareModeUrl, "short")}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 min-h-[42px]"
              >
                {copiedShort ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> 복사됨!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> 링크 복사
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Toggle for original raw links */}
          <div className="pt-1">
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showOriginal ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              <span>전체 원본 링크 및 편집 링크 보기</span>
            </button>
          </div>

          {showOriginal && (
            <div className="space-y-3 pt-1 animate-in fade-in duration-200">
              {/* Full Original Read-Only URL */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
                <div className="flex items-center justify-between mb-1 text-slate-700 font-semibold">
                  <span>원본 전체 링크 (읽기 전용)</span>
                  <button
                    onClick={() => copyToClipboard(shareModeUrl, "readOnly")}
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedReadOnly ? "복사됨" : "복사"}
                  </button>
                </div>
                <div className="font-mono text-[11px] text-slate-500 truncate bg-white p-2 rounded border border-slate-200">
                  {shareModeUrl}
                </div>
              </div>

              {/* Full Edit URL */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
                <div className="flex items-center justify-between mb-1 text-slate-700 font-semibold">
                  <span>함께 수정하는 편집용 링크</span>
                  <button
                    onClick={() => copyToClipboard(editModeUrl, "edit")}
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedEdit ? "복사됨" : "복사"}
                  </button>
                </div>
                <div className="font-mono text-[11px] text-slate-500 truncate bg-white p-2 rounded border border-slate-200">
                  {editModeUrl}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
