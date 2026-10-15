"use client";

import React, { useState, useEffect } from "react";
import {
  Share2,
  Calendar,
  Pencil,
  Check,
  Eye,
  MapPin,
  Luggage,
  Download,
} from "lucide-react";

interface HeaderProps {
  title: string;
  startDate: string;
  endDate: string;
  isReadOnly: boolean;
  hasApiKey?: boolean;
  tripsCount?: number;
  onUpdateTitle: (newTitle: string) => void;
  onUpdateDates: (start: string, end: string) => void;
  onOpenShareModal: () => void;
  onOpenMyTrips?: () => void;
  onOpenKeyModal?: () => void;
  onSaveToMyTrips?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  startDate,
  endDate,
  isReadOnly,
  tripsCount = 1,
  onUpdateTitle,
  onUpdateDates,
  onOpenShareModal,
  onOpenMyTrips,
  onSaveToMyTrips,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(title);

  const [isEditingDates, setIsEditingDates] = useState(false);
  const [startInput, setStartInput] = useState(startDate);
  const [endInput, setEndInput] = useState(endDate);

  // Synchronize when external title or dates change (e.g. from localStorage)
  useEffect(() => {
    setTitleInput(title);
  }, [title]);

  useEffect(() => {
    setStartInput(startDate);
    setEndInput(endDate);
  }, [startDate, endDate]);

  const handleSaveTitle = () => {
    const trimmed = titleInput.trim();
    if (trimmed && trimmed !== title) {
      onUpdateTitle(trimmed);
    } else if (!trimmed) {
      setTitleInput(title);
    }
    setIsEditingTitle(false);
  };

  const handleSaveDates = () => {
    if (startInput.trim() && endInput.trim()) {
      onUpdateDates(startInput.trim(), endInput.trim());
    }
    setIsEditingDates(false);
  };

  return (
    <header className="px-5 py-4 border-b border-slate-200/90 bg-white sticky top-0 z-30 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        {/* Brand: 라니투어 */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0">
            라
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-tight text-slate-900">
              라니투어
            </span>
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
              TRAVEL
            </span>
          </div>
          {isReadOnly && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold ml-1">
              <Eye className="w-3 h-3" />
              보기 전용
            </span>
          )}
        </div>

        {/* Action Buttons: 내 여행 목록 & 일정 공유 */}
        <div className="flex items-center gap-1.5">
          {onOpenMyTrips && !isReadOnly && (
            <button
              onClick={onOpenMyTrips}
              title="내 여행 보관함 열기"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-all active:scale-95"
            >
              <Luggage className="w-3.5 h-3.5 text-blue-600" />
              <span>내 여행</span>
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                {tripsCount}
              </span>
            </button>
          )}

          {isReadOnly && onSaveToMyTrips && (
            <button
              onClick={onSaveToMyTrips}
              title="이 일정을 내 여행 보관함에 복사하여 저장합니다"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>내 보관함에 담기</span>
            </button>
          )}

          <button
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>일정 공유</span>
          </button>
        </div>
      </div>

      {/* Trip Title */}
      <div className="mt-2.5">
        {isEditingTitle && !isReadOnly ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTitle();
                if (e.key === "Escape") {
                  setTitleInput(title);
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
              className="flex-1 text-lg font-bold text-slate-900 border-b-2 border-blue-500 px-1.5 py-0.5 focus:outline-none bg-blue-50/40 rounded transition-colors"
            />
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                handleSaveTitle();
              }}
              onClick={handleSaveTitle}
              title="저장"
              className="p-1.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shrink-0 shadow-xs"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => {
              if (!isReadOnly) {
                setTitleInput(title);
                setIsEditingTitle(true);
              }
            }}
            className={`group inline-flex items-center gap-2 cursor-pointer ${
              isReadOnly ? "cursor-default" : "hover:text-blue-600"
            } transition-colors`}
          >
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
              {title}
            </h1>
            {!isReadOnly && (
              <Pencil className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 opacity-60 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        )}
      </div>

      {/* Trip Period */}
      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        {isEditingDates && !isReadOnly ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              onBlur={handleSaveDates}
              placeholder="YYYY.MM.DD"
              className="w-24 px-1.5 py-0.5 border border-slate-300 rounded text-xs font-mono"
            />
            <span>-</span>
            <input
              type="text"
              value={endInput}
              onChange={(e) => setEndInput(e.target.value)}
              onBlur={handleSaveDates}
              placeholder="YYYY.MM.DD"
              className="w-24 px-1.5 py-0.5 border border-slate-300 rounded text-xs font-mono"
            />
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                handleSaveDates();
              }}
              onClick={handleSaveDates}
              className="p-1 rounded text-white bg-blue-600 hover:bg-blue-700 shadow-xs"
            >
              <Check className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => {
              if (!isReadOnly) {
                setStartInput(startDate);
                setEndInput(endDate);
                setIsEditingDates(true);
              }
            }}
            className={`inline-flex items-center gap-1 font-medium ${
              isReadOnly ? "cursor-default" : "hover:text-slate-800 cursor-pointer"
            }`}
          >
            <span>
              {startDate} - {endDate}
            </span>
            {!isReadOnly && (
              <span className="text-[10px] text-slate-400 underline decoration-slate-300 ml-1">
                수정
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
