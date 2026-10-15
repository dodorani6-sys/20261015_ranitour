"use client";

import React, { useState, useMemo } from "react";
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
  const [copiedReadOnly, setCopiedReadOnly] = useState(false);
  const [copiedEdit, setCopiedEdit] = useState(false);

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

  if (!isOpen) return null;

  const copyToClipboard = (url: string, isReadOnly: boolean) => {
    navigator.clipboard.writeText(url);
    if (isReadOnly) {
      setCopiedReadOnly(true);
      setTimeout(() => setCopiedReadOnly(false), 2000);
      onShowToast("가족/친구 공유용 링크가 복사되었습니다! (읽기 전용)");
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

        <div className="p-6 space-y-5">
          {/* Vercel Tip Banner if running on localhost */}
          {isLocalhost && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">
                  Vercel 배포 후 링크를 복사하면 친구 폰에서도 바로 열립니다!
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  현재는 내 컴퓨터(`localhost`) 주소이며, Vercel 배포 주소(`https://...vercel.app`)에서 공유 버튼을 누르면 친구에게 카톡으로 보낼 수 있는 진짜 웹 링크가 생성됩니다.
                </p>
              </div>
            </div>
          )}

          {/* Read-Only Share with Full Data */}
          <div className="p-4 rounded-xl border-2 border-blue-500/30 bg-blue-50/40 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-semibold">
                <Eye className="w-3 h-3" />
                <span>추천 · 가족/친구 공유용 (읽기 전용)</span>
              </div>
              <span className="text-[11px] text-blue-700 font-medium">
                '{trip.title}' 포함
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              내가 작성한 장소, 메모, 도보/차로 이동시간이 링크에 포함되어 있어, 친구가 열었을 때 내 일정 그대로 똑같이 나타납니다.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-white rounded-lg border border-blue-200 text-xs font-mono text-slate-700 truncate select-all">
                {shareModeUrl}
              </div>
              <button
                onClick={() => copyToClipboard(shareModeUrl, true)}
                className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
              >
                {copiedReadOnly ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> 복사됨
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> 링크 복사
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Edit URL */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
              <Link2 className="w-3.5 h-3.5 text-slate-500" />
              <span>함께 수정할 수 있는 편집 링크</span>
            </div>
            <p className="text-xs text-slate-500 mb-2.5">
              친구도 직접 장소를 추가하거나 메모를 바꿀 수 있는 편집 모드 링크입니다.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-600 truncate select-all">
                {editModeUrl}
              </div>
              <button
                onClick={() => copyToClipboard(editModeUrl, false)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition-all"
              >
                {copiedEdit ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> 복사됨
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> 복사
                  </>
                )}
              </button>
            </div>
          </div>
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
