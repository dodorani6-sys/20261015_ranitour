export type TransportMode = "car" | "walk";

export interface Place {
  id: string;
  name: string;
  category: string;
  address: string;
  roadAddress?: string;
  lat: number;
  lng: number;
  phone?: string;
  memo?: string;
  url?: string;
  transportMode?: TransportMode; // Transportation mode to next place (default: "car")
  photoUrl?: string; // Captured photo / image for place (compressed Data URL)
  customCaption?: string; // Custom subtitle for travel video reel
}

export interface DaySchedule {
  day: number;
  dateStr?: string;
  places: Place[];
}

export interface TripPlan {
  id: string;
  title: string;
  startDate: string; // YYYY.MM.DD
  endDate: string;   // YYYY.MM.DD
  days: DaySchedule[];
}

// Distance and time calculation result
export interface SegmentRouteInfo {
  fromPlaceId: string;
  toPlaceId: string;
  distanceKm: number;
  formattedDistance: string;
  estimatedMinutes: number;
  formattedTime: string;
  mode: TransportMode;
}
