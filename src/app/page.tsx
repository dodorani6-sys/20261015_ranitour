"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  MapPin,
  Route,
  Clock,
  Sparkles,
  Share2,
  Calendar,
  Layers,
  Map as MapIcon,
  List as ListIcon,
  Rows,
  RotateCcw,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";

import { TripPlan, Place, DaySchedule } from "@/types/trip";
import { initialTripData } from "@/lib/dummy-data";
import { calculateSegmentRoute } from "@/lib/geo";
import { decodeTripFromUrl } from "@/lib/share-utils";

import { Header } from "@/components/Header";
import { DayTabs } from "@/components/DayTabs";
import { PlaceCard } from "@/components/PlaceCard";
import { DistanceBadge } from "@/components/DistanceBadge";
import { PlaceSearchModal } from "@/components/PlaceSearchModal";
import { KakaoMap } from "@/components/KakaoMap";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { ShareModal } from "@/components/ShareModal";
import { MyTripsDrawer } from "@/components/MyTripsDrawer";
import { ToastContainer, ToastMessage } from "@/components/Toast";

function TravelPlannerContent() {
  const searchParams = useSearchParams();
  const isReadOnly = searchParams.get("mode") === "share";

  // State: Multiple Trips
  const [trips, setTrips] = useState<TripPlan[]>([initialTripData]);
  const [trip, setTrip] = useState<TripPlan>(initialTripData);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);

  // State: Kakao API Key
  const [apiKey, setApiKey] = useState<string>("");

  // State: Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMyTripsOpen, setIsMyTripsOpen] = useState(false);

  // State: Mobile toggle ('split' | 'list' | 'map')
  const [mobileView, setMobileView] = useState<"split" | "list" | "map">("split");

  // State: Drag and Drop reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const touchStartRef = useRef<{ index: number; startY: number } | null>(null);

  // State: Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (text: string, type: "success" | "info" | "error" = "success") => {
    const newToast: ToastMessage = {
      id: `${Date.now()}-${Math.random()}`,
      text,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load API Key & Stored Trips from localStorage
  useEffect(() => {
    // 1. Check API key: localStorage, environment variable, or default key
    const envKey =
      process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY ||
      "b9ccbf52dd55480bbb63e5b9dc9ad6cc";
    const savedKey = localStorage.getItem("kakao_map_api_key") || "";
    const effectiveKey = savedKey || envKey;
    setApiKey(effectiveKey);

    // 2. Check if trip data is provided via URL (?plan=...)
    let planParam = searchParams.get("plan");
    if (!planParam && typeof window !== "undefined") {
      planParam = new URLSearchParams(window.location.search).get("plan");
    }

    if (planParam) {
      const decoded = decodeTripFromUrl(planParam);
      if (decoded && decoded.days && decoded.days.length > 0) {
        setTrip(decoded);
        setActiveDay(1);
        setActivePlaceId(null);
        return;
      }
    }

    // 3. Load saved trips list from localStorage
    try {
      const savedTripsJson = localStorage.getItem("triple_saved_trips");
      const singleStoredJson = localStorage.getItem("triple_travel_planner_data");
      const activeTripId = localStorage.getItem("triple_active_trip_id");

      let loadedTrips: TripPlan[] = [];

      if (savedTripsJson) {
        loadedTrips = JSON.parse(savedTripsJson);
      }

      // If no saved trips list yet, migrate existing single trip or seed with initial
      if (!loadedTrips || loadedTrips.length === 0) {
        if (singleStoredJson) {
          const parsedSingle = JSON.parse(singleStoredJson);
          if (parsedSingle && parsedSingle.days && parsedSingle.days.length > 0) {
            loadedTrips = [parsedSingle];
            // If the single stored trip is not Jeju, also add initial Jeju trip as an option
            if (parsedSingle.id !== initialTripData.id) {
              loadedTrips.push(initialTripData);
            }
          }
        }
        if (loadedTrips.length === 0) {
          loadedTrips = [initialTripData];
        }
        localStorage.setItem("triple_saved_trips", JSON.stringify(loadedTrips));
      }

      setTrips(loadedTrips);

      // Set active trip
      const active =
        loadedTrips.find((t) => t.id === activeTripId) || loadedTrips[0];
      setTrip(active);
    } catch (e) {
      console.warn("Failed to load saved trips", e);
    }
  }, [searchParams]);

  // Save trip to localStorage on change and keep trips array in sync
  const saveTripState = (updated: TripPlan) => {
    setTrip(updated);
    try {
      localStorage.setItem("triple_travel_planner_data", JSON.stringify(updated));
      localStorage.setItem("triple_active_trip_id", updated.id);

      setTrips((prevTrips) => {
        const index = prevTrips.findIndex((t) => t.id === updated.id);
        let nextTrips: TripPlan[];
        if (index >= 0) {
          nextTrips = [...prevTrips];
          nextTrips[index] = updated;
        } else {
          nextTrips = [updated, ...prevTrips];
        }
        localStorage.setItem("triple_saved_trips", JSON.stringify(nextTrips));
        return nextTrips;
      });
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  };

  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem("kakao_map_api_key", newKey);
    addToast(
      newKey ? "카카오맵 API 키가 등록되었습니다!" : "API 키가 삭제되었습니다.",
      "info"
    );
  };

  // Active Day Object
  const currentDay = useMemo(() => {
    return trip.days.find((d) => d.day === activeDay) || trip.days[0];
  }, [trip.days, activeDay]);

  const currentPlaces = currentDay ? currentDay.places : [];

  // Calculate Segment Routes (Distance & Travel Time)
  const segments = useMemo(() => {
    if (!currentPlaces || currentPlaces.length < 2) return [];
    const list = [];
    for (let i = 0; i < currentPlaces.length - 1; i++) {
      const from = currentPlaces[i];
      const to = currentPlaces[i + 1];
      list.push(calculateSegmentRoute(from, to, from.transportMode || "car"));
    }
    return list;
  }, [currentPlaces]);

  // Day Stats
  const dayStats = useMemo(() => {
    const totalDistance = segments.reduce((sum, s) => sum + s.distanceKm, 0);
    const totalMinutes = segments.reduce((sum, s) => sum + s.estimatedMinutes, 0);

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const timeFormatted =
      hours > 0 ? `${hours}시간 ${mins > 0 ? `${mins}분` : ""}` : `${mins}분`;

    return {
      placeCount: currentPlaces.length,
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalTimeFormatted: totalMinutes > 0 ? timeFormatted : "0분",
    };
  }, [segments, currentPlaces]);

  // Handlers for Trip Header
  const handleUpdateTitle = (newTitle: string) => {
    const updated = { ...trip, title: newTitle };
    saveTripState(updated);
    addToast("여행 제목이 변경되었습니다.");
  };

  const handleUpdateDates = (start: string, end: string) => {
    const updated = { ...trip, startDate: start, endDate: end };
    saveTripState(updated);
    addToast("여행 일정이 업데이트되었습니다.");
  };

  // Handlers for Days
  const handleAddDay = () => {
    const nextDayNum = trip.days.length + 1;
    const newDay: DaySchedule = {
      day: nextDayNum,
      places: [],
    };
    const updated = {
      ...trip,
      days: [...trip.days, newDay],
    };
    saveTripState(updated);
    setActiveDay(nextDayNum);
    addToast(`${nextDayNum}일차가 새롭게 추가되었습니다.`);
  };

  const handleDeleteDay = (dayNum: number) => {
    if (trip.days.length <= 1) return;
    const filtered = trip.days.filter((d) => d.day !== dayNum);
    // Renumber days
    const renumbered = filtered.map((d, idx) => ({
      ...d,
      day: idx + 1,
    }));
    const updated = { ...trip, days: renumbered };
    saveTripState(updated);
    setActiveDay(Math.min(activeDay, renumbered.length));
    addToast(`${dayNum}일차가 삭제되었습니다.`, "info");
  };

  // Handlers for Places
  const handleAddPlace = (placeData: Omit<Place, "id">) => {
    const newPlace: Place = {
      ...placeData,
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    };

    const updatedDays = trip.days.map((d) => {
      if (d.day === activeDay) {
        return {
          ...d,
          places: [...d.places, newPlace],
        };
      }
      return d;
    });

    const updated = { ...trip, days: updatedDays };
    saveTripState(updated);
    setActivePlaceId(newPlace.id);
    addToast(`'${newPlace.name}'이(가) ${activeDay}일차에 추가되었습니다.`);
  };

  const handleDeletePlace = (placeId: string) => {
    const updatedDays = trip.days.map((d) => {
      if (d.day === activeDay) {
        return {
          ...d,
          places: d.places.filter((p) => p.id !== placeId),
        };
      }
      return d;
    });

    const updated = { ...trip, days: updatedDays };
    saveTripState(updated);
    if (activePlaceId === placeId) {
      setActivePlaceId(null);
    }
    addToast("장소가 삭제되었습니다.", "info");
  };

  const handleUpdateMemo = (placeId: string, memo: string) => {
    const updatedDays = trip.days.map((d) => {
      if (d.day === activeDay) {
        return {
          ...d,
          places: d.places.map((p) => (p.id === placeId ? { ...p, memo } : p)),
        };
      }
      return d;
    });

    const updated = { ...trip, days: updatedDays };
    saveTripState(updated);
    addToast("메모가 저장되었습니다.");
  };

  const handleChangeTransportMode = (placeId: string, newMode: "car" | "walk") => {
    const updatedDays = trip.days.map((d) => {
      if (d.day === activeDay) {
        return {
          ...d,
          places: d.places.map((p) =>
            p.id === placeId ? { ...p, transportMode: newMode } : p
          ),
        };
      }
      return d;
    });

    const updated = { ...trip, days: updatedDays };
    saveTripState(updated);
    addToast(
      newMode === "walk"
        ? "도보 이동 시간으로 변경되었습니다."
        : "차량 이동 시간으로 변경되었습니다."
    );
  };

  const handleSelectPlace = (place: Place) => {
    setActivePlaceId(place.id);
  };

  // Handlers for Drag & Drop Place Reordering
  const handleReorderPlaces = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const currentDay = trip.days.find((d) => d.day === activeDay);
    if (!currentDay) return;

    const placesList = [...currentDay.places];
    if (
      fromIndex < 0 ||
      fromIndex >= placesList.length ||
      toIndex < 0 ||
      toIndex >= placesList.length
    ) {
      return;
    }

    const [movedItem] = placesList.splice(fromIndex, 1);
    placesList.splice(toIndex, 0, movedItem);

    const updatedDays = trip.days.map((d) => {
      if (d.day === activeDay) {
        return {
          ...d,
          places: placesList,
        };
      }
      return d;
    });

    const updated = { ...trip, days: updatedDays };
    saveTripState(updated);
    addToast(`'${movedItem.name}'의 순서가 ${toIndex + 1}번째로 변경되었습니다.`);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && index !== draggedIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent, index: number) => {
    // Keep target or let dragenter handle
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData("text/plain");
    const sourceIndex = sourceIndexStr ? parseInt(sourceIndexStr, 10) : draggedIndex;

    if (sourceIndex !== null && !isNaN(sourceIndex) && sourceIndex !== targetIndex) {
      handleReorderPlaces(sourceIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Touch handlers for mobile devices
  const handleTouchDragStart = (index: number, e: React.TouchEvent) => {
    touchStartRef.current = { index, startY: e.touches[0].clientY };
    setDraggedIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
    const cardElem = elem?.closest("[data-place-index]");
    if (cardElem) {
      const targetIdx = Number(cardElem.getAttribute("data-place-index"));
      if (!isNaN(targetIdx) && targetIdx !== touchStartRef.current.index) {
        setDragOverIndex(targetIdx);
      }
    }
  };

  const handleTouchEnd = () => {
    if (
      touchStartRef.current &&
      dragOverIndex !== null &&
      touchStartRef.current.index !== dragOverIndex
    ) {
      handleReorderPlaces(touchStartRef.current.index, dragOverIndex);
    }
    touchStartRef.current = null;
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleResetToDefault = () => {
    if (confirm("모든 일정을 초기 제주 2박 3일 추천 일정으로 되돌리시겠습니까?")) {
      saveTripState(initialTripData);
      setActiveDay(1);
      setActivePlaceId(null);
      addToast("기본 여행 일정으로 복원되었습니다.");
    }
  };

  // Handlers for MyTripsDrawer
  const handleSelectTrip = (tripId: string) => {
    const selected = trips.find((t) => t.id === tripId);
    if (!selected) return;
    setTrip(selected);
    setActiveDay(1);
    setActivePlaceId(null);
    localStorage.setItem("triple_active_trip_id", tripId);
    localStorage.setItem("triple_travel_planner_data", JSON.stringify(selected));
    addToast(`'${selected.title}' 일정으로 전환되었습니다.`);
  };

  const handleCreateTrip = (
    title: string,
    startDate: string,
    endDate: string,
    totalDays: number
  ) => {
    const newTrip: TripPlan = {
      id: `trip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title,
      startDate,
      endDate,
      days: Array.from({ length: totalDays }, (_, i) => ({
        day: i + 1,
        places: [],
      })),
    };

    const nextTrips = [newTrip, ...trips];
    setTrips(nextTrips);
    setTrip(newTrip);
    setActiveDay(1);
    setActivePlaceId(null);

    try {
      localStorage.setItem("triple_saved_trips", JSON.stringify(nextTrips));
      localStorage.setItem("triple_active_trip_id", newTrip.id);
      localStorage.setItem("triple_travel_planner_data", JSON.stringify(newTrip));
    } catch (e) {
      console.error(e);
    }

    addToast(`새로운 여행 '${title}'이(가) 생성되었습니다!`);
  };

  const handleDuplicateTrip = (tripId: string) => {
    const original = trips.find((t) => t.id === tripId);
    if (!original) return;

    const clonedTrip: TripPlan = {
      ...original,
      id: `trip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: `${original.title} (복사본)`,
      days: original.days.map((d) => ({
        ...d,
        places: d.places.map((p) => ({
          ...p,
          id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        })),
      })),
    };

    const nextTrips = [clonedTrip, ...trips];
    setTrips(nextTrips);
    try {
      localStorage.setItem("triple_saved_trips", JSON.stringify(nextTrips));
    } catch (e) {
      console.error(e);
    }
    addToast(`'${original.title}' 일정이 복제되었습니다.`);
  };

  const handleDeleteTrip = (tripId: string) => {
    if (trips.length <= 1) return;
    const remaining = trips.filter((t) => t.id !== tripId);
    setTrips(remaining);

    // If deleting active trip, switch to first remaining
    if (trip.id === tripId) {
      const nextActive = remaining[0];
      setTrip(nextActive);
      setActiveDay(1);
      setActivePlaceId(null);
      localStorage.setItem("triple_active_trip_id", nextActive.id);
      localStorage.setItem(
        "triple_travel_planner_data",
        JSON.stringify(nextActive)
      );
    }

    try {
      localStorage.setItem("triple_saved_trips", JSON.stringify(remaining));
    } catch (e) {
      console.error(e);
    }
    addToast("여행 일정이 보관함에서 삭제되었습니다.", "info");
  };

  const handleSaveSharedToMyTrips = () => {
    const importedTrip: TripPlan = {
      ...trip,
      id: `trip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    };

    const nextTrips = [
      importedTrip,
      ...trips.filter((t) => t.id !== importedTrip.id),
    ];
    setTrips(nextTrips);
    setTrip(importedTrip);

    try {
      localStorage.setItem("triple_saved_trips", JSON.stringify(nextTrips));
      localStorage.setItem("triple_active_trip_id", importedTrip.id);
      localStorage.setItem(
        "triple_travel_planner_data",
        JSON.stringify(importedTrip)
      );
    } catch (e) {
      console.error(e);
    }

    // Clean URL and switch into editable mode
    window.location.href = window.location.pathname;
  };

  return (
    <div className="flex flex-col min-h-screen md:h-screen w-full bg-slate-50 md:overflow-hidden font-sans">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Main 2-Column Responsive Container */}
      <div className="flex-1 flex flex-col md:flex-row w-full md:h-full min-h-0 min-w-0 md:overflow-hidden relative">
        {/* Left Column / Bottom Panel: Itinerary Management */}
        <aside
          className={`bg-white border-slate-200/90 z-10 transition-all flex flex-col ${
            mobileView === "split"
              ? "w-full order-2 md:order-1 md:w-[420px] lg:w-[450px] md:h-full border-t md:border-t-0 md:border-r"
              : mobileView === "list"
              ? "min-h-screen md:min-h-0 w-full order-2 md:order-1 md:w-[420px] lg:w-[450px] md:h-full border-r flex"
              : "hidden md:flex md:order-1 md:w-[420px] lg:w-[450px] md:h-full border-r"
          }`}
        >
          {/* Header */}
          <Header
            title={trip.title}
            startDate={trip.startDate}
            endDate={trip.endDate}
            isReadOnly={isReadOnly}
            hasApiKey={Boolean(apiKey)}
            tripsCount={trips.length}
            onUpdateTitle={handleUpdateTitle}
            onUpdateDates={handleUpdateDates}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onOpenMyTrips={() => setIsMyTripsOpen(true)}
            onOpenKeyModal={() => setIsKeyModalOpen(true)}
            onSaveToMyTrips={handleSaveSharedToMyTrips}
          />

          {/* Day Tabs */}
          <DayTabs
            days={trip.days}
            activeDay={activeDay}
            isReadOnly={isReadOnly}
            onSelectDay={(day) => {
              setActiveDay(day);
              setActivePlaceId(null);
            }}
            onAddDay={handleAddDay}
            onDeleteDay={handleDeleteDay}
          />

          {/* Subheader: Day Summary & Add Place Button */}
          <div className="px-4 py-2.5 sm:px-5 sm:py-3 bg-slate-50/80 border-b border-slate-200/70 flex items-center justify-between shrink-0">
            {/* Quick stats badge */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-600 min-w-0">
              <span className="font-bold text-slate-800 whitespace-nowrap">
                {activeDay}일차 일정
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1 font-medium text-slate-500 whitespace-nowrap">
                <Route className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                약 {dayStats.totalDistance}km
              </span>
              {dayStats.totalDistance > 0 && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1 font-medium text-slate-500 whitespace-nowrap">
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    {dayStats.totalTimeFormatted}
                  </span>
                </>
              )}
            </div>

            {/* [+ 장소 추가] Button */}
            {!isReadOnly && (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition-all active:scale-95 whitespace-nowrap shrink-0 ml-2"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>장소 추가</span>
              </button>
            )}
          </div>

          {/* Place Cards List (Scrollable on desktop, natural page flow on mobile) */}
          <div
            className="flex-1 overflow-visible md:overflow-y-auto md:custom-scrollbar p-4 sm:p-5 pb-24 md:pb-5 space-y-1"
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            {currentPlaces.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm mb-1">
                  등록된 일정이 없습니다
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mb-4">
                  {isReadOnly
                    ? "이 일차에는 아직 등록된 장소가 없습니다."
                    : "우측 상단의 [+ 장소 추가] 버튼을 눌러 가고 싶은 맛집, 명소 등을 추가해보세요!"}
                </p>
                {!isReadOnly && (
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>첫 장소 추가하기</span>
                  </button>
                )}
              </div>
            ) : (
              currentPlaces.map((place, idx) => (
                <React.Fragment key={place.id}>
                  <PlaceCard
                    place={place}
                    index={idx}
                    totalPlaces={currentPlaces.length}
                    isActive={place.id === activePlaceId}
                    isReadOnly={isReadOnly}
                    isDragging={draggedIndex === idx}
                    isDragOver={dragOverIndex === idx && draggedIndex !== idx}
                    onSelect={handleSelectPlace}
                    onDelete={handleDeletePlace}
                    onUpdateMemo={handleUpdateMemo}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    onTouchDragStart={handleTouchDragStart}
                    onMoveUp={() => handleReorderPlaces(idx, idx - 1)}
                    onMoveDown={() => handleReorderPlaces(idx, idx + 1)}
                  />

                  {/* Distance and Travel Time Badge between cards */}
                  {idx < currentPlaces.length - 1 && segments[idx] && (
                    <DistanceBadge
                      routeInfo={segments[idx]}
                      isReadOnly={isReadOnly}
                      onChangeMode={(newMode) =>
                        handleChangeTransportMode(place.id, newMode)
                      }
                    />
                  )}
                </React.Fragment>
              ))
            )}

            {/* Bottom Actions Footer */}
            {!isReadOnly && (
              <div className="pt-6 pb-4 flex items-center justify-between text-xs text-slate-400">
                <button
                  onClick={handleResetToDefault}
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>초기 샘플 데이터로 복원</span>
                </button>
                <span>라니투어</span>
              </div>
            )}
          </div>
        </aside>

        {/* Right Column: Kakao Map Area */}
        <main
          className={`min-w-0 relative transition-all ${
            mobileView === "split"
              ? "h-[36vh] sm:h-[40vh] w-full shrink-0 order-1 md:order-2 md:h-full md:flex-1 block shadow-xs"
              : mobileView === "map"
              ? "h-full w-full order-1 md:order-2 md:h-full md:flex-1 block"
              : "hidden md:block md:order-2 md:h-full md:flex-1"
          }`}
        >
          <KakaoMap
            apiKey={apiKey}
            places={currentPlaces}
            activePlaceId={activePlaceId}
            onSelectPlace={(place) => {
              handleSelectPlace(place);
              // On mobile in map-only view, switch to split view so place is visible
              if (window.innerWidth < 768 && mobileView === "map") {
                setMobileView("split");
              }
            }}
            onOpenKeyModal={() => setIsKeyModalOpen(true)}
          />
        </main>
      </div>

      {/* Mobile Bottom Floating Switcher */}
      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 text-white backdrop-blur-md p-1 rounded-full shadow-2xl border border-slate-700/60 flex items-center gap-1 shrink-0 whitespace-nowrap">
        <button
          onClick={() => setMobileView("split")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
            mobileView === "split"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-400 hover:text-white"
          }`}
          title="상단 지도 + 하단 일정"
        >
          <Rows className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">지도+일정</span>
        </button>
        <button
          onClick={() => setMobileView("list")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
            mobileView === "list"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <ListIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">일정만</span>
        </button>
        <button
          onClick={() => setMobileView("map")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
            mobileView === "map"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <MapIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">지도만</span>
        </button>
      </div>

      {/* Place Search Modal */}
      <PlaceSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onAddPlace={handleAddPlace}
        hasApiKey={Boolean(apiKey)}
      />

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        currentKey={apiKey}
        onSaveKey={handleSaveApiKey}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        trip={trip}
        onShowToast={(msg) => addToast(msg, "success")}
      />

      {/* My Trips Drawer */}
      <MyTripsDrawer
        isOpen={isMyTripsOpen}
        onClose={() => setIsMyTripsOpen(false)}
        trips={trips}
        activeTripId={trip.id}
        onSelectTrip={handleSelectTrip}
        onCreateTrip={handleCreateTrip}
        onDuplicateTrip={handleDuplicateTrip}
        onDeleteTrip={handleDeleteTrip}
      />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500 font-medium text-sm">
          여행 일정을 불러오는 중입니다...
        </div>
      }
    >
      <TravelPlannerContent />
    </Suspense>
  );
}
