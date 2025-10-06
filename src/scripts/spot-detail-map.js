import { MAP_DEFAULTS } from "../config/map-constants";
import {
  createBaseMap,
  waitForLeaflet,
  createMarkerWithPopup,
} from "../utils/leaflet-setup";
import { getSpotDataFromElement } from "../utils/spot-data";

/**
 * Initializes the spot detail map
 */
function initSpotMap() {
  waitForLeaflet(() => {
    const spot = getSpotDataFromElement("spot-data");
    if (!spot) return;

    // Initialize map centered on the spot
    const map = createBaseMap(
      "spot-map",
      [spot.latitude, spot.longitude],
      MAP_DEFAULTS.SPOT_ZOOM,
    );
    if (!map) return;

    // Add marker for the spot
    createMarkerWithPopup(
      map,
      spot.latitude,
      spot.longitude,
      spot.title,
      spot.description,
      true, // Open popup immediately
    );
  });
}

// Initialize when DOM is ready
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  initSpotMap();
} else {
  document.addEventListener("DOMContentLoaded", initSpotMap);
}
