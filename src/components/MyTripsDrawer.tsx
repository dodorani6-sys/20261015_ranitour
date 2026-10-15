"use client";

import React, { useState } from "react";
import {
  FolderKanban,
  Plus,
  Calendar,
  MapPin,
  Trash2,
  Copy,
  Check,
  X,
  Compass,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { TripPlan } from "@/types/trip";

interface MyTripsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  trips: TripPlan[];
  activeTripId: string;
  onSelectTrip: (tripId: string) => void;
  onCreateTrip: (title: string, startDate: string, endDate: string, totalDays: number) => void;
  onDuplicateTrip: (tripId: string) => void;
  onDeleteTrip: (tripId: string) => void;
}

export const MyTripsDrawer: React.FC<MyTripsDrawerProps> = ({
  isOpen,
  onClose,
  trips,
  activeTripId,
  onSelectTrip,
  onCreateTrip,
  onDuplicateTrip,
  onDeleteTrip,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newStartDate, setNewStartDate] = useState("2026.11.01");
  const [newEndDate, setNewEndDate] = useState("2026.11.02");
  const [newDaysCount, setNewDaysCount] = useState(2);

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateTrip(
      newTitle.trim(),
      newStartDate.trim() || "2026.11.01",
      newEndDate.trim() || "2026.11.02",
      Math.max(1, newDaysCount)
    );
    setNewTitle("");
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-r border-slate-200 animate-in slide-in-from-left duration-250">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">
                내 여행 보관함
              </h2>
              <p className="text-xs text-slate-500">
                총 <span className="font-bold text-blue-600">{trips.length}</span>개의 여행 일정이 보관되어 있습니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button: [+ 새 여행 만들기] */}
        <div className="p-4 border-b border-slate-100 bg-white shrink-0">
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-2xl font-bold text-sm shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>새 여행 만들기</span>
            </button>
          ) : (
            <form
              onSubmit={handleCreateSubmit}
              className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/90 space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  새로운 여행 계획
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  취소
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  여행 제목
                </label>
                <input
                  type="text"
                  placeholder="예: 부산 2박 3일 힐링 미식 투어"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    시작일
                  </label>
                  <input
                    type="text"
                    placeholder="YYYY.MM.DD"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    종료일
                  </label>
                  <input
                    type="text"
                    placeholder="YYYY.MM.DD"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  일정 일수 (Day 수)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setNewDaysCount(count)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        newDaysCount === count
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {count}일
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs"
                >
                  일정 생성하기
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Trips List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {trips.map((item) => {
            const isActive = item.id === activeTripId;
            const totalPlaces = item.days.reduce(
              (sum, d) => sum + d.places.length,
              0
            );
            const previewPlaces = item.days
              .flatMap((d) => d.places)
              .slice(0, 3);

            return (
              <div
                key={item.id}
                onClick={() => {
                  onSelectTrip(item.id);
                  onClose();
                }}
                className={`group relative rounded-2xl border p-4 cursor-pointer transition-all ${
                  isActive
                    ? "bg-blue-50/50 border-blue-500 shadow-md ring-2 ring-blue-500/20"
                    : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-soft"
                }`}
              >
                {/* Active Tag */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                        현재 편집 중
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400">
                        저장된 일정
                      </span>
                    )}
                  </div>

                  {/* Actions: Duplicate & Delete */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
                  >
                    <button
                      type="button"
                      onClick={() => onDuplicateTrip(item.id)}
                      title="일정 복제하기"
                      className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {trips.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              `'${item.title}' 일정을 보관함에서 삭제하시겠습니까?`
                            )
                          ) {
                            onDeleteTrip(item.id);
                          }
                        }}
                        title="일정 삭제"
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Trip Title */}
                <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition-colors mb-1.5">
                  {item.title}
                </h3>

                {/* Meta details */}
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-2.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {item.startDate} - {item.endDate}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="font-semibold text-slate-700">
                    총 {item.days.length}일차 ({totalPlaces}곳)
                  </span>
                </div>

                {/* Place Preview Tags */}
                {previewPlaces.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
                    {previewPlaces.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px]"
                      >
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[90px]">{p.name}</span>
                      </span>
                    ))}
                    {totalPlaces > 3 && (
                      <span className="text-[11px] text-slate-400 font-medium">
                        +{totalPlaces - 3}곳 더보기
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>라니투어 다중 여행 관리</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
