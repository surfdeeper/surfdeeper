/**
 * Utility functions for setting up Leaflet maps
 */

import type { MapTheme } from '../config/map-constants';

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
 * Gets the stored map theme preference from localStorage
 * @param defaultTheme The default theme to use if none is stored
 * @returns The theme ID
 */
export function getStoredTheme(defaultTheme: string): string {
  if (typeof window === 'undefined') return defaultTheme;
  try {
    return localStorage.getItem('mapTheme') || defaultTheme;
  } catch {
    return defaultTheme;
  }
}

/**
 * Stores the map theme preference in localStorage
 * @param themeId The theme ID to store
 */
export function storeTheme(themeId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('mapTheme', themeId);
  } catch (e) {
    console.warn('Failed to store theme preference:', e);
  }
}

/**
 * Creates a base Leaflet map with tile layer support
 * @param elementId The DOM element ID to attach the map to
 * @param center The [latitude, longitude] center point
 * @param zoom The zoom level
 * @param theme The map theme configuration (optional, will use stored theme if not provided)
 * @returns The Leaflet map instance or null if Leaflet is not loaded
 */
export function createBaseMap(
  elementId: string,
  center: [number, number],
  zoom: number,
  theme?: MapTheme
): any | null {
  if (typeof window === 'undefined' || !(window as any).L) {
    console.error('Leaflet not loaded');
    return null;
  }

  const L = (window as any).L;
  const map = L.map(elementId, {
    // Set dark background to prevent white flicker
    backgroundColor: '#1a1f2e'
  }).setView(center, zoom);

  // Add tile layer if theme is provided
  if (theme) {
    const tileLayerOptions: any = {
      attribution: theme.attribution,
      maxZoom: theme.maxZoom,
      className: 'map-tiles'
    };
    
    if (theme.subdomains) {
      tileLayerOptions.subdomains = theme.subdomains;
    }
    
    const tileLayer = L.tileLayer(theme.url, tileLayerOptions);
    tileLayer.addTo(map);
    
    // Store tile layer reference on map for theme switching
    (map as any)._tileLayer = tileLayer;
  }

  return map;
}

/**
 * Changes the theme of an existing map
 * @param map The Leaflet map instance
 * @param theme The new theme configuration
 */
export function changeMapTheme(map: any, theme: MapTheme): void {
  if (!map || typeof window === 'undefined') return;
  
  const L = (window as any).L;
  
  // Remove existing tile layer
  if ((map as any)._tileLayer) {
    map.removeLayer((map as any)._tileLayer);
  }
  
  // Add new tile layer
  const tileLayerOptions: any = {
    attribution: theme.attribution,
    maxZoom: theme.maxZoom,
    className: 'map-tiles'
  };
  
  if (theme.subdomains) {
    tileLayerOptions.subdomains = theme.subdomains;
  }
  
  const tileLayer = L.tileLayer(theme.url, tileLayerOptions);
  tileLayer.addTo(map);
  
  // Store new tile layer reference
  (map as any)._tileLayer = tileLayer;
  
  // Store theme preference
  storeTheme(theme.id);
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

