"use client";

import React from "react";
import { Car, Footprints } from "lucide-react";
import { SegmentRouteInfo, TransportMode } from "@/types/trip";

interface DistanceBadgeProps {
  routeInfo: SegmentRouteInfo;
  isReadOnly?: boolean;
  onChangeMode?: (mode: TransportMode) => void;
}

export const DistanceBadge: React.FC<DistanceBadgeProps> = ({
  routeInfo,
  isReadOnly = false,
  onChangeMode,
}) => {
  const isWalk = routeInfo.mode === "walk";

  return (
    <div className="relative flex items-center justify-center py-2.5 my-0.5">
      {/* Vertical connecting line */}
      <div className="absolute left-[29px] top-0 bottom-0 w-[2px] bg-slate-200 border-l border-dashed border-slate-300" />

      {/* Pill badge */}
      <div className="relative z-10 flex items-center gap-2 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-full text-[11px] font-medium text-slate-700 shadow-sm transition-all group">
        <span className="text-slate-500 font-normal">
          약 {routeInfo.formattedDistance}
        </span>

        <span className="text-slate-300">·</span>

        {isReadOnly ? (
          <div className="flex items-center gap-1">
            {isWalk ? (
              <Footprints className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Car className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span className="text-slate-800 font-semibold">
              {routeInfo.formattedTime}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            {/* Interactive Mode Switcher */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/80">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeMode?.("car");
                }}
                title="차량 이동으로 변경"
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                  !isWalk
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Car className="w-3 h-3" />
                <span>차로</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeMode?.("walk");
                }}
                title="도보 이동으로 변경"
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                  isWalk
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Footprints className="w-3 h-3" />
                <span>도보</span>
              </button>
            </div>

            <span className="font-bold text-slate-800 ml-0.5">
              {routeInfo.formattedTime.replace("차로 ", "").replace("도보 ", "")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
