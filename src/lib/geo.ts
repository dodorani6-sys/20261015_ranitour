import { Place, SegmentRouteInfo, TransportMode } from "@/types/trip";

/**
 * Calculates straight-line distance in kilometers between two points using the Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Estimates distance and travel time for driving (차로) or walking (도보)
 */
export function calculateSegmentRoute(
  from: Place,
  to: Place,
  customMode?: TransportMode
): SegmentRouteInfo {
  const mode: TransportMode = customMode || from.transportMode || "car";
  const directDistance = calculateDistanceKm(from.lat, from.lng, to.lat, to.lng);

  if (mode === "walk") {
    // Walking road curvature factor ~1.2
    const estimatedWalkDistance = directDistance * 1.2;
    let formattedDistance = "";
    if (estimatedWalkDistance < 1) {
      formattedDistance = `${Math.round(estimatedWalkDistance * 1000)}m`;
    } else {
      formattedDistance = `${estimatedWalkDistance.toFixed(1)}km`;
    }

    // Walking speed: ~4.2 km/h
    const walkHours = estimatedWalkDistance / 4.2;
    const estimatedMinutes = Math.max(1, Math.round(walkHours * 60));

    let formattedTime = "";
    if (estimatedMinutes >= 60) {
      const hours = Math.floor(estimatedMinutes / 60);
      const mins = estimatedMinutes % 60;
      formattedTime = mins > 0 ? `도보 ${hours}시간 ${mins}분` : `도보 ${hours}시간`;
    } else {
      formattedTime = `도보 ${estimatedMinutes}분`;
    }

    return {
      fromPlaceId: from.id,
      toPlaceId: to.id,
      distanceKm: Math.round(estimatedWalkDistance * 10) / 10,
      formattedDistance,
      estimatedMinutes,
      formattedTime,
      mode: "walk",
    };
  }

  // Car mode
  // Real driving road factor is approximately 1.25 ~ 1.35x straight line
  const estimatedRoadDistance = directDistance * 1.3;
  let formattedDistance = "";
  if (estimatedRoadDistance < 1) {
    formattedDistance = `${Math.round(estimatedRoadDistance * 1000)}m`;
  } else {
    formattedDistance = `${estimatedRoadDistance.toFixed(1)}km`;
  }

  // Estimated driving time: average 38 km/h in urban/scenic areas + 2 min buffer
  const drivingHours = estimatedRoadDistance / 38;
  const estimatedMinutes = Math.max(2, Math.round(drivingHours * 60 + 2));

  let formattedTime = "";
  if (estimatedMinutes >= 60) {
    const hours = Math.floor(estimatedMinutes / 60);
    const mins = estimatedMinutes % 60;
    formattedTime = mins > 0 ? `차로 ${hours}시간 ${mins}분` : `차로 ${hours}시간`;
  } else {
    formattedTime = `차로 ${estimatedMinutes}분`;
  }

  return {
    fromPlaceId: from.id,
    toPlaceId: to.id,
    distanceKm: Math.round(estimatedRoadDistance * 10) / 10,
    formattedDistance,
    estimatedMinutes,
    formattedTime,
    mode: "car",
  };
}
