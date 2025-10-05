/**
 * Utility functions for setting up Leaflet maps
 */

/**
 * Waits for Leaflet library to be loaded
 * @param callback Function to call once Leaflet is ready
 * @param maxAttempts Maximum number of attempts to check for Leaflet
 */
export function waitForLeaflet(callback: () => void, maxAttempts = 50): void {
  let attempts = 0;
  
  function check() {
    if (typeof window !== 'undefined' && (window as any).L) {
      callback();
    } else if (attempts < maxAttempts) {
      attempts++;
      setTimeout(check, 100);
    } else {
      console.error('Leaflet library failed to load');
    }
  }
  
  check();
}

/**
 * Creates a base Leaflet map with OpenStreetMap tiles
 * @param elementId The DOM element ID to attach the map to
 * @param center The [latitude, longitude] center point
 * @param zoom The zoom level
 * @returns The Leaflet map instance or null if Leaflet is not loaded
 */
export function createBaseMap(
  elementId: string,
  center: [number, number],
  zoom: number
): any | null {
  if (typeof window === 'undefined' || !(window as any).L) {
    console.error('Leaflet not loaded');
    return null;
  }

  const L = (window as any).L;
  const map = L.map(elementId).setView(center, zoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  return map;
}

/**
 * Creates a marker with a popup
 * @param map The Leaflet map instance
 * @param latitude The marker latitude
 * @param longitude The marker longitude
 * @param title The marker title
 * @param description Optional description for the popup
 * @param openPopup Whether to open the popup immediately
 * @returns The marker instance
 */
export function createMarkerWithPopup(
  map: any,
  latitude: number,
  longitude: number,
  title: string,
  description?: string,
  openPopup = false
): any {
  const L = (window as any).L;
  const marker = L.marker([latitude, longitude]).addTo(map);
  
  const popupContent = `<b>${title}</b>${description ? `<br/>${description}` : ''}`;
  marker.bindPopup(popupContent);
  
  if (openPopup) {
    marker.openPopup();
  }
  
  return marker;
}

