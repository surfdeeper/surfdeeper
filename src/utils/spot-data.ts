/**
 * Utility functions for serializing spot data
 */

export interface SerializedSpot {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  slug: string;
}

export interface SpotEntry {
  data: {
    title: string;
    description?: string;
    latitude: number;
    longitude: number;
  };
  slug: string;
}

/**
 * Serializes a spot entry for client-side use
 * @param spot The spot entry from Astro content collection
 * @returns Serialized spot data
 */
export function serializeSpot(spot: SpotEntry): SerializedSpot {
  return {
    title: spot.data.title,
    description: spot.data.description || "",
    latitude: spot.data.latitude,
    longitude: spot.data.longitude,
    slug: spot.slug,
  };
}

/**
 * Serializes multiple spot entries for client-side use
 * @param spots Array of spot entries from Astro content collection
 * @returns Array of serialized spot data
 */
export function serializeSpots(spots: SpotEntry[]): SerializedSpot[] {
  return spots.map(serializeSpot);
}

/**
 * Parses spot data from a JSON script element
 * @param elementId The ID of the script element containing spot data
 * @returns Parsed spot data or null if parsing fails
 */
export function getSpotDataFromElement(elementId: string): any {
  const dataElement = document.getElementById(elementId);
  if (!dataElement) {
    console.error(`Element with ID "${elementId}" not found`);
    return null;
  }

  try {
    const json = dataElement.textContent || "{}";
    return JSON.parse(json);
  } catch (error) {
    console.error(
      `Failed to parse spot data from element "${elementId}":`,
      error,
    );
    return null;
  }
}

/**
 * Parses multiple spots data from a JSON script element
 * @param elementId The ID of the script element containing spots array
 * @returns Array of parsed spot data or empty array if parsing fails
 */
export function getSpotsDataFromElement(elementId: string): any[] {
  const dataElement = document.getElementById(elementId);
  if (!dataElement) {
    console.error(`Element with ID "${elementId}" not found`);
    return [];
  }

  try {
    const json = dataElement.textContent || "[]";
    return JSON.parse(json);
  } catch (error) {
    console.error(
      `Failed to parse spots data from element "${elementId}":`,
      error,
    );
    return [];
  }
}
