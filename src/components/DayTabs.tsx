"use client";

import React from "react";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { DaySchedule } from "@/types/trip";

interface DayTabsProps {
  days: DaySchedule[];
  activeDay: number;
  isReadOnly: boolean;
  onSelectDay: (day: number) => void;
  onAddDay: () => void;
  onDeleteDay: (day: number) => void;
}

export const DayTabs: React.FC<DayTabsProps> = ({
  days,
  activeDay,
  isReadOnly,
  onSelectDay,
  onAddDay,
  onDeleteDay,
}) => {
  return (
    <div className="border-b border-slate-200 bg-white relative md:sticky md:top-[105px] z-20">
      <div className="flex items-center gap-1.5 px-4 pt-2.5 overflow-x-auto no-scrollbar scroll-smooth">
        {days.map((item) => {
          const isActive = item.day === activeDay;
          const count = item.places.length;

          return (
            <div key={item.day} className="relative group shrink-0">
              <button
                onClick={() => onSelectDay(item.day)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl text-sm font-semibold transition-all relative ${
                  isActive
                    ? "text-blue-600 bg-blue-50/70 border-b-2 border-blue-600"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <span>{item.day}일차</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-medium ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                  }`}
                >
                  {count}
                </span>
              </button>

              {/* Day delete button if > 1 day and not read only */}
              {!isReadOnly && days.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`${item.day}일차 일정을 정말 삭제하시겠습니까?`)) {
                      onDeleteDay(item.day);
                    }
                  }}
                  title={`${item.day}일차 삭제`}
                  className="absolute -top-1 -right-1 hidden group-hover:flex w-4 h-4 rounded-full bg-slate-300 hover:bg-rose-500 text-white items-center justify-center text-[10px] transition-colors shadow-sm"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}

        {/* Add Day Button */}
        {!isReadOnly && (
          <button
            onClick={onAddDay}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 mb-1 text-xs font-semibold text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg border border-dashed border-slate-300 hover:border-blue-300 transition-all ml-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>일차 추가</span>
          </button>
        )}
      </div>
    </div>
  );
};
