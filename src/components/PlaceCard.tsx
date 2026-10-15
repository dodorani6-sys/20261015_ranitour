"use client";

import React, { useState } from "react";
import {
  MapPin,
  Trash2,
  FileText,
  Navigation,
  Check,
  Tag,
  ExternalLink,
} from "lucide-react";
import { Place } from "@/types/trip";

interface PlaceCardProps {
  place: Place;
  index: number;
  isActive: boolean;
  isReadOnly: boolean;
  onSelect: (place: Place) => void;
  onDelete: (placeId: string) => void;
  onUpdateMemo: (placeId: string, memo: string) => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  index,
  isActive,
  isReadOnly,
  onSelect,
  onDelete,
  onUpdateMemo,
}) => {
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [memoText, setMemoText] = useState(place.memo || "");

  const handleSaveMemo = () => {
    onUpdateMemo(place.id, memoText.trim());
    setIsEditingMemo(false);
  };

  const displayCategory = place.category
    ? place.category.split(" > ").pop() || place.category
    : "명소";

  return (
    <div
      onClick={() => onSelect(place)}
      className={`group relative rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
        isActive
          ? "bg-blue-50/40 border-blue-500 shadow-md ring-2 ring-blue-500/20"
          : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-soft"
      }`}
    >
      <div className="p-4">
        {/* Top Header: Badge, Name, Category, Delete */}
        <div className="flex items-start gap-3">
          {/* Order Badge (1, 2, 3...) */}
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors shadow-xs ${
              isActive
                ? "bg-blue-600 text-white"
                : "bg-slate-900 text-white group-hover:bg-blue-600"
            }`}
          >
            {index + 1}
          </div>

          {/* Place Title & Category */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-slate-900 text-base leading-tight group-hover:text-blue-600 transition-colors">
                {place.name}
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                {displayCategory}
              </span>
            </div>

            {/* Address */}
            <p className="text-xs text-slate-500 flex items-center gap-1 leading-normal truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{place.roadAddress || place.address}</span>
            </p>
          </div>

          {/* Delete Action (Hidden in Read-Only) */}
          {!isReadOnly && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`'${place.name}' 일정을 삭제하시겠습니까?`)) {
                  onDelete(place.id);
                }
              }}
              title="장소 삭제"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Memo Section */}
        <div className="mt-3 pt-2.5 border-t border-slate-100">
          {isEditingMemo && !isReadOnly ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="space-y-2"
            >
              <textarea
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                placeholder="추천 메뉴, 이동 팁, 예상 경비, 주의사항 등을 메모하세요."
                rows={2}
                autoFocus
                className="w-full text-xs text-slate-800 p-2.5 rounded-xl border border-blue-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed resize-none"
              />
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMemoText(place.memo || "");
                    setIsEditingMemo(false);
                  }}
                  className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveMemo}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  <Check className="w-3 h-3" />
                  <span>저장</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={(e) => {
                if (!isReadOnly) {
                  e.stopPropagation();
                  setMemoText(place.memo || "");
                  setIsEditingMemo(true);
                }
              }}
              className={`rounded-xl p-2.5 text-xs transition-all ${
                place.memo
                  ? "bg-amber-50/60 border border-amber-200/70 text-slate-700"
                  : isReadOnly
                  ? "hidden"
                  : "bg-slate-50/70 border border-dashed border-slate-200 text-slate-400 hover:border-blue-300 hover:bg-blue-50/30 hover:text-blue-600"
              }`}
            >
              {place.memo ? (
                <div className="flex items-start gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed whitespace-pre-wrap font-normal">
                    {place.memo}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 opacity-60" />
                  <span>+ 메모 추가 (추천 메뉴, 이동 팁 등)</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
