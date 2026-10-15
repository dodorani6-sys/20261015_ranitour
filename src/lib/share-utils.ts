import { TripPlan } from "@/types/trip";

/**
 * Encodes a TripPlan object into a compact, URL-safe Base64 string (UTF-8 safe)
 */
export function encodeTripToUrl(trip: TripPlan): string {
  try {
    const jsonStr = JSON.stringify(trip);
    // UTF-8 to Base64 in browser
    const utf8Bytes = new TextEncoder().encode(jsonStr);
    let binary = "";
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const base64 = btoa(binary);
    return encodeURIComponent(base64);
  } catch (e) {
    console.error("Failed to encode trip to URL", e);
    return "";
  }
}

/**
 * Decodes a URL-safe Base64 string back into a TripPlan object (UTF-8 safe)
 */
export function decodeTripFromUrl(encoded: string): TripPlan | null {
  try {
    const base64 = decodeURIComponent(encoded);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const jsonStr = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(jsonStr);
    if (parsed && parsed.days && Array.isArray(parsed.days)) {
      return parsed;
    }
    return null;
  } catch (e) {
    console.warn("Failed to decode trip from URL", e);
    return null;
  }
}
